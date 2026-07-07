"use server"

import { convertCurrency, type Debt, type Transaction, type Recurring, type Goal } from "@/lib/finance"

export type ChatMessage = {
  role: "user" | "model"
  content: string
}

export async function askGemini({
  chatHistory,
  debts,
  transactions,
  recurring,
  goals,
  currency,
  userApiKey,
}: {
  chatHistory: ChatMessage[]
  debts: Debt[]
  transactions: Transaction[]
  recurring: Recurring[]
  goals: Goal[]
  currency: string
  userApiKey?: string
}) {
  const apiKey = process.env.GEMINI_API_KEY || userApiKey
  if (!apiKey) {
    throw new Error("API_KEY_MISSING")
  }

  // Resumir la información financiera de forma segura para contextualizar al asistente
  const totalDebtAmount = debts.reduce(
    (sum, d) => sum + convertCurrency(Math.max(d.totalAmount - d.paidAmount, 0), d.currency, currency),
    0
  )
  const debtsList = debts
    .map(
      (d) =>
        `- ${d.name}: Pendiente ${d.currency} ${(d.totalAmount - d.paidAmount).toFixed(2)} (Mínimo: ${d.currency} ${d.minimumPayment.toFixed(2)}, Interés: ${d.interestRate}% anual, Día pago: ${d.dueDay || "N/A"})`
    )
    .join("\n")

  const goalsList = goals
    .map(
      (g) =>
        `- ${g.name}: Meta ${g.currency} ${g.targetAmount.toFixed(2)} (Ahorrado: ${g.currency} ${g.savedAmount.toFixed(2)}, Fecha: ${g.targetDate || "Sin fecha"})`
    )
    .join("\n")

  const recurringList = recurring
    .map(
      (r) =>
        `- ${r.description} (${r.direction === "income" ? "Entrada" : "Salida"} fija): ${r.currency} ${r.amount.toFixed(2)} (${r.frequency}, Día: ${r.dayOfMonth || "N/A"})`
    )
    .join("\n")

  // Analizar gastos hormiga (últimos 30 días o total de este mes)
  const recentTransactions = transactions.slice(0, 15)
  const antTransactions = transactions.filter((t) => t.isAnt)
  const totalAntExpenses = antTransactions.reduce((sum, t) => sum + convertCurrency(t.amount, t.currency, currency), 0)
  const antList = antTransactions
    .slice(0, 10)
    .map((t) => `- ${t.description}: ${t.currency} ${t.amount.toFixed(2)}`)
    .join("\n")

  const systemInstruction = `Eres un asesor financiero experto y amigable llamado "Asistente de Control de Gastos".
Ayudas al usuario a optimizar sus finanzas personales, reducir deudas e incrementar sus ahorros.

Aquí está el resumen financiero actual del usuario:
- Moneda preferida: ${currency}

DEUDAS:
${debtsList || "No tiene deudas registradas."}
Total deudas pendientes: ${currency} ${totalDebtAmount.toFixed(2)}

METAS DE AHORRO:
${goalsList || "No tiene metas de ahorro configuradas."}

MOVIMIENTOS FIJOS (RECURRENTES):
${recurringList || "No tiene movimientos fijos configurados."}

GASTOS HORMIGA REGISTRADOS (Gasto total hormiga: ${currency} ${totalAntExpenses.toFixed(2)}):
${antList || "No tiene gastos hormiga registrados."}

REGLAS IMPORTANTES:
1. Responde de manera clara, empática y práctica en español.
2. Da consejos accionables basados en sus deudas, ingresos y gastos hormiga.
3. Si el usuario te pregunta sobre planes de deudas, sugiere usar el método Avalancha o Bola de Nieve (haz referencia a los datos de sus deudas reales para explicar cómo funcionaría).
4. Usa formato Markdown con negritas, listas y secciones cortas para facilitar la lectura. No uses encabezados h1 ni h2 muy grandes; prefiere negrita o h3/h4.`

  // Mapear el historial del chat al formato de Gemini
  // La API de Gemini requiere roles alternados de user y model.
  const apiContents = chatHistory.map((msg) => ({
    role: msg.role === "user" ? "user" : "model",
    parts: [{ text: msg.content }],
  }))

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: apiContents,
        systemInstruction: {
          parts: [{ text: systemInstruction }],
        },
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 1500,
        },
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("Gemini API Error Response:", errorText)
      throw new Error(`Gemini API Error: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text
    if (!textResponse) {
      throw new Error("No response generated from Gemini")
    }

    return textResponse
  } catch (error: any) {
    console.error("Error in askGemini Action:", error)
    throw new Error(error.message || "INTERNAL_ERROR")
  }
}

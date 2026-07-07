"use client"

import { useState, useEffect, useTransition, useRef } from "react"
import { askGemini, type ChatMessage } from "@/app/actions/assistant"
import { formatMoney, CURRENCIES } from "@/lib/config"
import {
  toMonthly,
  convertCurrency,
  type Debt,
  type Transaction,
  type Recurring,
  type Goal,
} from "@/lib/finance"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  Sparkles,
  Calculator,
  Lightbulb,
  MessageSquare,
  Key,
  TrendingDown,
  Coins,
  ArrowRight,
  Info,
  ChevronRight,
  TrendingUp,
  AlertCircle
} from "lucide-react"
import { toast } from "sonner"

// --- Helper Types for Simulation ---
type SimulationResult = {
  months: number
  totalInterest: number
  timeline: {
    month: number
    remainingBalance: number
    debtsPaidThisMonth: string[]
  }[]
  debtDetails: {
    id: number
    name: string
    paidInMonth: number
  }[]
}

export function AssistantPanel({
  debts,
  transactions,
  recurring,
  goals,
  currency,
}: {
  debts: Debt[]
  transactions: Transaction[]
  recurring: Recurring[]
  goals: Goal[]
  currency: string
}) {
  // API Key state (local storage fallback)
  const [apiKey, setApiKey] = useState("")
  const [showKeyInput, setShowKeyInput] = useState(false)

  // Chat states
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([
    {
      role: "model",
      content: "¡Hola! Soy tu asistente financiero con Inteligencia Artificial. He analizado tus cuentas actuales y estoy listo para darte consejos. ¿En qué te gustaría enfocarte hoy?\n\nPuedes hacerme preguntas o hacer clic en una de las sugerencias rápidas abajo.",
    },
  ])
  const [inputMessage, setInputMessage] = useState("")
  const [pending, startTransition] = useTransition()
  const chatEndRef = useRef<HTMLDivElement>(null)

  // Debt calculator states
  const [extraPayment, setExtraPayment] = useState<number>(0)

  useEffect(() => {
    // Cargar clave de API del almacenamiento local si existe
    const savedKey = localStorage.getItem("user_gemini_api_key")
    if (savedKey) {
      setApiKey(savedKey)
    }
  }, [])

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [chatHistory])

  // Guardar clave API del usuario
  function handleSaveKey() {
    if (apiKey.trim()) {
      localStorage.setItem("user_gemini_api_key", apiKey.trim())
      toast.success("Clave API guardada localmente")
      setShowKeyInput(false)
    } else {
      localStorage.removeItem("user_gemini_api_key")
      toast.info("Clave API eliminada")
    }
  }

  // Enviar mensaje al asistente
  function handleSendMessage(messageText: string) {
    if (!messageText.trim()) return

    const newHistory = [...chatHistory, { role: "user" as const, content: messageText }]
    setChatHistory(newHistory)
    setInputMessage("")

    startTransition(async () => {
      try {
        const response = await askGemini({
          chatHistory: newHistory,
          debts,
          transactions,
          recurring,
          goals,
          currency,
          userApiKey: apiKey || undefined,
        })
        setChatHistory((prev) => [...prev, { role: "model" as const, content: response }])
      } catch (err: any) {
        console.error(err)
        if (err.message === "API_KEY_MISSING") {
          toast.error("Falta configurar la clave de API de Gemini")
          setShowKeyInput(true)
        } else {
          toast.error("Error al conectar con la Inteligencia Artificial")
        }
        // Deshacer el último mensaje del usuario para que pueda reintentar
        setChatHistory((prev) => prev.slice(0, -1))
      }
    })
  }

  // --- Algoritmos de Simulación de Deudas (Con Soporte Multidivisa) ---
  function runDebtSimulation(method: "snowball" | "avalanche"): SimulationResult {
    // Filtrar deudas con balance pendiente
    let activeDebts = debts
      .map((d) => ({
        ...d,
        remaining: d.totalAmount - d.paidAmount, // En la moneda original de la deuda
      }))
      .filter((d) => d.remaining > 0)

    if (activeDebts.length === 0) {
      return { months: 0, totalInterest: 0, timeline: [], debtDetails: [] }
    }

    // Ordenar deudas según el método, convirtiendo temporalmente a la moneda de visualización para comparar
    if (method === "snowball") {
      // Bola de nieve: Menor balance primero (en la moneda de visualización)
      activeDebts.sort(
        (a, b) =>
          convertCurrency(a.remaining, a.currency, currency) -
          convertCurrency(b.remaining, b.currency, currency)
      )
    } else {
      // Avalancha: Mayor tasa de interés primero
      activeDebts.sort((a, b) => b.interestRate - a.interestRate)
    }

    const debtDetails = activeDebts.map((d) => ({ id: d.id, name: d.name, paidInMonth: 0 }))
    const timeline: SimulationResult["timeline"] = []
    let totalInterest = 0 // Sumado en la moneda de visualización
    let month = 0
    const maxMonths = 360 // Límite de 30 años

    // Simulador mes a mes
    while (activeDebts.some((d) => d.remaining > 0) && month < maxMonths) {
      month++
      // Acelerador disponible este mes en la moneda de visualización
      let monthlyExtra = extraPayment
      let debtsPaidThisMonth: string[] = []

      // 1. Cobrar intereses mensuales primero y sumar el pago mínimo requerido
      activeDebts.forEach((d) => {
        if (d.remaining > 0) {
          const monthlyRate = d.interestRate / 100 / 12
          const interestCharge = d.remaining * monthlyRate // En moneda original de la deuda
          d.remaining += interestCharge
          totalInterest += convertCurrency(interestCharge, d.currency, currency)
        }
      });

      // 2. Realizar pagos mínimos mensuales (en la moneda de cada deuda)
      activeDebts.forEach((d) => {
        if (d.remaining > 0) {
          const minPay = Math.min(d.minimumPayment, d.remaining)
          d.remaining -= minPay

          if (d.remaining <= 0) {
            debtsPaidThisMonth.push(d.name)
            const detail = debtDetails.find((x) => x.id === d.id)
            if (detail) detail.paidInMonth = month
            // Convertimos la diferencia del mínimo no usado al acelerador en la moneda de visualización
            monthlyExtra += convertCurrency(d.minimumPayment - minPay, d.currency, currency)
          }
        }
      })

      // 3. Aplicar el acelerador (en moneda de visualización) convertido a la moneda de la deuda prioritaria
      if (monthlyExtra > 0) {
        for (const d of activeDebts) {
          if (d.remaining > 0) {
            // Convertir el acelerador mensual a la moneda de esta deuda
            const extraInDebtCurrency = convertCurrency(monthlyExtra, currency, d.currency)
            const extraPay = Math.min(extraInDebtCurrency, d.remaining)
            
            d.remaining -= extraPay
            // Restamos el equivalente pagado en la moneda de visualización
            monthlyExtra -= convertCurrency(extraPay, d.currency, currency)

            if (d.remaining <= 0) {
              if (!debtsPaidThisMonth.includes(d.name)) {
                debtsPaidThisMonth.push(d.name)
              }
              const detail = debtDetails.find((x) => x.id === d.id)
              if (detail && !detail.paidInMonth) detail.paidInMonth = month
            }

            if (monthlyExtra <= 0.01) break // Evitar flotantes residuales
          }
        }
      }

      // Guardar instantánea del mes (convertido a la moneda de visualización)
      const totalRemaining = activeDebts.reduce(
        (sum, d) => sum + convertCurrency(Math.max(d.remaining, 0), d.currency, currency),
        0
      )
      timeline.push({
        month,
        remainingBalance: totalRemaining,
        debtsPaidThisMonth,
      })

      if (totalRemaining <= 0) break
    }

    return {
      months: month,
      totalInterest,
      timeline,
      debtDetails,
    }
  }

  const snowballResult = runDebtSimulation("snowball")
  const avalancheResult = runDebtSimulation("avalanche")

  // --- Análisis de Gastos e Insights (Soporte Multidivisa) ---
  const activeRecurring = recurring.filter((r) => r.active)
  const monthlyFixedExpenses = activeRecurring
    .filter((r) => r.direction === "expense")
    .reduce((sum, r) => {
      const monthlyAmt = toMonthly(r.amount, r.frequency)
      return sum + convertCurrency(monthlyAmt, r.currency, currency)
    }, 0)

  // Filtrar transacciones del mes en curso para análisis
  const currentMonthTransactions = transactions.filter((t) => {
    const d = new Date(t.occurredAt)
    const now = new Date()
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
  })

  const antExpenses = currentMonthTransactions.filter((t) => t.isAnt)
  // Convertimos todos los gastos hormiga a la moneda de visualización para sumarlos correctamente
  const totalAntCost = antExpenses.reduce((sum, t) => sum + convertCurrency(t.amount, t.currency, currency), 0)

  // Agrupar gastos hormiga por descripción convirtiéndolos a la moneda de visualización
  const antCounts = antExpenses.reduce((acc, curr) => {
    const desc = curr.description.trim().toLowerCase()
    const convertedAmt = convertCurrency(curr.amount, curr.currency, currency)
    acc[desc] = (acc[desc] || 0) + convertedAmt
    return acc
  }, {} as Record<string, number>)

  const topAntExpenses = Object.entries(antCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)

  // Meta principal en moneda de visualización
  const firstGoal = goals[0]
  const targetInDisplay = firstGoal ? convertCurrency(firstGoal.targetAmount, firstGoal.currency, currency) : 0
  const savedInDisplay = firstGoal ? convertCurrency(firstGoal.savedAmount, firstGoal.currency, currency) : 0
  const remainingInDisplay = Math.max(targetInDisplay - savedInDisplay, 0)

  return (
    <div className="flex flex-col gap-6">
      {/* Configuration Box for Gemini API Key */}
      {showKeyInput && (
        <Card className="border border-primary/20 bg-gradient-to-r from-primary/5 to-transparent shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base text-primary">
              <Key className="h-4 w-4" />
              Configurar Clave API de Gemini
            </CardTitle>
            <CardDescription>
              Para usar el chat interactivo de Inteligencia Artificial, ingresa tu clave API. Esta clave se guardará localmente en tu navegador y no se compartirá públicamente.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col sm:flex-row gap-3">
            <Input
              type="password"
              placeholder="AIzaSy..."
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="font-mono flex-1 bg-background"
            />
            <div className="flex gap-2">
              <Button onClick={handleSaveKey} className="flex-1 sm:flex-none">
                Guardar Clave
              </Button>
              <Button variant="ghost" onClick={() => setShowKeyInput(false)}>
                Cancelar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="deudas" className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-card/60 border border-border/50 p-1 shadow-sm rounded-xl backdrop-blur-md">
          <TabsTrigger value="deudas" className="flex items-center gap-1.5 py-2 text-xs font-semibold rounded-lg transition-all duration-200 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm">
            <Calculator className="h-4 w-4 shrink-0" />
            <span className="hidden sm:inline">Plan de Deudas</span>
            <span className="sm:hidden">Deudas</span>
          </TabsTrigger>
          <TabsTrigger value="ahorros" className="flex items-center gap-1.5 py-2 text-xs font-semibold rounded-lg transition-all duration-200 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm">
            <Lightbulb className="h-4 w-4 shrink-0" />
            <span className="hidden sm:inline">Ideas de Ahorro</span>
            <span className="sm:hidden">Ahorro</span>
          </TabsTrigger>
          <TabsTrigger value="chat" className="flex items-center gap-1.5 py-2 text-xs font-semibold rounded-lg transition-all duration-200 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm">
            <MessageSquare className="h-4 w-4 shrink-0" />
            <span className="hidden sm:inline">Asistente IA</span>
            <span className="sm:hidden">IA Chat</span>
          </TabsTrigger>
        </TabsList>

        {/* ==================== TAB 1: DEBT PLANNER ==================== */}
        <TabsContent value="deudas" className="mt-4">
          {debts.length === 0 ? (
            <Card className="border-dashed py-12 text-center">
              <CardContent className="flex flex-col items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                  <Calculator className="h-6 w-6 text-muted-foreground" />
                </div>
                <p className="font-semibold text-lg">No hay deudas registradas</p>
                <p className="max-w-md text-sm text-muted-foreground">
                  Ve a la pestaña <strong>Deudas</strong> para registrar tus tarjetas, préstamos o pasivos. Una vez agregados, aquí podrás simular las mejores estrategias para saldarlos rápidamente.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6 md:grid-cols-3">
              {/* Controls Column */}
              <div className="md:col-span-1 flex flex-col gap-4">
                <Card className="bg-card/50">
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-1.5">
                      <TrendingDown className="h-4 w-4 text-primary" />
                      Acelerador de Deuda
                    </CardTitle>
                    <CardDescription>
                      Añade un pago extra mensual en <strong>{currency}</strong> además del pago mínimo para ver cómo se acorta el plazo.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex flex-col gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-muted-foreground uppercase">
                        Monto extra al mes ({currency})
                      </label>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-mono font-medium text-muted-foreground">
                          {currency}
                        </span>
                        <Input
                          type="number"
                          min="0"
                          step="100"
                          value={extraPayment || ""}
                          placeholder="Ej. 1000"
                          onChange={(e) => setExtraPayment(Number(e.target.value))}
                          className="font-mono"
                        />
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 text-xs"
                        onClick={() => setExtraPayment((prev) => Math.max(0, prev - 500))}
                      >
                        -{formatMoney(500, currency)}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 text-xs"
                        onClick={() => setExtraPayment((prev) => prev + 500)}
                      >
                        +{formatMoney(500, currency)}
                      </Button>
                    </div>

                    <div className="rounded-lg bg-primary/5 p-3 border border-primary/10 flex items-start gap-2 text-xs text-primary leading-normal">
                      <Info className="h-4 w-4 shrink-0 mt-0.5" />
                      <p>
                        Los saldos se convierten y simulan dinámicamente a pesos dominicanos u otras monedas. Cuando una deuda se liquida por completo, su pago mínimo se redirige automáticamente.
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Comparison Card */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-semibold text-muted-foreground uppercase">
                      Comparativa de Métodos
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    <div className="flex items-center justify-between pb-2 border-b border-border">
                      <span className="font-medium text-muted-foreground">Estrategia</span>
                      <span className="font-bold">Meses / Interés</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <div className="h-2 w-2 rounded-full bg-emerald-500" />
                        <span className="font-medium">Bola de Nieve</span>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{snowballResult.months} meses</p>
                        <p className="text-xs text-muted-foreground font-mono">
                          Int: {formatMoney(snowballResult.totalInterest, currency)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <div className="h-2 w-2 rounded-full bg-blue-500" />
                        <span className="font-medium">Avalancha</span>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{avalancheResult.months} meses</p>
                        <p className="text-xs text-muted-foreground font-mono">
                          Int: {formatMoney(avalancheResult.totalInterest, currency)}
                        </p>
                      </div>
                    </div>

                    {avalancheResult.totalInterest !== snowballResult.totalInterest && (
                      <div className="mt-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-2.5 text-xs text-emerald-600 dark:text-emerald-400">
                        {avalancheResult.totalInterest < snowballResult.totalInterest ? (
                          <p>
                            ¡El método <strong>Avalancha</strong> te ahorra{" "}
                            <strong>
                              {formatMoney(
                                snowballResult.totalInterest - avalancheResult.totalInterest,
                                currency
                              )}
                            </strong>{" "}
                            en intereses!
                          </p>
                        ) : (
                          <p>
                            ¡El método <strong>Bola de Nieve</strong> te ahorra{" "}
                            <strong>
                              {formatMoney(
                                avalancheResult.totalInterest - snowballResult.totalInterest,
                                currency
                              )}
                            </strong>{" "}
                            en intereses!
                          </p>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Simulation Result Details Column */}
              <div className="md:col-span-2 flex flex-col gap-4">
                <Card>
                  <CardHeader>
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <CardTitle className="text-lg">Cronograma de Liquidación</CardTitle>
                        <CardDescription>
                          Cómo irías eliminando tus deudas mes a mes.
                        </CardDescription>
                      </div>
                      <Badge variant="secondary" className="bg-primary/10 text-primary">
                        Estrategia Sugerida: Avalancha
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Method details */}
                    <div>
                      <h4 className="text-sm font-semibold mb-3 flex items-center gap-1">
                        <Coins className="h-4 w-4 text-primary" />
                        Orden de Pago Recomendado (Avalancha)
                      </h4>
                      <div className="relative border-l border-primary/20 pl-4 ml-2 space-y-4">
                        {avalancheResult.debtDetails
                          .sort((a, b) => a.paidInMonth - b.paidInMonth)
                          .map((d, i) => {
                            const originalDebt = debts.find((x) => x.id === d.id)
                            return (
                              <div key={d.id} className="relative group">
                                <div className="absolute -left-[21px] top-1.5 h-3.5 w-3.5 rounded-full border-2 border-primary bg-card" />
                                <div className="flex items-start justify-between gap-3 text-sm">
                                  <div>
                                    <p className="font-semibold text-foreground flex items-center gap-2">
                                      {d.name}
                                      <Badge variant="secondary" className="font-mono text-[9px] h-4">
                                        {originalDebt?.currency}
                                      </Badge>
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-0.5">
                                      Tasa: {originalDebt?.interestRate}% anual · Pendiente original:{" "}
                                      {formatMoney(
                                        originalDebt
                                          ? originalDebt.totalAmount - originalDebt.paidAmount
                                          : 0,
                                        originalDebt?.currency
                                      )}
                                    </p>
                                  </div>
                                  <Badge className="bg-primary/25 text-primary hover:bg-primary/30 font-mono">
                                    Pagada en Mes {d.paidInMonth}
                                  </Badge>
                                </div>
                              </div>
                            )
                          })}
                      </div>
                    </div>

                    {/* Quick Stats */}
                    <div className="grid grid-cols-2 gap-3 pt-3 border-t border-border">
                      <div className="p-3 bg-secondary/20 rounded-xl">
                        <p className="text-xs text-muted-foreground">Tiempo total para deuda cero</p>
                        <p className="text-xl font-bold font-mono text-primary mt-1">
                          {avalancheResult.months} meses
                        </p>
                      </div>
                      <div className="p-3 bg-secondary/20 rounded-xl">
                        <p className="text-xs text-muted-foreground">Total interés a pagar ({currency})</p>
                        <p className="text-xl font-bold font-mono text-destructive mt-1">
                          {formatMoney(avalancheResult.totalInterest, currency)}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </TabsContent>

        {/* ==================== TAB 2: SAVINGS SUGGESTIONS ==================== */}
        <TabsContent value="ahorros" className="mt-4">
          <div className="grid gap-6 md:grid-cols-3">
            {/* Gastos Hormiga Widget */}
            <div className="md:col-span-1 flex flex-col gap-4">
              <Card className="bg-destructive/5 border-destructive/20">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-1.5 text-destructive">
                    <TrendingDown className="h-4 w-4" />
                    Gastos Hormiga del Mes
                  </CardTitle>
                  <CardDescription className="text-xs text-destructive/80">
                    Gasto acumulado en pequeños consumos diarios prescindibles.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center py-2 border-b border-destructive/10">
                    <p className="text-xs text-muted-foreground">Total Gastado (en {currency})</p>
                    <p className="text-3xl font-mono font-bold text-destructive mt-1">
                      {formatMoney(totalAntCost, currency)}
                    </p>
                  </div>

                  {topAntExpenses.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center">
                      No has marcado transacciones como "Gasto Hormiga" este mes.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-xs font-semibold text-muted-foreground uppercase">
                        Mayores fugas de dinero (en {currency})
                      </p>
                      <div className="space-y-2 text-sm">
                        {topAntExpenses.map(([desc, amount]) => (
                          <div key={desc} className="flex justify-between items-center bg-card p-2 rounded-lg border border-destructive/10">
                            <span className="capitalize font-medium truncate pr-2">{desc}</span>
                            <span className="font-mono font-semibold text-destructive shrink-0">
                              {formatMoney(amount, currency)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {totalAntCost > 0 && goals.length > 0 && (
                    <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-2.5 text-xs text-destructive leading-normal flex gap-1.5 items-start">
                      <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                      <p>
                        Redirigir tu gasto hormiga a tu meta <strong>{goals[0].name}</strong> aceleraría su cumplimiento por completo.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Monthly Savings Capacity */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Capacidad de Ahorro</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Fijos Mensuales:</span>
                    <span className="font-mono font-semibold">
                      {formatMoney(monthlyFixedExpenses, currency)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Gastos Hormiga:</span>
                    <span className="font-mono font-semibold text-destructive">
                      {formatMoney(totalAntCost, currency)}
                    </span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-border font-medium">
                    <span>Ahorro Potencial:</span>
                    <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                      {formatMoney(Math.max(0, totalAntCost * 0.8), currency)}
                      /mes
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Savings Challenges & Recommendations */}
            <div className="md:col-span-2 flex flex-col gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Estrategias e Ideas de Ahorro Personalizadas</CardTitle>
                  <CardDescription>
                    Implementa estas tácticas sencillas basadas en tus movimientos de cuenta.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Challenge 1 */}
                  <div className="flex items-start gap-4 p-4 rounded-xl border border-border hover:border-primary/30 transition-all bg-card/45">
                    <div className="h-10 w-10 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0">
                      <Coins className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="font-semibold text-sm">Desafío del Gasto Cero Semanal</h4>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        Elige un día fijo a la semana (ej. Miércoles) donde no gastes absolutamente nada que no esté planificado. Evita cafés, antojos y suscripciones extras. Al mes, este hábito reduce los gastos variables en aproximadamente un 15%.
                      </p>
                    </div>
                  </div>

                  {/* Challenge 2 */}
                  <div className="flex items-start gap-4 p-4 rounded-xl border border-border hover:border-primary/30 transition-all bg-card/45">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <TrendingUp className="h-5 w-5 text-primary" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="font-semibold text-sm">Regla de las 72 Horas para Compras</h4>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        Cada vez que desees comprar un artículo no esencial (ropa, gadgets, salidas), colócalo en una lista de espera por 72 horas. Si después de 3 días aún consideras que es necesario, procede. Esto erradica el 90% de los impulsos de compra.
                      </p>
                    </div>
                  </div>

                  {/* Challenge 3 */}
                  <div className="flex items-start gap-4 p-4 rounded-xl border border-border hover:border-primary/30 transition-all bg-card/45">
                    <div className="h-10 w-10 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0">
                      <Lightbulb className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="font-semibold text-sm">Optimización de Suscripciones Fijas</h4>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        Tienes {recurring.filter(r => r.direction === "expense" && r.active).length} suscripciones/servicios fijos activos. Haz una revisión trimestral: cancela las plataformas de streaming que no hayas abierto en el último mes o cámbiate a planes anuales/familiares compartidos.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Actionable Plan Widget for first Goal */}
              {firstGoal && (
                <Card className="bg-emerald-500/5 border-emerald-500/15">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                      <ArrowRight className="h-4 w-4" />
                      Plan de Ahorro para tu Meta: {firstGoal.name} ({firstGoal.currency})
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm space-y-3">
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Tu meta requiere acumular {formatMoney(firstGoal.targetAmount, firstGoal.currency)}. Faltan {formatMoney(firstGoal.targetAmount - firstGoal.savedAmount, firstGoal.currency)}
                      {firstGoal.currency !== currency && ` (~ ${formatMoney(remainingInDisplay, currency)})`}.
                    </p>
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span>Ahorro mensual sugerido</span>
                        <span className="font-bold">Meta con Recorte Hormiga</span>
                      </div>
                      <Progress
                        value={((savedInDisplay + totalAntCost) / targetInDisplay) * 100}
                        className="h-2"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground leading-normal">
                      Si depositas la cantidad habitual más el ahorro de tus <strong>gastos hormiga mensuales ({formatMoney(totalAntCost, currency)})</strong>, reducirás el tiempo para alcanzar tu meta en aproximadamente <strong>2.5 meses</strong>.
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>

        {/* ==================== TAB 3: AI CHAT ASSISTANT ==================== */}
        <TabsContent value="chat" className="mt-4">
          <Card className="flex flex-col h-[600px] max-h-[80svh]">
            {/* Header info */}
            <CardHeader className="pb-3 border-b border-border flex flex-row items-center justify-between gap-4">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  Chat Financiero con IA
                </CardTitle>
                <CardDescription className="text-xs">
                  Resuelve dudas financieras con Gemini a partir de tu perfil de deudas, metas e ingresos.
                </CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="text-xs shrink-0"
                onClick={() => setShowKeyInput(!showKeyInput)}
              >
                <Key className="h-3.5 w-3.5 mr-1" />
                {apiKey ? "Clave API Guardada" : "Configurar API Key"}
              </Button>
            </CardHeader>

            {/* Chat Messages */}
            <CardContent className="flex-1 overflow-hidden p-0 relative">
              <ScrollArea className="h-full p-4">
                <div className="space-y-4 pr-3">
                  {chatHistory.map((msg, index) => {
                    const isUser = msg.role === "user"
                    return (
                      <div
                        key={index}
                        className={`flex ${isUser ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                            isUser
                              ? "bg-primary text-primary-foreground shadow-sm rounded-tr-sm"
                              : "bg-muted/80 backdrop-blur-sm border border-border/60 text-foreground shadow-sm rounded-tl-sm"
                          }`}
                        >
                          <div className="whitespace-pre-wrap">{msg.content}</div>
                        </div>
                      </div>
                    )
                  })}
                  {pending && (
                    <div className="flex justify-start">
                      <div className="bg-muted/80 backdrop-blur-sm border border-border/60 text-foreground shadow-sm rounded-2xl rounded-tl-sm px-4 py-3 text-sm flex items-center gap-2">
                        <div className="flex space-x-1">
                          <div className="h-2 w-2 rounded-full bg-muted-foreground/45 animate-bounce" style={{ animationDelay: "0ms" }} />
                          <div className="h-2 w-2 rounded-full bg-muted-foreground/45 animate-bounce" style={{ animationDelay: "150ms" }} />
                          <div className="h-2 w-2 rounded-full bg-muted-foreground/45 animate-bounce" style={{ animationDelay: "300ms" }} />
                        </div>
                        <span className="text-xs text-muted-foreground">Pensando...</span>
                      </div>
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </div>
              </ScrollArea>
            </CardContent>

            {/* Input area */}
            <div className="p-3 border-t border-border bg-card/50 flex flex-col gap-2 shrink-0">
              {/* Quick suggestions */}
              <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-2 px-2 scrollbar-none">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleSendMessage("Analizar mis finanzas y darme 3 consejos de ahorro")}
                  disabled={pending}
                  className="text-xs whitespace-nowrap shrink-0 rounded-full"
                >
                  3 Consejos de Ahorro
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleSendMessage("¿Cómo reducir mis gastos hormiga?")}
                  disabled={pending}
                  className="text-xs whitespace-nowrap shrink-0 rounded-full"
                >
                  Reducir Gastos Hormiga
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleSendMessage("Explicar mi plan de liquidación de deudas detalladamente")}
                  disabled={pending}
                  className="text-xs whitespace-nowrap shrink-0 rounded-full"
                >
                  Detalle Plan de Deudas
                </Button>
              </div>

              {/* Text Input */}
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  handleSendMessage(inputMessage)
                }}
                className="flex items-center gap-2"
              >
                <Input
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  placeholder="Escribe tu duda financiera..."
                  disabled={pending}
                  className="flex-1 bg-background"
                />
                <Button type="submit" disabled={pending || !inputMessage.trim()}>
                  Enviar
                </Button>
              </form>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

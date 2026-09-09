export type Debt = {
  id: number
  name: string
  creditor: string | null
  type: string
  totalAmount: number
  paidAmount: number
  interestRate: number
  minimumPayment: number
  dueDay: number | null
  currency: string
  notes: string | null
  createdAt: Date | string
}

export type BankAccount = {
  id: number
  userId: string
  bankName: string | null // Ej. "Banco Popular", "BHD León", "ScotiaBank", "Efectivo"
  name: string // Ej. "Nómina", "Ahorros USD", "Tarjeta Gold"
  type: string // "cuenta_ahorro" | "cuenta_corriente" | "tarjeta_credito" | "efectivo" | "inversion" | "otro"
  balance: number
  currency: string
  accountNumber: string | null
  color: string | null
  notes: string | null
  createdAt: Date | string
  updatedAt: Date | string
}

export type Transaction = {
  id: number
  type: string
  category: string
  description: string
  amount: number
  currency: string
  bankAccountId?: number | null
  business: string | null
  isAnt: boolean
  occurredAt: Date | string
  createdAt: Date | string
}

export type Recurring = {
  id: number
  direction: string
  description: string
  category: string
  amount: number
  currency: string
  frequency: string
  dayOfMonth: number | null
  active: boolean
  createdAt: Date | string
}

export type Goal = {
  id: number
  name: string
  targetAmount: number
  savedAmount: number
  currency: string
  targetDate: string | null
  notes: string | null
  createdAt: Date | string
}

export type Settings = {
  displayCurrency: string
  monthlyIncome: number
}

export type UserProfile = {
  id: string
  email: string
  name: string
  createdAt?: string
  avatarColor?: string
  payDay?: number
  phone?: string
  notificationsEnabled?: boolean
}

// Tasas de cambio fijas respecto a 1 USD (como base de referencia)
export const EXCHANGE_RATES: Record<string, number> = {
  USD: 1.0,
  DOP: 60.0,
  EUR: 0.92,
  MXN: 17.5,
  COP: 4000.0,
  ARS: 950.0,
  CAD: 1.36,
}

export function convertCurrency(amount: number, from: string, to: string): number {
  const cleanFrom = (from || "DOP").toUpperCase()
  const cleanTo = (to || "DOP").toUpperCase()
  if (cleanFrom === cleanTo) return amount

  const fromRate = EXCHANGE_RATES[cleanFrom] ?? EXCHANGE_RATES.DOP
  const toRate = EXCHANGE_RATES[cleanTo] ?? EXCHANGE_RATES.DOP

  // Convertir de origen a USD, luego de USD a destino
  const amountInUSD = amount / fromRate
  return amountInUSD * toRate
}

// Normaliza una recurrencia a su equivalente mensual aproximado
export function toMonthly(amount: number, frequency: string) {
  switch (frequency) {
    case "semanal":
      return amount * 4.33
    case "quincenal":
      return amount * 2
    case "mensual":
      return amount
    case "anual":
      return amount / 12
    default:
      return amount
  }
}

export function remaining(debt: Debt) {
  return Math.max(debt.totalAmount - debt.paidAmount, 0)
}

export function totalDebt(debts: Debt[], targetCurrency: string = "DOP") {
  return debts.reduce((sum, d) => sum + convertCurrency(remaining(d), d.currency, targetCurrency), 0)
}

export function monthNow() {
  const d = new Date()
  return { year: d.getFullYear(), month: d.getMonth() }
}

export function isSameMonth(dateLike: Date | string) {
  const d = new Date(dateLike)
  const { year, month } = monthNow()
  return d.getFullYear() === year && d.getMonth() === month
}

export function summarize(
  transactions: Transaction[],
  recurring: Recurring[],
  targetCurrency: string = "DOP",
) {
  const monthTx = transactions.filter((t) => isSameMonth(t.occurredAt))
  const income = monthTx
    .filter((t) => t.type === "income")
    .reduce((s, t) => s + convertCurrency(t.amount, t.currency, targetCurrency), 0)
  const expenses = monthTx
    .filter((t) => t.type === "expense")
    .reduce((s, t) => s + convertCurrency(t.amount, t.currency, targetCurrency), 0)
  const antExpenses = monthTx
    .filter((t) => t.type === "expense" && t.isAnt)
    .reduce((s, t) => s + convertCurrency(t.amount, t.currency, targetCurrency), 0)

  const activeRec = recurring.filter((r) => r.active)
  const fixedIncome = activeRec
    .filter((r) => r.direction === "income")
    .reduce((s, r) => s + convertCurrency(toMonthly(r.amount, r.frequency), r.currency, targetCurrency), 0)
  const fixedExpenses = activeRec
    .filter((r) => r.direction === "expense")
    .reduce((s, r) => s + convertCurrency(toMonthly(r.amount, r.frequency), r.currency, targetCurrency), 0)

  return {
    income,
    expenses,
    antExpenses,
    balance: income - expenses,
    fixedIncome,
    fixedExpenses,
    projectedBalance: income + fixedIncome - expenses - fixedExpenses,
  }
}

export function totalBankBalance(
  bankAccounts: BankAccount[],
  targetCurrency: string = "DOP"
): number {
  return bankAccounts.reduce(
    (sum, acc) => sum + convertCurrency(acc.balance, acc.currency, targetCurrency),
    0
  )
}

export type DateRangePreset = "este_mes" | "30_dias" | "este_ano" | "todo" | "custom"

export function filterTransactionsByDateRange(
  transactions: Transaction[],
  preset: DateRangePreset,
  customStart?: string,
  customEnd?: string
): Transaction[] {
  const now = new Date()

  return transactions.filter((t) => {
    const txDate = new Date(t.occurredAt)
    if (isNaN(txDate.getTime())) return true

    if (preset === "este_mes") {
      return (
        txDate.getFullYear() === now.getFullYear() &&
        txDate.getMonth() === now.getMonth()
      )
    }

    if (preset === "30_dias") {
      const thirtyDaysAgo = new Date(now)
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
      return txDate >= thirtyDaysAgo && txDate <= now
    }

    if (preset === "este_ano") {
      return txDate.getFullYear() === now.getFullYear()
    }

    if (preset === "custom") {
      if (customStart && customEnd) {
        const start = new Date(customStart)
        start.setHours(0, 0, 0, 0)
        const end = new Date(customEnd)
        end.setHours(23, 59, 59, 999)
        return txDate >= start && txDate <= end
      }
      if (customStart) {
        const start = new Date(customStart)
        start.setHours(0, 0, 0, 0)
        return txDate >= start
      }
      if (customEnd) {
        const end = new Date(customEnd)
        end.setHours(23, 59, 59, 999)
        return txDate <= end
      }
    }

    // "todo"
    return true
  })
}

export function getCategoryBreakdown(
  transactions: Transaction[],
  targetCurrency: string = "DOP"
) {
  // Excluir transferencias internas de los gastos de consumo real
  const expenseTxs = transactions.filter(
    (t) => t.type === "expense" && t.category !== "transferencia"
  )

  const totalsByCategory: Record<string, number> = {}
  let totalExpenses = 0

  for (const t of expenseTxs) {
    const converted = convertCurrency(t.amount, t.currency, targetCurrency)
    const cat = t.category || "general"
    totalsByCategory[cat] = (totalsByCategory[cat] || 0) + converted
    totalExpenses += converted
  }

  const breakdown = Object.entries(totalsByCategory)
    .map(([category, amount]) => ({
      category,
      amount,
      percentage: totalExpenses > 0 ? (amount / totalExpenses) * 100 : 0,
    }))
    .sort((a, b) => b.amount - a.amount)

  return {
    breakdown,
    totalExpenses,
  }
}

export function getNetWorth(
  bankAccounts: BankAccount[],
  debts: Debt[],
  targetCurrency: string = "DOP"
) {
  const assets = totalBankBalance(bankAccounts, targetCurrency)
  const liabilities = totalDebt(debts, targetCurrency)
  return {
    assets,
    liabilities,
    netWorth: assets - liabilities,
  }
}

export function getMonthlyTrends(
  transactions: Transaction[],
  targetCurrency: string = "DOP"
) {
  // Agrupar los últimos 6 meses
  const monthsMap: Record<string, { monthLabel: string; income: number; expense: number }> = {}
  const now = new Date()

  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
    const monthName = d.toLocaleDateString("es-DO", { month: "short" })
    monthsMap[key] = { monthLabel: monthName, income: 0, expense: 0 }
  }

  for (const t of transactions) {
    const d = new Date(t.occurredAt)
    if (isNaN(d.getTime())) continue
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
    if (monthsMap[key]) {
      const converted = convertCurrency(t.amount, t.currency, targetCurrency)
      if (t.type === "income") {
        monthsMap[key].income += converted
      } else if (t.type === "expense" && t.category !== "transferencia") {
        monthsMap[key].expense += converted
      }
    }
  }

  return Object.values(monthsMap)
}


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

export type Transaction = {
  id: number
  type: string
  category: string
  description: string
  amount: number
  currency: string
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

// Tasas de cambio fijas respecto a 1 USD (como base de referencia)
export const EXCHANGE_RATES: Record<string, number> = {
  USD: 1.0,
  DOP: 60.0,
  EUR: 0.92,
  MXN: 17.5,
  COP: 4000.0,
  ARS: 950.0,
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

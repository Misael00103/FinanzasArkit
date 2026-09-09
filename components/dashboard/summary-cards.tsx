"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { formatMoney } from "@/lib/config"
import {
  summarize,
  totalDebt,
  remaining,
  convertCurrency,
  totalBankBalance,
  filterTransactionsByDateRange,
  getCategoryBreakdown,
  getNetWorth,
  getMonthlyTrends,
  type DateRangePreset,
  type Debt,
  type Transaction,
  type Recurring,
  type Goal,
  type BankAccount,
} from "@/lib/finance"
import {
  TrendingUp,
  TrendingDown,
  CreditCard,
  Bug,
  PiggyBank,
  Scale,
  Landmark,
  Calendar,
  PieChart as PieIcon,
  BarChart3,
  ShieldAlert,
  ShieldCheck,
  Zap,
  ArrowUpRight,
  ArrowDownRight,
  Layers,
  Utensils,
  Wrench,
  Car,
  ShoppingBag,
  ArrowRightLeft,
} from "lucide-react"

const CATEGORY_META: Record<string, { label: string; icon: any; color: string }> = {
  comida: { label: "Comida / Restaurantes", icon: Utensils, color: "bg-orange-500" },
  servicio: { label: "Servicios / Facturas", icon: Wrench, color: "bg-blue-500" },
  transporte: { label: "Transporte / Combustible", icon: Car, color: "bg-indigo-500" },
  gasto_hormiga: { label: "Gastos Hormiga", icon: Bug, color: "bg-amber-500" },
  gasto: { label: "Gastos Generales", icon: ShoppingBag, color: "bg-rose-500" },
  entrada: { label: "Entradas / Ingresos", icon: TrendingUp, color: "bg-emerald-500" },
  transferencia: { label: "Transferencias Internas", icon: ArrowRightLeft, color: "bg-slate-400" },
}

export function SummaryCards({
  debts,
  transactions,
  recurring,
  goals,
  bankAccounts = [],
  currency,
}: {
  debts: Debt[]
  transactions: Transaction[]
  recurring: Recurring[]
  goals: Goal[]
  bankAccounts?: BankAccount[]
  currency: string
}) {
  // Date Range state
  const [datePreset, setDatePreset] = useState<DateRangePreset>("este_mes")
  const [customStart, setCustomStart] = useState<string>("")
  const [customEnd, setCustomEnd] = useState<string>("")

  // Filter transactions according to selected date range
  const filteredTxs = filterTransactionsByDateRange(
    transactions,
    datePreset,
    customStart,
    customEnd
  )

  const s = summarize(filteredTxs, recurring, currency)
  const deudaTotal = totalDebt(debts, currency)
  const saldoCuentas = totalBankBalance(bankAccounts, currency)
  const netWorthInfo = getNetWorth(bankAccounts, debts, currency)
  const categoryData = getCategoryBreakdown(filteredTxs, currency)
  const monthlyTrends = getMonthlyTrends(transactions, currency)

  const metaTotal = goals.reduce((sum, g) => sum + convertCurrency(g.savedAmount, g.currency, currency), 0)
  const metaObjetivo = goals.reduce((sum, g) => sum + convertCurrency(g.targetAmount, g.currency, currency), 0)

  const stats = [
    {
      label: "Dinero en Cuentas",
      value: saldoCuentas,
      icon: Landmark,
      tone: "text-blue-600 dark:text-blue-400",
      bg: "bg-blue-500/10 border-blue-500/20",
      gradient: "from-blue-500/5 via-transparent to-transparent",
    },
    {
      label: "Ingresos (Periodo)",
      value: s.income,
      icon: TrendingUp,
      tone: "text-emerald-600 dark:text-emerald-400",
      bg: "bg-emerald-500/10 border-emerald-500/20",
      gradient: "from-emerald-500/5 via-transparent to-transparent",
    },
    {
      label: "Gastos (Periodo)",
      value: s.expenses,
      icon: TrendingDown,
      tone: "text-rose-600 dark:text-rose-400",
      bg: "bg-rose-500/10 border-rose-500/20",
      gradient: "from-rose-500/5 via-transparent to-transparent",
    },
    {
      label: "Balance (Periodo)",
      value: s.balance,
      icon: Scale,
      tone: s.balance >= 0 ? "text-indigo-600 dark:text-indigo-400" : "text-rose-600 dark:text-rose-400",
      bg: s.balance >= 0 ? "bg-indigo-500/10 border-indigo-500/20" : "bg-rose-500/10 border-rose-500/20",
      gradient: s.balance >= 0 ? "from-indigo-500/5 via-transparent to-transparent" : "from-rose-500/5 via-transparent to-transparent",
    },
    {
      label: "Gastos Hormiga (Periodo)",
      value: s.antExpenses,
      icon: Bug,
      tone: "text-amber-600 dark:text-amber-400",
      bg: "bg-amber-500/10 border-amber-500/20",
      gradient: "from-amber-500/5 via-transparent to-transparent",
    },
    {
      label: "Deuda Pendiente Total",
      value: deudaTotal,
      icon: CreditCard,
      tone: "text-orange-600 dark:text-orange-400",
      bg: "bg-orange-500/10 border-orange-500/20",
      gradient: "from-orange-500/5 via-transparent to-transparent",
    },
  ]

  // Base para Regla 50/30/20
  const baseIngreso = s.income + s.fixedIncome
  const plan = {
    necesidades: baseIngreso * 0.5,
    deseos: baseIngreso * 0.3,
    ahorroDeuda: baseIngreso * 0.2,
  }

  const topDebts = [...debts]
    .filter((d) => remaining(d) > 0)
    .sort((a, b) => b.interestRate - a.interestRate)
    .slice(0, 3)

  return (
    <div className="flex flex-col gap-6">
      {/* Date Range Filter Bar */}
      <Card className="border border-border/60 bg-card/70 backdrop-blur-md shadow-sm">
        <CardContent className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary shrink-0" />
            <div>
              <p className="text-sm font-bold text-foreground">Rango de Fechas y Análisis</p>
              <p className="text-xs text-muted-foreground">Filtra las métricas de ingresos, gastos y gráficos</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Select value={datePreset} onValueChange={(val) => setDatePreset(val as DateRangePreset)}>
              <SelectTrigger className="w-44 bg-background">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="este_mes">Este Mes</SelectItem>
                <SelectItem value="30_dias">Últimos 30 días</SelectItem>
                <SelectItem value="este_ano">Este Año</SelectItem>
                <SelectItem value="todo">Todo el Historial</SelectItem>
                <SelectItem value="custom">Rango Personalizado</SelectItem>
              </SelectContent>
            </Select>

            {datePreset === "custom" && (
              <div className="flex items-center gap-2">
                <Input
                  type="date"
                  value={customStart}
                  onChange={(e) => setCustomStart(e.target.value)}
                  className="w-36 bg-background text-xs"
                />
                <span className="text-xs text-muted-foreground">a</span>
                <Input
                  type="date"
                  value={customEnd}
                  onChange={(e) => setCustomEnd(e.target.value)}
                  className="w-36 bg-background text-xs"
                />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 3 Visual Cards for Net Worth / Financial Position */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: Patrimonio Neto Líquido */}
        <Card className="relative overflow-hidden border border-primary/20 bg-gradient-to-br from-primary/10 via-card to-card shadow-sm hover:shadow-md transition-all backdrop-blur-md">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between gap-2">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Scale className="h-4 w-4 text-primary" />
                Patrimonio Neto Líquido
              </CardTitle>
              {netWorthInfo.netWorth >= 0 ? (
                <Badge variant="secondary" className="gap-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 text-[10px]">
                  <ShieldCheck className="h-3 w-3" /> Solvente
                </Badge>
              ) : (
                <Badge variant="destructive" className="gap-1 text-[10px]">
                  <ShieldAlert className="h-3 w-3" /> Atención Deudas
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <div>
              <p className={`font-display text-2xl font-black tracking-tight ${netWorthInfo.netWorth >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
                {formatMoney(netWorthInfo.netWorth, currency)}
              </p>
              <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">
                Calculado como: <span className="font-semibold text-foreground">{formatMoney(netWorthInfo.assets, currency)}</span> en cuentas bancarias − <span className="font-semibold text-destructive">{formatMoney(netWorthInfo.liabilities, currency)}</span> en deudas pendientes.
              </p>
            </div>

            {/* Solvency Progress Bar Indicator */}
            <div className="space-y-1 pt-1">
              <div className="flex justify-between text-[10px] font-semibold text-muted-foreground">
                <span>Ratio de Solvencia Líquida</span>
                <span>
                  {netWorthInfo.assets > 0
                    ? Math.min(
                        Math.round(
                          (netWorthInfo.assets /
                            (netWorthInfo.assets + netWorthInfo.liabilities)) *
                            100
                        ),
                        100
                      )
                    : 0}
                  %
                </span>
              </div>
              <Progress
                value={
                  netWorthInfo.assets > 0
                    ? Math.min(
                        (netWorthInfo.assets /
                          (netWorthInfo.assets + netWorthInfo.liabilities)) *
                          100,
                        100
                      )
                    : 0
                }
                className="h-2"
              />
            </div>
          </CardContent>
        </Card>

        {/* Card 2: Total Activos (Bancos) */}
        <Card className="relative overflow-hidden border border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 via-card to-card shadow-sm hover:shadow-md transition-all backdrop-blur-md">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between gap-2">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Landmark className="h-4 w-4 text-emerald-500" />
                Total Activos (Bancos)
              </CardTitle>
              <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 font-mono text-[10px]">
                + Activos
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <div>
              <p className="font-display text-2xl font-black tracking-tight text-emerald-600 dark:text-emerald-400 font-mono">
                +{formatMoney(netWorthInfo.assets, currency)}
              </p>
              <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">
                Dinero total acumulado disponible en todas tus cuentas bancarias y cajas.
              </p>
            </div>

            {/* Asset Power Graphic */}
            <div className="space-y-1 pt-1">
              <div className="flex justify-between text-[10px] font-semibold text-muted-foreground">
                <span>Disponibilidad Líquida</span>
                <span className="text-emerald-500 font-bold">100% Disponible</span>
              </div>
              <Progress value={100} className="h-2 bg-emerald-500/20" />
            </div>
          </CardContent>
        </Card>

        {/* Card 3: Total Pasivos (Deudas) */}
        <Card className="relative overflow-hidden border border-rose-500/20 bg-gradient-to-br from-rose-500/10 via-card to-card shadow-sm hover:shadow-md transition-all backdrop-blur-md">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between gap-2">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <CreditCard className="h-4 w-4 text-rose-500" />
                Total Pasivos (Deudas)
              </CardTitle>
              <Badge variant="destructive" className="font-mono text-[10px]">
                - Pasivos
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <div>
              <p className="font-display text-2xl font-black tracking-tight text-rose-600 dark:text-rose-400 font-mono">
                -{formatMoney(netWorthInfo.liabilities, currency)}
              </p>
              <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">
                Balance total por saldar en tarjetas de crédito, préstamos y pasivos.
              </p>
            </div>

            {/* Liability Burden Graphic */}
            <div className="space-y-1 pt-1">
              <div className="flex justify-between text-[10px] font-semibold text-muted-foreground">
                <span>Presión de Deuda</span>
                <span className="text-rose-500 font-bold">
                  {netWorthInfo.assets > 0
                    ? (netWorthInfo.liabilities / netWorthInfo.assets).toFixed(1)
                    : "0"}
                  x de tus activos
                </span>
              </div>
              <Progress
                value={
                  netWorthInfo.assets > 0
                    ? Math.min(
                        (netWorthInfo.liabilities / netWorthInfo.assets) * 100,
                        100
                      )
                    : 100
                }
                className="h-2 bg-rose-500/20"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
        {stats.map((stat) => (
          <Card key={stat.label} className="group relative overflow-hidden border border-border/60 bg-card/70 shadow-sm backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:border-border/100 hover:shadow-md">
            <div className={`absolute inset-0 bg-gradient-to-br ${stat.gradient}`} />
            
            <CardContent className="relative z-10 flex items-start gap-3.5 p-4 sm:p-5">
              <div
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border ${stat.bg} shadow-sm transition-all duration-300 group-hover:scale-110`}
              >
                <stat.icon className={`h-5 w-5 ${stat.tone}`} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium tracking-wide text-muted-foreground">{stat.label}</p>
                <p className={`mt-1 truncate font-display text-xl font-black tracking-tight ${stat.tone}`}>
                  {formatMoney(stat.value, currency)}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Graphical Breakdown & Trends Section */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Category Expense Breakdown Chart */}
        <Card className="border border-border/60 bg-card/70 backdrop-blur-md">
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-base">
              <span className="flex items-center gap-2">
                <PieIcon className="h-5 w-5 text-primary animate-pulse" />
                Distribución de Gastos por Categoría
              </span>
              <Badge variant="outline" className="font-mono text-xs">
                Total: {formatMoney(categoryData.totalExpenses, currency)}
              </Badge>
            </CardTitle>
            <CardDescription className="text-xs">
              Consumo acumulado en el periodo seleccionado (excluyendo transferencias internas).
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {categoryData.breakdown.length === 0 ? (
              <p className="text-sm text-muted-foreground py-6 text-center">
                Sin gastos registrados en el periodo seleccionado.
              </p>
            ) : (
              <>
                {/* Visual SVG Donut Graphic */}
                <CategoryDonutChart
                  breakdown={categoryData.breakdown}
                  total={categoryData.totalExpenses}
                  currency={currency}
                />

                <div className="flex flex-col gap-3 pt-2">
                  {categoryData.breakdown.map((cat) => {
                    const meta = CATEGORY_META[cat.category] || {
                      label: cat.category.replace(/_/g, " "),
                      icon: Layers,
                      color: "bg-primary",
                    }
                    const IconComponent = meta.icon

                    return (
                      <div key={cat.category} className="flex flex-col gap-1.5">
                        <div className="flex items-center justify-between text-sm">
                          <span className="flex items-center gap-2 font-medium text-foreground capitalize">
                            <IconComponent className="h-4 w-4 text-muted-foreground" />
                            {meta.label}
                          </span>
                          <span className="font-mono text-xs font-bold text-foreground">
                            {formatMoney(cat.amount, currency)}{" "}
                            <span className="text-muted-foreground font-normal">
                              ({cat.percentage.toFixed(1)}%)
                            </span>
                          </span>
                        </div>
                        <Progress value={cat.percentage} className="h-2" />
                      </div>
                    )
                  })}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* 6-Month Income vs Expense Trend Visualizer */}
        <Card className="border border-border/60 bg-card/70 backdrop-blur-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <BarChart3 className="h-4 w-4 text-emerald-500" />
              Tendencia Visual (Últimos 6 Meses)
            </CardTitle>
            <CardDescription className="text-xs">
              Comparativa de Entradas (verde) vs Gastos (rojo) por mes.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-5">
            <div className="grid grid-cols-6 items-end gap-2 h-44 pt-4 pb-2 px-1 border-b border-border/50">
              {monthlyTrends.map((m) => {
                const maxVal = Math.max(...monthlyTrends.flatMap((t) => [t.income, t.expense]), 1)
                const incHeight = Math.min((m.income / maxVal) * 100, 100)
                const expHeight = Math.min((m.expense / maxVal) * 100, 100)

                return (
                  <div key={m.monthLabel} className="flex flex-col items-center gap-1 h-full justify-end group">
                    <div className="flex items-end gap-1 w-full justify-center h-full">
                      {/* Income Bar */}
                      <div
                        className="w-1/2 bg-emerald-500/80 hover:bg-emerald-500 rounded-t transition-all group-hover:scale-y-105"
                        style={{ height: `${Math.max(incHeight, 4)}%` }}
                        title={`Ingresos ${m.monthLabel}: ${formatMoney(m.income, currency)}`}
                      />
                      {/* Expense Bar */}
                      <div
                        className="w-1/2 bg-rose-500/80 hover:bg-rose-500 rounded-t transition-all group-hover:scale-y-105"
                        style={{ height: `${Math.max(expHeight, 4)}%` }}
                        title={`Gastos ${m.monthLabel}: ${formatMoney(m.expense, currency)}`}
                      />
                    </div>
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-tight">
                      {m.monthLabel}
                    </span>
                  </div>
                )
              })}
            </div>

            <div className="flex items-center justify-center gap-6 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded-xs bg-emerald-500 inline-block" />
                Ingresos Entrantes
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded-xs bg-rose-500 inline-block" />
                Gastos Realizados
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Budget Allocation & Debt Priorities */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border border-border/60 bg-card/70 backdrop-blur-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Scale className="h-4 w-4 text-primary" />
              Distribución Sugerida (Regla 50/30/20)
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {baseIngreso <= 0 ? (
              <p className="text-sm text-muted-foreground">
                Registra tus ingresos para calcular la distribución ideal de tu dinero.
              </p>
            ) : (
              <>
                <DistRow
                  label="Necesidades (50%)"
                  desc="Renta, comida, servicios, pago mínimo de deudas"
                  value={plan.necesidades}
                  currency={currency}
                  pct={50}
                />
                <DistRow
                  label="Deseos (30%)"
                  desc="Ocio, antojos, gustos y gastos hormiga"
                  value={plan.deseos}
                  currency={currency}
                  pct={30}
                />
                <DistRow
                  label="Ahorro y Deuda Extra (20%)"
                  desc="Fondo de emergencia, abonar a capital y metas"
                  value={plan.ahorroDeuda}
                  currency={currency}
                  pct={20}
                />
              </>
            )}
          </CardContent>
        </Card>

        <Card className="border border-border/60 bg-card/70 backdrop-blur-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <CreditCard className="h-4 w-4 text-destructive" />
              Prioridad de Pago de Deudas (Mayor Interés)
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {topDebts.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No tienes deudas pendientes registradas. ¡Excelente trabajo!
              </p>
            ) : (
              topDebts.map((d) => {
                const rem = remaining(d)
                const pct =
                  d.totalAmount > 0
                    ? Math.min((d.paidAmount / d.totalAmount) * 100, 100)
                    : 0
                return (
                  <div key={d.id} className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between gap-2 text-sm">
                      <span className="truncate font-medium text-foreground">
                        {d.name}
                      </span>
                      <span className="shrink-0 rounded-full bg-destructive/10 px-2 py-0.5 text-xs font-bold text-destructive">
                        {d.interestRate}% int.
                      </span>
                    </div>
                    <Progress value={pct} className="h-2" />
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>Restante: {formatMoney(rem, currency)}</span>
                      <span>{pct.toFixed(0)}% pagado</span>
                    </div>
                  </div>
                )
              })
            )}
          </CardContent>
        </Card>
      </div>

      {/* Goals Progress Bar */}
      {metaObjetivo > 0 && (
        <Card className="border border-border/60 bg-card/70 backdrop-blur-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <PiggyBank className="h-4 w-4 text-primary" />
              Progreso General de Metas de Ahorro
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Progress
              value={Math.min((metaTotal / metaObjetivo) * 100, 100)}
              className="h-3"
            />
            <p className="mt-2 text-sm text-muted-foreground">
              {formatMoney(metaTotal, currency)} de{" "}
              {formatMoney(metaObjetivo, currency)} ahorrado (
              {((metaTotal / metaObjetivo) * 100).toFixed(0)}%)
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function DistRow({
  label,
  desc,
  value,
  currency,
  pct,
}: {
  label: string
  desc: string
  value: number
  currency: string
  pct: number
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="text-sm font-medium text-foreground">{label}</p>
          <p className="text-xs text-muted-foreground">{desc}</p>
        </div>
        <p className="shrink-0 font-mono text-sm font-bold text-foreground">
          {formatMoney(value, currency)}
        </p>
      </div>
      <Progress value={pct} className="h-1.5" />
    </div>
  )
}

function CategoryDonutChart({
  breakdown,
  total,
  currency,
}: {
  breakdown: { category: string; amount: number; percentage: number }[]
  total: number
  currency: string
}) {
  const radius = 38
  const circumference = 2 * Math.PI * radius
  let cumulativePercent = 0

  const COLOR_MAP: Record<string, string> = {
    transporte: "#6366f1",
    gasto: "#f43f5e",
    comida: "#f97316",
    gasto_hormiga: "#f59e0b",
    servicio: "#3b82f6",
    entrada: "#10b981",
    transferencia: "#94a3b8",
  }

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-secondary/20 border border-border/40 backdrop-blur-xs">
      {/* Donut SVG Graphic */}
      <div className="relative flex items-center justify-center shrink-0 w-36 h-36">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r={radius}
            className="stroke-muted/30"
            strokeWidth="11"
            fill="transparent"
          />
          {breakdown.map((cat) => {
            const strokeDasharray = `${(cat.percentage / 100) * circumference} ${circumference}`
            const strokeDashoffset = -((cumulativePercent / 100) * circumference)
            cumulativePercent += cat.percentage
            const color = COLOR_MAP[cat.category] || "#8b5cf6"

            return (
              <circle
                key={cat.category}
                cx="50"
                cy="50"
                r={radius}
                stroke={color}
                strokeWidth="11"
                strokeDasharray={strokeDasharray}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                fill="transparent"
                className="transition-all duration-500 hover:stroke-[13] cursor-pointer"
              />
            )
          })}
        </svg>

        {/* Donut Inner Label */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-2">
          <PieIcon className="h-4 w-4 text-primary mb-0.5 animate-pulse" />
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-tight">Dona</span>
          <span className="text-[11px] font-black font-mono text-foreground truncate max-w-[100px]">
            {formatMoney(total, currency)}
          </span>
        </div>
      </div>

      {/* Donut Legend Items */}
      <div className="flex flex-col gap-2 min-w-0 flex-1 w-full">
        {breakdown.map((cat) => {
          const meta = CATEGORY_META[cat.category] || {
            label: cat.category,
          }
          const color = COLOR_MAP[cat.category] || "#8b5cf6"

          return (
            <div key={cat.category} className="flex items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className="h-2.5 w-2.5 rounded-full shrink-0 shadow-xs"
                  style={{ backgroundColor: color }}
                />
                <span className="truncate font-medium text-foreground">{meta.label}</span>
              </div>
              <div className="flex items-center gap-2 shrink-0 font-mono">
                <span className="font-bold text-foreground">{formatMoney(cat.amount, currency)}</span>
                <span className="text-[10px] font-medium text-muted-foreground">({cat.percentage.toFixed(1)}%)</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}


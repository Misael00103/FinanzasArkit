"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { formatMoney } from "@/lib/config"
import {
  summarize,
  totalDebt,
  remaining,
  convertCurrency,
  type Debt,
  type Transaction,
  type Recurring,
  type Goal,
} from "@/lib/finance"
import {
  TrendingUp,
  TrendingDown,
  CreditCard,
  Bug,
  PiggyBank,
  Scale,
} from "lucide-react"

export function SummaryCards({
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
  const s = summarize(transactions, recurring, currency)
  const deudaTotal = totalDebt(debts, currency)
  const metaTotal = goals.reduce((sum, g) => sum + convertCurrency(g.savedAmount, g.currency, currency), 0)
  const metaObjetivo = goals.reduce((sum, g) => sum + convertCurrency(g.targetAmount, g.currency, currency), 0)

  const stats = [
    {
      label: "Ingresos del mes",
      value: s.income,
      icon: TrendingUp,
      tone: "text-emerald-600 dark:text-emerald-400",
      bg: "bg-emerald-500/10 border-emerald-500/20",
      gradient: "from-emerald-500/5 via-transparent to-transparent",
    },
    {
      label: "Gastos del mes",
      value: s.expenses,
      icon: TrendingDown,
      tone: "text-rose-600 dark:text-rose-400",
      bg: "bg-rose-500/10 border-rose-500/20",
      gradient: "from-rose-500/5 via-transparent to-transparent",
    },
    {
      label: "Balance del mes",
      value: s.balance,
      icon: Scale,
      tone: s.balance >= 0 ? "text-indigo-600 dark:text-indigo-400" : "text-rose-600 dark:text-rose-400",
      bg: s.balance >= 0 ? "bg-indigo-500/10 border-indigo-500/20" : "bg-rose-500/10 border-rose-500/20",
      gradient: s.balance >= 0 ? "from-indigo-500/5 via-transparent to-transparent" : "from-rose-500/5 via-transparent to-transparent",
    },
    {
      label: "Gastos hormiga",
      value: s.antExpenses,
      icon: Bug,
      tone: "text-amber-600 dark:text-amber-400",
      bg: "bg-amber-500/10 border-amber-500/20",
      gradient: "from-amber-500/5 via-transparent to-transparent",
    },
    {
      label: "Deuda total pendiente",
      value: deudaTotal,
      icon: CreditCard,
      tone: "text-orange-600 dark:text-orange-400",
      bg: "bg-orange-500/10 border-orange-500/20",
      gradient: "from-orange-500/5 via-transparent to-transparent",
    },
    {
      label: "Ahorro en metas",
      value: metaTotal,
      icon: PiggyBank,
      tone: "text-sky-600 dark:text-sky-400",
      bg: "bg-sky-500/10 border-sky-500/20",
      gradient: "from-sky-500/5 via-transparent to-transparent",
    },
  ]

  // Regla 50/30/20 sobre ingresos proyectados
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
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
        {stats.map((stat) => (
          <Card key={stat.label} className="group relative overflow-hidden border border-border/60 bg-card/70 shadow-sm backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:border-border/100 hover:shadow-md">
            {/* Ambient Background Gradient */}
            <div className={`absolute inset-0 bg-gradient-to-br ${stat.gradient}`} />
            
            <CardContent className="relative z-10 flex items-start gap-3.5 p-4 sm:p-5">
              <div
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border ${stat.bg} shadow-sm transition-all duration-300 group-hover:scale-110`}
              >
                <stat.icon className={`h-5 w-5 ${stat.tone}`} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium tracking-wide text-muted-foreground">{stat.label}</p>
                <p
                  className={`mt-1 truncate font-display text-xl font-black tracking-tight ${stat.tone}`}
                >
                  {formatMoney(stat.value, currency)}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Scale className="h-4 w-4 text-primary" />
              Distribucion sugerida (regla 50/30/20)
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {baseIngreso <= 0 ? (
              <p className="text-sm text-muted-foreground">
                Registra tus ingresos o entradas fijas para ver una distribucion
                sugerida de tu dinero.
              </p>
            ) : (
              <>
                <DistRow
                  label="Necesidades (50%)"
                  desc="Renta, comida, servicios, deuda minima"
                  value={plan.necesidades}
                  currency={currency}
                  pct={50}
                />
                <DistRow
                  label="Deseos (30%)"
                  desc="Ocio, antojos, gastos hormiga"
                  value={plan.deseos}
                  currency={currency}
                  pct={30}
                />
                <DistRow
                  label="Ahorro y deuda extra (20%)"
                  desc="Metas, fondo de emergencia, abonar deudas"
                  value={plan.ahorroDeuda}
                  currency={currency}
                  pct={20}
                />
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <CreditCard className="h-4 w-4 text-destructive" />
              Prioriza estas deudas (mayor interes)
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {topDebts.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No tienes deudas pendientes registradas. Agrega tus deudas en la
                pestana Deudas.
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
                      <span className="shrink-0 rounded-full bg-destructive/10 px-2 py-0.5 text-xs font-medium text-destructive">
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

      {metaObjetivo > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <PiggyBank className="h-4 w-4 text-primary" />
              Progreso general de metas
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

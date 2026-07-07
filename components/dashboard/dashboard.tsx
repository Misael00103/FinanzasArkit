"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { SummaryCards } from "@/components/dashboard/summary-cards"
import { DebtsPanel } from "@/components/dashboard/debts-panel"
import { TransactionsPanel } from "@/components/dashboard/transactions-panel"
import { RecurringPanel } from "@/components/dashboard/recurring-panel"
import { GoalsPanel } from "@/components/dashboard/goals-panel"
import { AssistantPanel } from "@/components/dashboard/assistant-panel"
import type {
  Debt,
  Transaction,
  Recurring,
  Goal,
  Settings,
} from "@/lib/finance"
import {
  LayoutDashboard,
  CreditCard,
  ArrowLeftRight,
  CalendarClock,
  Target,
  Sparkles,
} from "lucide-react"

type Props = {
  userName: string
  debts: Debt[]
  transactions: Transaction[]
  recurring: Recurring[]
  goals: Goal[]
  settings: Settings
}

const TABS = [
  { value: "resumen", label: "Resumen", icon: LayoutDashboard },
  { value: "deudas", label: "Deudas", icon: CreditCard },
  { value: "movimientos", label: "Movimientos", icon: ArrowLeftRight },
  { value: "fijos", label: "Fijos", icon: CalendarClock },
  { value: "metas", label: "Metas", icon: Target },
  { value: "asistente", label: "Asistente", icon: Sparkles },
]

export function Dashboard({
  userName,
  debts,
  transactions,
  recurring,
  goals,
  settings,
}: Props) {
  const [currency, setCurrency] = useState(settings.displayCurrency)

  return (
    <div className="min-h-svh bg-secondary/30">
      <DashboardHeader
        userName={userName}
        currency={currency}
        onCurrencyChange={setCurrency}
      />

      <main className="mx-auto w-full max-w-6xl px-4 pb-20 pt-6">
        <Tabs defaultValue="resumen" className="w-full">
          <div className="-mx-4 mb-6 overflow-x-auto px-4">
            <TabsList className="inline-flex h-auto w-auto justify-start gap-1 bg-card p-1">
              {TABS.map((t) => (
                <TabsTrigger
                  key={t.value}
                  value={t.value}
                  className="flex items-center gap-1.5 whitespace-nowrap px-3 py-2 text-sm"
                >
                  <t.icon className="h-4 w-4" />
                  {t.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          <TabsContent value="resumen" className="mt-0">
            <SummaryCards
              debts={debts}
              transactions={transactions}
              recurring={recurring}
              goals={goals}
              currency={currency}
            />
          </TabsContent>

          <TabsContent value="deudas" className="mt-0">
            <DebtsPanel debts={debts} currency={currency} />
          </TabsContent>

          <TabsContent value="movimientos" className="mt-0">
            <TransactionsPanel
              transactions={transactions}
              currency={currency}
            />
          </TabsContent>

          <TabsContent value="fijos" className="mt-0">
            <RecurringPanel recurring={recurring} currency={currency} />
          </TabsContent>

          <TabsContent value="metas" className="mt-0">
            <GoalsPanel goals={goals} currency={currency} />
          </TabsContent>

          <TabsContent value="asistente" className="mt-0">
            <AssistantPanel
              debts={debts}
              transactions={transactions}
              recurring={recurring}
              goals={goals}
              currency={currency}
            />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}

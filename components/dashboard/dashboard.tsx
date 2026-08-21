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
import { ProfilePanel } from "@/components/dashboard/profile-panel"
import type {
  Debt,
  Transaction,
  Recurring,
  Goal,
  Settings,
  UserProfile,
} from "@/lib/finance"
import {
  LayoutDashboard,
  CreditCard,
  ArrowLeftRight,
  CalendarClock,
  Target,
  Sparkles,
  User,
} from "lucide-react"

type Props = {
  userName: string
  user?: UserProfile
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
  { value: "perfil", label: "Perfil", icon: User },
]

export function Dashboard({
  userName,
  user,
  debts,
  transactions,
  recurring,
  goals,
  settings,
}: Props) {
  const [currency, setCurrency] = useState(settings.displayCurrency)
  const [activeTab, setActiveTab] = useState("resumen")

  const userProfile: UserProfile = user || {
    id: "user-id",
    email: "usuario@ejemplo.com",
    name: userName || "Misael",
  }

  return (
    <div className="relative min-h-svh bg-background/95 overflow-hidden">
      {/* Ambient background glow elements for premium look */}
      <div className="absolute top-10 left-10 h-72 w-72 rounded-full bg-primary/5 blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 h-96 w-96 rounded-full bg-accent/5 blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-1/3 h-80 w-80 rounded-full bg-indigo-500/[0.03] blur-3xl pointer-events-none" />

      <DashboardHeader
        userName={userProfile.name}
        userEmail={userProfile.email}
        currency={currency}
        onCurrencyChange={setCurrency}
        onOpenProfile={() => setActiveTab("perfil")}
      />

      <main className="mx-auto w-full max-w-6xl px-4 pb-20 pt-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="-mx-4 mb-6 overflow-x-auto px-4 no-scrollbar">
            <TabsList className="inline-flex h-auto w-auto justify-start gap-1 bg-card/60 border border-border/50 p-1 shadow-sm rounded-xl backdrop-blur-md">
              {TABS.map((t) => (
                <TabsTrigger
                  key={t.value}
                  value={t.value}
                  className="flex items-center gap-1.5 whitespace-nowrap px-4 py-2 text-sm rounded-lg font-medium transition-all duration-200 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm"
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

          <TabsContent value="perfil" className="mt-0">
            <ProfilePanel
              user={userProfile}
              settings={settings}
              debtsCount={debts.length}
              transactionsCount={transactions.length}
              goalsCount={goals.length}
              onCurrencyChange={setCurrency}
            />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}

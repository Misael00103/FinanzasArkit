"use client"

import { useState } from "react"
import { AppSidebar, type TabValue } from "@/components/dashboard/app-sidebar"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { SummaryCards } from "@/components/dashboard/summary-cards"
import { BankAccountsPanel } from "@/components/dashboard/bank-accounts-panel"
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
  BankAccount,
  Settings,
  UserProfile,
} from "@/lib/finance"

type Props = {
  userName: string
  user?: UserProfile
  bankAccounts?: BankAccount[]
  debts: Debt[]
  transactions: Transaction[]
  recurring: Recurring[]
  goals: Goal[]
  settings: Settings
}

export function Dashboard({
  userName,
  user,
  bankAccounts = [],
  debts,
  transactions,
  recurring,
  goals,
  settings,
}: Props) {
  const [currency, setCurrency] = useState(settings.displayCurrency)
  const [activeTab, setActiveTab] = useState<TabValue>("resumen")
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)

  const userProfile: UserProfile = user || {
    id: "user-id",
    email: "usuario@ejemplo.com",
    name: userName || "Misael",
  }

  const toggleSidebar = () => setIsSidebarCollapsed((prev) => !prev)

  return (
    <div className="flex min-h-svh bg-background/95">
      {/* Ambient background glow elements */}
      <div className="fixed top-10 left-10 h-72 w-72 rounded-full bg-primary/5 blur-3xl pointer-events-none" />
      <div className="fixed bottom-10 right-10 h-96 w-96 rounded-full bg-accent/5 blur-3xl pointer-events-none" />

      {/* Left Sidebar Component */}
      <AppSidebar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        userProfile={userProfile}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={toggleSidebar}
        counts={{
          accountsCount: bankAccounts.length,
          debtsCount: debts.length,
          transactionsCount: transactions.length,
          goalsCount: goals.length,
        }}
      />

      {/* Main Content Body */}
      <div className="flex-1 flex flex-col min-w-0 transition-all duration-300">
        <DashboardHeader
          userName={userProfile.name}
          userEmail={userProfile.email}
          currency={currency}
          user={userProfile}
          settings={settings}
          debtsCount={debts.length}
          transactionsCount={transactions.length}
          goalsCount={goals.length}
          onCurrencyChange={setCurrency}
          isSidebarCollapsed={isSidebarCollapsed}
          onToggleSidebar={toggleSidebar}
        />

        <main className="flex-1 p-4 md:p-8 max-w-7xl w-full mx-auto pb-20">
          {activeTab === "resumen" && (
            <SummaryCards
              debts={debts}
              transactions={transactions}
              recurring={recurring}
              goals={goals}
              bankAccounts={bankAccounts}
              currency={currency}
            />
          )}

          {activeTab === "cuentas" && (
            <BankAccountsPanel
              bankAccounts={bankAccounts}
              currency={currency}
            />
          )}

          {activeTab === "deudas" && (
            <DebtsPanel debts={debts} currency={currency} />
          )}

          {activeTab === "movimientos" && (
            <TransactionsPanel
              transactions={transactions}
              bankAccounts={bankAccounts}
              currency={currency}
            />
          )}

          {activeTab === "fijos" && (
            <RecurringPanel recurring={recurring} currency={currency} />
          )}

          {activeTab === "metas" && (
            <GoalsPanel goals={goals} currency={currency} />
          )}

          {activeTab === "asistente" && (
            <AssistantPanel
              debts={debts}
              transactions={transactions}
              recurring={recurring}
              goals={goals}
              bankAccounts={bankAccounts}
              currency={currency}
            />
          )}
        </main>
      </div>
    </div>
  )
}


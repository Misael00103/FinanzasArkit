import { redirect } from "next/navigation"
import { getSession } from "@/lib/session"
import { getDebts } from "@/app/actions/debts"
import { getTransactions } from "@/app/actions/transactions"
import { getRecurring } from "@/app/actions/recurring"
import { getGoals } from "@/app/actions/goals"
import { getSettings } from "@/app/actions/settings"
import { Dashboard } from "@/components/dashboard/dashboard"

export default async function HomePage() {
  const session = await getSession()
  if (!session?.user) redirect("/sign-in")

  const [debts, transactions, recurring, goals, settings] = await Promise.all([
    getDebts(),
    getTransactions(),
    getRecurring(),
    getGoals(),
    getSettings(),
  ])

  const userProfile = {
    id: session.user.id,
    email: session.user.email || "",
    name: session.user.name || "Misael",
    createdAt: session.user.created_at,
    avatarColor: session.user.avatarColor,
    payDay: session.user.payDay,
    phone: session.user.phone,
    notificationsEnabled: session.user.notificationsEnabled,
  }

  return (
    <Dashboard
      userName={userProfile.name}
      user={userProfile}
      debts={debts}
      transactions={transactions}
      recurring={recurring}
      goals={goals}
      settings={settings}
    />
  )
}

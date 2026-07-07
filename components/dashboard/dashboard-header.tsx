"use client"

import { useRouter } from "next/navigation"
import { signOut } from "@/lib/auth-client"
import { saveSettings } from "@/app/actions/settings"
import { CURRENCIES, type CurrencyCode } from "@/lib/config"
import { Button } from "@/components/ui/button"
import { useTheme } from "next-themes"
import { useState, useEffect } from "react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Wallet, LogOut, Sun, Moon } from "lucide-react"

export function DashboardHeader({
  userName,
  currency,
  onCurrencyChange,
}: {
  userName: string
  currency: string
  onCurrencyChange: (c: string) => void
}) {
  const router = useRouter()
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  async function handleCurrency(value: string | null) {
    if (!value) return
    onCurrencyChange(value)
    await saveSettings({ displayCurrency: value })
  }

  async function handleLogout() {
    await signOut()
    router.push("/sign-in")
    router.refresh()
  }

  return (
    <header className="sticky top-0 z-20 border-b border-border bg-card/95 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Wallet className="h-5 w-5" />
          </div>
          <div className="leading-tight">
            <p className="font-display text-base font-bold text-foreground">
              Control de Gastos
            </p>
            <p className="text-xs text-muted-foreground">Hola, {userName}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Select value={currency} onValueChange={handleCurrency}>
            <SelectTrigger className="h-9 w-[130px] bg-background" aria-label="Moneda">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(CURRENCIES).map(([code, c]) => (
                <SelectItem key={code} value={code}>
                  {c.symbol} {code}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            aria-label="Cambiar tema"
            className="h-9 w-9"
          >
            {mounted && theme === "dark" ? (
              <Sun className="h-4 w-4 text-amber-500 animate-spin-once" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleLogout}
            aria-label="Cerrar sesion"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  )
}

export type { CurrencyCode }

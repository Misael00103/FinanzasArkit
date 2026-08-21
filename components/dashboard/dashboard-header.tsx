"use client"

import { useRouter } from "next/navigation"
import { createClient } from "@/utils/supabase/client"
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
import { LogOut, Sun, Moon, User } from "lucide-react"

export function DashboardHeader({
  userName,
  userEmail,
  currency,
  onCurrencyChange,
  onOpenProfile,
}: {
  userName: string
  userEmail?: string
  currency: string
  onCurrencyChange: (c: string) => void
  onOpenProfile?: () => void
}) {
  const router = useRouter()
  const supabase = createClient()
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
    await supabase.auth.signOut()
    router.push("/sign-in")
    router.refresh()
  }

  const initial = (userName || userEmail || "U")[0].toUpperCase()

  return (
    <header className="sticky top-0 z-20 border-b border-border/50 bg-card/75 backdrop-blur-md shadow-sm">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-4 py-3">
        {/* Brand & User Greeting */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl overflow-hidden bg-secondary/50">
            <img
              src="/logo-nuevo-removebg-preview.png"
              alt="Logo"
              className="h-8 w-8 object-contain"
            />
          </div>

          <div
            onClick={onOpenProfile}
            className="group flex items-center gap-2.5 cursor-pointer rounded-xl py-1 px-2 -ml-2 hover:bg-secondary/60 transition-all duration-200"
            title="Ver perfil de usuario"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary font-bold text-xs group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-200">
              {initial}
            </div>
            <div className="leading-tight">
              <p className="font-display text-base font-bold text-foreground">
                Control de Gastos
              </p>
              <p className="text-xs text-muted-foreground flex items-center gap-1 group-hover:text-primary transition-colors">
                Hola, {userName}
                <User className="h-3 w-3 opacity-70 group-hover:opacity-100" />
              </p>
            </div>
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2">
          {/* Currency Switcher */}
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

          {/* Theme Toggle */}
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

          {/* Profile Quick Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={onOpenProfile}
            className="hidden sm:flex items-center gap-1.5 h-9 bg-background border-border/60 hover:bg-secondary/60"
            aria-label="Ver Perfil"
          >
            <User className="h-4 w-4 text-primary" />
            <span>Perfil</span>
          </Button>

          {/* Sign Out Button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={handleLogout}
            aria-label="Cerrar sesion"
            title="Cerrar sesión"
            className="h-9 w-9 text-muted-foreground hover:text-destructive"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  )
}

export type { CurrencyCode }

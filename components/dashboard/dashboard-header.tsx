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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ProfilePanel } from "@/components/dashboard/profile-panel"
import type { UserProfile, Settings } from "@/lib/finance"
import { LogOut, Sun, Moon, User } from "lucide-react"

export function DashboardHeader({
  userName,
  userEmail,
  currency,
  user,
  settings,
  debtsCount = 0,
  transactionsCount = 0,
  goalsCount = 0,
  onCurrencyChange,
}: {
  userName: string
  userEmail?: string
  currency: string
  user?: UserProfile
  settings?: Settings
  debtsCount?: number
  transactionsCount?: number
  goalsCount?: number
  onCurrencyChange: (c: string) => void
}) {
  const router = useRouter()
  const supabase = createClient()
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [isProfileOpen, setIsProfileOpen] = useState(false)

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

  const defaultUser: UserProfile = user || {
    id: "user-id",
    email: userEmail || "usuario@ejemplo.com",
    name: userName || "Misael",
  }

  const defaultSettings: Settings = settings || {
    displayCurrency: currency,
    monthlyIncome: 0,
  }

  return (
    <>
      <header className="sticky top-0 z-20 border-b border-border/50 bg-card/75 backdrop-blur-md shadow-sm">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-4 py-3">
          {/* Brand Logo & Name */}
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl overflow-hidden bg-secondary/50">
              <img
                src="/logo-nuevo-removebg-preview.png"
                alt="Logo"
                className="h-8 w-8 object-contain"
              />
            </div>
            <div className="leading-tight">
              <p className="font-display text-base font-bold text-foreground">
                Control de Gastos
              </p>
              <p className="text-xs text-muted-foreground">Hola, {userName}</p>
            </div>
          </div>

          {/* Right Header Actions: Currency, Theme & Single User Avatar Button */}
          <div className="flex items-center gap-2">
            {/* Currency Switcher */}
            <Select value={currency} onValueChange={handleCurrency}>
              <SelectTrigger className="h-9 w-[125px] bg-background" aria-label="Moneda">
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

            {/* SINGLE Profile Avatar Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsProfileOpen(true)}
              className="flex items-center gap-2 h-9 px-3 bg-background border-border/60 hover:bg-secondary/60 transition-all rounded-xl"
              title="Mi Perfil y Configuración"
            >
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold text-[11px]">
                {initial}
              </div>
              <span className="hidden sm:inline font-medium text-xs">Perfil</span>
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

      {/* SINGLE Profile Modal */}
      <Dialog open={isProfileOpen} onOpenChange={setIsProfileOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-6 sm:max-w-2xl">
          <DialogHeader className="pb-2">
            <DialogTitle className="text-xl font-bold font-display flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              Mi Perfil de Usuario
            </DialogTitle>
          </DialogHeader>
          <ProfilePanel
            user={defaultUser}
            settings={defaultSettings}
            debtsCount={debtsCount}
            transactionsCount={transactionsCount}
            goalsCount={goalsCount}
            onCurrencyChange={onCurrencyChange}
          />
        </DialogContent>
      </Dialog>
    </>
  )
}

export type { CurrencyCode }

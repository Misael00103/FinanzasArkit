"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/utils/supabase/client"
import { updateProfileName } from "@/app/actions/profile"
import { saveSettings } from "@/app/actions/settings"
import { CURRENCIES, formatMoney } from "@/lib/config"
import type { UserProfile, Settings, Debt, Transaction, Goal } from "@/lib/finance"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  User,
  Mail,
  Key,
  Calendar,
  CheckCircle2,
  Edit2,
  Save,
  X,
  LogOut,
  Copy,
  Check,
  DollarSign,
  ShieldCheck,
  Coins,
  Receipt,
  Target,
  CreditCard,
  Building2,
} from "lucide-react"

type ProfilePanelProps = {
  user: UserProfile
  settings: Settings
  debtsCount?: number
  transactionsCount?: number
  goalsCount?: number
  onCurrencyChange?: (currency: string) => void
}

export function ProfilePanel({
  user,
  settings,
  debtsCount = 0,
  transactionsCount = 0,
  goalsCount = 0,
  onCurrencyChange,
}: ProfilePanelProps) {
  const router = useRouter()
  const supabase = createClient()

  // Inline editing state for name
  const [isEditingName, setIsEditingName] = useState(false)
  const [name, setName] = useState(user.name)
  const [savingName, setSavingName] = useState(false)

  // Settings state
  const [monthlyIncome, setMonthlyIncome] = useState(settings.monthlyIncome.toString())
  const [savingIncome, setSavingIncome] = useState(false)
  const [displayCurrency, setDisplayCurrency] = useState(settings.displayCurrency)

  // Copy feedback
  const [copiedId, setCopiedId] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  const initials = (name || user.email || "U")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase()

  const formattedDate = user.createdAt
    ? new Date(user.createdAt).toLocaleDateString("es-ES", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "Reciente"

  async function handleSaveName() {
    if (!name.trim()) return
    setSavingName(true)
    setMessage(null)
    try {
      await updateProfileName(name.trim())
      setIsEditingName(false)
      setMessage({ type: "success", text: "Nombre actualizado con éxito" })
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "Error al actualizar el nombre" })
    } finally {
      setSavingName(false)
    }
  }

  async function handleSaveIncome() {
    const val = parseFloat(monthlyIncome) || 0
    setSavingIncome(true)
    setMessage(null)
    try {
      await saveSettings({ monthlyIncome: val })
      setMessage({ type: "success", text: "Ingreso mensual guardado exitosamente" })
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "Error al guardar el ingreso" })
    } finally {
      setSavingIncome(false)
    }
  }

  async function handleCurrencyChange(newCurrency: string | null) {
    if (!newCurrency) return
    setDisplayCurrency(newCurrency)
    if (onCurrencyChange) onCurrencyChange(newCurrency)
    await saveSettings({ displayCurrency: newCurrency })
    setMessage({ type: "success", text: `Moneda preferida cambiada a ${newCurrency}` })
  }

  function handleCopyId() {
    navigator.clipboard.writeText(user.id)
    setCopiedId(true)
    setTimeout(() => setCopiedId(false), 2000)
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push("/sign-in")
    router.refresh()
  }

  return (
    <div className="space-y-6">
      {/* Alert Feedback Banner */}
      {message && (
        <div
          className={`flex items-center justify-between rounded-xl border p-3.5 text-sm transition-all duration-200 ${
            message.type === "success"
              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
              : "border-destructive/30 bg-destructive/10 text-destructive"
          }`}
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>{message.text}</span>
          </div>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => setMessage(null)}
            className="h-6 w-6 opacity-70 hover:opacity-100"
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      )}

      {/* Hero Profile Header */}
      <Card className="relative overflow-hidden border-border/60 bg-gradient-to-br from-card via-card to-secondary/30 shadow-md">
        <div className="absolute top-0 right-0 h-32 w-32 rounded-bl-full bg-primary/10 blur-2xl pointer-events-none" />
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left">
            {/* Avatar Circle */}
            <div className="relative">
              <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-tr from-primary to-primary/70 text-2xl font-bold text-primary-foreground shadow-lg shadow-primary/25 border-2 border-background">
                {initials}
              </div>
              <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 ring-2 ring-background">
                <Check className="h-3 w-3 text-white" />
              </span>
            </div>

            {/* Name & Details */}
            <div className="flex-1 space-y-1.5">
              {isEditingName ? (
                <div className="flex items-center gap-2 max-w-sm">
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Tu nombre completo"
                    className="h-9 bg-background"
                    disabled={savingName}
                  />
                  <Button
                    size="sm"
                    onClick={handleSaveName}
                    disabled={savingName || !name.trim()}
                    className="gap-1"
                  >
                    <Save className="h-3.5 w-3.5" />
                    Guardar
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setName(user.name)
                      setIsEditingName(false)
                    }}
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center justify-center sm:justify-start gap-2">
                  <h2 className="text-xl font-bold font-display text-foreground">
                    {name}
                  </h2>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsEditingName(true)}
                    className="h-7 w-7 text-muted-foreground hover:text-foreground"
                    title="Editar nombre"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              )}

              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 text-xs text-muted-foreground">
                <span className="flex items-center gap-1 bg-secondary/50 px-2.5 py-1 rounded-md border border-border/40">
                  <Mail className="h-3.5 w-3.5 text-primary" />
                  {user.email}
                </span>
                <Badge variant="outline" className="gap-1 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/5">
                  <ShieldCheck className="h-3 w-3" />
                  Verificado
                </Badge>
              </div>
            </div>

            {/* Account Status Badge */}
            <div className="shrink-0 text-right hidden md:block">
              <p className="text-xs text-muted-foreground">Miembro desde</p>
              <p className="text-xs font-semibold text-foreground">{formattedDate}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Grid Section: Account Info & Financial Config */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Account & Security Card */}
        <Card className="border-border/50 bg-card/60 backdrop-blur-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <User className="h-4 w-4 text-primary" />
              Información de la Cuenta
            </CardTitle>
            <CardDescription className="text-xs">
              Detalles de identificación y registro de tu perfil.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            {/* Email Field */}
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Correo electrónico</Label>
              <div className="flex items-center justify-between rounded-lg border border-border/40 bg-background/50 p-2.5">
                <span className="font-mono text-xs text-foreground truncate max-w-[240px]">
                  {user.email}
                </span>
                <Badge variant="secondary" className="text-[10px] uppercase tracking-wider">
                  Principal
                </Badge>
              </div>
            </div>

            {/* User ID Field */}
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">ID de Usuario (Supabase)</Label>
              <div className="flex items-center justify-between gap-2 rounded-lg border border-border/40 bg-background/50 p-2.5">
                <span className="font-mono text-[11px] text-muted-foreground truncate select-all">
                  {user.id}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleCopyId}
                  className="h-6 w-6 shrink-0"
                  title="Copiar ID"
                >
                  {copiedId ? (
                    <Check className="h-3.5 w-3.5 text-emerald-500" />
                  ) : (
                    <Copy className="h-3.5 w-3.5 text-muted-foreground" />
                  )}
                </Button>
              </div>
            </div>

            {/* Created At */}
            <div className="flex items-center justify-between pt-1 text-xs">
              <span className="text-muted-foreground flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                Fecha de registro
              </span>
              <span className="font-medium text-foreground">{formattedDate}</span>
            </div>

            <Separator className="my-2" />

            {/* Sign Out Action */}
            <div className="pt-1">
              <Button
                variant="destructive"
                className="w-full justify-center gap-2"
                onClick={handleLogout}
              >
                <LogOut className="h-4 w-4" />
                Cerrar Sesión
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Financial Preferences Card */}
        <Card className="border-border/50 bg-card/60 backdrop-blur-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Coins className="h-4 w-4 text-primary" />
              Preferencias Financieras
            </CardTitle>
            <CardDescription className="text-xs">
              Personaliza tus montos base y la moneda principal.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            {/* Preferred Currency */}
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Moneda Principal</Label>
              <Select value={displayCurrency} onValueChange={handleCurrencyChange}>
                <SelectTrigger className="w-full bg-background" aria-label="Moneda principal">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(CURRENCIES).map(([code, c]) => (
                    <SelectItem key={code} value={code}>
                      <span className="font-medium">{c.symbol}</span> - {c.label} ({code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Base Monthly Income */}
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Ingreso Mensual Estimado</Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <span className="absolute left-3 top-2.5 text-xs text-muted-foreground">
                    {CURRENCIES[displayCurrency as keyof typeof CURRENCIES]?.symbol || "$"}
                  </span>
                  <Input
                    type="number"
                    value={monthlyIncome}
                    onChange={(e) => setMonthlyIncome(e.target.value)}
                    placeholder="0.00"
                    className="pl-9 bg-background"
                    disabled={savingIncome}
                  />
                </div>
                <Button
                  onClick={handleSaveIncome}
                  disabled={savingIncome}
                  className="gap-1 shrink-0"
                >
                  <Save className="h-3.5 w-3.5" />
                  {savingIncome ? "Guardando..." : "Guardar"}
                </Button>
              </div>
            </div>

            <Separator className="my-2" />

            {/* Activity Summary Badges */}
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Resumen de tu cuenta</Label>
              <div className="grid grid-cols-3 gap-2">
                <div className="flex flex-col items-center justify-center rounded-lg border border-border/40 bg-secondary/30 p-2 text-center">
                  <Receipt className="h-4 w-4 text-emerald-500 mb-1" />
                  <span className="text-xs font-bold text-foreground">{transactionsCount}</span>
                  <span className="text-[10px] text-muted-foreground">Movimientos</span>
                </div>

                <div className="flex flex-col items-center justify-center rounded-lg border border-border/40 bg-secondary/30 p-2 text-center">
                  <CreditCard className="h-4 w-4 text-amber-500 mb-1" />
                  <span className="text-xs font-bold text-foreground">{debtsCount}</span>
                  <span className="text-[10px] text-muted-foreground">Deudas</span>
                </div>

                <div className="flex flex-col items-center justify-center rounded-lg border border-border/40 bg-secondary/30 p-2 text-center">
                  <Target className="h-4 w-4 text-indigo-500 mb-1" />
                  <span className="text-xs font-bold text-foreground">{goalsCount}</span>
                  <span className="text-[10px] text-muted-foreground">Metas</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/utils/supabase/client"
import {
  updateProfileName,
  updateProfileEmail,
  updateProfilePassword,
  updateProfileMetadata,
} from "@/app/actions/profile"
import { saveSettings } from "@/app/actions/settings"
import { CURRENCIES } from "@/lib/config"
import type { UserProfile, Settings } from "@/lib/finance"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
  KeyRound,
  Calendar,
  CheckCircle2,
  Edit2,
  Save,
  X,
  LogOut,
  Copy,
  Check,
  ShieldCheck,
  Coins,
  Receipt,
  Target,
  CreditCard,
  Phone,
  Bell,
  Lock,
  Palette,
  Sparkles,
  Loader2,
  Eye,
  EyeOff,
  AlertTriangle,
} from "lucide-react"

type ProfilePanelProps = {
  user: UserProfile
  settings: Settings
  debtsCount?: number
  transactionsCount?: number
  goalsCount?: number
  onCurrencyChange?: (currency: string) => void
}

const AVATAR_THEMES = [
  { id: "emerald", label: "Esmeralda", gradient: "from-emerald-500 to-teal-700", ring: "ring-emerald-500" },
  { id: "indigo", label: "Índigo", gradient: "from-indigo-500 to-purple-700", ring: "ring-indigo-500" },
  { id: "violet", label: "Violeta", gradient: "from-violet-500 to-fuchsia-700", ring: "ring-violet-500" },
  { id: "amber", label: "Ámbar", gradient: "from-amber-500 to-orange-700", ring: "ring-amber-500" },
  { id: "rose", label: "Rosa", gradient: "from-rose-500 to-pink-700", ring: "ring-rose-500" },
  { id: "cyan", label: "Cian", gradient: "from-cyan-500 to-blue-700", ring: "ring-cyan-500" },
]

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

  // Tab State
  const [profileTab, setProfileTab] = useState("personal")

  // Personal Info Form State
  const [name, setName] = useState(user.name)
  const [email, setEmail] = useState(user.email)
  const [phone, setPhone] = useState(user.phone || "")
  const [avatarColor, setAvatarColor] = useState(user.avatarColor || "emerald")

  // Financial Form State
  const [monthlyIncome, setMonthlyIncome] = useState(settings.monthlyIncome.toString())
  const [displayCurrency, setDisplayCurrency] = useState(settings.displayCurrency)
  const [payDay, setPayDay] = useState((user.payDay || 15).toString())

  // Password State
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)

  // Notifications State
  const [notifications, setNotifications] = useState(user.notificationsEnabled ?? true)

  // Loading States
  const [loadingSection, setLoadingSection] = useState<string | null>(null)

  // Copy Feedback & Messages
  const [copiedId, setCopiedId] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  const selectedTheme = AVATAR_THEMES.find((t) => t.id === avatarColor) || AVATAR_THEMES[0]

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

  // Handlers
  async function handleSavePersonal() {
    setLoadingSection("personal")
    setMessage(null)
    try {
      if (name.trim() !== user.name) {
        await updateProfileName(name.trim())
      }
      if (email.trim().toLowerCase() !== user.email.toLowerCase()) {
        await updateProfileEmail(email.trim())
        setMessage({
          type: "success",
          text: "Se ha solicitado la actualización de correo. Revisa tu bandeja de entrada.",
        })
      }
      await updateProfileMetadata({
        avatarColor,
        phone: phone.trim(),
      })
      if (!message) {
        setMessage({ type: "success", text: "Datos personales actualizados correctamente" })
      }
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "Error al actualizar perfil" })
    } finally {
      setLoadingSection(null)
    }
  }

  async function handleSaveFinancial() {
    setLoadingSection("financial")
    setMessage(null)
    try {
      const val = parseFloat(monthlyIncome) || 0
      await saveSettings({ monthlyIncome: val, displayCurrency })
      await updateProfileMetadata({ payDay: parseInt(payDay) || 15 })
      if (onCurrencyChange) onCurrencyChange(displayCurrency)
      setMessage({ type: "success", text: "Preferencias financieras guardadas correctamente" })
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "Error al guardar preferencias" })
    } finally {
      setLoadingSection(null)
    }
  }

  async function handleSavePassword() {
    if (!newPassword) return
    if (newPassword !== confirmPassword) {
      setMessage({ type: "error", text: "Las contraseñas no coinciden" })
      return
    }
    if (newPassword.length < 6) {
      setMessage({ type: "error", text: "La contraseña debe tener al menos 6 caracteres" })
      return
    }

    setLoadingSection("password")
    setMessage(null)
    try {
      await updateProfilePassword(newPassword)
      setNewPassword("")
      setConfirmPassword("")
      setMessage({ type: "success", text: "¡Contraseña actualizada exitosamente!" })
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "Error al cambiar contraseña" })
    } finally {
      setLoadingSection(null)
    }
  }

  async function handleToggleNotifications(checked: boolean) {
    setNotifications(checked)
    try {
      await updateProfileMetadata({ notificationsEnabled: checked })
      setMessage({
        type: "success",
        text: checked ? "Notificaciones activadas" : "Notificaciones desactivadas",
      })
    } catch {
      setNotifications(!checked)
    }
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
          className={`flex items-center justify-between rounded-xl border p-4 text-sm transition-all duration-300 shadow-sm animate-in fade-in-0 slide-in-from-top-2 ${
            message.type === "success"
              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
              : "border-destructive/30 bg-destructive/10 text-destructive"
          }`}
        >
          <div className="flex items-center gap-2.5">
            {message.type === "success" ? (
              <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-500" />
            ) : (
              <AlertTriangle className="h-5 w-5 shrink-0 text-destructive" />
            )}
            <span className="font-medium">{message.text}</span>
          </div>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => setMessage(null)}
            className="h-6 w-6 opacity-70 hover:opacity-100"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Hero Profile Card */}
      <Card className="relative overflow-hidden border-border/60 bg-gradient-to-br from-card via-card/90 to-secondary/30 shadow-lg">
        <div className="absolute top-0 right-0 h-44 w-44 rounded-bl-full bg-primary/10 blur-3xl pointer-events-none" />
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
            <div className="flex flex-col sm:flex-row items-center gap-5">
              {/* Avatar Circle with Selected Theme */}
              <div className="relative group">
                <div
                  className={`flex h-22 w-22 items-center justify-center rounded-2xl bg-gradient-to-tr ${selectedTheme.gradient} text-3xl font-bold text-white shadow-xl shadow-primary/20 border-2 border-background transition-transform duration-300 group-hover:scale-105`}
                >
                  {initials}
                </div>
                <span className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 ring-4 ring-background">
                  <Check className="h-3.5 w-3.5 text-white" />
                </span>
              </div>

              {/* Basic Info */}
              <div className="space-y-1">
                <div className="flex items-center justify-center sm:justify-start gap-2">
                  <h2 className="text-2xl font-bold font-display text-foreground tracking-tight">
                    {name}
                  </h2>
                  <Badge variant="secondary" className="gap-1 bg-primary/10 text-primary border-primary/20">
                    <Sparkles className="h-3 w-3" />
                    Pro
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground flex items-center justify-center sm:justify-start gap-1.5">
                  <Mail className="h-3.5 w-3.5 text-primary" />
                  {email}
                </p>
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1 text-xs">
                  <Badge variant="outline" className="gap-1 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/5">
                    <ShieldCheck className="h-3 w-3" />
                    Usuario Verificado
                  </Badge>
                  <span className="text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    Desde {formattedDate}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Metrics Bar */}
            <div className="grid grid-cols-3 gap-3 w-full md:w-auto border-t md:border-t-0 md:border-l border-border/50 pt-4 md:pt-0 md:pl-6">
              <div className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-secondary/40 border border-border/40 min-w-[85px]">
                <Receipt className="h-4 w-4 text-emerald-500 mb-1" />
                <span className="text-base font-bold text-foreground">{transactionsCount}</span>
                <span className="text-[10px] font-medium text-muted-foreground">Movimientos</span>
              </div>
              <div className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-secondary/40 border border-border/40 min-w-[85px]">
                <CreditCard className="h-4 w-4 text-amber-500 mb-1" />
                <span className="text-base font-bold text-foreground">{debtsCount}</span>
                <span className="text-[10px] font-medium text-muted-foreground">Deudas</span>
              </div>
              <div className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-secondary/40 border border-border/40 min-w-[85px]">
                <Target className="h-4 w-4 text-indigo-500 mb-1" />
                <span className="text-base font-bold text-foreground">{goalsCount}</span>
                <span className="text-[10px] font-medium text-muted-foreground">Metas</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Profile Tabs / Navigation */}
      <Tabs value={profileTab} onValueChange={setProfileTab} className="w-full">
        <div className="-mx-4 mb-4 overflow-x-auto px-4 no-scrollbar">
          <TabsList className="inline-flex h-auto w-full sm:w-auto justify-start gap-1.5 bg-card/70 border border-border/50 p-1.5 rounded-xl shadow-sm backdrop-blur-md">
            <TabsTrigger
              value="personal"
              className="flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg transition-all data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <User className="h-4 w-4" />
              Datos Personales
            </TabsTrigger>
            <TabsTrigger
              value="financial"
              className="flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg transition-all data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <Coins className="h-4 w-4" />
              Finanzas
            </TabsTrigger>
            <TabsTrigger
              value="security"
              className="flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg transition-all data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <Lock className="h-4 w-4" />
              Seguridad
            </TabsTrigger>
            <TabsTrigger
              value="notifications"
              className="flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg transition-all data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <Bell className="h-4 w-4" />
              Alertas
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Tab 1: Datos Personales */}
        <TabsContent value="personal" className="mt-0 space-y-6">
          <Card className="border-border/50 bg-card/60 backdrop-blur-sm shadow-sm">
            <CardHeader>
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <User className="h-4 w-4 text-primary" />
                Información Personal y Perfil
              </CardTitle>
              <CardDescription className="text-xs">
                Actualiza tu nombre de pantalla, avatar y datos de contacto.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Avatar Color Selector */}
              <div className="space-y-2">
                <Label className="text-xs font-semibold flex items-center gap-1.5">
                  <Palette className="h-3.5 w-3.5 text-primary" />
                  Color de Estilo del Avatar
                </Label>
                <div className="flex flex-wrap gap-3">
                  {AVATAR_THEMES.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setAvatarColor(t.id)}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-medium transition-all ${
                        avatarColor === t.id
                          ? `border-primary bg-primary/10 text-primary ${t.ring} ring-2 ring-offset-2 ring-offset-background`
                          : "border-border/50 bg-background/50 hover:bg-secondary/60 text-muted-foreground"
                      }`}
                    >
                      <span className={`h-3.5 w-3.5 rounded-full bg-gradient-to-tr ${t.gradient}`} />
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              <Separator className="my-2" />

              {/* Form Grid */}
              <div className="grid gap-4 sm:grid-cols-2">
                {/* Display Name */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Nombre Completo</Label>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Tu nombre completo"
                    className="bg-background"
                  />
                </div>

                {/* Email Address */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Correo Electrónico</Label>
                  <Input
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="correo@ejemplo.com"
                    className="bg-background"
                  />
                  <p className="text-[10px] text-muted-foreground">
                    Si cambias el correo, recibirás un enlace de confirmación.
                  </p>
                </div>

                {/* Phone */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Teléfono (Opcional)</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+1 (809) 000-0000"
                      className="pl-9 bg-background"
                    />
                  </div>
                </div>

                {/* Supabase User ID (Readonly + Copy) */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">ID de Cuenta (Supabase)</Label>
                  <div className="flex gap-2">
                    <Input
                      value={user.id}
                      readOnly
                      className="bg-muted/40 font-mono text-xs select-all"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={handleCopyId}
                      className="shrink-0"
                      title="Copiar ID"
                    >
                      {copiedId ? (
                        <Check className="h-4 w-4 text-emerald-500" />
                      ) : (
                        <Copy className="h-4 w-4 text-muted-foreground" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex justify-end pt-2">
                <Button
                  onClick={handleSavePersonal}
                  disabled={loadingSection === "personal"}
                  className="gap-2 px-6"
                >
                  {loadingSection === "personal" ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      Guardar Cambios Personales
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 2: Finanzas & Preferencias */}
        <TabsContent value="financial" className="mt-0 space-y-6">
          <Card className="border-border/50 bg-card/60 backdrop-blur-sm shadow-sm">
            <CardHeader>
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Coins className="h-4 w-4 text-primary" />
                Preferencias Financieras y Presupuesto
              </CardTitle>
              <CardDescription className="text-xs">
                Configura la moneda predeterminada, tu ingreso mensual y día de cobro.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid gap-5 sm:grid-cols-2">
                {/* Currency Selector */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Moneda Principal de la Cuenta</Label>
                  <Select value={displayCurrency} onValueChange={(val) => val && setDisplayCurrency(val)}>
                    <SelectTrigger className="w-full bg-background" aria-label="Moneda principal">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(CURRENCIES).map(([code, c]) => (
                        <SelectItem key={code} value={code}>
                          <span className="font-semibold text-primary">{c.symbol}</span> - {c.label} ({code})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Base Monthly Income */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Ingreso Mensual Base Estimado</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-xs font-semibold text-muted-foreground">
                      {CURRENCIES[displayCurrency as keyof typeof CURRENCIES]?.symbol || "$"}
                    </span>
                    <Input
                      type="number"
                      value={monthlyIncome}
                      onChange={(e) => setMonthlyIncome(e.target.value)}
                      placeholder="0.00"
                      className="pl-10 bg-background"
                    />
                  </div>
                </div>

                {/* Estimated Pay Day / Billing Cycle */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Día de Cobro / Cierre Estimado del Mes</Label>
                  <Select value={payDay} onValueChange={(val) => val && setPayDay(val)}>
                    <SelectTrigger className="w-full bg-background" aria-label="Día de cobro">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                        <SelectItem key={day} value={day.toString()}>
                          Día {day} de cada mes
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Account Plan Info */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Plan de Control de Gastos</Label>
                  <div className="flex items-center justify-between rounded-lg border border-border/40 bg-background/50 p-2.5">
                    <span className="text-xs font-semibold text-foreground">Acceso Ilimitado Pro</span>
                    <Badge variant="secondary" className="text-[10px] bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
                      Activo
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <Button
                  onClick={handleSaveFinancial}
                  disabled={loadingSection === "financial"}
                  className="gap-2 px-6"
                >
                  {loadingSection === "financial" ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      Guardar Configuración Financiera
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 3: Seguridad & Contraseña */}
        <TabsContent value="security" className="mt-0 space-y-6">
          <Card className="border-border/50 bg-card/60 backdrop-blur-sm shadow-sm">
            <CardHeader>
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <KeyRound className="h-4 w-4 text-primary" />
                Seguridad y Cambio de Contraseña
              </CardTitle>
              <CardDescription className="text-xs">
                Actualiza tu contraseña para mantener protegida tu cuenta.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid gap-4 sm:grid-cols-2">
                {/* New Password */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Nueva Contraseña</Label>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Mínimo 6 caracteres"
                      className="pr-10 bg-background"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-1 top-1 h-7 w-7 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                    </Button>
                  </div>
                </div>

                {/* Confirm New Password */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Confirmar Nueva Contraseña</Label>
                  <Input
                    type={showPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repite la nueva contraseña"
                    className="bg-background"
                  />
                </div>
              </div>

              {/* Password strength tips */}
              <div className="rounded-xl border border-border/40 bg-secondary/20 p-3 text-xs space-y-1 text-muted-foreground">
                <p className="font-semibold text-foreground">Recomendaciones de contraseña:</p>
                <ul className="list-disc list-inside space-y-0.5 text-[11px]">
                  <li>Utiliza al menos 6 caracteres con letras y números.</li>
                  <li>Combina mayúsculas, minúsculas y caracteres especiales.</li>
                </ul>
              </div>

              <div className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-2">
                <Button
                  variant="outline"
                  className="w-full sm:w-auto text-destructive hover:bg-destructive/10 hover:text-destructive border-destructive/30 gap-2"
                  onClick={handleLogout}
                >
                  <LogOut className="h-4 w-4" />
                  Cerrar Sesión Activa
                </Button>

                <Button
                  onClick={handleSavePassword}
                  disabled={loadingSection === "password" || !newPassword}
                  className="w-full sm:w-auto gap-2 px-6"
                >
                  {loadingSection === "password" ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Actualizando...
                    </>
                  ) : (
                    <>
                      <Lock className="h-4 w-4" />
                      Actualizar Contraseña
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 4: Alertas & Notificaciones */}
        <TabsContent value="notifications" className="mt-0 space-y-6">
          <Card className="border-border/50 bg-card/60 backdrop-blur-sm shadow-sm">
            <CardHeader>
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Bell className="h-4 w-4 text-primary" />
                Preferencias de Notificaciones y Recordatorios
              </CardTitle>
              <CardDescription className="text-xs">
                Administra los avisos automáticos sobre tus gastos y vencimiento de deudas.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3.5 rounded-xl border border-border/40 bg-background/50">
                <div className="space-y-0.5">
                  <p className="text-xs font-semibold text-foreground">Alertas de Notificación</p>
                  <p className="text-[11px] text-muted-foreground">
                    Recibir aviso automático en la app cuando un gasto o pago recurrente esté próximo.
                  </p>
                </div>
                <Switch
                  checked={notifications}
                  onCheckedChange={handleToggleNotifications}
                />
              </div>

              <div className="flex items-center justify-between p-3.5 rounded-xl border border-border/40 bg-background/50">
                <div className="space-y-0.5">
                  <p className="text-xs font-semibold text-foreground">Aviso de Gastos Hormiga</p>
                  <p className="text-[11px] text-muted-foreground">
                    Alertar en el panel de control cuando los pequeños gastos superen el límite sugerido.
                  </p>
                </div>
                <Switch defaultChecked />
              </div>

              <div className="flex items-center justify-between p-3.5 rounded-xl border border-border/40 bg-background/50">
                <div className="space-y-0.5">
                  <p className="text-xs font-semibold text-foreground">Resumen Semanal de Metas</p>
                  <p className="text-[11px] text-muted-foreground">
                    Mostrar progresos periódicos sobre tus metas de ahorro y avance de pagos.
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

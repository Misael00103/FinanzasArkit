"use client"

import { useState, useTransition } from "react"
import {
  createBankAccount,
  updateBankAccount,
  deleteBankAccount,
  transferBetweenAccounts,
} from "@/app/actions/bank-accounts"
import { formatMoney, CURRENCIES } from "@/lib/config"
import { convertCurrency, totalBankBalance, type BankAccount } from "@/lib/finance"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Landmark,
  Plus,
  ArrowRightLeft,
  CreditCard,
  Wallet,
  Coins,
  TrendingUp,
  Edit2,
  Trash2,
  SlidersHorizontal,
  Building2,
  DollarSign,
  ChevronRight,
} from "lucide-react"
import { toast } from "sonner"

const ACCOUNT_TYPES = [
  { value: "cuenta_ahorro", label: "Cuenta de Ahorros", icon: Landmark, color: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20" },
  { value: "cuenta_corriente", label: "Cuenta Corriente", icon: Building2, color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20" },
  { value: "tarjeta_credito", label: "Tarjeta de Crédito", icon: CreditCard, color: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20" },
  { value: "efectivo", label: "Efectivo / Caja", icon: Wallet, color: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20" },
  { value: "inversion", label: "Inversión / Fondo", icon: TrendingUp, color: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20" },
  { value: "otro", label: "Otra Cuenta", icon: Coins, color: "bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20" },
]

const POPULAR_BANKS = [
  "Banco Popular",
  "BHD León",
  "Banreservas",
  "Scotiabank",
  "BAC Credomatic",
  "Santa Cruz",
  "Promerica",
  "APAP",
  "Efectivo / Caja",
]

const COLOR_PRESETS = [
  "#3b82f6", // Blue
  "#10b981", // Emerald
  "#8b5cf6", // Purple
  "#f59e0b", // Amber
  "#ec4899", // Pink
  "#06b6d4", // Cyan
  "#64748b", // Slate
]

export function BankAccountsPanel({
  bankAccounts,
  currency,
}: {
  bankAccounts: BankAccount[]
  currency: string
}) {
  const [createOpen, setCreateOpen] = useState(false)
  const [transferOpen, setTransferOpen] = useState(false)
  const [pending, startTransition] = useTransition()

  // Form states for Create Account
  const [bankNameInput, setBankNameInput] = useState("Banco Popular")
  const [type, setType] = useState("cuenta_ahorro")
  const [accountCurrency, setAccountCurrency] = useState(currency)
  const [selectedColor, setSelectedColor] = useState("#3b82f6")

  // Form states for Transfer
  const [fromAccount, setFromAccount] = useState<string>("")
  const [toAccount, setToAccount] = useState<string>("")

  const totalBalance = totalBankBalance(bankAccounts, currency)

  // Group accounts by Bank Name
  const groupedByBank = bankAccounts.reduce((acc, account) => {
    const bank = (account.bankName || "General").trim()
    if (!acc[bank]) acc[bank] = []
    acc[bank].push(account)
    return acc
  }, {} as Record<string, BankAccount[]>)

  function handleCreate(formData: FormData) {
    const name = String(formData.get("name") || "").trim()
    const balance = Number(formData.get("balance") || 0)
    const accountNumber = String(formData.get("accountNumber") || "").trim()
    const notes = String(formData.get("notes") || "").trim()

    if (!name) {
      toast.error("El nombre de la cuenta es obligatorio")
      return
    }

    startTransition(async () => {
      try {
        await createBankAccount({
          bankName: bankNameInput || "General",
          name,
          type,
          balance,
          currency: accountCurrency,
          accountNumber: accountNumber || undefined,
          color: selectedColor,
          notes: notes || undefined,
        })
        toast.success("Cuenta bancaria agregada")
        setCreateOpen(false)
      } catch (err: any) {
        toast.error(err.message || "Error al agregar cuenta bancaria")
      }
    })
  }

  function handleTransfer(formData: FormData) {
    const fromId = Number(fromAccount)
    const toId = Number(toAccount)
    const amount = Number(formData.get("amount") || 0)
    const notes = String(formData.get("notes") || "").trim()

    if (!fromId || !toId) {
      toast.error("Selecciona cuenta de origen y destino")
      return
    }

    startTransition(async () => {
      try {
        await transferBetweenAccounts({
          fromAccountId: fromId,
          toAccountId: toId,
          amount,
          currency,
          notes,
        })
        toast.success("Transferencia realizada con éxito")
        setTransferOpen(false)
        setFromAccount("")
        setToAccount("")
      } catch (err: any) {
        toast.error(err.message || "Error al realizar la transferencia")
      }
    })
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Top Banner & Quick Actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold font-display tracking-tight text-foreground flex items-center gap-2.5">
            <Landmark className="h-6 w-6 text-primary" />
            Mis Bancos y Cuentas
          </h2>
          <p className="text-sm text-muted-foreground">
            Organiza tus diferentes cuentas por banco y selecciona de cuál sale el dinero en cada consumo.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {bankAccounts.length >= 2 && (
            <Dialog open={transferOpen} onOpenChange={setTransferOpen}>
              <DialogTrigger render={
                <Button variant="outline" className="gap-2 shadow-sm">
                  <ArrowRightLeft className="h-4 w-4" />
                  Transferir entre Cuentas
                </Button>
              } />
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2 text-lg font-bold">
                    <ArrowRightLeft className="h-5 w-5 text-primary" />
                    Transferencia entre Cuentas
                  </DialogTitle>
                </DialogHeader>
                <form action={handleTransfer} className="flex flex-col gap-4 pt-2">
                  <div className="flex flex-col gap-1.5">
                    <Label>Cuenta de Origen (De dónde sale el dinero) *</Label>
                    <Select value={fromAccount} onValueChange={(val) => val && setFromAccount(val)}>
                      <SelectTrigger className="w-full h-auto min-h-11 py-2 px-3">
                        <SelectValue placeholder="Seleccionar origen..." />
                      </SelectTrigger>
                      <SelectContent className="w-full min-w-[320px] max-w-[95vw]">
                        {bankAccounts.map((acc) => (
                          <SelectItem key={acc.id} value={acc.id.toString()} className="py-2">
                            <div className="flex flex-col gap-0.5 py-1 text-left w-full min-w-0">
                              <div className="flex items-center justify-between gap-2">
                                <span className="font-bold text-foreground text-sm truncate flex items-center gap-1.5">
                                  <Building2 className="h-3.5 w-3.5 text-primary shrink-0" />
                                  {acc.bankName || "General"} · {acc.name}
                                </span>
                                <span className="font-mono text-xs font-black text-emerald-600 dark:text-emerald-400 shrink-0 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                                  {formatMoney(acc.balance, acc.currency)}
                                </span>
                              </div>
                              <div className="flex items-center justify-between gap-2 text-[11px] text-muted-foreground">
                                <span className="capitalize">{acc.type.replace(/_/g, " ")}</span>
                                {acc.accountNumber && <span className="font-mono text-[10px]">{acc.accountNumber}</span>}
                              </div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <Label>Cuenta de Destino (A dónde llega el dinero) *</Label>
                    <Select value={toAccount} onValueChange={(val) => val && setToAccount(val)}>
                      <SelectTrigger className="w-full h-auto min-h-11 py-2 px-3">
                        <SelectValue placeholder="Seleccionar destino..." />
                      </SelectTrigger>
                      <SelectContent className="w-full min-w-[320px] max-w-[95vw]">
                        {bankAccounts
                          .filter((acc) => acc.id.toString() !== fromAccount)
                          .map((acc) => (
                            <SelectItem key={acc.id} value={acc.id.toString()} className="py-2">
                              <div className="flex flex-col gap-0.5 py-1 text-left w-full min-w-0">
                                <div className="flex items-center justify-between gap-2">
                                  <span className="font-bold text-foreground text-sm truncate flex items-center gap-1.5">
                                    <Building2 className="h-3.5 w-3.5 text-primary shrink-0" />
                                    {acc.bankName || "General"} · {acc.name}
                                  </span>
                                  <span className="font-mono text-xs font-black text-emerald-600 dark:text-emerald-400 shrink-0 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                                    {formatMoney(acc.balance, acc.currency)}
                                  </span>
                                </div>
                                <div className="flex items-center justify-between gap-2 text-[11px] text-muted-foreground">
                                  <span className="capitalize">{acc.type.replace(/_/g, " ")}</span>
                                  {acc.accountNumber && <span className="font-mono text-[10px]">{acc.accountNumber}</span>}
                                </div>
                              </div>
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="transferAmount">Monto a Transferir *</Label>
                    <Input id="transferAmount" name="amount" type="number" step="0.01" min="0.01" required placeholder="0.00" />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="transferNotes">Notas / Concepto (Opcional)</Label>
                    <Input id="transferNotes" name="notes" placeholder="Ej. Paso a ahorro o tarjeta" />
                  </div>

                  <DialogFooter className="pt-2">
                    <Button type="submit" disabled={pending} className="w-full">
                      Realizar Transferencia
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          )}

          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger render={
              <Button className="gap-2 shadow-sm">
                <Plus className="h-4 w-4" />
                Nueva Cuenta
              </Button>
            } />
            <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="text-lg font-bold flex items-center gap-2">
                  <Landmark className="h-5 w-5 text-primary" />
                  Agregar Cuenta Bancaria
                </DialogTitle>
              </DialogHeader>
              <form action={handleCreate} className="flex flex-col gap-4 pt-2">
                {/* Banco / Entidad */}
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="bankNameInput">Banco / Entidad Financiera *</Label>
                  <Input
                    id="bankNameInput"
                    value={bankNameInput}
                    onChange={(e) => setBankNameInput(e.target.value)}
                    placeholder="Ej. Banco Popular, BHD León, Scotiabank, Efectivo..."
                    required
                  />
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {POPULAR_BANKS.map((b) => (
                      <button
                        key={b}
                        type="button"
                        onClick={() => setBankNameInput(b)}
                        className={`text-[11px] px-2 py-0.5 rounded-full border transition-all ${
                          bankNameInput === b
                            ? "bg-primary text-primary-foreground border-primary font-medium"
                            : "bg-secondary text-secondary-foreground border-border hover:bg-secondary/80"
                        }`}
                      >
                        {b}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="name">Nombre / Apodo de esta Cuenta *</Label>
                  <Input id="name" name="name" placeholder="Ej. Nómina, Ahorros USD, Tarjeta Gold..." required />
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label>Tipo de Cuenta</Label>
                  <Select value={type} onValueChange={(val) => val && setType(val)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ACCOUNT_TYPES.map((t) => (
                        <SelectItem key={t.value} value={t.value}>
                          {t.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="flex flex-col gap-1.5 col-span-1 sm:col-span-2">
                    <Label htmlFor="balance">Saldo Actual *</Label>
                    <Input id="balance" name="balance" type="number" step="0.01" required placeholder="0.00" />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label>Moneda</Label>
                    <Select value={accountCurrency} onValueChange={(val) => val && setAccountCurrency(val)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.keys(CURRENCIES).map((code) => (
                          <SelectItem key={code} value={code}>
                            {code}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="accountNumber">Número de Cuenta / Últimos 4 dígitos (Opcional)</Label>
                  <Input id="accountNumber" name="accountNumber" placeholder="Ej. *4821" />
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label>Color Identificador</Label>
                  <div className="flex items-center gap-2 pt-1">
                    {COLOR_PRESETS.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setSelectedColor(c)}
                        className={`h-7 w-7 rounded-full transition-all ${
                          selectedColor === c ? "ring-2 ring-primary ring-offset-2 scale-110" : "opacity-80 hover:opacity-100"
                        }`}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="notes">Notas o Detalles (Opcional)</Label>
                  <Input id="notes" name="notes" placeholder="Ej. Cuenta para nómina quincenal" />
                </div>

                <DialogFooter className="pt-2">
                  <Button type="submit" disabled={pending} className="w-full">
                    Guardar Cuenta
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Total Balance Overview */}
      <Card className="relative overflow-hidden border border-primary/20 bg-gradient-to-br from-primary/10 via-background to-card shadow-md">
        <CardContent className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-6">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg">
              <DollarSign className="h-7 w-7" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Dinero Total Disponible en Bancos y Cuentas
              </p>
              <h3 className="font-display text-3xl font-extrabold tracking-tight text-foreground mt-0.5">
                {formatMoney(totalBalance, currency)}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-4 border-t sm:border-t-0 sm:border-l border-border/60 pt-3 sm:pt-0 sm:pl-6">
            <div className="text-left sm:text-right">
              <p className="text-xs text-muted-foreground">Bancos Registrados</p>
              <p className="text-lg font-bold text-foreground font-mono">{Object.keys(groupedByBank).length}</p>
            </div>
            <div className="text-left sm:text-right">
              <p className="text-xs text-muted-foreground">Cuentas Totales</p>
              <p className="text-lg font-bold text-primary font-mono">{bankAccounts.length}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Grouped Accounts List by Bank */}
      {bankAccounts.length === 0 ? (
        <Card className="border-dashed bg-card/40">
          <CardContent className="flex flex-col items-center gap-3 py-14 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-secondary">
              <Landmark className="h-7 w-7 text-muted-foreground" />
            </div>
            <p className="text-base font-semibold text-foreground">No tienes cuentas bancarias agregadas</p>
            <p className="max-w-md text-xs text-muted-foreground">
              Agrega tus bancos (ej. Banco Popular, BHD, Cash) y las sub-cuentas que tienes en cada uno para organizar tus fondos.
            </p>
            <Button onClick={() => setCreateOpen(true)} className="mt-2 gap-2">
              <Plus className="h-4 w-4" />
              Agregar Mi Primera Cuenta
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-6">
          {Object.entries(groupedByBank).map(([bankName, accounts]) => {
            const bankTotal = totalBankBalance(accounts, currency)
            return (
              <div key={bankName} className="space-y-3">
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-primary" />
                    <h3 className="font-display font-bold text-lg text-foreground">
                      {bankName}
                    </h3>
                    <Badge variant="secondary" className="font-mono text-xs">
                      {accounts.length} {accounts.length === 1 ? "cuenta" : "cuentas"}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3">
                    <p className="text-xs font-semibold text-muted-foreground font-mono hidden sm:block">
                      Total: <span className="text-foreground font-bold">{formatMoney(bankTotal, currency)}</span>
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setBankNameInput(bankName)
                        setCreateOpen(true)
                      }}
                      className="h-8 gap-1.5 text-xs shadow-xs"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Agregar cuenta a {bankName}
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {accounts.map((acc) => (
                    <AccountCard key={acc.id} acc={acc} currency={currency} />
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function AccountCard({ acc, currency }: { acc: BankAccount; currency: string }) {
  const [pending, startTransition] = useTransition()
  const [editOpen, setEditOpen] = useState(false)
  const [adjustOpen, setAdjustOpen] = useState(false)

  // Edit states
  const [editBankName, setEditBankName] = useState(acc.bankName || "General")
  const [editName, setEditName] = useState(acc.name)
  const [editType, setEditType] = useState(acc.type)
  const [editBalance, setEditBalance] = useState(acc.balance.toString())
  const [editCurrency, setEditCurrency] = useState(acc.currency)
  const [editAccNum, setEditAccNum] = useState(acc.accountNumber || "")
  const [editColor, setEditColor] = useState(acc.color || "#3b82f6")
  const [editNotes, setEditNotes] = useState(acc.notes || "")

  const typeObj = ACCOUNT_TYPES.find((t) => t.value === acc.type) || ACCOUNT_TYPES[0]
  const IconComponent = typeObj.icon

  function handleEdit(e: React.FormEvent) {
    e.preventDefault()
    if (!editName.trim()) {
      toast.error("El nombre es obligatorio")
      return
    }
    startTransition(async () => {
      try {
        await updateBankAccount(acc.id, {
          bankName: editBankName.trim() || "General",
          name: editName.trim(),
          type: editType,
          balance: Number(editBalance) || 0,
          currency: editCurrency,
          accountNumber: editAccNum.trim() || undefined,
          color: editColor,
          notes: editNotes.trim() || undefined,
        })
        toast.success("Cuenta actualizada")
        setEditOpen(false)
      } catch (err: any) {
        toast.error(err.message || "Error al actualizar cuenta")
      }
    })
  }

  function handleAdjust(formData: FormData) {
    const newBal = Number(formData.get("newBalance") || 0)
    startTransition(async () => {
      try {
        await updateBankAccount(acc.id, { balance: newBal })
        toast.success("Saldo ajustado")
        setAdjustOpen(false)
      } catch (err: any) {
        toast.error(err.message || "Error al ajustar saldo")
      }
    })
  }

  function handleDelete() {
    if (confirm(`¿Estás seguro de eliminar la cuenta "${acc.name}" de ${acc.bankName || 'este banco'}?`)) {
      startTransition(async () => {
        try {
          await deleteBankAccount(acc.id)
          toast.success("Cuenta eliminada")
        } catch (err: any) {
          toast.error(err.message || "Error al eliminar la cuenta")
        }
      })
    }
  }

  return (
    <Card className="group relative overflow-hidden border border-border/60 bg-card/70 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md backdrop-blur-md rounded-2xl">
      {/* Color strip */}
      <div className="h-1.5 w-full" style={{ backgroundColor: acc.color || "#3b82f6" }} />

      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
        <div className="flex items-center gap-3 min-w-0">
          <div
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl shadow-sm text-white font-bold"
            style={{ backgroundColor: acc.color || "#3b82f6" }}
          >
            <IconComponent className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <CardTitle className="text-base font-bold truncate text-foreground flex items-center gap-1.5">
              <span>{acc.name}</span>
            </CardTitle>
            <CardDescription className="text-xs truncate flex items-center gap-1.5 mt-0.5">
              <span className="font-medium text-foreground/80">{typeObj.label}</span>
              {acc.accountNumber && (
                <span className="font-mono text-[11px] text-muted-foreground/80">
                  · {acc.accountNumber}
                </span>
              )}
            </CardDescription>
          </div>
        </div>

        <div className="flex items-center gap-1 opacity-90 group-hover:opacity-100 transition-opacity">
          <Dialog open={adjustOpen} onOpenChange={setAdjustOpen}>
            <DialogTrigger render={
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 text-muted-foreground hover:text-foreground"
                title="Ajustar saldo"
              >
                <SlidersHorizontal className="h-3.5 w-3.5" />
              </Button>
            } />
            <DialogContent className="sm:max-w-xs">
              <DialogHeader>
                <DialogTitle className="text-base font-bold">Ajustar Saldo</DialogTitle>
              </DialogHeader>
              <form action={handleAdjust} className="flex flex-col gap-3 pt-1">
                <div className="flex flex-col gap-1.5">
                  <Label>Nuevo Saldo ({acc.currency})</Label>
                  <Input name="newBalance" type="number" step="0.01" defaultValue={acc.balance} required />
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={pending} className="w-full">
                    Confirmar Ajuste
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          <Dialog open={editOpen} onOpenChange={setEditOpen}>
            <DialogTrigger render={
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 text-muted-foreground hover:text-foreground"
                title="Editar cuenta"
              >
                <Edit2 className="h-3.5 w-3.5" />
              </Button>
            } />
            <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="text-lg font-bold flex items-center gap-2">
                  <Edit2 className="h-5 w-5 text-primary" />
                  Editar Cuenta Bancaria
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleEdit} className="flex flex-col gap-4 pt-2">
                <div className="flex flex-col gap-1.5">
                  <Label>Banco / Entidad Financiera *</Label>
                  <Input
                    value={editBankName}
                    onChange={(e) => setEditBankName(e.target.value)}
                    placeholder="Ej. Banco Popular, BHD León..."
                    required
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label>Nombre / Apodo de la Cuenta *</Label>
                  <Input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    required
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label>Tipo de Cuenta</Label>
                  <Select value={editType} onValueChange={(val) => val && setEditType(val)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ACCOUNT_TYPES.map((t) => (
                        <SelectItem key={t.value} value={t.value}>
                          {t.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="flex flex-col gap-1.5 col-span-1 sm:col-span-2">
                    <Label>Saldo Actual *</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={editBalance}
                      onChange={(e) => setEditBalance(e.target.value)}
                      required
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label>Moneda</Label>
                    <Select value={editCurrency} onValueChange={(val) => val && setEditCurrency(val)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.keys(CURRENCIES).map((code) => (
                          <SelectItem key={code} value={code}>
                            {code}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label>Número / Últimos dígitos</Label>
                  <Input
                    value={editAccNum}
                    onChange={(e) => setEditAccNum(e.target.value)}
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label>Color Identificador</Label>
                  <div className="flex items-center gap-2 pt-1">
                    {COLOR_PRESETS.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setEditColor(c)}
                        className={`h-7 w-7 rounded-full transition-all ${
                          editColor === c ? "ring-2 ring-primary ring-offset-2 scale-110" : "opacity-80 hover:opacity-100"
                        }`}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label>Notas</Label>
                  <Input
                    value={editNotes}
                    onChange={(e) => setEditNotes(e.target.value)}
                  />
                </div>

                <DialogFooter className="pt-2">
                  <Button type="submit" disabled={pending} className="w-full">
                    Guardar Cambios
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          <Button
            size="icon"
            variant="ghost"
            onClick={handleDelete}
            disabled={pending}
            className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
            title="Eliminar cuenta"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="pt-2">
        <div className="flex items-baseline justify-between">
          <p className="text-2xl font-black tracking-tight font-mono text-foreground">
            {formatMoney(acc.balance, acc.currency)}
          </p>
          {acc.currency !== currency && (
            <p className="text-xs text-muted-foreground font-mono">
              ~ {formatMoney(convertCurrency(acc.balance, acc.currency, currency), currency)}
            </p>
          )}
        </div>

        {acc.notes && (
          <p className="mt-2 text-xs text-muted-foreground line-clamp-1">
            {acc.notes}
          </p>
        )}
      </CardContent>
    </Card>
  )
}

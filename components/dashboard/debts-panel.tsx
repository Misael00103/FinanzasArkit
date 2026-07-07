"use client"

import { useState, useTransition, useEffect } from "react"
import {
  createDebt,
  deleteDebt,
  registerDebtPayment,
} from "@/app/actions/debts"
import { formatMoney, CURRENCIES } from "@/lib/config"
import { remaining, totalDebt, convertCurrency, type Debt } from "@/lib/finance"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
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
import { Plus, Trash2, CreditCard, HandCoins } from "lucide-react"
import { toast } from "sonner"

export function DebtsPanel({
  debts,
  currency,
}: {
  debts: Debt[]
  currency: string
}) {
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()
  const [type, setType] = useState("deuda")
  const [debtCurrency, setDebtCurrency] = useState(currency)

  useEffect(() => {
    setDebtCurrency(currency)
  }, [currency])

  const total = totalDebt(debts, currency)
  const totalMin = debts.reduce((s, d) => s + convertCurrency(d.minimumPayment, d.currency, currency), 0)

  function handleCreate(formData: FormData) {
    const name = String(formData.get("name") || "").trim()
    if (!name) {
      toast.error("El nombre es obligatorio")
      return
    }
    startTransition(async () => {
      await createDebt({
        name,
        creditor: String(formData.get("creditor") || ""),
        type,
        totalAmount: Number(formData.get("totalAmount") || 0),
        paidAmount: Number(formData.get("paidAmount") || 0),
        interestRate: Number(formData.get("interestRate") || 0),
        minimumPayment: Number(formData.get("minimumPayment") || 0),
        dueDay: formData.get("dueDay") ? Number(formData.get("dueDay")) : null,
        currency: debtCurrency,
        notes: String(formData.get("notes") || ""),
      })
      toast.success("Deuda agregada")
      setOpen(false)
    })
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative overflow-hidden rounded-2xl border border-rose-500/20 bg-gradient-to-br from-rose-500/5 via-transparent to-transparent px-5 py-4 backdrop-blur shadow-sm">
          <div className="absolute top-0 right-0 -mt-4 -mr-4 h-24 w-24 rounded-full bg-rose-500/10 blur-xl pointer-events-none" />
          <p className="text-xs font-semibold tracking-wider uppercase text-muted-foreground">Total pendiente ({currency})</p>
          <p className="font-display text-3xl font-black tracking-tight text-rose-600 dark:text-rose-400 mt-1">
            {formatMoney(total, currency)}
          </p>
          <p className="mt-1 text-xs text-muted-foreground/80 font-medium">
            Pago mínimo mensual sumado: <span className="font-semibold text-foreground">{formatMoney(totalMin, currency)}</span>
          </p>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger render={
            <Button>
              <Plus className="mr-1.5 h-4 w-4" />
              Nueva deuda
            </Button>
          } />
          <DialogContent className="max-h-[90svh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Agregar deuda o pasivo</DialogTitle>
            </DialogHeader>
            <form action={handleCreate} className="flex flex-col gap-3">
              <div className="flex flex-col gap-2">
                <Label htmlFor="name">Nombre *</Label>
                <Input id="name" name="name" placeholder="Ej. Tarjeta de credito" required />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="creditor">Acreedor</Label>
                  <Input id="creditor" name="creditor" placeholder="Banco / persona" />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="type">Tipo</Label>
                  <Select value={type} onValueChange={(val) => setType(val || "deuda")}>
                    <SelectTrigger id="type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="deuda">Deuda</SelectItem>
                      <SelectItem value="pasivo">Pasivo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="flex flex-col gap-2 col-span-1 sm:col-span-2">
                  <Label htmlFor="totalAmount">Monto total *</Label>
                  <Input id="totalAmount" name="totalAmount" type="number" step="0.01" min="0" defaultValue="0" required />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="currency">Moneda</Label>
                  <Select value={debtCurrency} onValueChange={(val) => setDebtCurrency(val || currency)}>
                    <SelectTrigger id="currency">
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="paidAmount">Ya pagado</Label>
                  <Input id="paidAmount" name="paidAmount" type="number" step="0.01" min="0" defaultValue="0" />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="interestRate">Interés (% anual)</Label>
                  <Input id="interestRate" name="interestRate" type="number" step="0.01" min="0" defaultValue="0" />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="minimumPayment">Pago mínimo</Label>
                  <Input id="minimumPayment" name="minimumPayment" type="number" step="0.01" min="0" defaultValue="0" />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="dueDay">Día de pago (1-31)</Label>
                  <Input id="dueDay" name="dueDay" type="number" min="1" max="31" placeholder="Opcional" />
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="notes">Notas</Label>
                <Input id="notes" name="notes" placeholder="Opcional" />
              </div>
              <DialogFooter>
                <Button type="submit" disabled={pending} className="w-full">
                  Guardar deuda
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {debts.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {debts.map((d) => (
            <DebtCard key={d.id} debt={d} currency={currency} />
          ))}
        </div>
      )}
    </div>
  )
}

function DebtCard({ debt, currency }: { debt: Debt; currency: string }) {
  const [pending, startTransition] = useTransition()
  const [payOpen, setPayOpen] = useState(false)
  const rem = remaining(debt)
  const convertedRem = convertCurrency(rem, debt.currency, currency)
  const showConversion = debt.currency !== currency
  const pct =
    debt.totalAmount > 0
      ? Math.min((debt.paidAmount / debt.totalAmount) * 100, 100)
      : 0

  function handlePay(formData: FormData) {
    const amount = Number(formData.get("amount") || 0)
    if (amount <= 0) {
      toast.error("Ingresa un monto valido")
      return
    }
    startTransition(async () => {
      await registerDebtPayment(debt.id, amount)
      toast.success("Pago registrado")
      setPayOpen(false)
    })
  }

  function handleDelete() {
    startTransition(async () => {
      await deleteDebt(debt.id)
      toast.success("Deuda eliminada")
    })
  }

  const isPasivo = debt.type === "pasivo"

  return (
    <Card className={`border border-border/60 bg-card/75 border-l-4 ${isPasivo ? "border-l-orange-500/80" : "border-l-rose-500/80"} shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-0.5 backdrop-blur-md`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <CardTitle className="flex items-center gap-2 text-base">
              <CreditCard className="h-4 w-4 shrink-0 text-primary" />
              <span className="truncate">{debt.name}</span>
            </CardTitle>
            {debt.creditor && (
              <p className="mt-1 truncate text-xs text-muted-foreground">
                {debt.creditor}
              </p>
            )}
          </div>
          <div className="flex flex-col gap-1 items-end shrink-0">
            <Badge variant={debt.type === "pasivo" ? "secondary" : "outline"}>
              {debt.type}
            </Badge>
            <Badge variant="secondary" className="font-mono text-[10px]">
              {debt.currency}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <div className="flex items-end justify-between gap-2">
          <div>
            <p className="text-xs text-muted-foreground">Restante</p>
            <p className="font-mono text-xl font-bold text-destructive">
              {formatMoney(rem, debt.currency)}
            </p>
            {showConversion && (
              <p className="text-[11px] text-muted-foreground font-mono">
                ~ {formatMoney(convertedRem, currency)}
              </p>
            )}
          </div>
          <div className="text-right text-xs text-muted-foreground">
            <p>Total: {formatMoney(debt.totalAmount, debt.currency)}</p>
            {debt.interestRate > 0 && <p>Interés: {debt.interestRate}%</p>}
            {debt.dueDay && <p>Paga día {debt.dueDay}</p>}
          </div>
        </div>
        <Progress value={pct} className="h-2" />
        <div className="flex items-center gap-2">
          <Dialog open={payOpen} onOpenChange={setPayOpen}>
            <DialogTrigger render={
              <Button size="sm" variant="secondary" className="flex-1">
                <HandCoins className="mr-1.5 h-4 w-4" />
                Abonar
              </Button>
            } />
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Registrar pago de {debt.name}</DialogTitle>
              </DialogHeader>
              <form action={handlePay} className="flex flex-col gap-3">
                <div className="flex flex-col gap-2">
                  <Label htmlFor={`pay-${debt.id}`}>Monto a abonar (en {debt.currency})</Label>
                  <Input
                    id={`pay-${debt.id}`}
                    name="amount"
                    type="number"
                    step="0.01"
                    min="0"
                    defaultValue={debt.minimumPayment || ""}
                    autoFocus
                  />
                </div>
                <Button type="submit" disabled={pending}>
                  Registrar pago
                </Button>
              </form>
            </DialogContent>
          </Dialog>
          <Button
            size="sm"
            variant="ghost"
            onClick={handleDelete}
            disabled={pending}
            aria-label="Eliminar deudas"
          >
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

function EmptyState() {
  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-center gap-2 py-12 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
          <CreditCard className="h-6 w-6 text-muted-foreground" />
        </div>
        <p className="font-medium text-foreground">Sin deudas registradas</p>
        <p className="max-w-xs text-sm text-muted-foreground text-pretty">
          Agrega tus deudas y pasivos para llevar el control y recibir un plan
          de pago sugerido.
        </p>
      </CardContent>
    </Card>
  )
}

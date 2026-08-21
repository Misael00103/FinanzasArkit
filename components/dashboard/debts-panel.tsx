"use client"

import { useState, useTransition, useEffect } from "react"
import {
  createDebt,
  updateDebt,
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
import { Plus, Trash2, CreditCard, HandCoins, Edit2, ShieldAlert } from "lucide-react"
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
      toast.success("Deuda agregada con éxito")
      setOpen(false)
    })
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="relative overflow-hidden rounded-2xl border border-rose-500/20 bg-gradient-to-br from-rose-500/10 via-card to-card px-6 py-4 backdrop-blur shadow-sm flex-1 min-w-[280px]">
          <div className="absolute top-0 right-0 -mt-4 -mr-4 h-28 w-28 rounded-full bg-rose-500/10 blur-xl pointer-events-none" />
          <p className="text-xs font-bold tracking-wider uppercase text-muted-foreground">Total pendiente ({currency})</p>
          <p className="font-display text-3xl font-black tracking-tight text-rose-600 dark:text-rose-400 mt-1">
            {formatMoney(total, currency)}
          </p>
          <p className="mt-1 text-xs text-muted-foreground font-medium">
            Pago mínimo mensual sumado: <span className="font-semibold text-foreground">{formatMoney(totalMin, currency)}</span>
          </p>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger render={
            <Button className="gap-2 px-5 shadow-sm">
              <Plus className="h-4 w-4" />
              Nueva Deuda / Pasivo
            </Button>
          } />
          <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-lg">
                <CreditCard className="h-5 w-5 text-rose-500" />
                Agregar Deuda o Pasivo
              </DialogTitle>
            </DialogHeader>
            <form action={handleCreate} className="flex flex-col gap-4 pt-2">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="name">Nombre / Concepto *</Label>
                <Input id="name" name="name" placeholder="Ej. Tarjeta de crédito, Préstamo vehículo" required />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="creditor">Acreedor / Entidad</Label>
                  <Input id="creditor" name="creditor" placeholder="Banco, financiera o persona" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="type">Tipo</Label>
                  <Select value={type} onValueChange={(val) => val && setType(val)}>
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
                <div className="flex flex-col gap-1.5 col-span-1 sm:col-span-2">
                  <Label htmlFor="totalAmount">Monto Total *</Label>
                  <Input id="totalAmount" name="totalAmount" type="number" step="0.01" min="0" defaultValue="0" required />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="currency">Moneda</Label>
                  <Select value={debtCurrency} onValueChange={(val) => val && setDebtCurrency(val)}>
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
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="paidAmount">Ya Pagado</Label>
                  <Input id="paidAmount" name="paidAmount" type="number" step="0.01" min="0" defaultValue="0" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="interestRate">Tasa de Interés (% Anual)</Label>
                  <Input id="interestRate" name="interestRate" type="number" step="0.01" min="0" defaultValue="0" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="minimumPayment">Pago Mínimo Mensual</Label>
                  <Input id="minimumPayment" name="minimumPayment" type="number" step="0.01" min="0" defaultValue="0" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="dueDay">Día de Pago del Mes (1-31)</Label>
                  <Input id="dueDay" name="dueDay" type="number" min="1" max="31" placeholder="Ej. 15" />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="notes">Notas adicionales</Label>
                <Input id="notes" name="notes" placeholder="Detalles u observaciones" />
              </div>

              <DialogFooter className="pt-2">
                <Button type="submit" disabled={pending} className="w-full">
                  Guardar Deuda
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {debts.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
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
  const [editOpen, setEditOpen] = useState(false)

  // Edit form state
  const [editName, setEditName] = useState(debt.name)
  const [editCreditor, setEditCreditor] = useState(debt.creditor || "")
  const [editType, setEditType] = useState(debt.type || "deuda")
  const [editTotalAmount, setEditTotalAmount] = useState(debt.totalAmount.toString())
  const [editPaidAmount, setEditPaidAmount] = useState(debt.paidAmount.toString())
  const [editInterestRate, setEditInterestRate] = useState(debt.interestRate.toString())
  const [editMinimumPayment, setEditMinimumPayment] = useState(debt.minimumPayment.toString())
  const [editDueDay, setEditDueDay] = useState(debt.dueDay ? debt.dueDay.toString() : "")
  const [editCurrency, setEditCurrency] = useState(debt.currency || "DOP")
  const [editNotes, setEditNotes] = useState(debt.notes || "")

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
      toast.error("Ingresa un monto válido")
      return
    }
    startTransition(async () => {
      await registerDebtPayment(debt.id, amount)
      toast.success("Abono registrado con éxito")
      setPayOpen(false)
    })
  }

  function handleEdit(e: React.FormEvent) {
    e.preventDefault()
    if (!editName.trim()) {
      toast.error("El nombre es obligatorio")
      return
    }
    startTransition(async () => {
      await updateDebt(debt.id, {
        name: editName.trim(),
        creditor: editCreditor.trim(),
        type: editType,
        totalAmount: Number(editTotalAmount) || 0,
        paidAmount: Number(editPaidAmount) || 0,
        interestRate: Number(editInterestRate) || 0,
        minimumPayment: Number(editMinimumPayment) || 0,
        dueDay: editDueDay ? Number(editDueDay) : null,
        currency: editCurrency,
        notes: editNotes.trim(),
      })
      toast.success("Deuda actualizada")
      setEditOpen(false)
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
    <Card className={`relative overflow-hidden border border-border/60 bg-card/80 border-l-4 ${isPasivo ? "border-l-orange-500" : "border-l-rose-500"} shadow-sm hover:shadow-md transition-all duration-300 backdrop-blur-md`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <CardTitle className="flex items-center gap-2 text-base font-bold">
              <CreditCard className={`h-4 w-4 shrink-0 ${isPasivo ? "text-orange-500" : "text-rose-500"}`} />
              <span className="truncate">{debt.name}</span>
            </CardTitle>
            {debt.creditor && (
              <p className="mt-0.5 truncate text-xs text-muted-foreground font-medium">
                Acreedor: {debt.creditor}
              </p>
            )}
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <Badge variant={isPasivo ? "secondary" : "outline"} className="text-[10px] uppercase font-bold tracking-wider">
              {debt.type}
            </Badge>
            <Badge variant="secondary" className="font-mono text-[10px]">
              {debt.currency}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex flex-col gap-3">
        <div className="flex items-end justify-between gap-2 bg-secondary/30 p-3 rounded-xl border border-border/40">
          <div>
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Monto Restante</p>
            <p className="font-mono text-xl font-bold text-destructive">
              {formatMoney(rem, debt.currency)}
            </p>
            {showConversion && (
              <p className="text-[11px] text-muted-foreground font-mono">
                ~ {formatMoney(convertedRem, currency)}
              </p>
            )}
          </div>
          <div className="text-right text-xs text-muted-foreground space-y-0.5">
            <p className="font-medium">Total: <span className="font-bold text-foreground">{formatMoney(debt.totalAmount, debt.currency)}</span></p>
            {debt.interestRate > 0 && <p className="text-amber-600 dark:text-amber-400 font-semibold">Interés: {debt.interestRate}%</p>}
            {debt.dueDay && <p className="text-indigo-500 font-semibold">Pago día {debt.dueDay}</p>}
          </div>
        </div>

        <div className="space-y-1">
          <div className="flex justify-between text-xs font-semibold text-muted-foreground">
            <span>Progreso de Pago</span>
            <span>{pct.toFixed(0)}%</span>
          </div>
          <Progress value={pct} className="h-2" />
        </div>

        {/* Action Buttons: Abonar, Editar, Eliminar */}
        <div className="flex items-center gap-2 pt-1">
          {/* Abonar Modal */}
          <Dialog open={payOpen} onOpenChange={setPayOpen}>
            <DialogTrigger render={
              <Button size="sm" variant="secondary" className="flex-1 gap-1.5 font-medium">
                <HandCoins className="h-4 w-4 text-emerald-500" />
                Abonar
              </Button>
            } />
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Registrar Pago a {debt.name}</DialogTitle>
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
                    required
                  />
                </div>
                <Button type="submit" disabled={pending} className="w-full">
                  Confirmar Abonar
                </Button>
              </form>
            </DialogContent>
          </Dialog>

          {/* EDIT DEBT MODAL */}
          <Dialog open={editOpen} onOpenChange={setEditOpen}>
            <DialogTrigger render={
              <Button size="sm" variant="outline" className="gap-1 text-xs">
                <Edit2 className="h-3.5 w-3.5" />
                Editar
              </Button>
            } />
            <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-lg">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-lg">
                  <Edit2 className="h-5 w-5 text-primary" />
                  Editar Deuda: {debt.name}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleEdit} className="flex flex-col gap-3 pt-2">
                <div className="flex flex-col gap-1.5">
                  <Label>Nombre / Concepto *</Label>
                  <Input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <Label>Acreedor</Label>
                    <Input
                      value={editCreditor}
                      onChange={(e) => setEditCreditor(e.target.value)}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label>Tipo</Label>
                    <Select value={editType} onValueChange={(val) => val && setEditType(val)}>
                      <SelectTrigger>
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
                  <div className="flex flex-col gap-1.5 col-span-1 sm:col-span-2">
                    <Label>Monto Total *</Label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={editTotalAmount}
                      onChange={(e) => setEditTotalAmount(e.target.value)}
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

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <Label>Ya Pagado</Label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={editPaidAmount}
                      onChange={(e) => setEditPaidAmount(e.target.value)}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label>Interés (% anual)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={editInterestRate}
                      onChange={(e) => setEditInterestRate(e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <Label>Pago Mínimo</Label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={editMinimumPayment}
                      onChange={(e) => setEditMinimumPayment(e.target.value)}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label>Día de Pago (1-31)</Label>
                    <Input
                      type="number"
                      min="1"
                      max="31"
                      value={editDueDay}
                      onChange={(e) => setEditDueDay(e.target.value)}
                    />
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

          {/* Delete Button */}
          <Button
            size="sm"
            variant="ghost"
            onClick={handleDelete}
            disabled={pending}
            aria-label="Eliminar deuda"
            className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
            title="Eliminar Deuda"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

function EmptyState() {
  return (
    <Card className="border-dashed bg-card/40">
      <CardContent className="flex flex-col items-center gap-2 py-12 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary/80">
          <CreditCard className="h-6 w-6 text-muted-foreground" />
        </div>
        <p className="font-semibold text-foreground">Sin deudas registradas</p>
        <p className="max-w-xs text-xs text-muted-foreground text-pretty">
          Agrega tus deudas y pasivos para llevar el control y recibir un plan
          de pago sugerido.
        </p>
      </CardContent>
    </Card>
  )
}

"use client"

import { useState, useTransition, useEffect } from "react"
import {
  createRecurring,
  updateRecurring,
  deleteRecurring,
  toggleRecurring,
} from "@/app/actions/recurring"
import { formatMoney, CURRENCIES } from "@/lib/config"
import { toMonthly, convertCurrency, type Recurring } from "@/lib/finance"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
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
  Plus,
  Trash2,
  CalendarClock,
  ArrowUpRight,
  ArrowDownRight,
  Edit2,
} from "lucide-react"
import { toast } from "sonner"

const FREQUENCIES = [
  { value: "semanal", label: "Semanal" },
  { value: "quincenal", label: "Quincenal" },
  { value: "mensual", label: "Mensual" },
  { value: "anual", label: "Anual" },
]

export function RecurringPanel({
  recurring,
  currency,
}: {
  recurring: Recurring[]
  currency: string
}) {
  const [open, setOpen] = useState(false)
  const [direction, setDirection] = useState<"income" | "expense">("expense")
  const [pending, startTransition] = useTransition()
  const [frequency, setFrequency] = useState("mensual")
  const [recCurrency, setRecCurrency] = useState(currency)

  useEffect(() => {
    setRecCurrency(currency)
  }, [currency])

  const active = recurring.filter((r) => r.active)
  const fixedIncome = active
    .filter((r) => r.direction === "income")
    .reduce((s, r) => s + convertCurrency(toMonthly(r.amount, r.frequency), r.currency, currency), 0)
  const fixedExpense = active
    .filter((r) => r.direction === "expense")
    .reduce((s, r) => s + convertCurrency(toMonthly(r.amount, r.frequency), r.currency, currency), 0)

  function handleCreate(formData: FormData) {
    const description = String(formData.get("description") || "").trim()
    const amount = Number(formData.get("amount") || 0)
    if (!description || amount <= 0) {
      toast.error("Completa la descripción y un monto válido")
      return
    }
    startTransition(async () => {
      await createRecurring({
        direction,
        description,
        category: String(formData.get("category") || "general"),
        amount,
        currency: recCurrency,
        frequency,
        dayOfMonth: formData.get("dayOfMonth")
          ? Number(formData.get("dayOfMonth"))
          : null,
      })
      toast.success("Programación fija creada")
      setOpen(false)
      setDirection("expense")
    })
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="relative overflow-hidden rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 via-card to-card px-5 py-4 backdrop-blur shadow-sm">
          <p className="text-xs font-bold uppercase text-muted-foreground tracking-wider">Entradas Fijas (Mensual aprox.)</p>
          <p className="font-display text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
            {formatMoney(fixedIncome, currency)}
          </p>
        </div>
        <div className="relative overflow-hidden rounded-2xl border border-rose-500/20 bg-gradient-to-br from-rose-500/10 via-card to-card px-5 py-4 backdrop-blur shadow-sm">
          <p className="text-xs font-bold uppercase text-muted-foreground tracking-wider">Gastos Fijos (Mensual aprox.)</p>
          <p className="font-display text-2xl font-black text-rose-600 dark:text-rose-400 mt-1">
            {formatMoney(fixedExpense, currency)}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3">
        <h3 className="font-display font-bold text-lg text-foreground flex items-center gap-2">
          Gastos e Ingresos Fijos
          <Badge variant="secondary" className="font-mono text-xs">
            {recurring.length}
          </Badge>
        </h3>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger render={
            <Button className="gap-2 shadow-sm">
              <Plus className="h-4 w-4" />
              Nuevo Fijo
            </Button>
          } />
          <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-lg font-bold">Programar Gasto o Ingreso Fijo</DialogTitle>
            </DialogHeader>
            <form action={handleCreate} className="flex flex-col gap-4 pt-2">
              <div className="flex flex-col gap-1.5">
                <Label>Tipo de Movimiento</Label>
                <Select
                  value={direction}
                  onValueChange={(val) => val && setDirection(val as "income" | "expense")}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="expense">Gasto Fijo (Salida)</SelectItem>
                    <SelectItem value="income">Ingreso Fijo (Entrada)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="description">Descripción / Servicio *</Label>
                <Input
                  id="description"
                  name="description"
                  placeholder="Ej. Alquiler, Salario, Internet, Netflix"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="flex flex-col gap-1.5 col-span-1 sm:col-span-2">
                  <Label htmlFor="amount">Monto *</Label>
                  <Input id="amount" name="amount" type="number" step="0.01" min="0" required />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="currency">Moneda</Label>
                  <Select value={recCurrency} onValueChange={(val) => val && setRecCurrency(val)}>
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
                  <Label>Frecuencia</Label>
                  <Select value={frequency} onValueChange={(val) => val && setFrequency(val)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {FREQUENCIES.map((f) => (
                        <SelectItem key={f.value} value={f.value}>
                          {f.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="dayOfMonth">Día del Mes (1-31)</Label>
                  <Input id="dayOfMonth" name="dayOfMonth" type="number" min="1" max="31" placeholder="Ej. 1" />
                </div>
              </div>

              <DialogFooter className="pt-2">
                <Button type="submit" disabled={pending} className="w-full">
                  Guardar Fijo
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {recurring.length === 0 ? (
        <Card className="border-dashed bg-card/40">
          <CardContent className="flex flex-col items-center gap-2 py-12 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary">
              <CalendarClock className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="font-semibold text-foreground">Sin montos fijos programados</p>
            <p className="max-w-xs text-xs text-muted-foreground text-pretty">
              Agrega pagos de servicios, suscripciones o tu salario fijo para automatizar el cálculo mensual.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {recurring.map((r) => (
            <RecurringCard key={r.id} recurring={r} currency={currency} />
          ))}
        </div>
      )}
    </div>
  )
}

function RecurringCard({ recurring, currency }: { recurring: Recurring; currency: string }) {
  const [pending, startTransition] = useTransition()
  const [editOpen, setEditOpen] = useState(false)

  // Edit State
  const [editDescription, setEditDescription] = useState(recurring.description)
  const [editAmount, setEditAmount] = useState(recurring.amount.toString())
  const [editDirection, setEditDirection] = useState<"income" | "expense">(
    recurring.direction as "income" | "expense"
  )
  const [editFrequency, setEditFrequency] = useState(recurring.frequency || "mensual")
  const [editCurrency, setEditCurrency] = useState(recurring.currency || "DOP")
  const [editDayOfMonth, setEditDayOfMonth] = useState(
    recurring.dayOfMonth ? recurring.dayOfMonth.toString() : ""
  )

  const isIncome = recurring.direction === "income"
  const monthly = toMonthly(recurring.amount, recurring.frequency)

  function handleToggle(checked: boolean) {
    startTransition(async () => {
      await toggleRecurring(recurring.id, checked)
      toast.success(checked ? "Activado" : "Desactivado")
    })
  }

  function handleEdit(e: React.FormEvent) {
    e.preventDefault()
    if (!editDescription.trim()) {
      toast.error("La descripción es obligatoria")
      return
    }
    startTransition(async () => {
      await updateRecurring(recurring.id, {
        description: editDescription.trim(),
        amount: Number(editAmount) || 0,
        direction: editDirection,
        frequency: editFrequency,
        currency: editCurrency,
        dayOfMonth: editDayOfMonth ? Number(editDayOfMonth) : null,
      })
      toast.success("Programación actualizada")
      setEditOpen(false)
    })
  }

  function handleDelete() {
    startTransition(async () => {
      await deleteRecurring(recurring.id)
      toast.success("Programación eliminada")
    })
  }

  return (
    <Card
      className={`border border-border/60 bg-card/80 border-l-4 ${
        isIncome ? "border-l-emerald-500" : "border-l-rose-500"
      } ${!recurring.active ? "opacity-60" : ""} shadow-sm hover:shadow-md transition-all duration-300 backdrop-blur-md`}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <CardTitle className="flex items-center gap-2 text-base font-bold">
              {isIncome ? (
                <ArrowUpRight className="h-4 w-4 shrink-0 text-emerald-500" />
              ) : (
                <ArrowDownRight className="h-4 w-4 shrink-0 text-rose-500" />
              )}
              <span className="truncate">{recurring.description}</span>
            </CardTitle>
            <p className="mt-0.5 text-xs text-muted-foreground capitalize font-medium">
              {recurring.frequency} {recurring.dayOfMonth ? `· Día ${recurring.dayOfMonth}` : ""}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Badge variant="secondary" className="font-mono text-[10px]">
              {recurring.currency}
            </Badge>
            <Switch
              checked={recurring.active}
              onCheckedChange={handleToggle}
              disabled={pending}
              aria-label="Activar/desactivar fijo"
            />
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex flex-col gap-3">
        <div className="flex items-end justify-between gap-2 bg-secondary/30 p-3 rounded-xl border border-border/40">
          <div>
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Monto por Período</p>
            <p
              className={`font-mono text-lg font-bold ${
                isIncome ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
              }`}
            >
              {isIncome ? "+" : "-"}
              {formatMoney(recurring.amount, recurring.currency)}
            </p>
          </div>
          <div className="text-right text-xs text-muted-foreground">
            <p className="font-medium">Mensual equiv.</p>
            <p className="font-mono font-bold text-foreground">
              {formatMoney(monthly, recurring.currency)}
            </p>
          </div>
        </div>

        {/* Card Actions: Editar, Eliminar */}
        <div className="flex items-center justify-end gap-2 pt-1">
          {/* EDIT RECURRING MODAL */}
          <Dialog open={editOpen} onOpenChange={setEditOpen}>
            <DialogTrigger render={
              <Button size="sm" variant="outline" className="gap-1 text-xs">
                <Edit2 className="h-3.5 w-3.5" />
                Editar
              </Button>
            } />
            <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-lg font-bold">
                  <Edit2 className="h-5 w-5 text-primary" />
                  Editar Programación Fija
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleEdit} className="flex flex-col gap-4 pt-2">
                <div className="flex flex-col gap-1.5">
                  <Label>Tipo de Movimiento</Label>
                  <Select
                    value={editDirection}
                    onValueChange={(val) => val && setEditDirection(val as "income" | "expense")}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="expense">Gasto Fijo (Salida)</SelectItem>
                      <SelectItem value="income">Ingreso Fijo (Entrada)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label>Descripción *</Label>
                  <Input
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="flex flex-col gap-1.5 col-span-1 sm:col-span-2">
                    <Label>Monto *</Label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={editAmount}
                      onChange={(e) => setEditAmount(e.target.value)}
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
                    <Label>Frecuencia</Label>
                    <Select value={editFrequency} onValueChange={(val) => val && setEditFrequency(val)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {FREQUENCIES.map((f) => (
                          <SelectItem key={f.value} value={f.value}>
                            {f.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label>Día del Mes (1-31)</Label>
                    <Input
                      type="number"
                      min="1"
                      max="31"
                      value={editDayOfMonth}
                      onChange={(e) => setEditDayOfMonth(e.target.value)}
                    />
                  </div>
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
            aria-label="Eliminar fijo"
            className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
            title="Eliminar Fijo"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

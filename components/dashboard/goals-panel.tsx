"use client"

import { useState, useTransition, useEffect } from "react"
import { createGoal, updateGoal, deleteGoal, addToGoal } from "@/app/actions/goals"
import { formatMoney, CURRENCIES } from "@/lib/config"
import { convertCurrency, type Goal } from "@/lib/finance"
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
import { Plus, Trash2, Target, PiggyBank, Edit2, Calendar } from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"

function monthsUntil(date: string | null) {
  if (!date) return null
  const target = new Date(date)
  const now = new Date()
  const months =
    (target.getFullYear() - now.getFullYear()) * 12 +
    (target.getMonth() - now.getMonth())
  return months > 0 ? months : null
}

export function GoalsPanel({
  goals,
  currency,
}: {
  goals: Goal[]
  currency: string
}) {
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()
  const [goalCurrency, setGoalCurrency] = useState(currency)

  useEffect(() => {
    setGoalCurrency(currency)
  }, [currency])

  function handleCreate(formData: FormData) {
    const name = String(formData.get("name") || "").trim()
    const targetAmount = Number(formData.get("targetAmount") || 0)
    if (!name || targetAmount <= 0) {
      toast.error("Ingresa nombre y precio de la meta")
      return
    }
    startTransition(async () => {
      await createGoal({
        name,
        targetAmount,
        savedAmount: Number(formData.get("savedAmount") || 0),
        currency: goalCurrency,
        targetDate: String(formData.get("targetDate") || "") || null,
        notes: String(formData.get("notes") || ""),
      })
      toast.success("Meta creada exitosamente")
      setOpen(false)
    })
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-foreground">Metas de Ahorro y Futuro</h3>
          <p className="text-xs text-muted-foreground">
            Define tus metas a futuro y calcula automáticamente el ahorro mensual requerido.
          </p>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger render={
            <Button className="gap-2 px-4 shadow-sm">
              <Plus className="h-4 w-4" />
              Nueva Meta
            </Button>
          } />
          <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-lg">
                <Target className="h-5 w-5 text-emerald-500" />
                Crear Meta a Futuro
              </DialogTitle>
            </DialogHeader>
            <form action={handleCreate} className="flex flex-col gap-4 pt-2">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="name">Nombre de la meta *</Label>
                <Input id="name" name="name" placeholder="Ej. Fondo de emergencia, Viaje, Vehículo" required />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="flex flex-col gap-1.5 col-span-1 sm:col-span-2">
                  <Label htmlFor="targetAmount">Monto Objetivo *</Label>
                  <Input id="targetAmount" name="targetAmount" type="number" step="0.01" min="0" required />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="currency">Moneda</Label>
                  <Select value={goalCurrency} onValueChange={(val) => val && setGoalCurrency(val)}>
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
              <div className="grid grid-cols-1 gap-3">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="savedAmount">Monto Ya Ahorrado</Label>
                  <Input id="savedAmount" name="savedAmount" type="number" step="0.01" min="0" defaultValue="0" />
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="targetDate">Fecha Objetivo (Opcional)</Label>
                <Input id="targetDate" name="targetDate" type="date" />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="notes">Notas adicionales</Label>
                <Input id="notes" name="notes" placeholder="Detalles de la meta" />
              </div>
              <DialogFooter className="pt-2">
                <Button type="submit" disabled={pending} className="w-full">
                  Guardar Meta
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {goals.length === 0 ? (
        <Card className="border-dashed bg-card/40">
          <CardContent className="flex flex-col items-center gap-2 py-12 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary/80">
              <Target className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="font-semibold text-foreground">Sin metas registradas</p>
            <p className="max-w-xs text-xs text-muted-foreground text-pretty">
              Define tus metas a futuro con su precio y fecha. El sistema te dirá cuánto ahorrar cada mes.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {goals.map((g) => (
            <GoalCard key={g.id} goal={g} currency={currency} />
          ))}
        </div>
      )}
    </div>
  )
}

function GoalCard({ goal, currency }: { goal: Goal; currency: string }) {
  const [pending, startTransition] = useTransition()
  const [addOpen, setAddOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)

  // Edit Goal state
  const [editName, setEditName] = useState(goal.name)
  const [editTargetAmount, setEditTargetAmount] = useState(goal.targetAmount.toString())
  const [editSavedAmount, setEditSavedAmount] = useState(goal.savedAmount.toString())
  const [editCurrency, setEditCurrency] = useState(goal.currency || "DOP")
  const [editTargetDate, setEditTargetDate] = useState(goal.targetDate || "")
  const [editNotes, setEditNotes] = useState(goal.notes || "")

  const pct =
    goal.targetAmount > 0
      ? Math.min((goal.savedAmount / goal.targetAmount) * 100, 100)
      : 0
  const rem = Math.max(goal.targetAmount - goal.savedAmount, 0)
  const convertedRem = convertCurrency(rem, goal.currency, currency)
  const months = monthsUntil(goal.targetDate)
  const perMonth = months ? rem / months : null
  const convertedPerMonth = perMonth ? convertCurrency(perMonth, goal.currency, currency) : null
  const showConversion = goal.currency !== currency

  function handleAdd(formData: FormData) {
    const amount = Number(formData.get("amount") || 0)
    if (amount <= 0) {
      toast.error("Ingresa un monto válido")
      return
    }
    startTransition(async () => {
      await addToGoal(goal.id, amount)
      toast.success("Ahorro registrado")
      setAddOpen(false)
    })
  }

  function handleEdit(e: React.FormEvent) {
    e.preventDefault()
    if (!editName.trim()) {
      toast.error("El nombre es obligatorio")
      return
    }
    startTransition(async () => {
      await updateGoal(goal.id, {
        name: editName.trim(),
        targetAmount: Number(editTargetAmount) || 0,
        savedAmount: Number(editSavedAmount) || 0,
        currency: editCurrency,
        targetDate: editTargetDate || null,
        notes: editNotes.trim(),
      })
      toast.success("Meta actualizada")
      setEditOpen(false)
    })
  }

  function handleDelete() {
    startTransition(async () => {
      await deleteGoal(goal.id)
      toast.success("Meta eliminada")
    })
  }

  return (
    <Card className="relative overflow-hidden border border-border/60 bg-card/80 border-l-4 border-l-emerald-500 shadow-sm hover:shadow-md transition-all duration-300 backdrop-blur-md">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="flex items-center gap-2 text-base font-bold min-w-0">
            <Target className="h-4 w-4 shrink-0 text-emerald-500" />
            <span className="truncate">{goal.name}</span>
          </CardTitle>
          <div className="flex items-center gap-1.5 shrink-0">
            <Badge variant="secondary" className="font-mono text-[10px]">
              {goal.currency}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex flex-col gap-3">
        <div className="flex items-end justify-between gap-2 bg-secondary/30 p-3 rounded-xl border border-border/40">
          <div>
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Ahorrado Actualmente</p>
            <p className="font-mono text-xl font-bold text-emerald-600 dark:text-emerald-400">
              {formatMoney(goal.savedAmount, goal.currency)}
            </p>
            {showConversion && (
              <p className="text-[10px] text-muted-foreground font-mono">
                ~ {formatMoney(convertCurrency(goal.savedAmount, goal.currency, currency), currency)}
              </p>
            )}
          </div>
          <div className="text-right text-xs text-muted-foreground">
            <p className="font-medium">Meta: <span className="font-bold text-foreground">{formatMoney(goal.targetAmount, goal.currency)}</span></p>
            {showConversion && (
              <p className="text-[10px] font-mono text-muted-foreground">
                ~ {formatMoney(convertCurrency(goal.targetAmount, goal.currency, currency), currency)}
              </p>
            )}
          </div>
        </div>

        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground">
            <span>
              Faltan {formatMoney(rem, goal.currency)}
              {showConversion && ` (~ ${formatMoney(convertedRem, currency)})`}
            </span>
            <span className="text-emerald-600 dark:text-emerald-400 font-bold">{pct.toFixed(0)}%</span>
          </div>
          <Progress value={pct} className="h-2" />
        </div>

        {perMonth !== null && (
          <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 px-3 py-2 text-xs text-emerald-700 dark:text-emerald-400 leading-relaxed font-medium flex items-start gap-1.5">
            <span className="shrink-0">💡</span>
            <div>
              Ahorro mensual sugerido: <span className="font-bold">{formatMoney(perMonth, goal.currency)}</span>
              {showConversion && ` (~ ${formatMoney(convertedPerMonth || 0, currency)}/mes)`} para lograrlo en {months} mes(es).
            </div>
          </div>
        )}

        {/* Card Actions: Agregar Ahorro, Editar, Eliminar */}
        <div className="flex items-center gap-2 pt-1">
          {/* Add Savings Modal */}
          <Dialog open={addOpen} onOpenChange={setAddOpen}>
            <DialogTrigger render={
              <Button size="sm" variant="secondary" className="flex-1 gap-1.5 font-medium">
                <PiggyBank className="h-4 w-4 text-emerald-500" />
                Abonar Ahorro
              </Button>
            } />
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Agregar Ahorro a {goal.name}</DialogTitle>
              </DialogHeader>
              <form action={handleAdd} className="flex flex-col gap-3">
                <div className="flex flex-col gap-2">
                  <Label htmlFor={`add-${goal.id}`}>Monto a depositar (en {goal.currency})</Label>
                  <Input
                    id={`add-${goal.id}`}
                    name="amount"
                    type="number"
                    step="0.01"
                    min="0"
                    autoFocus
                    required
                  />
                </div>
                <Button type="submit" disabled={pending} className="w-full">
                  Confirmar Depósito
                </Button>
              </form>
            </DialogContent>
          </Dialog>

          {/* EDIT GOAL MODAL */}
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
                  Editar Meta: {goal.name}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleEdit} className="flex flex-col gap-3 pt-2">
                <div className="flex flex-col gap-1.5">
                  <Label>Nombre de la Meta *</Label>
                  <Input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="flex flex-col gap-1.5 col-span-1 sm:col-span-2">
                    <Label>Monto Objetivo *</Label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={editTargetAmount}
                      onChange={(e) => setEditTargetAmount(e.target.value)}
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
                    <Label>Monto Ya Ahorrado</Label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={editSavedAmount}
                      onChange={(e) => setEditSavedAmount(e.target.value)}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label>Fecha Objetivo</Label>
                    <Input
                      type="date"
                      value={editTargetDate}
                      onChange={(e) => setEditTargetDate(e.target.value)}
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

          {/* Delete Goal Button */}
          <Button
            size="sm"
            variant="ghost"
            onClick={handleDelete}
            disabled={pending}
            aria-label="Eliminar meta"
            className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
            title="Eliminar Meta"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

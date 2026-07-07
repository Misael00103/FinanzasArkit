"use client"

import { useState, useTransition, useEffect } from "react"
import { createGoal, deleteGoal, addToGoal } from "@/app/actions/goals"
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
import { Plus, Trash2, Target, PiggyBank } from "lucide-react"
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
      toast.success("Meta creada")
      setOpen(false)
    })
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          Tus metas a futuro y su precio
        </p>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger render={
            <Button>
              <Plus className="mr-1.5 h-4 w-4" />
              Nueva meta
            </Button>
          } />
          <DialogContent className="max-h-[90svh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Crear meta a futuro</DialogTitle>
            </DialogHeader>
            <form action={handleCreate} className="flex flex-col gap-3">
              <div className="flex flex-col gap-2">
                <Label htmlFor="name">Nombre de la meta *</Label>
                <Input id="name" name="name" placeholder="Ej. Carro, viaje, fondo de emergencia" required />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="flex flex-col gap-2 col-span-1 sm:col-span-2">
                  <Label htmlFor="targetAmount">Precio / objetivo *</Label>
                  <Input id="targetAmount" name="targetAmount" type="number" step="0.01" min="0" required />
                </div>
                <div className="flex flex-col gap-2">
                   <Label htmlFor="currency">Moneda</Label>
                  <Select value={goalCurrency} onValueChange={(val) => setGoalCurrency(val || currency)}>
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
                <div className="flex flex-col gap-2">
                  <Label htmlFor="savedAmount">Ya ahorrado (en la moneda seleccionada)</Label>
                  <Input id="savedAmount" name="savedAmount" type="number" step="0.01" min="0" defaultValue="0" />
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="targetDate">Fecha objetivo</Label>
                <Input id="targetDate" name="targetDate" type="date" />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="notes">Notas</Label>
                <Input id="notes" name="notes" placeholder="Opcional" />
              </div>
              <DialogFooter>
                <Button type="submit" disabled={pending} className="w-full">
                  Guardar meta
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {goals.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center gap-2 py-12 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
              <Target className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="font-medium text-foreground">Sin metas aun</p>
            <p className="max-w-xs text-sm text-muted-foreground text-pretty">
              Define tus metas a futuro con su precio y fecha. El sistema te dira
              cuanto ahorrar cada mes.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
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
  const [open, setOpen] = useState(false)
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
      toast.error("Ingresa un monto valido")
      return
    }
    startTransition(async () => {
      await addToGoal(goal.id, amount)
      toast.success("Ahorro agregado")
      setOpen(false)
    })
  }

  function handleDelete() {
    startTransition(async () => {
      await deleteGoal(goal.id)
      toast.success("Meta eliminada")
    })
  }

  return (
    <Card className="border border-border/60 bg-card/75 border-l-4 border-l-emerald-500/80 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-0.5 backdrop-blur-md">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="flex items-center gap-2 text-base min-w-0">
            <Target className="h-4 w-4 shrink-0 text-emerald-500" />
            <span className="truncate">{goal.name}</span>
          </CardTitle>
          <div className="flex items-center gap-1.5 shrink-0">
            <Badge variant="secondary" className="font-mono text-[9px] scale-90">
              {goal.currency}
            </Badge>
            <Button
              size="icon"
              variant="ghost"
              onClick={handleDelete}
              disabled={pending}
              aria-label="Eliminar meta"
              className="h-7 w-7"
            >
              <Trash2 className="h-4 w-4 text-muted-foreground" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <div className="flex items-end justify-between gap-2">
          <div>
            <p className="text-xs text-muted-foreground">Ahorrado</p>
            <p className="font-mono text-lg font-bold text-emerald-600 dark:text-emerald-400">
              {formatMoney(goal.savedAmount, goal.currency)}
            </p>
            {showConversion && (
              <p className="text-[10px] text-muted-foreground font-mono">
                ~ {formatMoney(convertCurrency(goal.savedAmount, goal.currency, currency), currency)}
              </p>
            )}
          </div>
          <div className="text-right text-xs text-muted-foreground">
            <p>Meta: {formatMoney(goal.targetAmount, goal.currency)}</p>
            {showConversion && (
              <p className="text-[10px] font-mono text-muted-foreground">
                ~ {formatMoney(convertCurrency(goal.targetAmount, goal.currency, currency), currency)}
              </p>
            )}
          </div>
        </div>
        <Progress value={pct} className="h-2" />
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>
            Faltan {formatMoney(rem, goal.currency)}
            {showConversion && ` (~ ${formatMoney(convertedRem, currency)})`}
          </span>
          <span>{pct.toFixed(0)}%</span>
        </div>
        {perMonth !== null && (
          <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 px-3 py-2 text-xs text-emerald-700 dark:text-emerald-400 leading-relaxed font-medium">
            💡 Ahorro mensual sugerido: <span className="font-bold">{formatMoney(perMonth, goal.currency)}</span>
            {showConversion && ` (~ ${formatMoney(convertedPerMonth || 0, currency)}/mes)`} para lograrlo en {months} mes(es).
          </div>
        )}
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger render={
            <Button size="sm" variant="secondary" className="w-full">
              <PiggyBank className="mr-1.5 h-4 w-4" />
              Agregar ahorro
            </Button>
          } />
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Agregar ahorro a {goal.name}</DialogTitle>
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
                />
              </div>
              <Button type="submit" disabled={pending}>
                Guardar
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  )
}

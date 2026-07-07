"use client"

import { useState, useTransition, useEffect } from "react"
import {
  createRecurring,
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
      toast.error("Completa la descripcion y un monto valido")
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
      toast.success("Programacion creada")
      setOpen(false)
      setDirection("expense")
    })
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-2 gap-3">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Entradas fijas / mes (en {currency})</p>
            <p className="mt-0.5 font-mono text-xl font-bold text-primary">
              {formatMoney(fixedIncome, currency)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Salidas fijas / mes (en {currency})</p>
            <p className="mt-0.5 font-mono text-xl font-bold text-destructive">
              {formatMoney(fixedExpense, currency)}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          Programa tus entradas y salidas fijas
        </p>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger render={
            <Button>
              <Plus className="mr-1.5 h-4 w-4" />
              Programar
            </Button>
          } />
          <DialogContent className="max-h-[90svh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Programar entrada o salida fija</DialogTitle>
            </DialogHeader>
            <form action={handleCreate} className="flex flex-col gap-3">
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={direction === "income" ? "default" : "outline"}
                  className="flex-1"
                  onClick={() => setDirection("income")}
                >
                  <ArrowUpRight className="mr-1.5 h-4 w-4" />
                  Entrada
                </Button>
                <Button
                  type="button"
                  variant={direction === "expense" ? "default" : "outline"}
                  className="flex-1"
                  onClick={() => setDirection("expense")}
                >
                  <ArrowDownRight className="mr-1.5 h-4 w-4" />
                  Salida
                </Button>
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="description">Descripcion *</Label>
                <Input id="description" name="description" placeholder="Ej. Renta, salario, Netflix..." required />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="flex flex-col gap-2 col-span-2">
                  <Label htmlFor="amount">Monto *</Label>
                  <Input id="amount" name="amount" type="number" step="0.01" min="0" required />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="currency">Moneda</Label>
                  <Select value={recCurrency} onValueChange={(val) => setRecCurrency(val || currency)}>
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
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="frequency">Frecuencia</Label>
                  <Select value={frequency} onValueChange={(val) => setFrequency(val || "mensual")}>
                    <SelectTrigger id="frequency">
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
                <div className="flex flex-col gap-2">
                  <Label htmlFor="dayOfMonth">Dia del mes</Label>
                  <Input id="dayOfMonth" name="dayOfMonth" type="number" min="1" max="31" placeholder="1-31" />
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="category">Categoria</Label>
                <Input id="category" name="category" placeholder="Opcional" defaultValue="general" />
              </div>
              <DialogFooter>
                <Button type="submit" disabled={pending} className="w-full">
                  Guardar programacion
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {recurring.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center gap-2 py-12 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
              <CalendarClock className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="font-medium text-foreground">Sin programaciones</p>
            <p className="max-w-xs text-sm text-muted-foreground text-pretty">
              Programa tus entradas fijas (salario, rentas) y salidas fijas
              (renta, servicios, suscripciones).
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {recurring.map((r) => (
            <RecurringCard key={r.id} item={r} currency={currency} />
          ))}
        </div>
      )}
    </div>
  )
}

function RecurringCard({
  item,
  currency,
}: {
  item: Recurring
  currency: string
}) {
  const [pending, startTransition] = useTransition()
  const isIncome = item.direction === "income"
  const converted = convertCurrency(item.amount, item.currency, currency)

  function handleToggle(v: boolean) {
    startTransition(async () => {
      await toggleRecurring(item.id, v)
    })
  }

  function handleDelete() {
    startTransition(async () => {
      await deleteRecurring(item.id)
      toast.success("Programacion eliminada")
    })
  }

  return (
    <Card className={item.active ? "" : "opacity-60"}>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="flex items-center gap-2 text-base">
            {isIncome ? (
              <ArrowUpRight className="h-4 w-4 shrink-0 text-primary" />
            ) : (
              <ArrowDownRight className="h-4 w-4 shrink-0 text-destructive" />
            )}
            <span className="truncate">{item.description}</span>
          </CardTitle>
          <div className="flex gap-1.5 items-center shrink-0">
            <Badge variant="secondary" className="font-mono text-[9px] scale-90">
              {item.currency}
            </Badge>
            <Badge variant="outline" className="shrink-0 capitalize">
              {item.frequency}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex items-center justify-between gap-2">
        <div>
          <p
            className={`font-mono text-lg font-bold ${
              isIncome ? "text-primary" : "text-destructive"
            }`}
          >
            {formatMoney(item.amount, item.currency)}
          </p>
          {item.currency !== currency && (
            <p className="text-[11px] text-muted-foreground font-mono">
              ~ {formatMoney(converted, currency)}
            </p>
          )}
          <p className="text-xs text-muted-foreground mt-0.5">
            {item.dayOfMonth ? `Dia ${item.dayOfMonth}` : "Sin dia fijo"}
            {" · "}
            {item.category}
          </p>
        </div>
        <div className="flex items-center gap-1">
          <Switch
            checked={item.active}
            onCheckedChange={handleToggle}
            disabled={pending}
            aria-label="Activar programacion"
          />
          <Button
            size="icon"
            variant="ghost"
            onClick={handleDelete}
            disabled={pending}
            aria-label="Eliminar"
            className="h-8 w-8"
          >
            <Trash2 className="h-4 w-4 text-muted-foreground" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

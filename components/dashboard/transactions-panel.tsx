"use client"

import { useState, useTransition, useEffect } from "react"
import {
  createTransaction,
  deleteTransaction,
} from "@/app/actions/transactions"
import { formatMoney, CURRENCIES } from "@/lib/config"
import { convertCurrency, type Transaction } from "@/lib/finance"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
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
import { Checkbox } from "@/components/ui/checkbox"
import { Plus, Trash2, ArrowUpRight, ArrowDownRight, Bug } from "lucide-react"
import { toast } from "sonner"

const CATEGORIES = [
  { value: "entrada", label: "Entrada / Ingreso", type: "income" },
  { value: "ganancia_negocio", label: "Ganancia de negocio", type: "income" },
  { value: "gasto", label: "Gasto general", type: "expense" },
  { value: "gasto_hormiga", label: "Gasto hormiga", type: "expense" },
  { value: "servicio", label: "Servicio / Factura", type: "expense" },
  { value: "comida", label: "Comida", type: "expense" },
  { value: "transporte", label: "Transporte", type: "expense" },
]

export function TransactionsPanel({
  transactions,
  currency,
}: {
  transactions: Transaction[]
  currency: string
}) {
  const [open, setOpen] = useState(false)
  const [category, setCategory] = useState("gasto")
  const [isAnt, setIsAnt] = useState(false)
  const [pending, startTransition] = useTransition()
  const [txCurrency, setTxCurrency] = useState(currency)

  useEffect(() => {
    setTxCurrency(currency)
  }, [currency])

  const selectedCat = CATEGORIES.find((c) => c.value === category)
  const isIncome = selectedCat?.type === "income"

  function handleCreate(formData: FormData) {
    const description = String(formData.get("description") || "").trim()
    const amount = Number(formData.get("amount") || 0)
    if (!description || amount <= 0) {
      toast.error("Completa la descripcion y un monto valido")
      return
    }
    startTransition(async () => {
      await createTransaction({
        type: isIncome ? "income" : "expense",
        category,
        description,
        amount,
        currency: txCurrency,
        business: String(formData.get("business") || "") || undefined,
        isAnt: category === "gasto_hormiga" ? true : isAnt,
        occurredAt: String(formData.get("occurredAt") || "") || undefined,
      })
      toast.success("Movimiento registrado")
      setOpen(false)
      setIsAnt(false)
      setCategory("gasto")
    })
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {transactions.length} movimiento(s) registrados
        </p>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger render={
            <Button>
              <Plus className="mr-1.5 h-4 w-4" />
              Nuevo movimiento
            </Button>
          } />
          <DialogContent className="max-h-[90svh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Registrar movimiento</DialogTitle>
            </DialogHeader>
            <form action={handleCreate} className="flex flex-col gap-3">
              <div className="flex flex-col gap-2">
                <Label htmlFor="category">Categoria</Label>
                <Select value={category} onValueChange={(val) => setCategory(val || "")}>
                  <SelectTrigger id="category">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => (
                      <SelectItem key={c.value} value={c.value}>
                        {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="description">Descripcion *</Label>
                <Input id="description" name="description" placeholder="Ej. Cafe, salario, venta..." required />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="flex flex-col gap-2 col-span-2">
                  <Label htmlFor="amount">Monto *</Label>
                  <Input id="amount" name="amount" type="number" step="0.01" min="0" required />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="currency">Moneda</Label>
                  <Select value={txCurrency} onValueChange={(val) => setTxCurrency(val || currency)}>
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
              <div className="flex flex-col gap-2">
                <Label htmlFor="occurredAt">Fecha</Label>
                <Input id="occurredAt" name="occurredAt" type="date" defaultValue={new Date().toISOString().slice(0, 10)} />
              </div>
              {isIncome && (
                <div className="flex flex-col gap-2">
                  <Label htmlFor="business">Negocio (opcional)</Label>
                  <Input id="business" name="business" placeholder="Nombre del negocio" />
                </div>
              )}
              {!isIncome && category !== "gasto_hormiga" && (
                <label className="flex items-center gap-2 text-sm text-foreground">
                  <Checkbox
                    checked={isAnt}
                    onCheckedChange={(v) => setIsAnt(Boolean(v))}
                  />
                  Marcar como gasto hormiga
                </label>
              )}
              <DialogFooter>
                <Button type="submit" disabled={pending} className="w-full">
                  Guardar movimiento
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {transactions.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center gap-2 py-12 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
              <ArrowUpRight className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="font-medium text-foreground">Sin movimientos</p>
            <p className="max-w-xs text-sm text-muted-foreground text-pretty">
              Registra tus entradas, gastos, gastos hormiga y ganancias de
              negocio.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-2">
          {transactions.map((t) => (
            <TxRow key={t.id} tx={t} currency={currency} />
          ))}
        </div>
      )}
    </div>
  )
}

function TxRow({ tx, currency }: { tx: Transaction; currency: string }) {
  const [pending, startTransition] = useTransition()
  const isIncome = tx.type === "income"

  function handleDelete() {
    startTransition(async () => {
      await deleteTransaction(tx.id)
      toast.success("Movimiento eliminado")
    })
  }

  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-3">
        <div
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
            isIncome ? "bg-primary/10" : tx.isAnt ? "bg-accent/40" : "bg-destructive/10"
          }`}
        >
          {isIncome ? (
            <ArrowUpRight className="h-4 w-4 text-primary" />
          ) : tx.isAnt ? (
            <Bug className="h-4 w-4 text-accent-foreground" />
          ) : (
            <ArrowDownRight className="h-4 w-4 text-destructive" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate text-sm font-medium text-foreground">
              {tx.description}
            </p>
            {tx.isAnt && (
              <Badge variant="secondary" className="h-5 shrink-0 px-1.5 text-[10px]">
                hormiga
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            {new Date(tx.occurredAt).toLocaleDateString("es-DO", {
              day: "2-digit",
              month: "short",
            })}
            {tx.business ? ` · ${tx.business}` : ""} ·{" "}
            {tx.category.replace(/_/g, " ")}
          </p>
        </div>
        <div className="text-right shrink-0">
          <p
            className={`font-mono text-sm font-bold ${
              isIncome ? "text-primary" : "text-destructive"
            }`}
          >
            {isIncome ? "+" : "-"}
            {formatMoney(tx.amount, tx.currency)}
          </p>
          {tx.currency !== currency && (
            <p className="text-[10px] text-muted-foreground font-mono">
              ~ {isIncome ? "+" : "-"}{formatMoney(convertCurrency(tx.amount, tx.currency, currency), currency)}
            </p>
          )}
        </div>
        <Button
          size="icon"
          variant="ghost"
          onClick={handleDelete}
          disabled={pending}
          aria-label="Eliminar movimiento"
          className="h-8 w-8 shrink-0"
        >
          <Trash2 className="h-4 w-4 text-muted-foreground" />
        </Button>
      </CardContent>
    </Card>
  )
}

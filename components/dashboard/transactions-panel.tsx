"use client"

import { useState, useTransition, useEffect } from "react"
import {
  createTransaction,
  updateTransaction,
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
import { Plus, Trash2, ArrowUpRight, ArrowDownRight, Bug, Edit2 } from "lucide-react"
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

  // Group transactions by date
  const groupedTransactions = transactions.reduce((acc, tx) => {
    const dateStr = new Date(tx.occurredAt).toLocaleDateString("es-DO", {
      day: "numeric",
      month: "long",
      year: "numeric"
    })
    if (!acc[dateStr]) acc[dateStr] = []
    acc[dateStr].push(tx)
    return acc
  }, {} as Record<string, Transaction[]>)

  function handleCreate(formData: FormData) {
    const description = String(formData.get("description") || "").trim()
    const amount = Number(formData.get("amount") || 0)
    if (!description || amount <= 0) {
      toast.error("Completa la descripción y un monto válido")
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
        <h3 className="font-display font-bold text-lg text-foreground flex items-center gap-2">
          Historial de Movimientos
          <Badge variant="secondary" className="font-mono text-xs">
            {transactions.length}
          </Badge>
        </h3>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger render={
            <Button className="gap-2 shadow-sm">
              <Plus className="h-4 w-4" />
              Nuevo Movimiento
            </Button>
          } />
          <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-lg font-bold">Registrar Movimiento</DialogTitle>
            </DialogHeader>
            <form action={handleCreate} className="flex flex-col gap-4 pt-2">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="category">Categoría</Label>
                <Select value={category} onValueChange={(val) => val && setCategory(val)}>
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

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="description">Descripción *</Label>
                <Input id="description" name="description" placeholder="Ej. Café, Salario, Venta producto..." required />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="flex flex-col gap-1.5 col-span-1 sm:col-span-2">
                  <Label htmlFor="amount">Monto *</Label>
                  <Input id="amount" name="amount" type="number" step="0.01" min="0" required />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="currency">Moneda</Label>
                  <Select value={txCurrency} onValueChange={(val) => val && setTxCurrency(val)}>
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

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="occurredAt">Fecha del Movimiento</Label>
                <Input id="occurredAt" name="occurredAt" type="date" defaultValue={new Date().toISOString().slice(0, 10)} />
              </div>

              {isIncome && (
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="business">Negocio Asociado (Opcional)</Label>
                  <Input id="business" name="business" placeholder="Nombre del negocio" />
                </div>
              )}

              {!isIncome && category !== "gasto_hormiga" && (
                <label className="flex items-center gap-2 text-sm text-foreground pt-1 cursor-pointer">
                  <Checkbox
                    checked={isAnt}
                    onCheckedChange={(v) => setIsAnt(Boolean(v))}
                  />
                  Marcar como gasto hormiga
                </label>
              )}

              <DialogFooter className="pt-2">
                <Button type="submit" disabled={pending} className="w-full">
                  Guardar Movimiento
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {transactions.length === 0 ? (
        <Card className="border-dashed bg-card/40">
          <CardContent className="flex flex-col items-center gap-2 py-12 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary">
              <ArrowUpRight className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="font-semibold text-foreground">Sin movimientos registrados</p>
            <p className="max-w-xs text-xs text-muted-foreground text-pretty">
              Registra tus entradas, gastos, gastos hormiga y ganancias de negocio.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-4">
          {Object.entries(groupedTransactions).map(([dateStr, txs]) => (
            <div key={dateStr} className="space-y-2">
              <h4 className="text-xs font-bold text-muted-foreground/80 tracking-wider uppercase pl-1">
                {dateStr}
              </h4>
              <div className="flex flex-col gap-2">
                {txs.map((t) => (
                  <TxRow key={t.id} tx={t} currency={currency} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function TxRow({ tx, currency }: { tx: Transaction; currency: string }) {
  const [pending, startTransition] = useTransition()
  const [editOpen, setEditOpen] = useState(false)

  // Edit transaction state
  const [editDescription, setEditDescription] = useState(tx.description)
  const [editAmount, setEditAmount] = useState(tx.amount.toString())
  const [editType, setEditType] = useState<"income" | "expense">(tx.type as "income" | "expense")
  const [editCategory, setEditCategory] = useState(tx.category || "gasto")
  const [editCurrency, setEditCurrency] = useState(tx.currency || "DOP")
  const [editBusiness, setEditBusiness] = useState(tx.business || "")
  const [editIsAnt, setEditIsAnt] = useState(tx.isAnt || false)
  const [editOccurredAt, setEditOccurredAt] = useState(
    tx.occurredAt ? new Date(tx.occurredAt).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10)
  )

  const isIncome = tx.type === "income"

  function handleEdit(e: React.FormEvent) {
    e.preventDefault()
    if (!editDescription.trim()) {
      toast.error("La descripción es obligatoria")
      return
    }
    startTransition(async () => {
      await updateTransaction(tx.id, {
        description: editDescription.trim(),
        amount: Number(editAmount) || 0,
        type: editType,
        category: editCategory,
        currency: editCurrency,
        business: editBusiness.trim() || undefined,
        isAnt: editCategory === "gasto_hormiga" ? true : editIsAnt,
        occurredAt: editOccurredAt,
      })
      toast.success("Movimiento actualizado")
      setEditOpen(false)
    })
  }

  function handleDelete() {
    startTransition(async () => {
      await deleteTransaction(tx.id)
      toast.success("Movimiento eliminado")
    })
  }

  return (
    <Card className="border border-border/60 bg-card/70 hover:bg-card transition-all duration-200 shadow-sm rounded-xl">
      <CardContent className="flex items-center gap-3 p-3">
        {/* Icon */}
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
            isIncome ? "bg-emerald-500/10" : tx.isAnt ? "bg-amber-500/10" : "bg-rose-500/10"
          }`}
        >
          {isIncome ? (
            <ArrowUpRight className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
          ) : tx.isAnt ? (
            <Bug className="h-5 w-5 text-amber-600 dark:text-amber-400" />
          ) : (
            <ArrowDownRight className="h-5 w-5 text-rose-600 dark:text-rose-400" />
          )}
        </div>

        {/* Text Info */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate text-sm font-semibold text-foreground">
              {tx.description}
            </p>
            {tx.isAnt && (
              <Badge variant="secondary" className="h-5 shrink-0 px-1.5 text-[10px] bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20">
                hormiga
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            {tx.business ? `${tx.business} · ` : ""}{tx.category.replace(/_/g, " ")}
          </p>
        </div>

        {/* Amount */}
        <div className="text-right shrink-0">
          <p
            className={`font-mono text-sm font-bold ${
              isIncome ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
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

        {/* EDIT TRANSACTION MODAL */}
        <Dialog open={editOpen} onOpenChange={setEditOpen}>
          <DialogTrigger render={
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8 shrink-0 text-muted-foreground hover:text-foreground"
              title="Editar Movimiento"
            >
              <Edit2 className="h-3.5 w-3.5" />
            </Button>
          } />
          <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-lg font-bold">
                <Edit2 className="h-5 w-5 text-primary" />
                Editar Movimiento
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleEdit} className="flex flex-col gap-4 pt-2">
              <div className="flex flex-col gap-1.5">
                <Label>Categoría</Label>
                <Select value={editCategory} onValueChange={(val) => {
                  if (!val) return
                  setEditCategory(val)
                  const catObj = CATEGORIES.find(c => c.value === val)
                  if (catObj) setEditType(catObj.type as "income" | "expense")
                }}>
                  <SelectTrigger>
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

              <div className="flex flex-col gap-1.5">
                <Label>Fecha del Movimiento</Label>
                <Input
                  type="date"
                  value={editOccurredAt}
                  onChange={(e) => setEditOccurredAt(e.target.value)}
                />
              </div>

              {editType === "income" && (
                <div className="flex flex-col gap-1.5">
                  <Label>Negocio Asociado (Opcional)</Label>
                  <Input
                    value={editBusiness}
                    onChange={(e) => setEditBusiness(e.target.value)}
                  />
                </div>
              )}

              {editType !== "income" && editCategory !== "gasto_hormiga" && (
                <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
                  <Checkbox
                    checked={editIsAnt}
                    onCheckedChange={(v) => setEditIsAnt(Boolean(v))}
                  />
                  Marcar como gasto hormiga
                </label>
              )}

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
          size="icon"
          variant="ghost"
          onClick={handleDelete}
          disabled={pending}
          aria-label="Eliminar movimiento"
          className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
          title="Eliminar Movimiento"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </CardContent>
    </Card>
  )
}

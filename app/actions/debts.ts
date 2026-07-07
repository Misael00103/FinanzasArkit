"use server"

import { db } from "@/lib/db"
import { debts } from "@/lib/db/schema"
import { getUserId } from "@/lib/session"
import { and, desc, eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"

export type DebtInput = {
  name: string
  creditor?: string
  type?: string
  totalAmount: number
  paidAmount?: number
  interestRate?: number
  minimumPayment?: number
  dueDay?: number | null
  currency?: string
  notes?: string
}

export async function getDebts() {
  const userId = await getUserId()
  const rows = await db
    .select()
    .from(debts)
    .where(eq(debts.userId, userId))
    .orderBy(desc(debts.createdAt))
  return rows.map((d) => ({
    ...d,
    totalAmount: Number(d.totalAmount),
    paidAmount: Number(d.paidAmount),
    interestRate: Number(d.interestRate),
    minimumPayment: Number(d.minimumPayment),
  }))
}

export async function createDebt(input: DebtInput) {
  const userId = await getUserId()
  await db.insert(debts).values({
    userId,
    name: input.name,
    creditor: input.creditor || null,
    type: input.type || "deuda",
    totalAmount: String(input.totalAmount ?? 0),
    paidAmount: String(input.paidAmount ?? 0),
    interestRate: String(input.interestRate ?? 0),
    minimumPayment: String(input.minimumPayment ?? 0),
    dueDay: input.dueDay ?? null,
    currency: input.currency || "DOP",
    notes: input.notes || null,
  })
  revalidatePath("/")
}

export async function updateDebt(id: number, input: Partial<DebtInput>) {
  const userId = await getUserId()
  const values: Record<string, unknown> = {}
  if (input.name !== undefined) values.name = input.name
  if (input.creditor !== undefined) values.creditor = input.creditor || null
  if (input.type !== undefined) values.type = input.type
  if (input.totalAmount !== undefined) values.totalAmount = String(input.totalAmount)
  if (input.paidAmount !== undefined) values.paidAmount = String(input.paidAmount)
  if (input.interestRate !== undefined) values.interestRate = String(input.interestRate)
  if (input.minimumPayment !== undefined) values.minimumPayment = String(input.minimumPayment)
  if (input.dueDay !== undefined) values.dueDay = input.dueDay
  if (input.currency !== undefined) values.currency = input.currency
  if (input.notes !== undefined) values.notes = input.notes || null
  await db
    .update(debts)
    .set(values)
    .where(and(eq(debts.id, id), eq(debts.userId, userId)))
  revalidatePath("/")
}

export async function registerDebtPayment(id: number, amount: number) {
  const userId = await getUserId()
  const [row] = await db
    .select()
    .from(debts)
    .where(and(eq(debts.id, id), eq(debts.userId, userId)))
  if (!row) throw new Error("Deuda no encontrada")
  const newPaid = Number(row.paidAmount) + amount
  await db
    .update(debts)
    .set({ paidAmount: String(newPaid) })
    .where(and(eq(debts.id, id), eq(debts.userId, userId)))
  revalidatePath("/")
}

export async function deleteDebt(id: number) {
  const userId = await getUserId()
  await db.delete(debts).where(and(eq(debts.id, id), eq(debts.userId, userId)))
  revalidatePath("/")
}

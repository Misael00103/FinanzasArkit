"use server"

import { db } from "@/lib/db"
import { transactions } from "@/lib/db/schema"
import { getUserId } from "@/lib/session"
import { and, desc, eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"

export type TransactionInput = {
  type: "income" | "expense"
  category?: string
  description: string
  amount: number
  currency?: string
  business?: string
  isAnt?: boolean
  occurredAt?: string
}

export async function getTransactions() {
  const userId = await getUserId()
  const rows = await db
    .select()
    .from(transactions)
    .where(eq(transactions.userId, userId))
    .orderBy(desc(transactions.occurredAt))
  return rows.map((t) => ({ ...t, amount: Number(t.amount) }))
}

export async function createTransaction(input: TransactionInput) {
  const userId = await getUserId()
  await db.insert(transactions).values({
    userId,
    type: input.type,
    category: input.category || "general",
    description: input.description,
    amount: String(input.amount ?? 0),
    currency: input.currency || "DOP",
    business: input.business || null,
    isAnt: input.isAnt ?? false,
    occurredAt: input.occurredAt ? new Date(input.occurredAt) : new Date(),
  })
  revalidatePath("/")
}

export async function deleteTransaction(id: number) {
  const userId = await getUserId()
  await db
    .delete(transactions)
    .where(and(eq(transactions.id, id), eq(transactions.userId, userId)))
  revalidatePath("/")
}

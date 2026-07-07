"use server"

import { db } from "@/lib/db"
import { recurring } from "@/lib/db/schema"
import { getUserId } from "@/lib/session"
import { and, desc, eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"

export type RecurringInput = {
  direction: "income" | "expense"
  description: string
  category?: string
  amount: number
  currency?: string
  frequency?: string
  dayOfMonth?: number | null
  active?: boolean
}

export async function getRecurring() {
  const userId = await getUserId()
  const rows = await db
    .select()
    .from(recurring)
    .where(eq(recurring.userId, userId))
    .orderBy(desc(recurring.createdAt))
  return rows.map((r) => ({ ...r, amount: Number(r.amount) }))
}

export async function createRecurring(input: RecurringInput) {
  const userId = await getUserId()
  await db.insert(recurring).values({
    userId,
    direction: input.direction,
    description: input.description,
    category: input.category || "general",
    amount: String(input.amount ?? 0),
    currency: input.currency || "DOP",
    frequency: input.frequency || "mensual",
    dayOfMonth: input.dayOfMonth ?? null,
    active: input.active ?? true,
  })
  revalidatePath("/")
}

export async function toggleRecurring(id: number, active: boolean) {
  const userId = await getUserId()
  await db
    .update(recurring)
    .set({ active })
    .where(and(eq(recurring.id, id), eq(recurring.userId, userId)))
  revalidatePath("/")
}

export async function deleteRecurring(id: number) {
  const userId = await getUserId()
  await db
    .delete(recurring)
    .where(and(eq(recurring.id, id), eq(recurring.userId, userId)))
  revalidatePath("/")
}

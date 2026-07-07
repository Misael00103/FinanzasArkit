"use server"

import { db } from "@/lib/db"
import { goals } from "@/lib/db/schema"
import { getUserId } from "@/lib/session"
import { and, desc, eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"

export type GoalInput = {
  name: string
  targetAmount: number
  savedAmount?: number
  currency?: string
  targetDate?: string | null
  notes?: string
}

export async function getGoals() {
  const userId = await getUserId()
  const rows = await db
    .select()
    .from(goals)
    .where(eq(goals.userId, userId))
    .orderBy(desc(goals.createdAt))
  return rows.map((g) => ({
    ...g,
    targetAmount: Number(g.targetAmount),
    savedAmount: Number(g.savedAmount),
  }))
}

export async function createGoal(input: GoalInput) {
  const userId = await getUserId()
  await db.insert(goals).values({
    userId,
    name: input.name,
    targetAmount: String(input.targetAmount ?? 0),
    savedAmount: String(input.savedAmount ?? 0),
    currency: input.currency || "DOP",
    targetDate: input.targetDate || null,
    notes: input.notes || null,
  })
  revalidatePath("/")
}

export async function addToGoal(id: number, amount: number) {
  const userId = await getUserId()
  const [row] = await db
    .select()
    .from(goals)
    .where(and(eq(goals.id, id), eq(goals.userId, userId)))
  if (!row) throw new Error("Meta no encontrada")
  const newSaved = Number(row.savedAmount) + amount
  await db
    .update(goals)
    .set({ savedAmount: String(newSaved) })
    .where(and(eq(goals.id, id), eq(goals.userId, userId)))
  revalidatePath("/")
}

export async function deleteGoal(id: number) {
  const userId = await getUserId()
  await db.delete(goals).where(and(eq(goals.id, id), eq(goals.userId, userId)))
  revalidatePath("/")
}

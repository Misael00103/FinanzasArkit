"use server"

import { db } from "@/lib/db"
import { settings } from "@/lib/db/schema"
import { getUserId } from "@/lib/session"
import { eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"

export async function getSettings() {
  const userId = await getUserId()
  const [row] = await db
    .select()
    .from(settings)
    .where(eq(settings.userId, userId))
  if (!row) {
    return { displayCurrency: "DOP", monthlyIncome: 0 }
  }
  return {
    displayCurrency: row.displayCurrency,
    monthlyIncome: Number(row.monthlyIncome),
  }
}

export async function saveSettings(input: {
  displayCurrency?: string
  monthlyIncome?: number
}) {
  const userId = await getUserId()
  const [existing] = await db
    .select()
    .from(settings)
    .where(eq(settings.userId, userId))
  if (existing) {
    const values: Record<string, unknown> = { updatedAt: new Date() }
    if (input.displayCurrency !== undefined)
      values.displayCurrency = input.displayCurrency
    if (input.monthlyIncome !== undefined)
      values.monthlyIncome = String(input.monthlyIncome)
    await db.update(settings).set(values).where(eq(settings.userId, userId))
  } else {
    await db.insert(settings).values({
      userId,
      displayCurrency: input.displayCurrency || "DOP",
      monthlyIncome: String(input.monthlyIncome ?? 0),
    })
  }
  revalidatePath("/")
}

"use server"

import { createClient } from "@/utils/supabase/server"
import { cookies } from "next/headers"
import { getUserId } from "@/lib/session"
import { revalidatePath } from "next/cache"

export async function getSettings() {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  const userId = await getUserId()
  const { data: row, error } = await supabase
    .from("settings")
    .select("*")
    .eq("userId", userId)
    .maybeSingle()
  if (error) throw error
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
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  const userId = await getUserId()
  const { data: existing, error: fetchError } = await supabase
    .from("settings")
    .select("*")
    .eq("userId", userId)
    .maybeSingle()
  if (fetchError) throw fetchError

  if (existing) {
    const values: Record<string, unknown> = { updatedAt: new Date().toISOString() }
    if (input.displayCurrency !== undefined)
      values.displayCurrency = input.displayCurrency
    if (input.monthlyIncome !== undefined)
      values.monthlyIncome = String(input.monthlyIncome)
    const { error: updateError } = await supabase
      .from("settings")
      .update(values)
      .eq("userId", userId)
    if (updateError) throw updateError
  } else {
    const { error: insertError } = await supabase
      .from("settings")
      .insert({
        userId,
        displayCurrency: input.displayCurrency || "DOP",
        monthlyIncome: String(input.monthlyIncome ?? 0),
      })
    if (insertError) throw insertError
  }
  revalidatePath("/")
}

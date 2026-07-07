"use server"

import { createClient } from "@/utils/supabase/server"
import { cookies } from "next/headers"
import { getUserId } from "@/lib/session"
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
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  const userId = await getUserId()
  const { data, error } = await supabase
    .from("goals")
    .select("*")
    .eq("userId", userId)
    .order("createdAt", { ascending: false })
  if (error) throw error
  return (data || []).map((g) => ({
    ...g,
    targetAmount: Number(g.targetAmount),
    savedAmount: Number(g.savedAmount),
  }))
}

export async function createGoal(input: GoalInput) {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  const userId = await getUserId()
  const { error } = await supabase.from("goals").insert({
    userId,
    name: input.name,
    targetAmount: String(input.targetAmount ?? 0),
    savedAmount: String(input.savedAmount ?? 0),
    currency: input.currency || "DOP",
    targetDate: input.targetDate || null,
    notes: input.notes || null,
  })
  if (error) throw error
  revalidatePath("/")
}

export async function addToGoal(id: number, amount: number) {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  const userId = await getUserId()
  const { data: row, error: selectError } = await supabase
    .from("goals")
    .select("*")
    .eq("id", id)
    .eq("userId", userId)
    .single()
  if (selectError || !row) throw new Error("Meta no encontrada")
  const newSaved = Number(row.savedAmount) + amount
  const { error: updateError } = await supabase
    .from("goals")
    .update({ savedAmount: String(newSaved) })
    .eq("id", id)
    .eq("userId", userId)
  if (updateError) throw updateError
  revalidatePath("/")
}

export async function deleteGoal(id: number) {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  const userId = await getUserId()
  const { error } = await supabase
    .from("goals")
    .delete()
    .eq("id", id)
    .eq("userId", userId)
  if (error) throw error
  revalidatePath("/")
}

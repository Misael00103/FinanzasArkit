"use server"

import { createClient } from "@/utils/supabase/server"
import { cookies } from "next/headers"
import { getUserId } from "@/lib/session"
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
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  const userId = await getUserId()
  const { data, error } = await supabase
    .from("recurring")
    .select("*")
    .eq("userId", userId)
    .order("createdAt", { ascending: false })
  if (error) throw error
  return (data || []).map((r) => ({ ...r, amount: Number(r.amount) }))
}

export async function createRecurring(input: RecurringInput) {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  const userId = await getUserId()
  const { error } = await supabase.from("recurring").insert({
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
  if (error) throw error
  revalidatePath("/")
}

export async function toggleRecurring(id: number, active: boolean) {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  const userId = await getUserId()
  const { error } = await supabase
    .from("recurring")
    .update({ active })
    .eq("id", id)
    .eq("userId", userId)
  if (error) throw error
  revalidatePath("/")
}

export async function deleteRecurring(id: number) {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  const userId = await getUserId()
  const { error } = await supabase
    .from("recurring")
    .delete()
    .eq("id", id)
    .eq("userId", userId)
  if (error) throw error
  revalidatePath("/")
}

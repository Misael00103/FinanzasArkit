"use server"

import { createClient } from "@/utils/supabase/server"
import { cookies } from "next/headers"
import { getUserId } from "@/lib/session"
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
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  const userId = await getUserId()
  const { data, error } = await supabase
    .from("transactions")
    .select("*")
    .eq("userId", userId)
    .order("occurredAt", { ascending: false })
  if (error) throw error
  return (data || []).map((t) => ({ ...t, amount: Number(t.amount) }))
}

export async function createTransaction(input: TransactionInput) {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  const userId = await getUserId()
  const { error } = await supabase.from("transactions").insert({
    userId,
    type: input.type,
    category: input.category || "general",
    description: input.description,
    amount: String(input.amount ?? 0),
    currency: input.currency || "DOP",
    business: input.business || null,
    isAnt: input.isAnt ?? false,
    occurredAt: input.occurredAt ? new Date(input.occurredAt).toISOString() : new Date().toISOString(),
  })
  if (error) throw error
  revalidatePath("/")
}

export async function deleteTransaction(id: number) {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  const userId = await getUserId()
  const { error } = await supabase
    .from("transactions")
    .delete()
    .eq("id", id)
    .eq("userId", userId)
  if (error) throw error
  revalidatePath("/")
}

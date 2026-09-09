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
  bankAccountId?: number | null
  business?: string
  isAnt?: boolean
  occurredAt?: string
}

async function adjustAccountBalance(
  supabase: any,
  userId: string,
  bankAccountId: number,
  delta: number
) {
  try {
    const { data: acc, error: getErr } = await supabase
      .from("bank_accounts")
      .select("balance")
      .eq("id", bankAccountId)
      .eq("userId", userId)
      .single()

    if (getErr || !acc) return

    const newBalance = Number(acc.balance || 0) + delta
    await supabase
      .from("bank_accounts")
      .update({ balance: String(newBalance), updatedAt: new Date().toISOString() })
      .eq("id", bankAccountId)
      .eq("userId", userId)
  } catch (err) {
    console.error("Error adjusting bank account balance:", err)
  }
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
    bankAccountId: input.bankAccountId || null,
    business: input.business || null,
    isAnt: input.isAnt ?? false,
    occurredAt: input.occurredAt ? new Date(input.occurredAt).toISOString() : new Date().toISOString(),
  })
  if (error) throw error

  // Si está vinculada a una cuenta bancaria, actualizar balance
  if (input.bankAccountId) {
    const delta = input.type === "income" ? input.amount : -input.amount
    await adjustAccountBalance(supabase, userId, input.bankAccountId, delta)
  }

  revalidatePath("/")
}

export async function updateTransaction(id: number, input: Partial<TransactionInput>) {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  const userId = await getUserId()

  // Obtener la transacción previa para revertir cambios de balance si aplican
  const { data: prevTx } = await supabase
    .from("transactions")
    .select("*")
    .eq("id", id)
    .eq("userId", userId)
    .single()

  const values: Record<string, unknown> = {}
  if (input.type !== undefined) values.type = input.type
  if (input.category !== undefined) values.category = input.category
  if (input.description !== undefined) values.description = input.description
  if (input.amount !== undefined) values.amount = String(input.amount)
  if (input.currency !== undefined) values.currency = input.currency
  if (input.bankAccountId !== undefined) values.bankAccountId = input.bankAccountId || null
  if (input.business !== undefined) values.business = input.business || null
  if (input.isAnt !== undefined) values.isAnt = input.isAnt
  if (input.occurredAt !== undefined) values.occurredAt = new Date(input.occurredAt).toISOString()

  const { error } = await supabase
    .from("transactions")
    .update(values)
    .eq("id", id)
    .eq("userId", userId)
  if (error) throw error

  // Revertir impacto previo si existía cuenta asignada
  if (prevTx && prevTx.bankAccountId) {
    const prevAmount = Number(prevTx.amount || 0)
    const revertDelta = prevTx.type === "income" ? -prevAmount : prevAmount
    await adjustAccountBalance(supabase, userId, prevTx.bankAccountId, revertDelta)
  }

  // Aplicar nuevo impacto si existe cuenta asignada
  const targetBankAccountId = input.bankAccountId !== undefined ? input.bankAccountId : prevTx?.bankAccountId
  if (targetBankAccountId) {
    const targetType = input.type || prevTx?.type || "expense"
    const targetAmount = input.amount !== undefined ? input.amount : Number(prevTx?.amount || 0)
    const newDelta = targetType === "income" ? targetAmount : -targetAmount
    await adjustAccountBalance(supabase, userId, targetBankAccountId, newDelta)
  }

  revalidatePath("/")
}

export async function deleteTransaction(id: number) {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  const userId = await getUserId()

  const { data: prevTx } = await supabase
    .from("transactions")
    .select("*")
    .eq("id", id)
    .eq("userId", userId)
    .single()

  const { error } = await supabase
    .from("transactions")
    .delete()
    .eq("id", id)
    .eq("userId", userId)
  if (error) throw error

  if (prevTx && prevTx.bankAccountId) {
    const prevAmount = Number(prevTx.amount || 0)
    const revertDelta = prevTx.type === "income" ? -prevAmount : prevAmount
    await adjustAccountBalance(supabase, userId, prevTx.bankAccountId, revertDelta)
  }

  revalidatePath("/")
}

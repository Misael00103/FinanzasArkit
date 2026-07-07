"use server"

import { createClient } from "@/utils/supabase/server"
import { cookies } from "next/headers"
import { getUserId } from "@/lib/session"
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
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  const userId = await getUserId()
  const { data, error } = await supabase
    .from("debts")
    .select("*")
    .eq("userId", userId)
    .order("createdAt", { ascending: false })
  if (error) throw error
  return (data || []).map((d) => ({
    ...d,
    totalAmount: Number(d.totalAmount),
    paidAmount: Number(d.paidAmount),
    interestRate: Number(d.interestRate),
    minimumPayment: Number(d.minimumPayment),
  }))
}

export async function createDebt(input: DebtInput) {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  const userId = await getUserId()
  const { error } = await supabase.from("debts").insert({
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
  if (error) throw error
  revalidatePath("/")
}

export async function updateDebt(id: number, input: Partial<DebtInput>) {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
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

  const { error } = await supabase
    .from("debts")
    .update(values)
    .eq("id", id)
    .eq("userId", userId)
  if (error) throw error
  revalidatePath("/")
}

export async function registerDebtPayment(id: number, amount: number) {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  const userId = await getUserId()
  const { data: row, error: selectError } = await supabase
    .from("debts")
    .select("*")
    .eq("id", id)
    .eq("userId", userId)
    .single()
  if (selectError || !row) throw new Error("Deuda no encontrada")
  const newPaid = Number(row.paidAmount) + amount
  const { error: updateError } = await supabase
    .from("debts")
    .update({ paidAmount: String(newPaid) })
    .eq("id", id)
    .eq("userId", userId)
  if (updateError) throw updateError
  revalidatePath("/")
}

export async function deleteDebt(id: number) {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  const userId = await getUserId()
  const { error } = await supabase
    .from("debts")
    .delete()
    .eq("id", id)
    .eq("userId", userId)
  if (error) throw error
  revalidatePath("/")
}

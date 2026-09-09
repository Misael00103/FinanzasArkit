"use server"

import { createClient } from "@/utils/supabase/server"
import { cookies } from "next/headers"
import { getUserId } from "@/lib/session"
import { revalidatePath } from "next/cache"
import type { BankAccount } from "@/lib/finance"

export type BankAccountInput = {
  bankName?: string
  name: string
  type: string
  balance: number
  currency?: string
  accountNumber?: string
  color?: string
  notes?: string
}

export async function getBankAccounts(): Promise<BankAccount[]> {
  try {
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)
    const userId = await getUserId()

    const { data, error } = await supabase
      .from("bank_accounts")
      .select("*")
      .eq("userId", userId)
      .order("createdAt", { ascending: true })

    if (error) {
      // Si la tabla no existe en Supabase todavía, se captura el error PGRST205 sin romper la UI
      if (error.code === "PGRST205" || error.message?.includes("bank_accounts")) {
        console.warn("La tabla 'bank_accounts' no ha sido creada aún en Supabase PostgreSQL. Ejecutar schema_bank_accounts.sql")
        return []
      }
      console.error("Error al obtener cuentas bancarias:", error)
      return []
    }

    return (data || []).map((acc) => ({
      ...acc,
      balance: Number(acc.balance || 0),
    }))
  } catch (err) {
    console.error("Error in getBankAccounts:", err)
    return []
  }
}

export async function createBankAccount(input: BankAccountInput) {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  const userId = await getUserId()

  const { error } = await supabase.from("bank_accounts").insert({
    userId,
    bankName: input.bankName || "General",
    name: input.name,
    type: input.type || "cuenta_ahorro",
    balance: String(input.balance ?? 0),
    currency: input.currency || "DOP",
    accountNumber: input.accountNumber || null,
    color: input.color || "#3b82f6",
    notes: input.notes || null,
  })

  if (error) throw error
  revalidatePath("/")
}

export async function updateBankAccount(id: number, input: Partial<BankAccountInput>) {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  const userId = await getUserId()

  const values: Record<string, unknown> = {
    updatedAt: new Date().toISOString(),
  }

  if (input.bankName !== undefined) values.bankName = input.bankName
  if (input.name !== undefined) values.name = input.name
  if (input.type !== undefined) values.type = input.type
  if (input.balance !== undefined) values.balance = String(input.balance)
  if (input.currency !== undefined) values.currency = input.currency
  if (input.accountNumber !== undefined) values.accountNumber = input.accountNumber || null
  if (input.color !== undefined) values.color = input.color
  if (input.notes !== undefined) values.notes = input.notes || null

  const { error } = await supabase
    .from("bank_accounts")
    .update(values)
    .eq("id", id)
    .eq("userId", userId)

  if (error) throw error
  revalidatePath("/")
}

export async function deleteBankAccount(id: number) {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  const userId = await getUserId()

  const { error } = await supabase
    .from("bank_accounts")
    .delete()
    .eq("id", id)
    .eq("userId", userId)

  if (error) throw error
  revalidatePath("/")
}

export async function transferBetweenAccounts({
  fromAccountId,
  toAccountId,
  amount,
  currency,
  notes,
}: {
  fromAccountId: number
  toAccountId: number
  amount: number
  currency: string
  notes?: string
}) {
  if (fromAccountId === toAccountId) {
    throw new Error("La cuenta de origen y destino deben ser distintas")
  }
  if (amount <= 0) {
    throw new Error("El monto a transferir debe ser mayor a cero")
  }

  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  const userId = await getUserId()

  // Obtener cuenta origen y destino
  const { data: fromAcc, error: err1 } = await supabase
    .from("bank_accounts")
    .select("*")
    .eq("id", fromAccountId)
    .eq("userId", userId)
    .single()

  const { data: toAcc, error: err2 } = await supabase
    .from("bank_accounts")
    .select("*")
    .eq("id", toAccountId)
    .eq("userId", userId)
    .single()

  if (err1 || !fromAcc || err2 || !toAcc) {
    throw new Error("No se pudieron encontrar ambas cuentas bancarias")
  }

  const newFromBalance = Number(fromAcc.balance) - amount
  const newToBalance = Number(toAcc.balance) + amount

  // Actualizar ambas cuentas
  const { error: updateFromErr } = await supabase
    .from("bank_accounts")
    .update({ balance: String(newFromBalance), updatedAt: new Date().toISOString() })
    .eq("id", fromAccountId)
    .eq("userId", userId)

  if (updateFromErr) throw updateFromErr

  const { error: updateToErr } = await supabase
    .from("bank_accounts")
    .update({ balance: String(newToBalance), updatedAt: new Date().toISOString() })
    .eq("id", toAccountId)
    .eq("userId", userId)

  if (updateToErr) throw updateToErr

  // Registrar el movimiento de transferencia
  await supabase.from("transactions").insert({
    userId,
    type: "expense",
    category: "transferencia",
    description: `Transferencia hacia ${toAcc.name}${notes ? ` (${notes})` : ""}`,
    amount: String(amount),
    currency,
    bankAccountId: fromAccountId,
    occurredAt: new Date().toISOString(),
  })

  await supabase.from("transactions").insert({
    userId,
    type: "income",
    category: "transferencia",
    description: `Transferencia recibida de ${fromAcc.name}${notes ? ` (${notes})` : ""}`,
    amount: String(amount),
    currency,
    bankAccountId: toAccountId,
    occurredAt: new Date().toISOString(),
  })

  revalidatePath("/")
}

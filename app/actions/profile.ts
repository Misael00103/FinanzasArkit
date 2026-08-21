"use server"

import { createClient } from "@/utils/supabase/server"
import { cookies } from "next/headers"
import { getUserId } from "@/lib/session"
import { revalidatePath } from "next/cache"

export async function updateProfileName(name: string) {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  await getUserId()

  const { data, error } = await supabase.auth.updateUser({
    data: { name: name.trim() },
  })

  if (error) throw new Error(error.message)
  revalidatePath("/")
  return { success: true, name: data.user?.user_metadata?.name || name }
}

export async function updateProfileEmail(email: string) {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  await getUserId()

  const trimmedEmail = email.trim()
  if (!trimmedEmail.includes("@")) {
    throw new Error("Por favor ingresa un correo electrónico válido.")
  }

  const { data, error } = await supabase.auth.updateUser({ email: trimmedEmail })

  if (error) throw new Error(error.message)
  revalidatePath("/")
  return { success: true, email: data.user?.email || trimmedEmail }
}

export async function updateProfilePassword(password: string) {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  await getUserId()

  if (!password || password.length < 6) {
    throw new Error("La contraseña debe tener al menos 6 caracteres.")
  }

  const { error } = await supabase.auth.updateUser({ password })

  if (error) throw new Error(error.message)
  return { success: true }
}

export async function updateProfileMetadata(metadata: Record<string, any>) {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  await getUserId()

  const { data, error } = await supabase.auth.updateUser({
    data: metadata,
  })

  if (error) throw new Error(error.message)
  revalidatePath("/")
  return { success: true, metadata: data.user?.user_metadata }
}

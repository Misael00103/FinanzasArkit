"use server"

import { createClient } from "@/utils/supabase/server"
import { cookies } from "next/headers"
import { getUserId } from "@/lib/session"
import { revalidatePath } from "next/cache"

export async function updateProfileName(name: string) {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  await getUserId() // Ensure user is authenticated

  const { data, error } = await supabase.auth.updateUser({
    data: { name: name.trim() },
  })

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath("/")
  return {
    success: true,
    name: data.user?.user_metadata?.name || name,
  }
}

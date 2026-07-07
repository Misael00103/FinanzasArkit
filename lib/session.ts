import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";

export async function getUserId() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) throw new Error("Unauthorized");
  return user.id;
}

export async function getSession() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error || !session) return null;
  return {
    ...session,
    user: {
      ...session.user,
      name: session.user.user_metadata?.name || session.user.email?.split("@")[0] || "Misael",
    },
  };
}

import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";

export default async function Page() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { data: todos } = await supabase.from("todos").select();

  return (
    <ul className="p-8 list-disc">
      {todos?.map((todo) => (
        <li key={todo.id}>{todo.name}</li>
      ))}
      {(!todos || todos.length === 0) && (
        <p className="text-muted-foreground">No todos found.</p>
      )}
    </ul>
  );
}

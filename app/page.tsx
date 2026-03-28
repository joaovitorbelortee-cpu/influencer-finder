import { redirect } from "next/navigation"
import { getUser } from "@/lib/supabase"

export default async function Home() {
  const user = await getUser()
  if (user) redirect("/dashboard")
  redirect("/login")
}

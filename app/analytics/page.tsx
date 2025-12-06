import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import AnalyticsDashboard from "@/components/dashboard/analytics-dashboard"

export default async function AnalyticsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { data: userData } = await supabase
    .from("users")
    .select("*")
    .eq("id", user.id)
    .single()

  if (!userData) {
    redirect("/auth/login")
  }

  return (
    <div className="container mx-auto p-4 max-w-7xl">
      <AnalyticsDashboard currentUser={userData} />
    </div>
  )
}


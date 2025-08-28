import { createClient, isSupabaseConfigured } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Header from "@/components/navigation/header"
import ProfileSettings from "@/components/settings/profile-settings"
import PreferencesSettings from "@/components/settings/preferences-settings"

export default async function SettingsPage() {
  // If Supabase is not configured, show setup message
  if (!isSupabaseConfigured) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-950">
        <h1 className="text-2xl font-bold mb-4 text-white">Connect Supabase to get started</h1>
      </div>
    )
  }

  // Get the user from the server
  const supabase = createClient()
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()

  // If no user, redirect to login
  if (!authUser) {
    redirect("/auth/login")
  }

  // Get user profile data
  const { data: user } = await supabase.from("users").select("*").eq("id", authUser.id).single()

  if (!user) {
    redirect("/auth/login")
  }

  return (
    <div className="min-h-screen bg-gray-950">
      <Header user={user} />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Settings</h1>
          <p className="text-gray-400">Manage your account and customize your experience</p>
        </div>

        {/* Settings Sections */}
        <div className="space-y-8">
          <ProfileSettings user={user} />
          <PreferencesSettings />
        </div>
      </main>
    </div>
  )
}

import { createClient, isSupabaseConfigured } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Header from "@/components/navigation/header"
import StatsCard from "@/components/dashboard/stats-card"
import QuickActions from "@/components/dashboard/quick-actions"
import RecentMatches from "@/components/dashboard/recent-matches"
import { Wallet, Trophy, Target, TrendingUp } from "lucide-react"
import Image from "next/image"

export default async function DashboardPage() {
  if (!isSupabaseConfigured) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4 text-white">Connect Supabase to get started</h1>
          <p className="text-gray-400">Configure your database connection to continue</p>
        </div>
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
    <div className="min-h-screen bg-black">
      <Header user={user} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 fade-in">
          <div className="flex items-center space-x-4 mb-4">
            <Image src="/chanceus-eagle.png" alt="ChanceUS Eagle" width={60} height={60} className="h-12 w-12" />
            <div>
              <h1 className="text-3xl font-bold text-white">
                Welcome back, <span className="text-accent">{user.display_name || user.username}</span>!
              </h1>
              <p className="text-gray-400">Ready to challenge your friends in skill-based games?</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatsCard
            title="Token Balance"
            value={user.tokens?.toLocaleString() || "0"}
            description="Available for betting"
            icon={Wallet}
            bgColor="bg-orange-500"
          />

          <StatsCard
            title="Games Won"
            value={user.total_games_won || 0}
            description={`Out of ${user.total_games_played || 0} total`}
            icon={Trophy}
            bgColor="bg-orange-500"
          />

          <StatsCard
            title="Win Rate"
            value={`${user.win_rate || 0}%`}
            description="Your success percentage"
            icon={Target}
            bgColor="bg-orange-500"
          />

          <StatsCard
            title="Rank"
            value="#247"
            description="Global leaderboard"
            icon={TrendingUp}
            bgColor="bg-orange-500"
          />
        </div>

        <div className="mb-8">
          <h2 className="text-xl font-bold text-white mb-6">Quick Play</h2>
          <QuickActions />
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <RecentMatches />
          </div>

          <div className="card-modern p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white">Active Players</h3>
              <div className="flex items-center text-orange-500">
                <div className="w-2 h-2 bg-orange-500 rounded-full mr-2 animate-pulse"></div>
                <span className="text-sm">1,247 online</span>
              </div>
            </div>
            <div className="space-y-3">
              {["MathWizard", "ConnectPro", "TriviaKing", "QuickShot", "BrainBox"].map((player) => (
                <div key={player} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center text-black font-bold text-sm">
                      {player.charAt(0)}
                    </div>
                    <span className="text-white">{player}</span>
                  </div>
                  <div className="flex items-center text-orange-500">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                    <span className="text-xs">Playing</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

import { createClient, isSupabaseConfigured } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Header from "@/components/navigation/header"
import GameCard from "@/components/games/game-card"
import MatchList from "@/components/games/match-list"

export default async function GamesPage() {
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

  // Get all active games
  const { data: games = [] } = await supabase.from("games").select("*").eq("is_active", true).order("name")

  // Get waiting matches with user info
  const { data: waitingMatches = [] } = await supabase
    .from("matches")
    .select(
      `
      id,
      bet_amount,
      created_at,
      games (name),
      users!matches_player1_id_fkey (username, display_name, avatar_url)
    `,
    )
    .eq("status", "waiting")
    .order("created_at", { ascending: false })
    .limit(10)

  // Get active match counts per game
  const { data: matchCounts = [] } = await supabase
    .from("matches")
    .select("game_id")
    .in("status", ["waiting", "in_progress"])

  const gameMatchCounts = matchCounts.reduce(
    (acc, match) => {
      acc[match.game_id] = (acc[match.game_id] || 0) + 1
      return acc
    },
    {} as Record<string, number>,
  )

  return (
    <div className="min-h-screen bg-gray-950">
      <Header user={user} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Games Lobby</h1>
          <p className="text-gray-400">Choose your game and test your skills against other players</p>
        </div>

        {/* Games Grid */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-6">Available Games</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {games.map((game) => (
              <GameCard
                key={game.id}
                game={game}
                activeMatches={gameMatchCounts[game.id] || 0}
                onlineUsers={Math.floor(Math.random() * 50) + 10} // Mock data
              />
            ))}
          </div>
        </div>

        {/* Waiting Matches */}
        <div className="grid lg:grid-cols-2 gap-8">
          <MatchList
            matches={waitingMatches}
            currentUserId={user.username}
            title="Open Matches"
            description="Join an existing match or create your own"
          />

          {/* Quick Stats */}
          <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Lobby Stats</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Players Online</span>
                <div className="flex items-center text-green-400">
                  <div className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></div>
                  <span className="font-semibold">1,247</span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Active Matches</span>
                <span className="text-white font-semibold">
                  {Object.values(gameMatchCounts).reduce((a, b) => a + b, 0)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Waiting Matches</span>
                <span className="text-yellow-400 font-semibold">{waitingMatches.length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Total Prize Pool</span>
                <span className="text-cyan-400 font-semibold">
                  {waitingMatches.reduce((sum, match) => sum + match.bet_amount * 2, 0).toLocaleString()} tokens
                </span>
              </div>
            </div>

            {/* Recent Winners */}
            <div className="mt-6 pt-6 border-t border-gray-800">
              <h4 className="text-white font-medium mb-3">Recent Winners</h4>
              <div className="space-y-2">
                {["MathWizard", "ConnectPro", "TriviaKing"].map((winner, index) => (
                  <div key={winner} className="flex items-center justify-between text-sm">
                    <span className="text-gray-300">@{winner}</span>
                    <span className="text-green-400 font-medium">+{(index + 1) * 50} tokens</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

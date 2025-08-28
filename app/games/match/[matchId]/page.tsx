import { createClient, isSupabaseConfigured } from "@/lib/supabase/server"
import { redirect, notFound } from "next/navigation"
import Header from "@/components/navigation/header"
import MatchInterface from "@/components/games/match-interface"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Trophy, Users, Clock } from "lucide-react"
import Link from "next/link"

interface MatchPageProps {
  params: {
    matchId: string
  }
}

export default async function MatchPage({ params }: MatchPageProps) {
  if (!isSupabaseConfigured) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-950">
        <h1 className="text-2xl font-bold mb-4 text-white">Connect Supabase to get started</h1>
      </div>
    )
  }

  const supabase = createClient()
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()

  if (!authUser) {
    redirect("/auth/login")
  }

  // Get user profile data
  const { data: user } = await supabase.from("users").select("*").eq("id", authUser.id).single()

  if (!user) {
    redirect("/auth/login")
  }

  // Get match data with detailed information
  const { data: match } = await supabase
    .from("matches")
    .select(`
      *,
      games (name, description, min_bet, max_bet),
      player1:users!matches_player1_id_fkey (id, username, display_name, avatar_url),
      player2:users!matches_player2_id_fkey (id, username, display_name, avatar_url)
    `)
    .eq("id", params.matchId)
    .single()

  if (!match) {
    notFound()
  }

  // Check if user is part of this match
  const isPlayer1 = match.player1_id === user.id
  const isPlayer2 = match.player2_id === user.id
  const isInMatch = isPlayer1 || isPlayer2

  // Handle match completion
  const handleMatchComplete = async (winnerId: string | null) => {
    // This will be handled by the real-time system
    // The match status and winner will be updated automatically
    console.log("Match completed, winner:", winnerId)
  }

  return (
    <div className="min-h-screen bg-gray-950">
      <Header user={user} />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Navigation */}
        <div className="mb-6">
          <Button asChild variant="outline" className="border-gray-700 text-gray-300 hover:text-white bg-transparent">
            <Link href="/games">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Games
            </Link>
          </Button>
        </div>

        {/* Match Header */}
        <Card className="bg-gray-900/50 border-gray-800 mb-8">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-white text-2xl flex items-center">
                  <Trophy className="mr-3 h-6 w-6 text-orange-400" />
                  {match.games?.name} Match
                </CardTitle>
                <p className="text-gray-400 mt-2">Match #{match.id.slice(0, 8)}</p>
              </div>
              <div className="flex items-center space-x-3">
                <Badge className="bg-orange-500/20 text-orange-400 text-lg px-4 py-2">
                  <Trophy className="mr-2 h-4 w-4" />
                  {match.bet_amount * 2} tokens
                </Badge>
                <Badge
                  className={`${
                    match.status === "waiting"
                      ? "bg-yellow-500/20 text-yellow-400"
                      : match.status === "in_progress"
                      ? "bg-green-500/20 text-green-400"
                      : match.status === "completed"
                      ? "bg-blue-500/20 text-blue-400"
                      : "bg-gray-500/20 text-gray-400"
                  }`}
                >
                  {match.status === "waiting" ? "Waiting" : 
                   match.status === "in_progress" ? "In Progress" : 
                   match.status === "completed" ? "Completed" : "Cancelled"}
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Player 1 */}
              <div className={`p-4 rounded-lg ${isPlayer1 ? "bg-orange-500/20 border border-orange-500/30" : "bg-gray-800/30"}`}>
                <div className="text-center">
                  <div className="text-sm text-gray-400 mb-2">Player 1</div>
                  <div className="text-white font-semibold text-lg">
                    {match.player1?.display_name || match.player1?.username}
                  </div>
                  {isPlayer1 && (
                    <Badge className="mt-2 bg-orange-500/20 text-orange-400">You</Badge>
                  )}
                </div>
              </div>

              {/* VS */}
              <div className="flex items-center justify-center">
                <div className="text-center">
                  <div className="text-3xl font-bold text-gray-400 mb-2">VS</div>
                  {match.status === "waiting" && !match.player2_id && (
                    <div className="text-sm text-gray-500">Waiting for opponent</div>
                  )}
                  {match.status === "in_progress" && (
                    <div className="text-sm text-green-400">Game in progress</div>
                  )}
                  {match.status === "completed" && (
                    <div className="text-sm text-blue-400">Match completed</div>
                  )}
                </div>
              </div>

              {/* Player 2 */}
              <div className={`p-4 rounded-lg ${isPlayer2 ? "bg-orange-500/20 border border-orange-500/30" : "bg-gray-800/30"}`}>
                <div className="text-center">
                  <div className="text-sm text-gray-400 mb-2">Player 2</div>
                  {match.player2 ? (
                    <>
                      <div className="text-white font-semibold text-lg">
                        {match.player2.display_name || match.player2.username}
                      </div>
                      {isPlayer2 && (
                        <Badge className="mt-2 bg-orange-500/20 text-orange-400">You</Badge>
                      )}
                    </>
                  ) : (
                    <div className="text-gray-400">Waiting...</div>
                  )}
                </div>
              </div>
            </div>

            {/* Match Info */}
            <div className="mt-6 pt-6 border-t border-gray-800">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div className="text-center">
                  <div className="text-gray-400">Created</div>
                  <div className="text-white">
                    {new Date(match.created_at).toLocaleDateString()}
                  </div>
                </div>
                {match.started_at && (
                  <div className="text-center">
                    <div className="text-gray-400">Started</div>
                    <div className="text-white">
                      {new Date(match.started_at).toLocaleDateString()}
                    </div>
                  </div>
                )}
                {match.completed_at && (
                  <div className="text-center">
                    <div className="text-gray-400">Completed</div>
                    <div className="text-white">
                      {new Date(match.completed_at).toLocaleDateString()}
                    </div>
                  </div>
                )}
                <div className="text-center">
                  <div className="text-gray-400">Bet Amount</div>
                  <div className="text-orange-400 font-semibold">
                    {match.bet_amount} tokens
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Game Interface */}
        <MatchInterface
          match={match}
          currentUser={user}
          onMatchComplete={handleMatchComplete}
        />

        {/* Match Actions */}
        {match.status === "waiting" && !isInMatch && (
          <Card className="bg-gray-900/50 border-yellow-500/20 mt-6">
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                <div className="text-xl text-white">Join this match?</div>
                <p className="text-gray-400">
                  Bet {match.bet_amount} tokens to challenge {match.player1?.display_name || match.player1?.username}
                </p>
                <Button className="btn-primary">
                  <Users className="mr-2 h-4 w-4" />
                  Join Match
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  )
}

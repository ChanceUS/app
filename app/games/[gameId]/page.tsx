import { createClient, isSupabaseConfigured } from "@/lib/supabase/server"
import { redirect, notFound } from "next/navigation"
import Header from "@/components/navigation/header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Users, Clock, Zap, Coins, DollarSign } from "lucide-react"
import Link from "next/link"
import MatchmakingInterface from "@/components/games/matchmaking-interface"

interface GameLobbyPageProps {
  params: {
    gameId: string
  }
}

export default async function GameLobbyPage({ params }: GameLobbyPageProps) {
  if (!isSupabaseConfigured) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-950">
        <h1 className="text-2xl font-bold mb-4 text-white">Connect Supabase to get started</h1>
      </div>
    )
  }

  const supabase = await createClient()
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

  // Get game data
  const { data: game } = await supabase
    .from("games")
    .select("*")
    .eq("id", params.gameId)
    .eq("is_active", true)
    .single()

  if (!game) {
    notFound()
  }

  // Get active matchmaking queue entries for this game
  const { data: matchmakingQueues = [] } = await supabase
    .from("matchmaking_queue")
    .select(
      `
      id,
      game_id,
      bet_amount,
      match_type,
      expires_at,
      created_at,
      users (username, display_name, avatar_url)
    `,
    )
    .eq("game_id", params.gameId)
    .eq("status", "waiting")
    .neq("user_id", authUser.id) // Don't show user's own queue entries
    .gt("expires_at", new Date().toISOString()) // Only show non-expired entries
    .order("created_at", { ascending: false })
    .limit(20)

  // Get waiting matches for this game
  const { data: waitingMatches = [] } = await supabase
    .from("matches")
    .select(
      `
      id,
      bet_amount,
      created_at,
      player1:users!matches_player1_id_fkey (username, display_name, avatar_url)
    `,
    )
    .eq("game_id", params.gameId)
    .eq("status", "waiting")
    .is("player2_id", null)
    .neq("player1_id", authUser.id)
    .order("created_at", { ascending: false })
    .limit(10)

  const gameIcons = {
    "Math Blitz": "🧮",
    "4 In a Row": "🔴",
    "Trivia Challenge": "🧠",
  }

  const gameColors = {
    "Math Blitz": "text-cyan-400",
    "4 In a Row": "text-yellow-400", 
    "Trivia Challenge": "text-purple-400",
  }

  return (
    <div className="min-h-screen bg-black">
      <Header user={user} />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Navigation */}
        <div className="mb-6">
          <Button asChild variant="outline" className="border-gray-600 text-gray-300 hover:bg-gray-800">
            <Link href="/games">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Games
            </Link>
          </Button>
        </div>

        {/* Game Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-4 mb-4">
            <div className="text-6xl">{gameIcons[game.name as keyof typeof gameIcons] || "🎮"}</div>
            <div>
              <h1 className="text-4xl font-bold text-white">{game.name} Lobby</h1>
              <p className="text-gray-400 text-lg">{game.description}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <Badge className="bg-gray-800 text-gray-300">
              Bet Range: {game.min_bet} - {game.max_bet} tokens
            </Badge>
            <Badge className={`${gameColors[game.name as keyof typeof gameColors]} bg-opacity-20`}>
              {matchmakingQueues.length + waitingMatches.length} players waiting
            </Badge>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Live Matchmaking */}
          <Card className="bg-gray-900/50 border-gray-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <Zap className="mr-2 h-5 w-5 text-orange-400" />
                Live Matchmaking
              </CardTitle>
              <p className="text-gray-400 text-sm">Players actively searching for opponents</p>
            </CardHeader>
            <CardContent>
              {matchmakingQueues.length > 0 ? (
                <div className="space-y-3">
                  {matchmakingQueues.map((queue) => {
                    const timeLeft = Math.max(0, Math.floor((new Date(queue.expires_at).getTime() - new Date().getTime()) / 1000))
                    const minutes = Math.floor(timeLeft / 60)
                    const seconds = timeLeft % 60
                    
                    return (
                      <div key={queue.id} className="bg-gray-800/30 p-4 rounded-lg border border-gray-700">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center">
                              <span className="text-black text-lg font-bold">⚡</span>
                            </div>
                            <div>
                              <div className="text-white font-medium">
                                {queue.users?.display_name || queue.users?.username}
                              </div>
                              <div className="text-gray-400 text-sm">
                                {queue.match_type === 'free' ? 'Free Play' : 
                                 queue.match_type === 'tokens' ? `${queue.bet_amount} tokens` :
                                 queue.match_type === 'cash5' ? '$5 Cash Pool' : '$10 Cash Pool'}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-orange-400 font-bold text-lg">
                              {minutes}:{seconds.toString().padStart(2, '0')}
                            </div>
                            <div className="text-gray-400 text-xs">Time left</div>
                          </div>
                        </div>
                        <Button 
                          className="w-full bg-orange-500 hover:bg-orange-600 text-black font-semibold"
                          onClick={() => {
                            // This would join the matchmaking queue
                            window.location.href = `/games/${game.id}/create?join=${queue.id}`
                          }}
                        >
                          Join Matchmaking
                        </Button>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">⚡</div>
                  <div className="text-gray-400 mb-2">No active matchmaking</div>
                  <div className="text-gray-500 text-sm">Be the first to start searching!</div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Waiting Matches */}
          <Card className="bg-gray-900/50 border-gray-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <Users className="mr-2 h-5 w-5 text-blue-400" />
                Open Matches
              </CardTitle>
              <p className="text-gray-400 text-sm">Traditional matches waiting for players</p>
            </CardHeader>
            <CardContent>
              {waitingMatches.length > 0 ? (
                <div className="space-y-3">
                  {waitingMatches.map((match) => (
                    <div key={match.id} className="bg-gray-800/30 p-4 rounded-lg border border-gray-700">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                            <span className="text-white text-lg font-bold">P</span>
                          </div>
                          <div>
                            <div className="text-white font-medium">
                              {match.player1?.display_name || match.player1?.username}
                            </div>
                            <div className="text-gray-400 text-sm">
                              {match.bet_amount} tokens
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-gray-400 text-sm">
                            {new Date(match.created_at).toLocaleDateString()}
                          </div>
                          <div className="text-gray-500 text-xs">
                            {new Date(match.created_at).toLocaleTimeString()}
                          </div>
                        </div>
                      </div>
                      <Button 
                        asChild
                        className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold"
                      >
                        <Link href={`/games/match/${match.id}`}>
                          View Match
                        </Link>
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">👥</div>
                  <div className="text-gray-400 mb-2">No open matches</div>
                  <div className="text-gray-500 text-sm">Create a match to get started!</div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Practice & Quick Start */}
        <div className="mt-8 grid lg:grid-cols-2 gap-8">
          {/* Practice Mode */}
          <Card className="bg-gray-900/50 border-gray-800">
            <CardHeader>
              <CardTitle className="text-white">Practice Mode</CardTitle>
              <p className="text-gray-400 text-sm">Play solo to practice your skills</p>
            </CardHeader>
            <CardContent>
              <Button 
                asChild
                className="w-full bg-gray-600 hover:bg-gray-700 text-white font-semibold"
              >
                <Link href={`/games/${game.id}/play`}>
                  <Zap className="mr-2 h-4 w-4" />
                  Practice {game.name}
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* Quick Start */}
          <Card className="bg-gray-900/50 border-gray-800">
            <CardHeader>
              <CardTitle className="text-white">Quick Start</CardTitle>
              <p className="text-gray-400 text-sm">Start your own matchmaking session</p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                <Button 
                  asChild
                  className="bg-green-500 hover:bg-green-600 text-black font-semibold"
                >
                  <Link href={`/games/${game.id}/create?tier=free`}>
                    <Zap className="mr-2 h-4 w-4" />
                    Free Play
                  </Link>
                </Button>
                <Button 
                  asChild
                  className="bg-yellow-500 hover:bg-yellow-600 text-black font-semibold"
                >
                  <Link href={`/games/${game.id}/create?tier=tokens`}>
                    <Coins className="mr-2 h-4 w-4" />
                    100 Tokens
                  </Link>
                </Button>
                <Button 
                  asChild
                  className="bg-blue-500 hover:bg-blue-600 text-white font-semibold"
                >
                  <Link href={`/games/${game.id}/create?tier=cash5`}>
                    <DollarSign className="mr-2 h-4 w-4" />
                    $5 Cash
                  </Link>
                </Button>
                <Button 
                  asChild
                  className="bg-purple-500 hover:bg-purple-600 text-white font-semibold"
                >
                  <Link href={`/games/${game.id}/create?tier=cash10`}>
                    <DollarSign className="mr-2 h-4 w-4" />
                    $10 Cash
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}

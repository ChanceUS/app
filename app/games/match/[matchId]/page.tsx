"use client"

import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import Header from "@/components/navigation/header"
import EnhancedMatchInterface from "@/components/games/enhanced-match-interface"
import StartGameButton from "@/components/games/start-game-button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Trophy, Users, Clock } from "lucide-react"
import Link from "next/link"

interface MatchPageProps {
  params: {
    matchId: string
  }
}

export default function MatchPage({ params }: MatchPageProps) {
  const [match, setMatch] = useState<any>(null)
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [matchId, setMatchId] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  console.log('🎮 MatchPage component loaded!', { params })

  // Await params first
  useEffect(() => {
    const getParams = async () => {
      const resolvedParams = await params
      setMatchId(resolvedParams.matchId)
    }
    getParams()
  }, [params])

  useEffect(() => {
    if (!matchId) return

    const loadData = async () => {
      try {
        // Get user
        const { data: { user: authUser } } = await supabase.auth.getUser()
        if (!authUser) {
          router.push("/auth/login")
          return
        }

        // Get user profile
        const { data: userData } = await supabase.from("users").select("*").eq("id", authUser.id).single()
        if (!userData) {
          router.push("/auth/login")
          return
        }
        setUser(userData)

        // Get match data
        const { data: matchData } = await supabase
          .from("matches")
          .select(`
            *,
            games (name, description, min_bet, max_bet),
            player1:users!matches_player1_id_fkey (id, username, display_name, avatar_url),
            player2:users!matches_player2_id_fkey (id, username, display_name, avatar_url)
          `)
          .eq("id", matchId)
          .single()

        if (!matchData) {
          router.push("/games")
          return
        }

        setMatch(matchData)
      } catch (error) {
        console.error("Error loading data:", error)
        router.push("/games")
      } finally {
        setLoading(false)
      }
    }

    loadData()

    // Poll for match updates every 2 seconds
    const pollInterval = setInterval(loadData, 2000)
    
    // Set up real-time subscription for immediate updates
    const channel = supabase
      .channel(`match-${matchId}`)
      .on('postgres_changes', 
        { 
          event: 'UPDATE', 
          schema: 'public', 
          table: 'matches', 
          filter: `id=eq.${matchId}` 
        }, 
        (payload) => {
          console.log('🔄 Match updated via real-time:', payload.new)
          setMatch(payload.new)
        }
      )
      .subscribe()
    
    return () => {
      clearInterval(pollInterval)
      supabase.removeChannel(channel)
    }
  }, [matchId, router, supabase])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    )
  }

  if (!match || !user) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-white text-xl">Match not found</div>
      </div>
    )
  }

  // Check if user is part of this match
  const isPlayer1 = match.player1_id === user.id
  const isPlayer2 = match.player2_id === user.id
  const isInMatch = isPlayer1 || isPlayer2

  // Debug logging
  console.log('🔍 DEBUG Match Page:', {
    matchStatus: match.status,
    isPlayer1,
    isPlayer2,
    isInMatch,
    player1Id: match.player1_id,
    player2Id: match.player2_id,
    userId: user.id,
    shouldShowStartButton: match.status === "waiting" && isPlayer1
  })

  return (
    <div className="min-h-screen bg-gray-950 relative">
      <Header user={user} />
      
      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-950/20 via-purple-950/10 to-transparent pointer-events-none"></div>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        {/* Navigation */}
        <div className="mb-6">
          <Link href="/games" className="inline-flex items-center text-gray-300 hover:text-white bg-transparent border border-gray-700 rounded px-4 py-2">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Games
          </Link>
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
                  <Trophy className="mr-2 h-4 w-6" />
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
        </Card>

        {/* Start Match Button - Show for both players when match is waiting */}
        {match.status === "waiting" && (
          <div className="text-center mt-6 mb-6">
            <button 
              onClick={async () => {
                try {
                  // Get current game_data
                  const { data: currentMatch } = await supabase
                    .from('matches')
                    .select('game_data')
                    .eq('id', match.id)
                    .single()
                  
                  const gameData = currentMatch?.game_data || {}
                  const playerKey = isPlayer1 ? 'player1_ready' : 'player2_ready'
                  const opponentKey = isPlayer1 ? 'player2_ready' : 'player1_ready'
                  
                  // Mark current player as ready
                  const updatedGameData = {
                    ...gameData,
                    [playerKey]: true
                  }
                  
                  // Check if both players are ready
                  const bothReady = updatedGameData.player1_ready && updatedGameData.player2_ready
                  
                  if (bothReady) {
                    // Both players ready - start the match with countdown
                    const { error } = await supabase
                      .from('matches')
                      .update({ 
                        status: 'in_progress', 
                        started_at: new Date().toISOString(),
                        game_data: updatedGameData
                      })
                      .eq('id', match.id)
                    
                    if (error) {
                      console.error('Error starting match:', error)
                    } else {
                      console.log('Match started! Both players ready.')
                      setMatch((prev: any) => ({ 
                        ...prev, 
                        status: 'in_progress', 
                        started_at: new Date().toISOString(),
                        game_data: updatedGameData
                      }))
                    }
                  } else {
                    // Only current player ready - update game_data
                    const { error } = await supabase
                      .from('matches')
                      .update({ game_data: updatedGameData })
                      .eq('id', match.id)
                    
                    if (error) {
                      console.error('Error updating player readiness:', error)
                    } else {
                      console.log(`${isPlayer1 ? 'Player 1' : 'Player 2'} is ready. Waiting for opponent...`)
                      setMatch((prev: any) => ({ 
                        ...prev, 
                        game_data: updatedGameData
                      }))
                    }
                  }
                } catch (error) {
                  console.error('Error starting match:', error)
                }
              }}
              className="bg-green-500 hover:bg-green-600 text-white px-8 py-3 rounded-lg font-semibold transition-colors"
            >
              {match.game_data?.player1_ready && match.game_data?.player2_ready 
                ? 'Both Players Ready!' 
                : 'I\'m Ready!'}
            </button>
            
            {/* Show readiness status */}
            <div className="mt-2 text-sm text-gray-400">
              {match.game_data?.player1_ready && match.game_data?.player2_ready ? (
                <span className="text-green-400">Both players ready! Match starting...</span>
              ) : (
                <span>
                  {match.game_data?.player1_ready && isPlayer1 ? 'You\'re ready! ' : ''}
                  {match.game_data?.player2_ready && isPlayer2 ? 'You\'re ready! ' : ''}
                  {match.game_data?.player1_ready && match.game_data?.player2_ready 
                    ? 'Waiting for match to start...' 
                    : 'Waiting for both players to be ready...'}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Game Interface */}
        <EnhancedMatchInterface
          match={match}
          currentUser={user}
          onMatchComplete={(winnerId) => {
            console.log('Match completed, winner:', winnerId)
            // The component will handle the match completion
          }}
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
                <div className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded cursor-pointer inline-flex items-center">
                  <Users className="mr-2 h-4 w-4" />
                  Join Match
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {match.status === "waiting" && isInMatch && !match.player2_id && (
          <Card className="bg-gray-900/50 border-yellow-500/20 mt-6">
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                <div className="text-xl text-white">Waiting for opponent...</div>
                <p className="text-gray-400">
                  Share this match link with a friend to start playing!
                </p>
                <div className="bg-gray-800 p-3 rounded text-sm text-gray-300 font-mono">
                  {typeof window !== 'undefined' ? window.location.href : 'Loading...'}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

      </main>
    </div>
  )
}

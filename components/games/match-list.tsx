"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Clock, Users, Zap, X } from "lucide-react"
import { joinMatch, cancelMatch } from "@/lib/game-actions"
import { useRouter } from "next/navigation"

interface Match {
  id: string
  bet_amount: number
  created_at: string
  player1_id: string
  games: {
    name: string
  }
  player1: {
    username: string
    display_name?: string
    avatar_url?: string
  }
}

interface MatchListProps {
  matches: Match[]
  currentUserId: string
  title: string
  description: string
}

export default function MatchList({ matches, currentUserId, title, description }: MatchListProps) {
  const router = useRouter()
  const [joiningMatch, setJoiningMatch] = useState<string | null>(null)
  const [cancellingMatch, setCancellingMatch] = useState<string | null>(null)

  const handleJoinMatch = async (matchId: string) => {
    try {
      setJoiningMatch(matchId)
      console.log("🎮 Attempting to join match:", matchId)
      const result = await joinMatch(matchId)
      console.log("🎮 Join match result:", result)
      if (result?.success && result?.matchId) {
        console.log("🎮 Redirecting to match page:", `/games/match/${result.matchId}`)
        // Navigate to the match page after successful join
        router.push(`/games/match/${result.matchId}`)
      } else {
        console.log("❌ Join match failed - no success or matchId")
      }
    } catch (error) {
      console.error("Failed to join match:", error)
      // In a real app, you'd show a toast notification here
    } finally {
      setJoiningMatch(null)
    }
  }

  const handleCancelMatch = async (matchId: string) => {
    try {
      setCancellingMatch(matchId)
      console.log(`🎯 Attempting to cancel match ${matchId} for user ${currentUserId}`)
      console.log(`🎯 Current user ID:`, currentUserId)
      console.log(`🎯 Match ID:`, matchId)
      
      const result = await cancelMatch(matchId)
      console.log(`🎯 Cancel result:`, result)
      
      if (result?.success) {
        console.log(`✅ Match ${matchId} cancelled successfully, redirecting to games...`)
        // Redirect to games page after successful cancellation
        window.location.href = "/games"
      } else {
        console.error("❌ Cancel failed:", result)
        alert("Failed to cancel match. It may have already been joined or cancelled.")
      }
    } catch (error) {
      console.error("❌ Failed to cancel match:", error)
      console.error("❌ Error details:", {
        message: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined
      })
      alert("Failed to cancel match: " + (error instanceof Error ? error.message : "Unknown error"))
    } finally {
      setCancellingMatch(null)
    }
  }

  return (
    <Card className="bg-gray-900/50 border-gray-800">
      <CardHeader>
        <CardTitle className="text-white">{title}</CardTitle>
        <CardDescription className="text-gray-400">{description}</CardDescription>
      </CardHeader>
      <CardContent>
        {matches.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No matches available</p>
            <p className="text-sm">Create a new match to get started</p>
          </div>
        ) : (
          <div className="space-y-4">
            {matches.map((match) => (
              <div
                key={match.id}
                className="flex items-center justify-between p-4 bg-gray-800/30 rounded-lg hover:bg-gray-800/50 transition-colors"
              >
                <div className="flex items-center space-x-4">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={match.player1?.avatar_url || ""} alt={match.player1?.username || "Player"} />
                    <AvatarFallback className="bg-gradient-to-br from-cyan-500 to-yellow-500 text-black font-semibold">
                      {match.player1?.username?.charAt(0).toUpperCase() || "P"}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-white font-medium">{match.games.name}</span>
                      <Badge className="bg-yellow-500/20 text-yellow-400">{match.bet_amount} tokens</Badge>
                    </div>
                    <div className="text-sm text-gray-400 flex items-center">
                      <span>by @{match.player1?.username || "Unknown"}</span>
                      <Clock className="h-3 w-3 ml-2 mr-1" />
                      <span>
                        {new Date(match.created_at).toLocaleDateString("en-US", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {match.player1_id === currentUserId ? (
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-red-500/50 text-red-400 hover:bg-red-500/10 bg-transparent"
                      onClick={() => handleCancelMatch(match.id)}
                      disabled={cancellingMatch === match.id}
                    >
                      <X className="h-4 w-4 mr-1" />
                      {cancellingMatch === match.id ? "Cancelling..." : "Cancel"}
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      className="bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 text-black font-semibold"
                      onClick={() => handleJoinMatch(match.id)}
                      disabled={joiningMatch === match.id}
                    >
                      <Zap className="h-4 w-4 mr-1" />
                      {joiningMatch === match.id ? "Joining..." : "Join Match"}
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

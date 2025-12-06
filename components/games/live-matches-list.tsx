"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Eye, Users, Clock, Zap } from "lucide-react"
import Link from "next/link"
import { formatDistanceToNow } from "date-fns"

interface LiveMatch {
  id: string
  bet_amount: number
  status: string
  started_at?: string
  created_at: string
  player1_id: string
  player2_id?: string
  games: {
    id: string
    name: string
  }
  player1: {
    id: string
    username: string
    display_name?: string
    avatar_url?: string
  }
  player2?: {
    id: string
    username: string
    display_name?: string
    avatar_url?: string
  }
}

interface LiveMatchesListProps {
  matches: LiveMatch[]
  title: string
  description: string
  currentUserId: string
}

// Function to override game names
const getDisplayName = (gameName: string) => {
  if (gameName === "Connect 4") return "Four in a Row"
  return gameName
}

export default function LiveMatchesList({
  matches,
  title,
  description,
  currentUserId,
}: LiveMatchesListProps) {
  if (matches.length === 0) {
    return null
  }

  return (
    <Card className="bg-gray-900/50 border-gray-800">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Zap className="h-5 w-5 text-yellow-400" />
          {title}
        </CardTitle>
        <CardDescription className="text-gray-400">{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {matches.map((match) => {
            const hasBothPlayers = match.player1 && match.player2
            const matchDuration = match.started_at
              ? formatDistanceToNow(new Date(match.started_at), { addSuffix: false })
              : null

            return (
              <div
                key={match.id}
                className="flex items-center justify-between p-4 bg-gray-800/30 rounded-lg hover:bg-gray-800/50 transition-colors border border-gray-700/50"
              >
                <div className="flex items-center space-x-4 flex-1">
                  {/* Game Icon/Info */}
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center">
                      <span className="text-2xl">
                        {match.games.name === "Math Blitz" ? "🧮" : match.games.name === "Trivia Challenge" ? "❓" : "🔴"}
                      </span>
                    </div>
                  </div>

                  {/* Match Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="text-white font-medium">{getDisplayName(match.games.name)}</span>
                      <Badge className="bg-yellow-500/20 text-yellow-400">{match.bet_amount} tokens</Badge>
                      {match.status === "in_progress" && (
                        <Badge className="bg-green-500/20 text-green-400 flex items-center gap-1">
                          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                          Live
                        </Badge>
                      )}
                    </div>

                    {/* Players */}
                    <div className="flex items-center space-x-3 text-sm">
                      <div className="flex items-center space-x-2">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={match.player1?.avatar_url || ""} />
                          <AvatarFallback className="text-xs bg-blue-500/20 text-blue-400">
                            {match.player1?.username?.charAt(0).toUpperCase() || "P1"}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-gray-300">@{match.player1?.username || "Player1"}</span>
                      </div>

                      <span className="text-gray-500">vs</span>

                      {hasBothPlayers ? (
                        <div className="flex items-center space-x-2">
                          <Avatar className="h-6 w-6">
                            <AvatarImage src={match.player2?.avatar_url || ""} />
                            <AvatarFallback className="text-xs bg-purple-500/20 text-purple-400">
                              {match.player2?.username?.charAt(0).toUpperCase() || "P2"}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-gray-300">@{match.player2?.username || "Player2"}</span>
                        </div>
                      ) : (
                        <span className="text-gray-500">Waiting for player...</span>
                      )}
                    </div>

                    {/* Match Duration */}
                    {matchDuration && (
                      <div className="flex items-center space-x-1 text-xs text-gray-500 mt-1">
                        <Clock className="h-3 w-3" />
                        <span>Started {matchDuration} ago</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Watch Button */}
                <div className="flex-shrink-0 ml-4">
                  <Button
                    asChild
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <Link href={`/games/match/${match.id}`}>
                      <Eye className="h-4 w-4 mr-2" />
                      Watch
                    </Link>
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}


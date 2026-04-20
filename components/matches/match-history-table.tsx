"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Clock, Users, Zap, X, Trophy, Eye, Filter } from "lucide-react"
import Link from "next/link"

interface MatchHistoryItem {
  id: string
  bet_amount: number
  status: string
  winner_id?: string
  started_at?: string
  completed_at?: string
  created_at: string
  games: {
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

interface MatchHistoryTableProps {
  matches: MatchHistoryItem[]
  currentUserId: string
}

export default function MatchHistoryTable({ matches, currentUserId }: MatchHistoryTableProps) {
  // Debug: Log the matches data to see what we're working with
  console.log('🔍 MatchHistoryTable - matches data:', matches)
  console.log('🔍 MatchHistoryTable - currentUserId:', currentUserId)

  const getMatchResult = (match: MatchHistoryItem) => {
    // Handle cases where match data might be incomplete
    if (!match || !match.status) {
      console.warn('Match data is incomplete:', match)
      return "ongoing"
    }
    
    if (match.status !== "completed") return "ongoing"
    if (!match.winner_id) return "draw"
    return match.winner_id === currentUserId ? "won" : "lost"
  }

  const getOpponent = (match: MatchHistoryItem) => {
    // Handle cases where player data might be null
    if (!match.player1) {
      console.warn('Player 1 data is missing for match:', match.id)
      return match.player2 || null
    }
    
    if (!match.player2) {
      console.warn('Player 2 data is missing for match:', match.id)
      return match.player1
    }
    
    return match.player1.id === currentUserId ? match.player2 : match.player1
  }

  const getResultBadge = (result: string) => {
    switch (result) {
      case "won":
        return <Badge className="bg-green-500/20 text-green-400">Won</Badge>
      case "lost":
        return <Badge className="bg-red-500/20 text-red-400">Lost</Badge>
      case "draw":
        return <Badge className="bg-gray-500/20 text-gray-400">Draw</Badge>
      default:
        return <Badge className="bg-yellow-500/20 text-yellow-400">Ongoing</Badge>
    }
  }

  const getTokenChange = (match: MatchHistoryItem, result: string) => {
    // Handle cases where match data might be incomplete
    if (!match || typeof match.bet_amount !== 'number') {
      console.warn('Match bet_amount is missing or invalid:', match)
      return "0"
    }
    
    if (result === "won") return `+${match.bet_amount * 2}`
    if (result === "lost") return `-${match.bet_amount}`
    if (result === "draw") return `+${match.bet_amount}` // Refund
    return "0"
  }

  return (
    <Card className="bg-gray-900/50 border-gray-800">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-white">Match History</CardTitle>
          <CardDescription className="text-gray-400">Your complete gaming record</CardDescription>
        </div>
        <Button variant="outline" size="sm" className="border-gray-700 text-gray-300 hover:text-white bg-transparent">
          <Filter className="mr-2 h-4 w-4" />
          Filter
        </Button>
      </CardHeader>
      <CardContent>
        {matches.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <Trophy className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No matches played yet</p>
            <p className="text-sm">Start playing to build your match history</p>
          </div>
        ) : (
          <div className="space-y-4">
            {matches
              .map((match) => {
                // Skip matches with incomplete data
                if (!match || !match.player1) {
                  console.warn('Skipping match with incomplete data:', match)
                  return null
                }
                
                const result = getMatchResult(match)
                const opponent = getOpponent(match)
                const tokenChange = getTokenChange(match, result)

                return (
                  <div
                    key={match.id}
                    className="flex items-center justify-between p-4 bg-gray-800/30 rounded-lg hover:bg-gray-800/50 transition-colors"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="text-2xl">
                        {match.games.name === "Math Blitz" && "🧮"}
                        {match.games.name === "4 In a Row" && "🔴"}
                        {match.games.name === "Trivia Challenge" && "🧠"}
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="text-white font-medium">{match.games.name}</span>
                          {getResultBadge(result)}
                        </div>
                        <div className="text-sm text-gray-400 flex items-center space-x-4">
                          {opponent ? (
                            <div className="flex items-center space-x-2">
                              <Avatar className="h-5 w-5">
                                <AvatarImage src={opponent.avatar_url || ""} alt={opponent.username} />
                                <AvatarFallback className="text-xs bg-gradient-to-br from-cyan-500 to-yellow-500 text-black">
                                  {opponent.username.charAt(0).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <span>vs @{opponent.username}</span>
                            </div>
                          ) : (
                            <span>vs Unknown</span>
                          )}
                          <div className="flex items-center">
                            <Clock className="h-3 w-3 mr-1" />
                            <span>
                              {new Date(match.completed_at || match.created_at).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <div
                          className={`font-semibold ${
                            result === "won" ? "text-green-400" : result === "lost" ? "text-red-400" : "text-gray-400"
                          }`}
                        >
                          {tokenChange} tokens
                        </div>
                        <div className="text-sm text-gray-400">Bet: {match.bet_amount}</div>
                      </div>
                      <Button
                        asChild
                        variant="outline"
                        size="sm"
                        className="border-gray-700 text-gray-300 hover:text-white bg-transparent"
                      >
                        <Link href={`/games/match/${match.id}`}>
                          <Eye className="h-4 w-4" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                )
              })
              .filter(Boolean) // Remove null values
            }
          </div>
        )}
      </CardContent>
    </Card>
  )
}

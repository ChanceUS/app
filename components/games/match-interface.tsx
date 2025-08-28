"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useMatchRealtime } from "@/hooks/use-match-realtime"
import { supabase } from "@/lib/supabase/client"
import type { Match, User } from "@/lib/supabase/client"
import EnhancedMatchInterface from "./enhanced-match-interface"
import { 
  Users, 
  Clock, 
  Trophy, 
  AlertCircle, 
  CheckCircle, 
  XCircle,
  Play,
  Pause,
  Gamepad2
} from "lucide-react"

interface MatchInterfaceProps {
  match: Match
  currentUser: User
  onMatchComplete?: (winnerId: string | null) => void
}

export default function MatchInterface({ 
  match, 
  currentUser, 
  onMatchComplete 
}: MatchInterfaceProps) {
  const [gameName, setGameName] = useState<string>("")
  const [isLoading, setIsLoading] = useState(true)

  // Fetch game name
  useEffect(() => {
    const fetchGameName = async () => {
      try {
        const { data: game } = await supabase
          .from("games")
          .select("name")
          .eq("id", match.game_id)
          .single()

        if (game) {
          setGameName(game.name.toLowerCase().replace(/\s+/g, "-"))
        }
        setIsLoading(false)
      } catch (error) {
        console.error("Failed to fetch game name:", error)
        setIsLoading(false)
      }
    }

    fetchGameName()
  }, [match.game_id])

  if (isLoading) {
    return (
      <Card className="bg-gray-900/50 border-yellow-500/20">
        <CardContent className="pt-6">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-orange-400">Loading match...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Use enhanced match interface for all games
  return (
    <EnhancedMatchInterface
      match={match}
      currentUser={currentUser}
      onMatchComplete={onMatchComplete}
    />
  )
}

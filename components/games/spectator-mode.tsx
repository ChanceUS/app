"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Eye, EyeOff, Users } from "lucide-react"
import { joinAsSpectator, leaveSpectatorMode, getSpectators } from "@/lib/spectator-actions"
import { createClient } from "@/lib/supabase/client"
import type { User } from "@/lib/supabase/client"
import { toast } from "sonner"

interface SpectatorModeProps {
  matchId: string
  currentUser: User
  isPlayer: boolean
}

export default function SpectatorMode({ matchId, currentUser, isPlayer }: SpectatorModeProps) {
  const [isSpectating, setIsSpectating] = useState(false)
  const [spectatorCount, setSpectatorCount] = useState(0)
  const [spectators, setSpectators] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  const supabase = createClient()

  // Check if user is already spectating
  useEffect(() => {
    const checkSpectatorStatus = async () => {
      const { data } = await supabase
        .from("spectators")
        .select("id")
        .eq("match_id", matchId)
        .eq("user_id", currentUser.id)
        .single()

      setIsSpectating(!!data)
    }

    if (!isPlayer) {
      checkSpectatorStatus()
    }
  }, [matchId, currentUser.id, isPlayer])

  // Subscribe to spectator changes
  useEffect(() => {
    if (isPlayer) return

    const channel = supabase
      .channel(`spectators:${matchId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "spectators",
          filter: `match_id=eq.${matchId}`,
        },
        async () => {
          // Refresh spectator list
          const result = await getSpectators(matchId)
          if (result.data) {
            setSpectators(result.data)
            setSpectatorCount(result.data.length)
          }
        }
      )
      .subscribe()

    // Load initial spectator count
    const loadSpectators = async () => {
      const result = await getSpectators(matchId)
      if (result.data) {
        setSpectators(result.data)
        setSpectatorCount(result.data.length)
      }
    }

    loadSpectators()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [matchId, isPlayer, supabase])

  const handleJoinSpectator = async () => {
    setLoading(true)
    const result = await joinAsSpectator(matchId)
    if (result.error) {
      toast.error(result.error)
    } else {
      setIsSpectating(true)
      toast.success("You are now spectating this match")
    }
    setLoading(false)
  }

  const handleLeaveSpectator = async () => {
    setLoading(true)
    const result = await leaveSpectatorMode(matchId)
    if (result.error) {
      toast.error(result.error)
    } else {
      setIsSpectating(false)
      toast.success("You left spectator mode")
    }
    setLoading(false)
  }

  if (isPlayer) {
    // Show spectator count for players
    return (
      <Card className="bg-gray-900/80 border-gray-800">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Users className="h-4 w-4" />
            Spectators
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="bg-blue-500/20 text-blue-400">
              {spectatorCount} {spectatorCount === 1 ? "spectator" : "spectators"}
            </Badge>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-gray-900/80 border-gray-800">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Eye className="h-4 w-4" />
          Spectator Mode
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {!isSpectating ? (
          <div className="space-y-2">
            <p className="text-sm text-gray-400">
              Watch this match live without participating
            </p>
            <Button
              onClick={handleJoinSpectator}
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              <Eye className="h-4 w-4 mr-2" />
              Join as Spectator
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-sm text-green-400">You are spectating this match</p>
            <Button
              onClick={handleLeaveSpectator}
              disabled={loading}
              variant="outline"
              className="w-full"
            >
              <EyeOff className="h-4 w-4 mr-2" />
              Stop Spectating
            </Button>
          </div>
        )}
        {spectatorCount > 0 && (
          <div className="pt-2 border-t border-gray-800">
            <p className="text-xs text-gray-500 mb-1">
              {spectatorCount} {spectatorCount === 1 ? "spectator" : "spectators"} watching
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}


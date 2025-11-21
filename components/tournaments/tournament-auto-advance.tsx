"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { advanceTournamentRound } from "@/lib/tournament-actions"
import { useRouter } from "next/navigation"

interface TournamentAutoAdvanceProps {
  tournamentId: string
  currentRound: number
  status: string
  matchIds: string[] // Pass match IDs from parent
}

export default function TournamentAutoAdvance({
  tournamentId,
  currentRound,
  status,
  matchIds,
}: TournamentAutoAdvanceProps) {
  const router = useRouter()
  const [isAdvancing, setIsAdvancing] = useState(false)

  useEffect(() => {
    if (status !== "in_progress" || currentRound === 0 || matchIds.length === 0) {
      return
    }

    const supabase = createClient()

    // Subscribe to match updates
    const channel = supabase
      .channel(`tournament-${tournamentId}-round-${currentRound}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "matches",
          filter: `id=in.(${matchIds.join(",")})`,
        },
        async (payload) => {
          console.log("🎮 Tournament match updated:", payload)

          // Check if match is completed
          if (payload.new.status === "completed" && !isAdvancing) {
            // Small delay to ensure all updates are processed
            setTimeout(async () => {
              if (isAdvancing) return
              setIsAdvancing(true)

              try {
                // Check if all matches in current round are completed
                const { data: tournamentMatches } = await supabase
                  .from("tournament_matches")
                  .select("*, matches(status)")
                  .eq("tournament_id", tournamentId)
                  .eq("round_number", currentRound)

                if (tournamentMatches) {
                  const allCompleted = tournamentMatches.every(
                    (tm: any) =>
                      tm.status === "completed" ||
                      tm.is_bye ||
                      tm.matches?.status === "completed"
                  )

                  if (allCompleted) {
                    console.log("✅ All matches in round completed, advancing tournament...")
                    const result = await advanceTournamentRound(tournamentId)

                    if (result.success) {
                      console.log("✅ Tournament advanced:", result)
                      router.refresh()
                    } else if (result.error) {
                      console.error("❌ Failed to advance tournament:", result.error)
                    }
                  }
                }
              } catch (error) {
                console.error("Error checking tournament advancement:", error)
              } finally {
                setIsAdvancing(false)
              }
            }, 2000) // 2 second delay
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [tournamentId, currentRound, status, matchIds, router, isAdvancing])

  return null // This component doesn't render anything
}


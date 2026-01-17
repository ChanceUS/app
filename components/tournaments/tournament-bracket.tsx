"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CheckCircle2, XCircle, ArrowRight, Trophy } from "lucide-react"
import Link from "next/link"
import type { Tournament, TournamentParticipant, TournamentMatch } from "@/lib/tournament-actions"

interface TournamentBracketProps {
  tournament: Tournament
  participants: TournamentParticipant[]
  matches: TournamentMatch[]
  currentUserId: string
}

export default function TournamentBracket({
  tournament,
  participants,
  matches,
  currentUserId,
}: TournamentBracketProps) {
  console.log("🎯 TournamentBracket render:", {
    status: tournament.status,
    matchesCount: matches.length,
    matches: matches,
    participantsCount: participants.length,
  })

  // If we have matches, show the bracket even if status is still "registration"
  // (this handles cases where status update hasn't propagated yet)
  if (tournament.status === "registration" && matches.length === 0) {
    return (
      <Card className="bg-gray-900/80 border-gray-800">
        <CardContent className="pt-6">
          <div className="text-center py-12">
            <p className="text-gray-400">
              Bracket will be generated when the tournament starts
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  // If tournament has started but no matches yet, show loading message
  if (matches.length === 0 && tournament.status === "in_progress") {
    return (
      <Card className="bg-gray-900/80 border-gray-800">
        <CardContent className="pt-6">
          <div className="text-center py-12">
            <p className="text-gray-400">
              Generating bracket...
            </p>
            <p className="text-gray-500 text-sm mt-2">
              Matches are being created. Please refresh the page.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Group matches by round
  const rounds = Array.from(new Set(matches.map((m) => m.round_number)))
    .sort((a, b) => a - b)
    .map((round) => ({
      round,
      matches: matches
        .filter((m) => m.round_number === round)
        .sort((a, b) => a.bracket_position - b.bracket_position),
    }))

  // If no rounds after grouping, show empty state
  if (rounds.length === 0) {
    return (
      <Card className="bg-gray-900/80 border-gray-800">
        <CardContent className="pt-6">
          <div className="text-center py-12">
            <p className="text-gray-400">
              No matches found. The bracket may still be generating.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Helper to get participant name by bracket position
  const getParticipantName = (bracketPosition: number | null): string => {
    if (!bracketPosition) return "TBD"
    const participant = participants.find((p) => p.bracket_position === bracketPosition)
    if (!participant) return `Player ${bracketPosition}`
    return participant.users?.display_name || participant.users?.username || `Player ${bracketPosition}`
  }

  // Helper to get participant name by user ID (for when bracket position might not match)
  const getParticipantNameByUserId = (userId: string | null | undefined): string => {
    if (!userId) return "TBD"
    const participant = participants.find((p) => p.user_id === userId)
    if (!participant) return "Unknown Player"
    return participant.users?.display_name || participant.users?.username || "Unknown Player"
  }

  // Helper to check if match is user's match
  const isUserMatch = (tm: TournamentMatch): boolean => {
    if (!tm.matches) return false
    return (
      tm.matches.player1_id === currentUserId || tm.matches.player2_id === currentUserId
    )
  }

  return (
    <Card className="bg-gray-900/80 border-gray-800">
      <CardContent className="pt-6">
        <div className="overflow-x-auto">
          <div className="flex gap-8 min-w-max pb-8">
            {rounds.map((roundData, roundIndex) => (
              <div key={roundData.round} className="flex flex-col gap-4 min-w-[280px]">
                <div className="text-center mb-4">
                  <h3 className="text-lg font-semibold text-white">
                    Round {roundData.round}
                  </h3>
                  {roundData.round === tournament.current_round && (
                    <Badge className="mt-2 bg-orange-500/20 text-orange-400 border-orange-500/30">
                      Current Round
                    </Badge>
                  )}
                </div>

                <div className="space-y-4">
                  {roundData.matches.map((tm) => {
                    const isUser = isUserMatch(tm)
                    const isCompleted = tm.status === "completed" || tm.is_bye
                    const winnerId = tm.matches?.winner_id

                    return (
                      <div
                        key={tm.id}
                        className={`p-4 rounded-lg border ${
                          isUser
                            ? "bg-orange-500/10 border-orange-500/30"
                            : "bg-gray-800/50 border-gray-700"
                        }`}
                      >
                        {tm.is_bye ? (
                          <div className="text-center py-2">
                            <p className="text-gray-400 text-sm mb-1">Bye</p>
                            <p className="text-white font-medium">
                              {getParticipantName(tm.player1_bracket_position)}
                            </p>
                            <Badge variant="outline" className="mt-2 text-xs">
                              Auto-advance
                            </Badge>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {/* Player 1 */}
                            <div
                              className={`flex items-center justify-between p-2 rounded ${
                                winnerId === tm.matches?.player1_id
                                  ? "bg-green-500/20 border border-green-500/30"
                                  : ""
                              }`}
                            >
                              <span className="text-white text-sm">
                                {getParticipantName(tm.player1_bracket_position)}
                              </span>
                              {isCompleted && (
                                <>
                                  {winnerId === tm.matches?.player1_id ? (
                                    <CheckCircle2 className="h-4 w-4 text-green-400" />
                                  ) : (
                                    <XCircle className="h-4 w-4 text-red-400" />
                                  )}
                                </>
                              )}
                            </div>

                            {/* VS */}
                            <div className="text-center text-xs text-gray-400 py-1">vs</div>

                            {/* Player 2 */}
                            <div
                              className={`flex items-center justify-between p-2 rounded ${
                                winnerId === tm.matches?.player2_id
                                  ? "bg-green-500/20 border border-green-500/30"
                                  : ""
                              }`}
                            >
                              <span className="text-white text-sm">
                                {tm.matches?.player2_id
                                  ? getParticipantNameByUserId(tm.matches.player2_id) || 
                                    (tm.player2_bracket_position ? getParticipantName(tm.player2_bracket_position) : "TBD")
                                  : tm.player2_bracket_position
                                  ? getParticipantName(tm.player2_bracket_position)
                                  : "TBD"}
                              </span>
                              {isCompleted && tm.matches?.player2_id && (
                                <>
                                  {winnerId === tm.matches?.player2_id ? (
                                    <CheckCircle2 className="h-4 w-4 text-green-400" />
                                  ) : (
                                    <XCircle className="h-4 w-4 text-red-400" />
                                  )}
                                </>
                              )}
                            </div>

                            {/* Winner Badge */}
                            {isCompleted && winnerId && (
                              <div className="pt-2 border-t border-gray-700">
                                <div className="flex items-center justify-center gap-2 text-green-400 text-xs font-semibold">
                                  <Trophy className="h-3 w-3" />
                                  Winner: {getParticipantNameByUserId(winnerId) || getParticipantName(
                                    winnerId === tm.matches?.player1_id 
                                      ? tm.player1_bracket_position 
                                      : tm.player2_bracket_position
                                  )}
                                </div>
                              </div>
                            )}

                            {/* Match Link */}
                            {tm.matches && (
                              <div className={`pt-2 ${isCompleted && winnerId ? '' : 'border-t border-gray-700'}`}>
                                <Button
                                  asChild
                                  variant="outline"
                                  size="sm"
                                  className="w-full border-gray-600 text-gray-300 hover:text-white text-xs"
                                >
                                  <Link href={`/games/match/${tm.match_id}`}>
                                    {isCompleted || tm.matches.status === "completed" ? "View Result" : "Play Match"}
                                    <ArrowRight className="ml-2 h-3 w-3" />
                                  </Link>
                                </Button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {tournament.status === "completed" && tournament.winner_id && (
          <div className="mt-8 text-center p-6 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/30 rounded-lg">
            <h3 className="text-xl font-bold text-white mb-2">🏆 Tournament Winner 🏆</h3>
            <p className="text-yellow-400 text-lg">
              {getParticipantName(
                participants.find((p) => p.user_id === tournament.winner_id)?.bracket_position ||
                  null
              )}
            </p>
            <p className="text-gray-400 text-sm mt-2">
              Won {tournament.prize_pool.toLocaleString()} tokens!
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}


import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import ReplayPlayer from "@/components/games/replay-player"
import { getReplayByMatchId } from "@/lib/replay-actions"

export default async function ReplayPage({ params }: { params: { matchId: string } }) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Get match and replay data
  const { data: match } = await supabase
    .from("matches")
    .select(`
      *,
      game:games(id, name)
    `)
    .eq("id", params.matchId)
    .single()

  if (!match) {
    return (
      <div className="container mx-auto p-4">
        <div className="text-center text-gray-400">Match not found</div>
      </div>
    )
  }

  const replayResult = await getReplayByMatchId(params.matchId)

  if (!replayResult.data) {
    return (
      <div className="container mx-auto p-4">
        <div className="text-center text-gray-400">Replay not available for this match</div>
      </div>
    )
  }

  // Determine game type from game name
  const gameTypeMap: Record<string, string> = {
    "Connect Four": "connect-four",
    "Math Blitz": "math-blitz",
    "Trivia Challenge": "trivia-challenge",
  }

  const gameType = gameTypeMap[match.game?.name || ""] || "connect-four"

  return (
    <div className="container mx-auto p-4 max-w-6xl">
      <h1 className="text-2xl font-bold mb-6">Match Replay</h1>
      <ReplayPlayer
        matchId={params.matchId}
        gameType={gameType}
        player1Id={match.player1_id}
        player2Id={match.player2_id || undefined}
      />
    </div>
  )
}


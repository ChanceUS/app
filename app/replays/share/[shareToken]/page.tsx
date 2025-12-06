import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import ReplayPlayer from "@/components/games/replay-player"
import { getReplayByShareToken } from "@/lib/replay-actions"

export default async function ShareReplayPage({ params }: { params: { shareToken: string } }) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const replayResult = await getReplayByShareToken(params.shareToken)

  if (!replayResult.data || !replayResult.data.match) {
    return (
      <div className="container mx-auto p-4">
        <div className="text-center text-gray-400">Replay not found</div>
      </div>
    )
  }

  const match = replayResult.data.match as any

  // Determine game type from game name
  const gameTypeMap: Record<string, string> = {
    "Connect Four": "connect-four",
    "Math Blitz": "math-blitz",
    "Trivia Challenge": "trivia-challenge",
  }

  const gameType = gameTypeMap[match.game?.name || ""] || "connect-four"

  return (
    <div className="container mx-auto p-4 max-w-6xl">
      <h1 className="text-2xl font-bold mb-6">Shared Match Replay</h1>
      <ReplayPlayer
        shareToken={params.shareToken}
        gameType={gameType}
        player1Id={match.player1_id}
        player2Id={match.player2_id || undefined}
      />
    </div>
  )
}


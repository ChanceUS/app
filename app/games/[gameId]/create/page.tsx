import { createClient, isSupabaseConfigured } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Header from "@/components/navigation/header"
import CreateMatchForm from "@/components/games/create-match-form"
import MathBlitz from "@/components/games/math-blitz"

interface CreateMatchPageProps {
  params: {
    gameId: string
  }
}

export default async function CreateMatchPage({ params }: CreateMatchPageProps) {
  const resolvedParams = await params
  
  if (!isSupabaseConfigured) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-950">
        <h1 className="text-2xl font-bold mb-4 text-white">Connect Supabase to get started</h1>
      </div>
    )
  }

  const supabase = await createClient()
  
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()

  if (!authUser) {
    redirect("/auth/login")
  }

  const { data: user } = await supabase.from("users").select("*").eq("id", authUser.id).single()
  
  if (!user) {
    redirect("/auth/login")
  }

  // Get game details
  const { data: game } = await supabase.from("games").select("*").eq("id", resolvedParams.gameId).single()
  
  if (!game) {
    redirect("/games")
  }

  return (
    <div className="min-h-screen bg-gray-950">
      <Header user={user} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Create {game.name} Match</h1>
          <p className="text-gray-400">Set your bet and challenge other players</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Match Creation Form */}
          <div>
            <CreateMatchForm game={game} user={user} />
          </div>

          {/* Game Preview */}
          <div>
            <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-6">
              <h2 className="text-xl font-bold text-white mb-4">Game Preview</h2>
              <p className="text-gray-400 mb-6">
                This is what you'll be playing. Practice while waiting for an opponent!
              </p>
              
              {/* Show Math Blitz for Math Blitz game */}
              {game.name === "Math Blitz" && (
                <div className="scale-90 origin-top">
                  <MathBlitz />
                </div>
              )}
              
              {/* Show other games when implemented */}
              {game.name === "Connect 4" && (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">🔴</div>
                  <h3 className="text-white text-lg font-semibold">Connect 4</h3>
                  <p className="text-gray-400">Game preview coming soon</p>
                </div>
              )}
              
              {game.name === "Trivia Challenge" && (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">🧠</div>
                  <h3 className="text-white text-lg font-semibold">Trivia Challenge</h3>
                  <p className="text-gray-400">Game preview coming soon</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

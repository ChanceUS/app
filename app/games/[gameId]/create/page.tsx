import { createClient, isSupabaseConfigured } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Header from "@/components/navigation/header"
import CreateMatchForm from "@/components/games/create-match-form"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

interface CreateMatchPageProps {
  params: {
    gameId: string
  }
}

export default async function CreateMatchPage({ params }: CreateMatchPageProps) {
  // If Supabase is not configured, show setup message
  if (!isSupabaseConfigured) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-950">
        <h1 className="text-2xl font-bold mb-4 text-white">Connect Supabase to get started</h1>
      </div>
    )
  }

  // Get the user from the server
  const supabase = createClient()
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()

  // If no user, redirect to login
  if (!authUser) {
    redirect("/auth/login")
  }

  // Get user profile data
  const { data: user } = await supabase.from("users").select("*").eq("id", authUser.id).single()

  if (!user) {
    redirect("/auth/login")
  }

  // Get game data
  const { data: game } = await supabase.from("games").select("*").eq("id", params.gameId).single()

  if (!game) {
    redirect("/games")
  }

  return (
    <div className="min-h-screen bg-gray-950">
      <Header user={user} />

      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <div className="mb-6">
          <Button asChild variant="outline" className="border-gray-700 text-gray-300 hover:text-white bg-transparent">
            <Link href="/games">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Games
            </Link>
          </Button>
        </div>

        {/* Create Match Form */}
        <CreateMatchForm game={game} userBalance={user.tokens} />
      </main>
    </div>
  )
}

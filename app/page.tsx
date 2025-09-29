import { createClient, isSupabaseConfigured } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Trophy, Zap, Users } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import Header from "@/components/navigation/header"

export default async function Home() {
  // If Supabase is not configured, show setup message directly
  if (!isSupabaseConfigured) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black">
        <h1 className="text-2xl font-bold text-white">Connect Supabase to get started</h1>
      </div>
    )
  }

  // Get the user from the server
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // If user is logged in, redirect to dashboard
  if (user) {
    redirect("/dashboard")
  }

  return (
    <div className="min-h-screen bg-black">
      <Header />

      <div className="relative overflow-hidden py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-12">
            <div className="flex justify-center mb-8">
              <Image
                src="/chanceus-logo.png"
                alt="ChanceUS Logo"
                width={600}
                height={180}
                className="h-32 w-auto hover-lift"
                priority
              />
            </div>

            <p className="text-xl md:text-2xl text-gray-300 max-w-4xl mx-auto leading-relaxed">
              Challenge friends in fast, skill-based games where talent meets technology.
            </p>

            <div className="flex flex-col sm:flex-row gap-6 justify-center pt-8">
              <Button asChild size="lg" className="btn-primary px-12 py-4 text-lg">
                <Link href="/auth/sign-up">Get Started</Link>
              </Button>

              <Button
                asChild
                variant="outline"
                size="lg"
                className="border-orange-500 text-orange-500 hover:bg-orange-500 hover:text-black px-12 py-4 text-lg bg-transparent"
              >
                <Link href="/games">See the games</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            <span className="text-orange-500">Skill-Based</span> <span className="text-white">Competition</span>
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Test your abilities against friends and players worldwide
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <div className="card-modern text-center">
            <div className="flex justify-center mb-6">
              <div className="p-4 bg-orange-500 rounded-2xl">
                <Zap className="h-8 w-8 text-black" />
              </div>
            </div>
            <h3 className="text-white text-xl font-semibold mb-4">Fair & Fast</h3>
            <p className="text-gray-300 leading-relaxed">
              Lightning-fast games with skill-based matchmaking. No luck involved - pure talent competition.
            </p>
          </div>

          <div className="card-modern text-center">
            <div className="flex justify-center mb-6">
              <div className="p-4 bg-orange-500 rounded-2xl">
                <Trophy className="h-8 w-8 text-black" />
              </div>
            </div>
            <h3 className="text-white text-xl font-semibold mb-4">Friend vs Friend</h3>
            <p className="text-gray-300 leading-relaxed">
              Challenge your friends directly or find worthy opponents from our global player base.
            </p>
          </div>

          <div className="card-modern text-center">
            <div className="flex justify-center mb-6">
              <div className="p-4 bg-orange-500 rounded-2xl">
                <Users className="h-8 w-8 text-black" />
              </div>
            </div>
            <h3 className="text-white text-xl font-semibold mb-4">How it works</h3>
            <p className="text-gray-300 leading-relaxed">
              1. Choose your game and set your stakes 2. Get matched with an opponent 3. Play! Winner takes all the
              tokens
            </p>
          </div>
        </div>
      </div>

      <div className="py-20">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl md:text-5xl font-bold mb-8">
            <span className="text-orange-500">Ready to start playing?</span>
          </h2>
          <p className="text-xl text-gray-300 mb-12">Join the skill-based gaming revolution</p>
          <Button asChild size="lg" className="btn-primary px-16 py-6 text-xl">
            <Link href="/auth/sign-up">Start playing</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}

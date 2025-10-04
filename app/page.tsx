import { createClient, isSupabaseConfigured } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Trophy, Zap, Users, Wallet, Target, TrendingUp } from "lucide-react"
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

  // Get user data directly from server client
  const supabase = await createClient()
  const { data: { user: authUser } } = await supabase.auth.getUser()
  
  let user = null
  if (authUser) {
    // Try to get complete user data from users table
    const { data: userProfile } = await supabase
      .from("users")
      .select("*")
      .eq("id", authUser.id)
      .single()
    
    if (userProfile) {
      user = userProfile
    } else {
      // Create fallback user object
      user = {
        id: authUser.id,
        username: authUser.user_metadata?.username || authUser.email?.split('@')[0] || 'user',
        email: authUser.email || '',
        display_name: authUser.user_metadata?.display_name || authUser.user_metadata?.full_name || authUser.email?.split('@')[0] || 'User',
        avatar_url: authUser.user_metadata?.avatar_url || null,
        tokens: 1000,
        total_games_played: 0,
        total_games_won: 0,
        win_rate: 0,
        created_at: authUser.created_at,
        updated_at: authUser.updated_at || authUser.created_at
      }
    }
  }

  // If user is logged in, show dashboard, otherwise show landing page
  if (user) {
    // Import dashboard components
    const { default: QuickActions } = await import("@/components/dashboard/quick-actions")
    const { default: RecentMatches } = await import("@/components/dashboard/recent-matches")
    const { default: StatsCard } = await import("@/components/dashboard/stats-card")
    
    return (
      <div className="min-h-screen bg-gray-950">
        <Header user={user} />

        <main className="max-w-[1600px] mx-auto px-8 sm:px-12 lg:px-16 py-16">
          <div className="mb-12 fade-in">
            <div className="flex items-center space-x-6 mb-6">
              <Image src="/chanceus-eagle.png" alt="ChanceUS" width={80} height={80} className="h-16 w-16" />
              <div>
                <h1 className="text-4xl font-bold text-white">
                  Welcome back, <span className="text-orange-500">{user.display_name || user.username}</span>!
                </h1>
                <p className="text-gray-400 text-lg">Ready to challenge your friends in skill-based games?</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-16">
            <StatsCard
              title="Token Balance"
              value="44,560"
              description="Available for betting"
              icon={Wallet}
              trend={{
                value: 12,
                isPositive: true
              }}
            />
            <StatsCard
              title="Games Won"
              value="17"
              description="Out of 29 total"
              icon={Trophy}
              trend={{
                value: 3,
                isPositive: true
              }}
            />
            <StatsCard
              title="Win Rate"
              value="65.38%"
              description="Your success percentage"
              icon={Target}
              trend={{
                value: 5.2,
                isPositive: true
              }}
            />
            <StatsCard
              title="Rank"
              value="#247"
              description="Global leaderboard"
              icon={TrendingUp}
              trend={{
                value: 12,
                isPositive: true
              }}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-16">
            <div className="lg:col-span-2">
              <QuickActions />
            </div>
            <div>
              <RecentMatches userId={user.id} />
            </div>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black">
      <Header />

      <div className="relative overflow-hidden py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-12">
            <div className="flex justify-center mb-8">
              <Image
                src="/chanceus-eagle.png"
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
              <Link 
                href="/auth/sign-up"
                className="get-started-btn inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all bg-orange-500 hover:bg-orange-600 px-12 py-4 text-lg h-10"
              >
                Get Started
              </Link>

              <Button
                asChild
                variant="outline"
                size="lg"
                className="border-white text-white hover:bg-white hover:text-black px-12 py-4 text-lg bg-gray-800"
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
          <div className="bg-blue-600/20 border border-blue-500/30 rounded-lg p-8 text-center">
            <div className="flex justify-center mb-6">
              <div className="p-4 bg-orange-500 rounded-2xl">
                <Zap className="h-8 w-8 text-black" />
              </div>
            </div>
            <h3 className="text-white text-xl font-semibold mb-4">Fair & Fast</h3>
            <p className="text-white leading-relaxed">
              Lightning-fast games with skill-based matchmaking. No luck involved - pure talent competition.
            </p>
          </div>

          <div className="bg-blue-600/20 border border-blue-500/30 rounded-lg p-8 text-center">
            <div className="flex justify-center mb-6">
              <div className="p-4 bg-orange-500 rounded-2xl">
                <Trophy className="h-8 w-8 text-black" />
              </div>
            </div>
            <h3 className="text-white text-xl font-semibold mb-4">Friend vs Friend</h3>
            <p className="text-white leading-relaxed">
              Challenge your friends directly or find worthy opponents from our global player base.
            </p>
          </div>

          <div className="bg-blue-600/20 border border-blue-500/30 rounded-lg p-8 text-center">
            <div className="flex justify-center mb-6">
              <div className="p-4 bg-orange-500 rounded-2xl">
                <Users className="h-8 w-8 text-black" />
              </div>
            </div>
            <h3 className="text-white text-xl font-semibold mb-4">How it works</h3>
            <p className="text-white leading-relaxed">
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

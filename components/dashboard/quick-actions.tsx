import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Calculator, Grid3X3, Brain, Trophy, Users, Zap } from "lucide-react"
import Link from "next/link"

const games = [
  {
    id: "math-blitz",
    name: "Math Blitz",
    description: "Lightning-fast arithmetic challenges",
    icon: Calculator,
    color: "from-cyan-500 to-cyan-600",
    hoverColor: "from-cyan-600 to-cyan-700",
    minBet: 10,
    maxBet: 500,
  },
  {
    id: "connect-4",
    name: "Connect 4",
    description: "Strategic four-in-a-row battles",
    icon: Grid3X3,
    color: "from-yellow-500 to-yellow-600",
    hoverColor: "from-yellow-600 to-yellow-700",
    minBet: 25,
    maxBet: 1000,
  },
  {
    id: "trivia",
    name: "Trivia Challenge",
    description: "Test your knowledge across categories",
    icon: Brain,
    color: "from-purple-500 to-purple-600",
    hoverColor: "from-purple-600 to-purple-700",
    minBet: 15,
    maxBet: 750,
  },
]

export default function QuickActions() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">Quick Play</h2>
        <Button asChild variant="outline" className="border-gray-700 text-gray-300 hover:text-white bg-transparent">
          <Link href="/games">
            <Trophy className="mr-2 h-4 w-4" />
            View All Games
          </Link>
        </Button>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {games.map((game) => (
          <Card key={game.id} className="bg-gray-900/50 border-gray-800 card-hover group">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <div
                  className={`p-4 bg-gradient-to-br ${game.color} rounded-full group-hover:scale-110 transition-transform duration-300`}
                >
                  <game.icon className="h-8 w-8 text-black" />
                </div>
              </div>
              <CardTitle className="text-white text-xl">{game.name}</CardTitle>
              <CardDescription className="text-gray-400">{game.description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between text-sm text-gray-400">
                <span>Min Bet: {game.minBet} tokens</span>
                <span>Max Bet: {game.maxBet} tokens</span>
              </div>
              <div className="flex gap-2">
                <Button
                  asChild
                  className={`flex-1 bg-gradient-to-r ${game.color} hover:${game.hoverColor} text-black font-semibold`}
                >
                  <Link href={`/games/${game.id}/play`}>
                    <Zap className="mr-2 h-4 w-4" />
                    Quick Match
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  className="border-gray-700 text-gray-300 hover:text-white hover:bg-gray-800 bg-transparent"
                >
                  <Link href={`/games/${game.id}`}>
                    <Users className="mr-2 h-4 w-4" />
                    Lobby
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

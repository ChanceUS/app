import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Users, Zap, Trophy } from "lucide-react"
import Link from "next/link"
import type { Game } from "@/lib/supabase/client"

interface GameCardProps {
  game: Game
  activeMatches?: number
  onlineUsers?: number
}

const gameIcons = {
  "Math Blitz": "🧮",
  "Connect 4": "🔴",
  "Trivia Challenge": "🧠",
}

const gameColors = {
  "Math Blitz": {
    gradient: "from-cyan-500 to-cyan-600",
    hoverGradient: "from-cyan-600 to-cyan-700",
    border: "border-cyan-500/20",
  },
  "Connect 4": {
    gradient: "from-yellow-500 to-yellow-600",
    hoverGradient: "from-yellow-600 to-yellow-700",
    border: "border-yellow-500/20",
  },
  "Trivia Challenge": {
    gradient: "from-purple-500 to-purple-600",
    hoverGradient: "from-purple-600 to-purple-700",
    border: "border-purple-500/20",
  },
}

export default function GameCard({ game, activeMatches = 0, onlineUsers = 0 }: GameCardProps) {
  const colors = gameColors[game.name as keyof typeof gameColors] || gameColors["Math Blitz"]

  return (
    <Card className={`bg-gray-900/50 border-gray-800 ${colors.border} card-hover group`}>
      <CardHeader className="text-center">
        <div className="flex justify-center mb-4">
          <div className="text-6xl">{gameIcons[game.name as keyof typeof gameIcons] || "🎮"}</div>
        </div>
        <CardTitle className="text-white text-2xl">{game.name}</CardTitle>
        <CardDescription className="text-gray-400 text-lg">{game.description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Game Stats */}
        <div className="flex justify-between items-center text-sm">
          <div className="flex items-center text-gray-400">
            <Users className="h-4 w-4 mr-1" />
            <span>{onlineUsers} online</span>
          </div>
          <div className="flex items-center text-gray-400">
            <Trophy className="h-4 w-4 mr-1" />
            <span>{activeMatches} active</span>
          </div>
        </div>

        {/* Bet Range */}
        <div className="bg-gray-800/30 p-3 rounded-lg">
          <div className="flex justify-between items-center">
            <span className="text-gray-400 text-sm">Bet Range:</span>
            <div className="flex items-center space-x-2">
              <Badge variant="outline" className="border-gray-600 text-gray-300">
                {game.min_bet} min
              </Badge>
              <Badge variant="outline" className="border-gray-600 text-gray-300">
                {game.max_bet} max
              </Badge>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button
            asChild
            className={`flex-1 bg-gradient-to-r ${colors.gradient} hover:${colors.hoverGradient} text-black font-semibold`}
          >
            <Link href={`/games/${game.id}/create`}>
              <Zap className="mr-2 h-4 w-4" />
              Create Match
            </Link>
          </Button>
          <Button
            asChild
            variant="outline"
            className="flex-1 border-gray-700 text-gray-300 hover:text-white hover:bg-gray-800 bg-transparent"
          >
            <Link href={`/games/${game.id}`}>
              <Users className="mr-2 h-4 w-4" />
              Join Lobby
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

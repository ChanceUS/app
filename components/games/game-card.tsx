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
  "Connect 4": "🎮",
  "4 In a Row": "🔴",
  "Trivia Challenge": "🧠",
}

const gameColors = {
  "Math Blitz": {
    gradient: "from-blue-500 to-blue-600",
    hoverGradient: "from-blue-600 to-blue-700",
    border: "border-blue-500/20",
  },
  "Connect 4": {
    gradient: "from-red-500 to-red-600",
    hoverGradient: "from-red-600 to-red-700",
    border: "border-red-500/20",
  },
  "4 In a Row": {
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
  
  console.log("🎮 GameCard rendering for:", { id: game.id, name: game.name })

  return (
    <Card className="bg-gray-900/80 border-gray-800 hover:border-gray-700 transition-colors">
      <CardHeader className="text-center pb-4">
        <div className="flex justify-center mb-4">
          <div className="text-5xl">{gameIcons[game.name as keyof typeof gameIcons] || "🎮"}</div>
        </div>
        <CardTitle className="text-white text-xl mb-2">{game.name}</CardTitle>
        <CardDescription className="text-gray-400 text-sm">{game.description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Game Stats */}
        <div className="flex justify-between items-center text-sm">
          <div className="flex items-center text-green-400">
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
            <span className="text-white/80 text-sm">Bet Range:</span>
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
            className="flex-1 bg-orange-600 hover:bg-orange-700 text-white font-semibold"
          >
            <Link href={`/games/${game.id}/create`}>
              Create Match
            </Link>
          </Button>
          <Button
            asChild
            variant="outline"
            className="flex-1 border-gray-700 text-gray-300 hover:bg-gray-800"
          >
            <Link href={`/games/${game.id}`}>
              View Details
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

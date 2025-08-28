import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Trophy, Clock, TrendingUp, Eye } from "lucide-react"
import Link from "next/link"

// Mock data - will be replaced with real data from Supabase
const recentMatches = [
  {
    id: "1",
    game: "Math Blitz",
    opponent: "QuickMath99",
    result: "won",
    tokens: 50,
    duration: "1m 23s",
    timestamp: "2 hours ago",
  },
  {
    id: "2",
    game: "Connect 4",
    opponent: "StrategyKing",
    result: "lost",
    tokens: -75,
    duration: "4m 12s",
    timestamp: "5 hours ago",
  },
  {
    id: "3",
    game: "Trivia Challenge",
    opponent: "BrainMaster",
    result: "won",
    tokens: 30,
    duration: "2m 45s",
    timestamp: "1 day ago",
  },
]

export default function RecentMatches() {
  return (
    <Card className="bg-gray-900/50 border-gray-800">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-white">Recent Matches</CardTitle>
          <CardDescription className="text-gray-400">Your latest gaming activity</CardDescription>
        </div>
        <Button
          asChild
          variant="outline"
          size="sm"
          className="border-gray-700 text-gray-300 hover:text-white bg-transparent"
        >
          <Link href="/matches">
            <Eye className="mr-2 h-4 w-4" />
            View All
          </Link>
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {recentMatches.map((match) => (
          <div key={match.id} className="flex items-center justify-between p-4 bg-gray-800/30 rounded-lg">
            <div className="flex items-center space-x-4">
              <div className={`p-2 rounded-full ${match.result === "won" ? "bg-green-500/20" : "bg-red-500/20"}`}>
                {match.result === "won" ? (
                  <Trophy className="h-4 w-4 text-green-400" />
                ) : (
                  <TrendingUp className="h-4 w-4 text-red-400 rotate-180" />
                )}
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-white font-medium">{match.game}</span>
                  <Badge
                    variant={match.result === "won" ? "default" : "destructive"}
                    className={match.result === "won" ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}
                  >
                    {match.result}
                  </Badge>
                </div>
                <div className="text-sm text-gray-400">vs {match.opponent}</div>
              </div>
            </div>
            <div className="text-right">
              <div className={`font-semibold ${match.tokens > 0 ? "text-green-400" : "text-red-400"}`}>
                {match.tokens > 0 ? "+" : ""}
                {match.tokens} tokens
              </div>
              <div className="text-sm text-gray-400 flex items-center">
                <Clock className="h-3 w-3 mr-1" />
                {match.duration} • {match.timestamp}
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

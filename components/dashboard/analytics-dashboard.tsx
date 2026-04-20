"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  getUserStatistics,
  getLeaderboard,
  getUserPerformanceTrends,
  getUserGameStatistics,
} from "@/lib/analytics-actions"
import { Trophy, TrendingUp, BarChart3, Users, Target, Clock } from "lucide-react"
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import type { User } from "@/lib/supabase/client"

interface AnalyticsDashboardProps {
  currentUser: User
}

export default function AnalyticsDashboard({ currentUser }: AnalyticsDashboardProps) {
  const [stats, setStats] = useState<any>(null)
  const [leaderboard, setLeaderboard] = useState<any[]>([])
  const [trends, setTrends] = useState<any[]>([])
  const [gameStats, setGameStats] = useState<any>({})
  const [selectedGame, setSelectedGame] = useState<string>("overall")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      try {
        // Load user statistics
        const statsResult = await getUserStatistics(currentUser.id)
        if (statsResult.data) {
          setStats(statsResult.data)
        }

        // Load leaderboard
        const leaderboardResult = await getLeaderboard("overall")
        if (leaderboardResult.data) {
          setLeaderboard(leaderboardResult.data)
        }

        // Load performance trends
        const trendsResult = await getUserPerformanceTrends(currentUser.id, 30)
        if (trendsResult.data) {
          setTrends(trendsResult.data)
        }

        // Load game-specific stats
        const gameStatsResult = await getUserGameStatistics(currentUser.id)
        if (gameStatsResult.data) {
          setGameStats(gameStatsResult.data)
        }
      } catch (error) {
        console.error("Error loading analytics:", error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [currentUser.id])

  if (loading) {
    return (
      <div className="space-y-4">
        <Card className="bg-gray-900/80 border-gray-800">
          <CardContent className="p-6">
            <p className="text-center text-gray-400">Loading analytics...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const userRank =
    leaderboard.findIndex((entry) => entry.user_id === currentUser.id) + 1 || null

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Analytics Dashboard</h2>
        <Select value={selectedGame} onValueChange={setSelectedGame}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select game" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="overall">Overall</SelectItem>
            <SelectItem value="connect-four">Connect Four</SelectItem>
            <SelectItem value="math-blitz">Math Blitz</SelectItem>
            <SelectItem value="trivia-challenge">Trivia Challenge</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gray-900/80 border-gray-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Matches</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total_matches || 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.total_wins || 0} wins, {stats?.total_losses || 0} losses
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gray-900/80 border-gray-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Win Rate</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.win_rate ? `${stats.win_rate.toFixed(1)}%` : "0%"}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats?.total_wins || 0} of {stats?.total_matches || 0} matches
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gray-900/80 border-gray-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Streak</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.current_win_streak || 0}</div>
            <p className="text-xs text-muted-foreground">
              Best: {stats?.longest_win_streak || 0}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gray-900/80 border-gray-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rank</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {userRank ? `#${userRank}` : "N/A"}
            </div>
            <p className="text-xs text-muted-foreground">
              {leaderboard.length} players ranked
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="trends">Performance Trends</TabsTrigger>
          <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
          <TabsTrigger value="game-stats">Game Statistics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card className="bg-gray-900/80 border-gray-800">
              <CardHeader>
                <CardTitle>Match Statistics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-400">Total Matches</span>
                    <span className="font-medium">{stats?.total_matches || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-400">Wins</span>
                    <span className="font-medium text-green-400">{stats?.total_wins || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-400">Losses</span>
                    <span className="font-medium text-red-400">{stats?.total_losses || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-400">Draws</span>
                    <span className="font-medium">{stats?.total_draws || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-400">Win Rate</span>
                    <span className="font-medium">
                      {stats?.win_rate ? `${stats.win_rate.toFixed(1)}%` : "0%"}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-900/80 border-gray-800">
              <CardHeader>
                <CardTitle>Token Statistics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-400">Total Won</span>
                    <span className="font-medium text-green-400">
                      {stats?.total_tokens_won || 0}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-400">Total Lost</span>
                    <span className="font-medium text-red-400">
                      {stats?.total_tokens_lost || 0}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-400">Net</span>
                    <span
                      className={`font-medium ${
                        (stats?.total_tokens_won || 0) - (stats?.total_tokens_lost || 0) >= 0
                          ? "text-green-400"
                          : "text-red-400"
                      }`}
                    >
                      {(stats?.total_tokens_won || 0) - (stats?.total_tokens_lost || 0)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          <Card className="bg-gray-900/80 border-gray-800">
            <CardHeader>
              <CardTitle>Performance Trends (Last 30 Days)</CardTitle>
            </CardHeader>
            <CardContent>
              {trends.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={trends}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="date" stroke="#9CA3AF" />
                    <YAxis stroke="#9CA3AF" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#1F2937",
                        border: "1px solid #374151",
                        borderRadius: "6px",
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="wins"
                      stroke="#10B981"
                      name="Wins"
                      strokeWidth={2}
                    />
                    <Line
                      type="monotone"
                      dataKey="losses"
                      stroke="#EF4444"
                      name="Losses"
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-center text-gray-400 py-8">
                  No match data available for the last 30 days
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="leaderboard" className="space-y-4">
          <Card className="bg-gray-900/80 border-gray-800">
            <CardHeader>
              <CardTitle>Global Leaderboard</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {leaderboard.slice(0, 20).map((entry, index) => (
                  <div
                    key={entry.user_id}
                    className={`flex items-center justify-between p-3 rounded-lg ${
                      entry.user_id === currentUser.id
                        ? "bg-blue-500/20 border border-blue-500/50"
                        : "bg-gray-800/50"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 text-center font-bold">
                        {index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : `#${index + 1}`}
                      </div>
                      <div>
                        <p className="font-medium">{entry.username}</p>
                        <p className="text-xs text-gray-400">
                          {entry.total_matches} matches • {entry.win_rate.toFixed(1)}% win rate
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-green-400">{entry.total_wins} wins</p>
                      <p className="text-xs text-gray-400">
                        Streak: {entry.current_win_streak}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="game-stats" className="space-y-4">
          <Card className="bg-gray-900/80 border-gray-800">
            <CardHeader>
              <CardTitle>Game-Specific Statistics</CardTitle>
            </CardHeader>
            <CardContent>
              {gameStats.games_played_by_type &&
              Object.keys(gameStats.games_played_by_type).length > 0 ? (
                <div className="space-y-4">
                  {Object.entries(gameStats.games_played_by_type).map(([gameId, count]: [string, any]) => (
                    <div key={gameId} className="p-4 bg-gray-800/50 rounded-lg">
                      <div className="flex justify-between items-center">
                        <span className="font-medium">Game {gameId}</span>
                        <div className="text-right">
                          <p className="text-sm text-gray-400">
                            Played: {count} | Won: {gameStats.wins_by_game_type?.[gameId] || 0}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-gray-400 py-8">No game-specific statistics available</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}


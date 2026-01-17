"use server"

import { createServerActionClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"

// Get user statistics
export async function getUserStatistics(userId: string) {
  const cookieStore = await cookies()
  const supabase = createServerActionClient({ cookies: () => cookieStore })

  try {
    const { data, error } = await supabase
      .from("user_statistics")
      .select("*")
      .eq("user_id", userId)
      .single()

    if (error) {
      if (error.code === "PGRST116") {
        // Statistics don't exist yet, return defaults
        return {
          success: true,
          data: {
            user_id: userId,
            total_matches: 0,
            total_wins: 0,
            total_losses: 0,
            total_draws: 0,
            win_rate: 0,
            total_tokens_won: 0,
            total_tokens_lost: 0,
            average_match_duration: 0,
            longest_win_streak: 0,
            current_win_streak: 0,
            games_played_by_type: {},
            wins_by_game_type: {},
          },
        }
      }
      console.error("Error fetching user statistics:", error)
      return { error: "Failed to fetch user statistics", data: null }
    }

    return { success: true, data }
  } catch (error) {
    console.error("Get user statistics error:", error)
    return { error: "An unexpected error occurred", data: null }
  }
}

// Get match statistics
export async function getMatchStatistics(matchId: string) {
  const cookieStore = await cookies()
  const supabase = createServerActionClient({ cookies: () => cookieStore })

  try {
    const { data, error } = await supabase
      .from("match_statistics")
      .select("*")
      .eq("match_id", matchId)
      .single()

    if (error) {
      if (error.code === "PGRST116") {
        return { error: "Statistics not found", data: null }
      }
      console.error("Error fetching match statistics:", error)
      return { error: "Failed to fetch match statistics", data: null }
    }

    return { success: true, data }
  } catch (error) {
    console.error("Get match statistics error:", error)
    return { error: "An unexpected error occurred", data: null }
  }
}

// Get leaderboard
export async function getLeaderboard(
  type: "overall" | "game" | "daily" | "weekly" | "monthly" = "overall",
  gameId?: string,
  limit: number = 100
) {
  const cookieStore = await cookies()
  const supabase = createServerActionClient({ cookies: () => cookieStore })

  try {
    // Check cache first
    const cacheKey = `${type}_${gameId || "all"}_${new Date().toISOString().split("T")[0]}`
    const { data: cached } = await supabase
      .from("leaderboard_cache")
      .select("*")
      .eq("leaderboard_type", type)
      .eq("game_id", gameId || null)
      .gt("expires_at", new Date().toISOString())
      .single()

    if (cached) {
      return { success: true, data: cached.rankings, cached: true }
    }

    // Build query based on type
    let query = supabase
      .from("user_statistics")
      .select(`
        *,
        user:users(id, username, display_name, avatar_url)
      `)
      .order("win_rate", { ascending: false })
      .order("total_wins", { ascending: false })
      .limit(limit)

    // Filter by game type if specified
    if (type === "game" && gameId) {
      // This would require filtering by games_played_by_type JSONB
      // For now, we'll get all and filter client-side or use a more complex query
    }

    const { data, error } = await query

    if (error) {
      console.error("Error fetching leaderboard:", error)
      return { error: "Failed to fetch leaderboard", data: [] }
    }

    // Format rankings
    const rankings = (data || []).map((stat, index) => ({
      rank: index + 1,
      user_id: stat.user_id,
      username: stat.user?.username || "Unknown",
      display_name: stat.user?.display_name,
      avatar_url: stat.user?.avatar_url,
      total_matches: stat.total_matches || 0,
      total_wins: stat.total_wins || 0,
      total_losses: stat.total_losses || 0,
      win_rate: stat.win_rate || 0,
      current_win_streak: stat.current_win_streak || 0,
      longest_win_streak: stat.longest_win_streak || 0,
    }))

    // Cache the results (async, don't wait)
    supabase
      .from("leaderboard_cache")
      .insert({
        leaderboard_type: type,
        game_id: gameId || null,
        rankings: rankings,
        expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString(), // 5 minutes
      })
      .catch((err) => console.error("Error caching leaderboard:", err))

    return { success: true, data: rankings, cached: false }
  } catch (error) {
    console.error("Get leaderboard error:", error)
    return { error: "An unexpected error occurred", data: [] }
  }
}

// Get user performance trends
export async function getUserPerformanceTrends(userId: string, days: number = 30) {
  const cookieStore = await cookies()
  const supabase = createServerActionClient({ cookies: () => cookieStore })

  try {
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    // Get matches for the user in the time period
    const { data: matches, error } = await supabase
      .from("matches")
      .select("id, status, winner_id, created_at, completed_at, game_id")
      .or(`player1_id.eq.${userId},player2_id.eq.${userId}`)
      .gte("created_at", startDate.toISOString())
      .eq("status", "completed")
      .order("completed_at", { ascending: true })

    if (error) {
      console.error("Error fetching performance trends:", error)
      return { error: "Failed to fetch performance trends", data: [] }
    }

    // Calculate daily trends
    const trends: Record<string, { wins: number; losses: number; date: string }> = {}

    matches?.forEach((match) => {
      const date = new Date(match.completed_at || match.created_at).toISOString().split("T")[0]
      if (!trends[date]) {
        trends[date] = { wins: 0, losses: 0, date }
      }
      if (match.winner_id === userId) {
        trends[date].wins++
      } else {
        trends[date].losses++
      }
    })

    return {
      success: true,
      data: Object.values(trends).sort((a, b) => a.date.localeCompare(b.date)),
    }
  } catch (error) {
    console.error("Get performance trends error:", error)
    return { error: "An unexpected error occurred", data: [] }
  }
}

// Get game-specific statistics for a user
export async function getUserGameStatistics(userId: string, gameId?: string) {
  const cookieStore = await cookies()
  const supabase = createServerActionClient({ cookies: () => cookieStore })

  try {
    const { data: stats, error } = await supabase
      .from("user_statistics")
      .select("games_played_by_type, wins_by_game_type")
      .eq("user_id", userId)
      .single()

    if (error) {
      return { success: true, data: { games_played: 0, wins: 0 } }
    }

    const gamesPlayed = (stats?.games_played_by_type as Record<string, number>) || {}
    const wins = (stats?.wins_by_game_type as Record<string, number>) || {}

    if (gameId) {
      return {
        success: true,
        data: {
          games_played: gamesPlayed[gameId] || 0,
          wins: wins[gameId] || 0,
        },
      }
    }

    return {
      success: true,
      data: {
        games_played_by_type: gamesPlayed,
        wins_by_game_type: wins,
      },
    }
  } catch (error) {
    console.error("Get user game statistics error:", error)
    return { error: "An unexpected error occurred", data: null }
  }
}


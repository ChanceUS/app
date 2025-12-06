"use server"

import { createServerActionClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { revalidatePath } from "next/cache"

// Join as a spectator to a match
export async function joinAsSpectator(matchId: string) {
  const cookieStore = await cookies()
  const supabase = createServerActionClient({ cookies: () => cookieStore })

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { error: "User not authenticated" }
    }

    // Check if match exists and is in progress
    const { data: match, error: matchError } = await supabase
      .from("matches")
      .select("*")
      .eq("id", matchId)
      .single()

    if (matchError || !match) {
      return { error: "Match not found" }
    }

    // Check if user is already a player
    if (match.player1_id === user.id || match.player2_id === user.id) {
      return { error: "You are already a player in this match" }
    }

    // Check if match is in progress or completed
    if (match.status === "waiting") {
      return { error: "Match has not started yet" }
    }

    // Add spectator
    const { data, error } = await supabase
      .from("spectators")
      .insert({
        match_id: matchId,
        user_id: user.id,
      })
      .select()
      .single()

    if (error) {
      console.error("Error joining as spectator:", error)
      return { error: "Failed to join as spectator" }
    }

    revalidatePath(`/games/match/${matchId}`)
    return { success: true, data }
  } catch (error) {
    console.error("Join spectator error:", error)
    return { error: "An unexpected error occurred" }
  }
}

// Leave spectator mode
export async function leaveSpectatorMode(matchId: string) {
  const cookieStore = await cookies()
  const supabase = createServerActionClient({ cookies: () => cookieStore })

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { error: "User not authenticated" }
    }

    const { error } = await supabase
      .from("spectators")
      .delete()
      .eq("match_id", matchId)
      .eq("user_id", user.id)

    if (error) {
      console.error("Error leaving spectator mode:", error)
      return { error: "Failed to leave spectator mode" }
    }

    revalidatePath(`/games/match/${matchId}`)
    return { success: true }
  } catch (error) {
    console.error("Leave spectator error:", error)
    return { error: "An unexpected error occurred" }
  }
}

// Get spectators for a match
export async function getSpectators(matchId: string) {
  const cookieStore = await cookies()
  const supabase = createServerActionClient({ cookies: () => cookieStore })

  try {
    const { data, error } = await supabase
      .from("spectators")
      .select(`
        *,
        user:users(id, username, display_name, avatar_url)
      `)
      .eq("match_id", matchId)
      .order("joined_at", { ascending: false })

    if (error) {
      console.error("Error fetching spectators:", error)
      return { error: "Failed to fetch spectators", data: [] }
    }

    return { success: true, data: data || [] }
  } catch (error) {
    console.error("Get spectators error:", error)
    return { error: "An unexpected error occurred", data: [] }
  }
}

// Check if user is a spectator
export async function isSpectator(matchId: string) {
  const cookieStore = await cookies()
  const supabase = createServerActionClient({ cookies: () => cookieStore })

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { isSpectator: false }
    }

    const { data, error } = await supabase
      .from("spectators")
      .select("id")
      .eq("match_id", matchId)
      .eq("user_id", user.id)
      .single()

    if (error || !data) {
      return { isSpectator: false }
    }

    return { isSpectator: true }
  } catch (error) {
    return { isSpectator: false }
  }
}


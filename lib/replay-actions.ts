"use server"

import { createServerActionClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { revalidatePath } from "next/cache"

// Generate a shareable replay token
function generateShareToken(): string {
  // Generate a random token using crypto API (available in Node.js)
  if (typeof window === "undefined") {
    // Server-side: use crypto module
    const crypto = require("crypto")
    return crypto.randomBytes(16).toString("hex")
  } else {
    // Client-side: use Web Crypto API
    const array = new Uint8Array(16)
    crypto.getRandomValues(array)
    return Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join("")
  }
}

// Create a replay from a completed match
export async function createReplay(matchId: string, replayData: any) {
  const cookieStore = await cookies()
  const supabase = createServerActionClient({ cookies: () => cookieStore })

  try {
    // Check if match exists and is completed
    const { data: match, error: matchError } = await supabase
      .from("matches")
      .select("*")
      .eq("id", matchId)
      .single()

    if (matchError || !match) {
      return { error: "Match not found" }
    }

    if (match.status !== "completed") {
      return { error: "Match must be completed to create a replay" }
    }

    // Check if replay already exists
    const { data: existingReplay } = await supabase
      .from("replays")
      .select("id")
      .eq("match_id", matchId)
      .single()

    if (existingReplay) {
      // Update existing replay
      const { data, error } = await supabase
        .from("replays")
        .update({
          replay_data: replayData,
          updated_at: new Date().toISOString(),
        })
        .eq("match_id", matchId)
        .select()
        .single()

      if (error) {
        console.error("Error updating replay:", error)
        return { error: "Failed to update replay" }
      }

      return { success: true, data }
    }

    // Create new replay
    const shareToken = generateShareToken()
    const { data, error } = await supabase
      .from("replays")
      .insert({
        match_id: matchId,
        replay_data: replayData,
        share_token: shareToken,
        is_public: true,
      })
      .select()
      .single()

    if (error) {
      console.error("Error creating replay:", error)
      return { error: "Failed to create replay" }
    }

    revalidatePath(`/replays/${matchId}`)
    return { success: true, data }
  } catch (error) {
    console.error("Create replay error:", error)
    return { error: "An unexpected error occurred" }
  }
}

// Get replay by match ID
export async function getReplayByMatchId(matchId: string) {
  const cookieStore = await cookies()
  const supabase = createServerActionClient({ cookies: () => cookieStore })

  try {
    const { data, error } = await supabase
      .from("replays")
      .select(`
        *,
        match:matches(*)
      `)
      .eq("match_id", matchId)
      .single()

    if (error) {
      if (error.code === "PGRST116") {
        return { error: "Replay not found", data: null }
      }
      console.error("Error fetching replay:", error)
      return { error: "Failed to fetch replay", data: null }
    }

    return { success: true, data }
  } catch (error) {
    console.error("Get replay error:", error)
    return { error: "An unexpected error occurred", data: null }
  }
}

// Get replay by share token
export async function getReplayByShareToken(shareToken: string) {
  const cookieStore = await cookies()
  const supabase = createServerActionClient({ cookies: () => cookieStore })

  try {
    const { data, error } = await supabase
      .from("replays")
      .select(`
        *,
        match:matches(*)
      `)
      .eq("share_token", shareToken)
      .single()

    if (error) {
      if (error.code === "PGRST116") {
        return { error: "Replay not found", data: null }
      }
      console.error("Error fetching replay:", error)
      return { error: "Failed to fetch replay", data: null }
    }

    // Increment view count
    await supabase
      .from("replays")
      .update({ view_count: (data.view_count || 0) + 1 })
      .eq("id", data.id)

    return { success: true, data }
  } catch (error) {
    console.error("Get replay by token error:", error)
    return { error: "An unexpected error occurred", data: null }
  }
}

// Get match history for replay data
export async function getMatchHistoryForReplay(matchId: string) {
  const cookieStore = await cookies()
  const supabase = createServerActionClient({ cookies: () => cookieStore })

  try {
    const { data, error } = await supabase
      .from("match_history")
      .select("*")
      .eq("match_id", matchId)
      .order("timestamp", { ascending: true })

    if (error) {
      console.error("Error fetching match history:", error)
      return { error: "Failed to fetch match history", data: [] }
    }

    return { success: true, data: data || [] }
  } catch (error) {
    console.error("Get match history error:", error)
    return { error: "An unexpected error occurred", data: [] }
  }
}

// Update replay visibility
export async function updateReplayVisibility(matchId: string, isPublic: boolean) {
  const cookieStore = await cookies()
  const supabase = createServerActionClient({ cookies: () => cookieStore })

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { error: "User not authenticated" }
    }

    // Verify user is a player in the match
    const { data: match } = await supabase
      .from("matches")
      .select("player1_id, player2_id")
      .eq("id", matchId)
      .single()

    if (!match || (match.player1_id !== user.id && match.player2_id !== user.id)) {
      return { error: "Unauthorized" }
    }

    const { data, error } = await supabase
      .from("replays")
      .update({ is_public: isPublic })
      .eq("match_id", matchId)
      .select()
      .single()

    if (error) {
      console.error("Error updating replay visibility:", error)
      return { error: "Failed to update replay visibility" }
    }

    revalidatePath(`/replays/${matchId}`)
    return { success: true, data }
  } catch (error) {
    console.error("Update replay visibility error:", error)
    return { error: "An unexpected error occurred" }
  }
}


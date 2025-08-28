"use server"

import { createServerActionClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

// Create a new match
export async function createMatch(prevState: any, formData: FormData) {
  if (!formData) {
    return { error: "Form data is missing" }
  }

  const gameId = formData.get("gameId")
  const betAmount = formData.get("betAmount")

  if (!gameId || !betAmount) {
    return { error: "Game and bet amount are required" }
  }

  const betAmountNum = Number.parseInt(betAmount.toString())
  if (betAmountNum < 1) {
    return { error: "Bet amount must be at least 1 token" }
  }

  const cookieStore = cookies()
  const supabase = createServerActionClient({ cookies: () => cookieStore })

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { error: "User not authenticated" }
    }

    // Check if user has enough tokens
    const { data: userData } = await supabase.from("users").select("tokens").eq("id", user.id).single()

    if (!userData || userData.tokens < betAmountNum) {
      return { error: "Insufficient token balance" }
    }

    // Verify game exists and get min/max bet limits
    const { data: gameData } = await supabase.from("games").select("*").eq("id", gameId.toString()).single()

    if (!gameData) {
      return { error: "Game not found" }
    }

    if (betAmountNum < gameData.min_bet || betAmountNum > gameData.max_bet) {
      return { error: `Bet amount must be between ${gameData.min_bet} and ${gameData.max_bet} tokens` }
    }

    // Create the match
    const { data: matchData, error: matchError } = await supabase
      .from("matches")
      .insert({
        game_id: gameId.toString(),
        player1_id: user.id,
        bet_amount: betAmountNum,
        status: "waiting",
      })
      .select()
      .single()

    if (matchError) {
      console.error("Match creation error:", matchError)
      return { error: "Failed to create match" }
    }

    // Create bet transaction for player 1
    const { error: transactionError } = await supabase.from("transactions").insert({
      user_id: user.id,
      match_id: matchData.id,
      type: "bet",
      amount: -betAmountNum,
      description: `Bet placed for ${gameData.name} match - ${betAmountNum} tokens`,
    })

    if (transactionError) {
      console.error("Transaction error:", transactionError)
      return { error: "Failed to process bet transaction" }
    }

    revalidatePath("/games")
    redirect(`/games/match/${matchData.id}`)
  } catch (error) {
    console.error("Create match error:", error)
    return { error: "An unexpected error occurred. Please try again." }
  }
}

// Join an existing match
export async function joinMatch(matchId: string) {
  const cookieStore = cookies()
  const supabase = createServerActionClient({ cookies: () => cookieStore })

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      throw new Error("User not authenticated")
    }

    // Get match details
    const { data: matchData } = await supabase
      .from("matches")
      .select("*, games(*)")
      .eq("id", matchId)
      .eq("status", "waiting")
      .single()

    if (!matchData) {
      throw new Error("Match not found or no longer available")
    }

    if (matchData.player1_id === user.id) {
      throw new Error("Cannot join your own match")
    }

    // Check if user has enough tokens
    const { data: userData } = await supabase.from("users").select("tokens").eq("id", user.id).single()

    if (!userData || userData.tokens < matchData.bet_amount) {
      throw new Error("Insufficient token balance")
    }

    // Update match with player 2 and set status to in_progress
    const { error: updateError } = await supabase
      .from("matches")
      .update({
        player2_id: user.id,
        status: "in_progress",
        started_at: new Date().toISOString(),
      })
      .eq("id", matchId)

    if (updateError) {
      throw new Error("Failed to join match")
    }

    // Create bet transaction for player 2
    const { error: transactionError } = await supabase.from("transactions").insert({
      user_id: user.id,
      match_id: matchId,
      type: "bet",
      amount: -matchData.bet_amount,
      description: `Bet placed for ${matchData.games.name} match - ${matchData.bet_amount} tokens`,
    })

    if (transactionError) {
      console.error("Transaction error:", transactionError)
      throw new Error("Failed to process bet transaction")
    }

    revalidatePath("/games")
    redirect(`/games/match/${matchId}`)
  } catch (error) {
    console.error("Join match error:", error)
    throw error
  }
}

// Cancel a match (only if you're the creator and no one has joined)
export async function cancelMatch(matchId: string) {
  const cookieStore = cookies()
  const supabase = createServerActionClient({ cookies: () => cookieStore })

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      throw new Error("User not authenticated")
    }

    // Get match details
    const { data: matchData } = await supabase
      .from("matches")
      .select("*")
      .eq("id", matchId)
      .eq("player1_id", user.id)
      .eq("status", "waiting")
      .single()

    if (!matchData) {
      throw new Error("Match not found or cannot be cancelled")
    }

    // Update match status to cancelled
    const { error: updateError } = await supabase.from("matches").update({ status: "cancelled" }).eq("id", matchId)

    if (updateError) {
      throw new Error("Failed to cancel match")
    }

    // Refund the bet to player 1
    const { error: refundError } = await supabase.from("transactions").insert({
      user_id: user.id,
      match_id: matchId,
      type: "bonus",
      amount: matchData.bet_amount,
      description: `Match cancelled - refund of ${matchData.bet_amount} tokens`,
    })

    if (refundError) {
      console.error("Refund error:", refundError)
      throw new Error("Failed to process refund")
    }

    revalidatePath("/games")
    redirect("/games")
  } catch (error) {
    console.error("Cancel match error:", error)
    throw error
  }
}

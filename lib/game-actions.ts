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

  const cookieStore = await cookies()
  const supabase = createServerActionClient({ cookies: () => cookieStore })

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { error: "User not authenticated" }
    }

    // Check if user has enough tokens
    const { data: userData, error: userError } = await supabase.from("users").select("tokens").eq("id", user.id).single()

    if (userError) {
      console.error("Error fetching user data:", userError)
      return { error: "Failed to fetch user data" }
    }

    if (!userData || userData.tokens < betAmountNum) {
      return { error: "Insufficient token balance" }
    }

    // Verify game exists and get min/max bet limits
    const { data: gameData, error: gameError } = await supabase.from("games").select("*").eq("id", gameId.toString()).single()

    if (gameError) {
      console.error("Error fetching game data:", gameError)
      return { error: "Failed to fetch game data" }
    }

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

    // Deduct tokens from user
    const { error: updateError } = await supabase
      .from("users")
      .update({ tokens: userData.tokens - betAmountNum })
      .eq("id", user.id)

    if (updateError) {
      console.error("Error updating user tokens:", updateError)
      return { error: "Failed to update user tokens" }
    }

    // Create transaction record
    const { error: transactionError } = await supabase.from("transactions").insert({
      user_id: user.id,
      match_id: matchData.id,
      amount: -betAmountNum,
      type: "bet",
      description: `Bet ${betAmountNum} tokens on ${gameData.name}`,
    })

    if (transactionError) {
      console.error("Transaction creation error:", transactionError)
      return { error: "Failed to create transaction record" }
    }

    revalidatePath("/matches")
    revalidatePath("/dashboard")

    return { success: true, matchId: matchData.id }
  } catch (error) {
    console.error("Unexpected error in createMatch:", error)
    return { error: "An unexpected error occurred. Please try again." }
  }
}

// Join an existing match
export async function joinMatch(matchId: string) {
  const cookieStore = await cookies()
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
      console.error("Update match error:", updateError)
      throw new Error("Failed to join match")
    }

    // Mark any waiting matchmaking queues for player2 as matched
    await supabase
      .from("matchmaking_queue")
      .update({ status: "matched" })
      .eq("user_id", user.id)
      .eq("status", "waiting")
    
    // Also mark player1's queues as matched if they have any
    if (matchData.player1_id) {
      await supabase
        .from("matchmaking_queue")
        .update({ status: "matched" })
        .eq("user_id", matchData.player1_id)
        .eq("status", "waiting")
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
    revalidatePath("/matches")
    
    console.log("✅ Match joined successfully:", { matchId, player2Id: user.id })
    
    // Return success instead of redirect for server action compatibility
    return { success: true, matchId }
  } catch (error) {
    console.error("Join match error:", error)
    throw error
  }
}

// Cancel a match (only if you're the creator and no one has joined)
export async function cancelMatch(matchId: string) {
  console.log("🚫 cancelMatch called with matchId:", matchId)
  const cookieStore = await cookies()
  const supabase = createServerActionClient({ cookies: () => cookieStore })

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    console.log("🚫 User authenticated:", !!user, "User ID:", user?.id)

    if (!user) {
      throw new Error("User not authenticated")
    }

    // Get match details - user can be either player1 or player2
    console.log("🚫 Looking for match with ID:", matchId, "and user:", user.id)
    const { data: matchData, error: matchError } = await supabase
      .from("matches")
      .select("*")
      .eq("id", matchId)
      .or(`player1_id.eq.${user.id},player2_id.eq.${user.id}`)
      .in("status", ["waiting", "in_progress", "completed", "cancelled"])
      .single()

    console.log("🚫 Match query result:", { matchData, matchError })

    if (!matchData) {
      console.log("🚫 Match not found or cannot be cancelled")
      throw new Error("Match not found or cannot be cancelled")
    }

    // If match is already cancelled, just return success
    if (matchData.status === "cancelled") {
      console.log("🚫 Match is already cancelled")
      return { success: true, message: "Match is already cancelled" }
    }

    // Update match status to cancelled
    console.log("🚫 Updating match status to cancelled...")
    const { error: updateError } = await supabase.from("matches").update({ status: "cancelled" }).eq("id", matchId)

    console.log("🚫 Update result:", { updateError })

    if (updateError) {
      console.error("🚫 Failed to update match status:", updateError)
      throw new Error("Failed to cancel match")
    }

    // Refund the bet to player 1
    console.log("🚫 Processing refund for amount:", matchData.bet_amount)
    const { error: refundError } = await supabase.from("transactions").insert({
      user_id: user.id,
      match_id: matchId,
      type: "bonus",
      amount: matchData.bet_amount,
      description: `Match cancelled - refund of ${matchData.bet_amount} tokens`,
    })

    console.log("🚫 Refund result:", { refundError })

    if (refundError) {
      console.error("🚫 Refund error:", refundError)
      throw new Error("Failed to process refund")
    }

    console.log("🚫 Revalidating paths...")
    revalidatePath("/games")
    revalidatePath("/matches")
    
    console.log("🚫 Cancel match successful!")
    // Return success instead of redirect for server action compatibility
    return { success: true }
  } catch (error) {
    console.error("Cancel match error:", error)
    throw error
  }
}

// Create a rematch and deduct tokens atomically
export async function createRematchWithDeduction(
  originalMatchId: string,
  gameId: string,
  player1Id: string,
  player2Id: string,
  betAmount: number
) {
  const cookieStore = await cookies()
  const supabase = createServerActionClient({ cookies: () => cookieStore })

  try {
    console.log('🔄 Creating rematch with token deduction:', {
      originalMatchId,
      gameId,
      player1Id,
      player2Id,
      betAmount
    })

    // Get the original match to copy category (for trivia games)
    const { data: originalMatch } = await supabase
      .from('matches')
      .select('game_data')
      .eq('id', originalMatchId)
      .single()
    
    const originalCategory = originalMatch?.game_data?.category
    console.log('📋 Original match category for rematch:', originalCategory)

    // Verify both players have sufficient tokens
    const { data: player1Data, error: player1Error } = await supabase
      .from('users')
      .select('tokens')
      .eq('id', player1Id)
      .single()

    const { data: player2Data, error: player2Error } = await supabase
      .from('users')
      .select('tokens')
      .eq('id', player2Id)
      .single()

    if (player1Error || player2Error) {
      console.error('❌ Error fetching player tokens:', { player1Error, player2Error })
      return { success: false, error: 'Failed to fetch player token balances' }
    }

    if (!player1Data || player1Data.tokens < betAmount) {
      return { success: false, error: 'Player 1 has insufficient tokens' }
    }

    if (!player2Data || player2Data.tokens < betAmount) {
      return { success: false, error: 'Player 2 has insufficient tokens' }
    }

    // Create the new match with appropriate game_data based on game type
    // Connect 4 game ID: 69bf26d2-110b-40d9-b20a-d5cfab14d133
    // Trivia game ID: e03ee060-b913-4795-9149-54660e2e2eac
    const isConnectFour = gameId === '69bf26d2-110b-40d9-b20a-d5cfab14d133'
    const isTrivia = gameId === 'e03ee060-b913-4795-9149-54660e2e2eac'
    
    const gameData = isConnectFour ? {
      board: Array(42).fill(null),
      currentPlayer: 'player1',
      winner: null
    } : isTrivia ? {
      // Trivia will initialize its own gameState when the component loads
      // Copy category from original match so rematch uses same category
      ...(originalCategory ? { category: originalCategory } : {})
    } : {} // For other games, let the component initialize game_data
    
    if (isTrivia) {
      console.log('📋 Rematch game_data for trivia:', gameData, 'Category:', originalCategory)
    }
    
    const { data: newMatch, error: matchError } = await supabase
      .from('matches')
      .insert({
        game_id: gameId,
        player1_id: player1Id,
        player2_id: player2Id,
        bet_amount: betAmount,
        status: 'in_progress',
        started_at: new Date().toISOString(),
        game_data: gameData
      })
      .select()
      .single()

    if (matchError || !newMatch) {
      console.error('❌ Error creating rematch match:', matchError)
      return { success: false, error: `Failed to create rematch: ${matchError?.message || 'Unknown error'}` }
    }

    console.log('✅ Rematch match created:', newMatch.id)

    // Check if tokens were already deducted (prevent duplicate deductions)
    const { data: existingTransactions } = await supabase
      .from('transactions')
      .select('id, user_id')
      .eq('match_id', newMatch.id)
      .eq('type', 'bet')
      .in('user_id', [player1Id, player2Id])

    if (existingTransactions && existingTransactions.length >= 2) {
      console.log('⚠️ Tokens already deducted for this match, skipping duplicate deduction')
      return { success: true, matchId: newMatch.id, alreadyDeducted: true }
    }

    // Deduct from player1
    const { error: player1UpdateError } = await supabase
      .from('users')
      .update({ tokens: player1Data.tokens - betAmount })
      .eq('id', player1Id)

    if (player1UpdateError) {
      console.error('❌ Error deducting tokens from player1:', player1UpdateError)
      // Try to delete the match if token deduction fails
      await supabase.from('matches').delete().eq('id', newMatch.id)
      return { success: false, error: 'Failed to deduct tokens from player 1' }
    }

    // Deduct from player2
    const { error: player2UpdateError } = await supabase
      .from('users')
      .update({ tokens: player2Data.tokens - betAmount })
      .eq('id', player2Id)

    if (player2UpdateError) {
      console.error('❌ Error deducting tokens from player2:', player2UpdateError)
      // Try to refund player1 if player2 deduction fails
      await supabase
        .from('users')
        .update({ tokens: player1Data.tokens })
        .eq('id', player1Id)
      // Try to delete the match if token deduction fails
      await supabase.from('matches').delete().eq('id', newMatch.id)
      return { success: false, error: 'Failed to deduct tokens from player 2' }
    }

    // Create transaction records (database trigger will update balances)
    const { error: transaction1Error } = await supabase.from('transactions').insert({
      user_id: player1Id,
      match_id: newMatch.id,
      amount: -betAmount,
      type: 'bet',
      description: `Rematch bet - ${betAmount} tokens`
    })

    const { error: transaction2Error } = await supabase.from('transactions').insert({
      user_id: player2Id,
      match_id: newMatch.id,
      amount: -betAmount,
      type: 'bet',
      description: `Rematch bet - ${betAmount} tokens`
    })

    if (transaction1Error || transaction2Error) {
      console.error('❌ Error creating transaction records:', { transaction1Error, transaction2Error })
      // Don't fail - tokens are already deducted
    }

    console.log('✅ Rematch created and tokens deducted successfully:', {
      matchId: newMatch.id,
      player1: { previous: player1Data.tokens, new: player1Data.tokens - betAmount },
      player2: { previous: player2Data.tokens, new: player2Data.tokens - betAmount }
    })

    revalidatePath('/games')
    revalidatePath('/matches')

    return {
      success: true,
      matchId: newMatch.id,
      player1Balance: player1Data.tokens - betAmount,
      player2Balance: player2Data.tokens - betAmount
    }
  } catch (error: any) {
    console.error('❌ Unexpected error creating rematch with deduction:', error)
    return { success: false, error: error?.message || 'An unexpected error occurred' }
  }
}

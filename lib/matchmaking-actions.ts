"use server"

import { createServerActionClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

// Join matchmaking queue with 3-minute wait
export async function joinMatchmakingQueue(
  gameId: string, 
  betAmount: number, 
  matchType: 'free' | 'tokens' | 'cash5' | 'cash10'
) {
  const cookieStore = await cookies()
  const supabase = createServerActionClient({ cookies: () => cookieStore })

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { error: "User not authenticated" }
    }

    // Check if user has enough tokens for the bet
    if (matchType !== 'free') {
      const { data: userData } = await supabase
        .from("users")
        .select("tokens")
        .eq("id", user.id)
        .single()

      if (!userData || userData.tokens < betAmount) {
        return { error: "Insufficient token balance" }
      }
    }

    // First, try to find an existing priority match to join
    const { data: priorityMatch } = await supabase
      .from("priority_matches")
      .select(`
        id,
        original_match_id,
        player1_id,
        matches!inner (
          game_id,
          bet_amount
        )
      `)
      .eq("status", "waiting_player2")
      .eq("matches.game_id", gameId)
      .eq("matches.bet_amount", betAmount)
      .neq("player1_id", user.id) // Can't join your own priority match
      .single()

    if (priorityMatch) {
      // Join existing priority match
      const { error: updateError } = await supabase
        .from("priority_matches")
        .update({
          player2_id: user.id,
          status: "completed"
        })
        .eq("id", priorityMatch.id)

      if (updateError) {
        console.error("Failed to join priority match:", updateError)
        return { error: "Failed to join priority match" }
      }

      // Update the original match
      const { error: matchUpdateError } = await supabase
        .from("matches")
        .update({
          player2_id: user.id,
          status: "waiting"
        })
        .eq("id", priorityMatch.original_match_id)

      if (matchUpdateError) {
        console.error("Failed to update match:", matchUpdateError)
        return { error: "Failed to update match" }
      }

      // Deduct tokens for player2 if not free
      if (matchType !== 'free') {
        const { error: tokenError } = await supabase
          .from("users")
          .update({ tokens: userData.tokens - betAmount })
          .eq("id", user.id)

        if (tokenError) {
          console.error("Failed to deduct tokens:", tokenError)
          return { error: "Failed to process bet" }
        }

        // Create transaction record
        await supabase.from("transactions").insert({
          user_id: user.id,
          match_id: priorityMatch.original_match_id,
          amount: -betAmount,
          type: "bet",
          description: `Bet ${betAmount} tokens on priority match`
        })
      }

      revalidatePath("/games")
      revalidatePath("/matches")
      
      return { 
        success: true, 
        matchId: priorityMatch.original_match_id,
        matchType: "priority_joined"
      }
    }

    // Check if there's already someone waiting in the queue for the same game and bet
    console.log(`🔍 Looking for existing queue: gameId=${gameId}, betAmount=${betAmount}, userId=${user.id}`)
    
    // First, let's see what's actually in the queue
    const { data: allQueues } = await supabase
      .from("matchmaking_queue")
      .select("*")
      .eq("status", "waiting")
      .gt("expires_at", new Date().toISOString())
    
    console.log(`🔍 All waiting queues:`, allQueues)
    
    // Also check with user join to see if the issue is in the join
    const { data: allQueuesWithUsers } = await supabase
      .from("matchmaking_queue")
      .select(`
        *,
        users (id, username, display_name)
      `)
      .eq("status", "waiting")
      .gt("expires_at", new Date().toISOString())
    
    console.log(`🔍 All waiting queues with users:`, allQueuesWithUsers)
    
    const { data: existingQueues, error: queueError } = await supabase
      .from("matchmaking_queue")
      .select("*")
      .eq("game_id", gameId)
      .eq("bet_amount", betAmount)
      .eq("status", "waiting")
      .neq("user_id", user.id) // Can't match with yourself
      .gt("expires_at", new Date().toISOString()) // Still valid
      .limit(1)

    const existingQueue = existingQueues?.[0] || null
    console.log(`🔍 Queue search result:`, { existingQueue, queueError })

    if (existingQueue) {
      // Found a match! Create a match for both players
      console.log(`🎯 Found existing queue entry, creating match!`, existingQueue)
      
      const { data: matchData, error: matchError } = await supabase
        .from("matches")
        .insert({
          game_id: gameId,
          player1_id: existingQueue.user_id,
          player2_id: user.id,
          bet_amount: betAmount,
          status: "waiting"
        })
        .select()
        .single()

      if (matchError) {
        console.error("❌ Failed to create match:", matchError)
        return { error: "Failed to create match" }
      }

      console.log("✅ Match created successfully:", matchData)

      // Update both queue entries as matched
      await supabase
        .from("matchmaking_queue")
        .update({ status: "matched" })
        .eq("id", existingQueue.id)

      // Deduct tokens for both players if not free
      if (matchType !== 'free') {
        // Deduct for player1 (existing queue user)
        const { data: player1Data } = await supabase
          .from("users")
          .select("tokens")
          .eq("id", existingQueue.user_id)
          .single()

        if (player1Data) {
          await supabase
            .from("users")
            .update({ tokens: player1Data.tokens - betAmount })
            .eq("id", existingQueue.user_id)

          await supabase.from("transactions").insert({
            user_id: existingQueue.user_id,
            match_id: matchData.id,
            amount: -betAmount,
            type: "bet",
            description: `Bet ${betAmount} tokens on match`
          })
        }

        // Deduct for player2 (current user)
        const { data: player2Data } = await supabase
          .from("users")
          .select("tokens")
          .eq("id", user.id)
          .single()

        if (player2Data) {
          await supabase
            .from("users")
            .update({ tokens: player2Data.tokens - betAmount })
            .eq("id", user.id)
        }

        await supabase.from("transactions").insert({
          user_id: user.id,
          match_id: matchData.id,
          amount: -betAmount,
          type: "bet",
          description: `Bet ${betAmount} tokens on match`
        })
      }

      revalidatePath("/games")
      revalidatePath("/matches")
      
      return { 
        success: true, 
        matchId: matchData.id,
        matchType: "matched"
      }
    }

    // No match found, create new matchmaking queue entry
    console.log(`⏳ No match found, creating new queue entry for user ${user.id}`)
    
    const expiresAt = new Date()
    expiresAt.setMinutes(expiresAt.getMinutes() + 3) // 3 minutes from now

    const { data: queueEntry, error: createQueueError } = await supabase
      .from("matchmaking_queue")
      .insert({
        user_id: user.id,
        game_id: gameId,
        bet_amount: betAmount,
        match_type: matchType,
        expires_at: expiresAt.toISOString()
      })
      .select(`
        *,
        users (id, username, display_name)
      `)
      .single()

    if (createQueueError) {
      console.error("Failed to create queue entry:", createQueueError)
      return { error: "Failed to join matchmaking queue" }
    }

    console.log(`✅ Created queue entry:`, queueEntry)
    console.log(`✅ Queue entry user data:`, queueEntry.users)

    // Start the 3-minute timer
    setTimeout(async () => {
      await handleMatchmakingTimeout(queueEntry.id, supabase)
    }, 3 * 60 * 1000) // 3 minutes

    revalidatePath("/games")
    
    return { 
      success: true, 
      queueId: queueEntry.id,
      matchType: "queue_waiting",
      expiresAt: expiresAt.toISOString()
    }

  } catch (error) {
    console.error("Unexpected error in joinMatchmakingQueue:", error)
    return { error: "An unexpected error occurred. Please try again." }
  }
}

// Handle matchmaking timeout - create priority match
async function handleMatchmakingTimeout(queueId: string, supabase: any) {
  try {
    // Get the queue entry
    const { data: queueEntry } = await supabase
      .from("matchmaking_queue")
      .select("*")
      .eq("id", queueId)
      .eq("status", "waiting")
      .single()

    if (!queueEntry) {
      return // Already processed or cancelled
    }

    // Create a regular match for the player
    const { data: matchData, error: matchError } = await supabase
      .from("matches")
      .insert({
        game_id: queueEntry.game_id,
        player1_id: queueEntry.user_id,
        bet_amount: queueEntry.bet_amount,
        status: "waiting"
      })
      .select()
      .single()

    if (matchError) {
      console.error("Failed to create match:", matchError)
      return
    }

    // Create priority match entry
    const { error: priorityError } = await supabase
      .from("priority_matches")
      .insert({
        original_match_id: matchData.id,
        player1_id: queueEntry.user_id,
        status: "waiting_player2"
      })

    if (priorityError) {
      console.error("Failed to create priority match:", priorityError)
      return
    }

    // Update queue entry
    await supabase
      .from("matchmaking_queue")
      .update({
        status: "expired",
        priority_match_id: matchData.id
      })
      .eq("id", queueId)

    // Deduct tokens if not free
    if (queueEntry.match_type !== 'free') {
      const { data: userData } = await supabase
        .from("users")
        .select("tokens")
        .eq("id", queueEntry.user_id)
        .single()

      if (userData) {
        await supabase
          .from("users")
          .update({ tokens: userData.tokens - queueEntry.bet_amount })
          .eq("id", queueEntry.user_id)

        // Create transaction record
        await supabase.from("transactions").insert({
          user_id: queueEntry.user_id,
          match_id: matchData.id,
          amount: -queueEntry.bet_amount,
          type: "bet",
          description: `Bet ${queueEntry.bet_amount} tokens on priority match`
        })
      }
    }

    console.log(`✅ Created priority match for user ${queueEntry.user_id}`)

  } catch (error) {
    console.error("Error handling matchmaking timeout:", error)
  }
}

// Cancel matchmaking queue entry
export async function cancelMatchmakingQueue(queueId: string) {
  const cookieStore = await cookies()
  const supabase = createServerActionClient({ cookies: () => cookieStore })

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { error: "User not authenticated" }
    }

    // Update queue entry status
    const { error } = await supabase
      .from("matchmaking_queue")
      .update({ status: "cancelled" })
      .eq("id", queueId)
      .eq("user_id", user.id)

    if (error) {
      console.error("Failed to cancel queue entry:", error)
      return { error: "Failed to cancel matchmaking" }
    }

    revalidatePath("/games")
    
    return { success: true }

  } catch (error) {
    console.error("Unexpected error in cancelMatchmakingQueue:", error)
    return { error: "An unexpected error occurred. Please try again." }
  }
}

// Submit results for priority match
export async function submitPriorityMatchResult(
  matchId: string, 
  gameResult: any
) {
  const cookieStore = await cookies()
  const supabase = createServerActionClient({ cookies: () => cookieStore })

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { error: "User not authenticated" }
    }

    // Get priority match
    const { data: priorityMatch } = await supabase
      .from("priority_matches")
      .select("*")
      .eq("original_match_id", matchId)
      .single()

    if (!priorityMatch) {
      return { error: "Priority match not found" }
    }

    // Determine which player this is
    const isPlayer1 = priorityMatch.player1_id === user.id
    const isPlayer2 = priorityMatch.player2_id === user.id

    if (!isPlayer1 && !isPlayer2) {
      return { error: "You are not part of this match" }
    }

    // Update the appropriate player's result
    const updateData = isPlayer1 
      ? { player1_result: gameResult }
      : { player2_result: gameResult }

    const { error: updateError } = await supabase
      .from("priority_matches")
      .update(updateData)
      .eq("id", priorityMatch.id)

    if (updateError) {
      console.error("Failed to update priority match result:", updateError)
      return { error: "Failed to submit result" }
    }

    // Check if both players have submitted results
    const updatedMatch = await supabase
      .from("priority_matches")
      .select("*")
      .eq("id", priorityMatch.id)
      .single()

    if (updatedMatch.data?.player1_result && updatedMatch.data?.player2_result) {
      // Both results in, determine winner
      const player1Score = updatedMatch.data.player1_result.finalScore || 0
      const player2Score = updatedMatch.data.player2_result.finalScore || 0
      
      let winnerId = null
      if (player1Score > player2Score) {
        winnerId = priorityMatch.player1_id
      } else if (player2Score > player1Score) {
        winnerId = priorityMatch.player2_id
      }

      // Update priority match as completed
      await supabase
        .from("priority_matches")
        .update({
          status: "completed",
          winner_id: winnerId,
          completed_at: new Date().toISOString()
        })
        .eq("id", priorityMatch.id)

      // Update original match
      await supabase
        .from("matches")
        .update({
          status: "completed",
          winner_id: winnerId,
          completed_at: new Date().toISOString(),
          game_data: {
            player1_result: updatedMatch.data.player1_result,
            player2_result: updatedMatch.data.player2_result,
            winner: winnerId ? (winnerId === priorityMatch.player1_id ? 'player1' : 'player2') : 'draw'
          }
        })
        .eq("id", matchId)

      // Distribute tokens to winner
      if (winnerId && priorityMatch.original_match_id) {
        const { data: matchData } = await supabase
          .from("matches")
          .select("bet_amount")
          .eq("id", priorityMatch.original_match_id)
          .single()

        if (matchData) {
          const winnings = matchData.bet_amount * 2 // Both players' bets
          
          // Add winnings to winner
          await supabase
            .from("users")
            .update({ tokens: supabase.raw(`tokens + ${winnings}`) })
            .eq("id", winnerId)

          // Create transaction record
          await supabase.from("transactions").insert({
            user_id: winnerId,
            match_id: priorityMatch.original_match_id,
            amount: winnings,
            type: "win",
            description: `Won priority match - ${winnings} tokens`
          })
        }
      }
    }

    revalidatePath("/matches")
    revalidatePath("/dashboard")
    
    return { success: true }

  } catch (error) {
    console.error("Unexpected error in submitPriorityMatchResult:", error)
    return { error: "An unexpected error occurred. Please try again." }
  }
}

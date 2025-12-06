"use server"

import { createServerActionClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"

export async function deductMatchTokens(matchId: string, player1Id: string, player2Id: string, betAmount: number) {
  const cookieStore = await cookies()
  const supabase = createServerActionClient({ cookies: () => cookieStore })

  try {
    console.log('💰 Deducting tokens for match:', { matchId, player1Id, player2Id, betAmount })

    if (betAmount <= 0) {
      return { success: true, message: 'No bet amount, skipping token deduction' }
    }

    // Check if tokens were already deducted (prevent duplicate deductions)
    const { data: existingTransactions } = await supabase
      .from('transactions')
      .select('id, user_id')
      .eq('match_id', matchId)
      .eq('type', 'bet')
      .in('user_id', [player1Id, player2Id])

    if (existingTransactions && existingTransactions.length >= 2) {
      console.log('⚠️ Tokens already deducted for this match, skipping duplicate deduction')
      return { success: true, message: 'Tokens already deducted', alreadyDeducted: true }
    }

    // Get current token balances for both players
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

    // Deduct from player1
    const { error: player1UpdateError } = await supabase
      .from('users')
      .update({ tokens: player1Data.tokens - betAmount })
      .eq('id', player1Id)

    if (player1UpdateError) {
      console.error('❌ Error deducting tokens from player1:', player1UpdateError)
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
      return { success: false, error: 'Failed to deduct tokens from player 2' }
    }

    // Create transaction records
    const { error: transaction1Error } = await supabase.from('transactions').insert({
      user_id: player1Id,
      match_id: matchId,
      amount: -betAmount,
      type: 'bet',
      description: `Match bet - ${betAmount} tokens`
    })

    const { error: transaction2Error } = await supabase.from('transactions').insert({
      user_id: player2Id,
      match_id: matchId,
      amount: -betAmount,
      type: 'bet',
      description: `Match bet - ${betAmount} tokens`
    })

    if (transaction1Error || transaction2Error) {
      console.error('❌ Error creating transaction records:', { transaction1Error, transaction2Error })
      // Don't fail - tokens are already deducted
    }

    console.log('✅ Tokens deducted successfully:', {
      player1: { previous: player1Data.tokens, new: player1Data.tokens - betAmount },
      player2: { previous: player2Data.tokens, new: player2Data.tokens - betAmount }
    })

    return { 
      success: true, 
      player1Balance: player1Data.tokens - betAmount,
      player2Balance: player2Data.tokens - betAmount
    }
  } catch (error) {
    console.error('❌ Unexpected error deducting match tokens:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}


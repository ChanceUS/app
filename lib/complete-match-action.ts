"use server"

import { createServerActionClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { revalidatePath } from "next/cache"

export async function completeMatch(matchId: string, winnerId: string | null, gameData: any) {
  const cookieStore = await cookies()
  const supabase = createServerActionClient({ cookies: () => cookieStore })

  try {
    console.log('🔄 Server action: Completing match:', { matchId, winnerId })

    const { data, error } = await supabase
      .from('matches')
      .update({ 
        status: 'completed',
        winner_id: winnerId,
        completed_at: new Date().toISOString(),
        game_data: gameData
      })
      .eq('id', matchId)
      .select()

    if (error) {
      console.error('❌ Server action: Failed to complete match:', error)
      return { success: false, error: error.message }
    }

    console.log('✅ Server action: Match completed successfully:', data)

    // Check if this match is part of a tournament
    const { data: tournamentMatch } = await supabase
      .from('tournament_matches')
      .select('tournament_id, round_number')
      .eq('match_id', matchId)
      .single()

    if (tournamentMatch) {
      // Update tournament match status
      await supabase
        .from('tournament_matches')
        .update({ status: 'completed' })
        .eq('match_id', matchId)

      console.log('✅ Tournament match updated:', tournamentMatch)

      // Revalidate tournament page
      revalidatePath(`/tournaments/${tournamentMatch.tournament_id}`)

      // Return tournament info so client can redirect
      return { 
        success: true, 
        data,
        tournament_id: tournamentMatch.tournament_id 
      }
    }

    // Revalidate the games page to update the UI
    revalidatePath('/games')
    revalidatePath('/matches')

    return { success: true, data }
  } catch (error) {
    console.error('❌ Server action: Unexpected error:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

"use server"

import { createServerActionClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"

export async function forceCompleteMatches() {
  const cookieStore = await cookies()
  const supabase = createServerActionClient({ cookies: () => cookieStore })

  try {
    console.log('🔄 Force completing matches that should be completed...')

    // Find matches that have both players but are still in "waiting" status
    // Only force complete matches that are older than 5 minutes to avoid completing fresh matches
    const fiveMinutesAgo = new Date()
    fiveMinutesAgo.setMinutes(fiveMinutesAgo.getMinutes() - 5)
    
    const { data: matchesToComplete, error: fetchError } = await supabase
      .from('matches')
      .select('id, player1_id, player2_id, status, created_at')
      .eq('status', 'waiting')
      .not('player2_id', 'is', null)
      .lt('created_at', fiveMinutesAgo.toISOString()) // Only matches older than 5 minutes
      .order('created_at', { ascending: false })

    if (fetchError) {
      console.error('❌ Failed to fetch matches to complete:', fetchError)
      return { success: false, error: fetchError.message }
    }

    if (!matchesToComplete || matchesToComplete.length === 0) {
      console.log('✅ No matches need to be force completed')
      return { success: true, message: 'No matches need to be completed', count: 0 }
    }

    console.log(`🔍 Found ${matchesToComplete.length} matches that should be completed:`, 
      matchesToComplete.map(m => ({ id: m.id, p1: m.player1_id, p2: m.player2_id, created: m.created_at })))

    let completedCount = 0
    for (const match of matchesToComplete) {
      // Update match to completed status
      const { error: updateError } = await supabase
        .from('matches')
        .update({ 
          status: 'completed',
          completed_at: new Date().toISOString()
        })
        .eq('id', match.id)

      if (updateError) {
        console.error(`❌ Failed to complete match ${match.id}:`, updateError)
      } else {
        console.log(`✅ Force completed match ${match.id}`)
        completedCount++
      }
    }

    // Note: revalidatePath removed as it can't be called during render
    // The UI will update on next page refresh or navigation

    console.log(`✅ Force completed ${completedCount} matches`)
    return { success: true, count: completedCount }
  } catch (error) {
    console.error('❌ Force complete matches error:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}


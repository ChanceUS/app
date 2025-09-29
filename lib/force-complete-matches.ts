"use server"

import { createServerActionClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { revalidatePath } from "next/cache"

export async function forceCompleteMatches() {
  const cookieStore = await cookies()
  const supabase = createServerActionClient({ cookies: () => cookieStore })

  try {
    console.log('🔄 Force completing matches that should be completed...')

    // Find matches that have both players but are still in "waiting" status
    const { data: matchesToComplete, error: fetchError } = await supabase
      .from('matches')
      .select('id, player1_id, player2_id, status, created_at')
      .eq('status', 'waiting')
      .not('player2_id', 'is', null)
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

    // Revalidate pages to update UI
    revalidatePath('/games')
    revalidatePath('/matches')

    console.log(`✅ Force completed ${completedCount} matches`)
    return { success: true, count: completedCount }
  } catch (error) {
    console.error('❌ Force complete matches error:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}


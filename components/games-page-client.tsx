"use client"

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'

interface GamesPageClientProps {
  userId: string
}

export default function GamesPageClient({ userId }: GamesPageClientProps) {
  const router = useRouter()

  useEffect(() => {
    console.log('🔄 Setting up match completion monitoring for user:', userId)

    // Set up real-time subscription for match completion
    const subscription = supabase
      .channel('match-completion-updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'matches',
          filter: `or(player1_id.eq.${userId},player2_id.eq.${userId})`
        },
        (payload) => {
          console.log('🔄 Match update detected:', payload)
          const match = payload.new as any
          
          // If match status changed to completed, refresh the page
          if (match.status === 'completed' && 
              (match.player1_id === userId || match.player2_id === userId)) {
            console.log('🏁 Match completed! Refreshing games page...')
            // Small delay to ensure the database is fully updated
            setTimeout(() => {
              router.refresh()
            }, 1000)
          }
        }
      )
      .subscribe((status) => {
        console.log('🔄 Match completion subscription status:', status)
      })

    // Cleanup on unmount
    return () => {
      console.log('🧹 Cleaning up match completion subscription')
      subscription.unsubscribe()
    }
  }, [userId, router])

  // This component doesn't render anything, it just handles real-time updates
  return null
}

"use client"

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'

interface RealTimeHandlerProps {
  userId: string
}

export default function RealTimeHandler({ userId }: RealTimeHandlerProps) {
  const router = useRouter()
  const lastCheckedMatch = useRef<string | null>(null)
  const hasRedirected = useRef<boolean>(false)

  useEffect(() => {
    console.log("🔄 Setting up match monitoring for user:", userId)

    // Check immediately when component mounts
    const checkActiveMatches = async () => {
      try {
        // Don't redirect if we're on games pages - let the user browse freely
        const currentPath = window.location.pathname
        if (currentPath.includes('/create') || currentPath === '/games' || currentPath.startsWith('/games/')) {
          console.log("🔍 On games page, skipping redirect to let user browse freely")
          return false
        }

        const { data: activeMatches, error } = await supabase
          .from('matches')
          .select('id, status, player1_id, player2_id, created_at')
          .or(`player1_id.eq.${userId},player2_id.eq.${userId}`)
          .in('status', ['waiting', 'in_progress'])
          .order('created_at', { ascending: false })
          .limit(1)

        if (error) {
          console.error("❌ Error checking for active matches:", error)
          return
        }

        if (activeMatches && activeMatches.length > 0) {
          const match = activeMatches[0]
          console.log("🔍 Found active match:", match)
          
          // Only redirect if this is a VERY NEW match (created in the last 10 seconds) that we haven't seen before
          const matchCreatedAt = new Date(match.created_at)
          const tenSecondsAgo = new Date(Date.now() - 10 * 1000)
          const isVeryRecentMatch = matchCreatedAt > tenSecondsAgo
          
          // Also redirect if match status JUST changed to in_progress (someone just joined)
          const isMatchInProgress = match.status === 'in_progress'
          const isNewInProgress = isMatchInProgress && lastCheckedMatch.current !== match.id
          
          if (isVeryRecentMatch && !hasRedirected.current) {
            console.log("🎮 VERY NEW match detected! Redirecting to:", match.id, "Status:", match.status)
            lastCheckedMatch.current = match.id
            hasRedirected.current = true
            router.push(`/games/match/${match.id}`)
            return true // Found and redirected
          } else if (isNewInProgress && !hasRedirected.current) {
            console.log("🎮 Match just started! Redirecting to:", match.id)
            lastCheckedMatch.current = match.id
            hasRedirected.current = true
            router.push(`/games/match/${match.id}`)
            return true // Found and redirected
          } else {
            console.log("🔍 Found existing match, not redirecting:", match.id, "Status:", match.status)
            lastCheckedMatch.current = match.id
          }
        } else {
          // Reset the last checked match if no active matches
          lastCheckedMatch.current = null
          hasRedirected.current = false
        }
        return false // No active match found
      } catch (error) {
        console.error("❌ Error in match polling:", error)
        return false
      }
    }

    // Check immediately
    checkActiveMatches()

    // Poll for active matches every 500ms (much faster)
    const pollInterval = setInterval(checkActiveMatches, 500)

    // Also check when page becomes visible (user switches back to tab)
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        console.log("👁️ Page became visible, checking for active matches...")
        checkActiveMatches()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    // Also try real-time subscriptions as backup
    const matchSubscription = supabase
      .channel('user-matches')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'matches',
          filter: `or(player1_id.eq.${userId},player2_id.eq.${userId})`
        },
        (payload) => {
          console.log("🔄 Real-time match update:", payload)
          const match = payload.new as any
          
          // Only redirect if match status changed to in_progress (someone joined) or if it's a very new match
          const matchCreatedAt = new Date(match.created_at)
          const tenSecondsAgo = new Date(Date.now() - 10 * 1000)
          const isVeryRecentMatch = matchCreatedAt > tenSecondsAgo
          const isMatchInProgress = match.status === 'in_progress'
          
          if ((isMatchInProgress || isVeryRecentMatch) && 
              (match.player1_id === userId || match.player2_id === userId) &&
              !hasRedirected.current) {
            console.log("🎮 Real-time: Match updated! Redirecting to:", match.id, "Status:", match.status)
            hasRedirected.current = true
            router.push(`/games/match/${match.id}`)
          }
        }
      )
      .subscribe((status) => {
        console.log("🔄 Real-time subscription status:", status)
      })

    // Cleanup on unmount
    return () => {
      console.log("🧹 Cleaning up match monitoring")
      clearInterval(pollInterval)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      supabase.removeChannel(matchSubscription)
    }
  }, [userId, router])

  return null // This component doesn't render anything
}

"use client"

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import MatchmakingQueueList from './games/matchmaking-queue-list'

interface MatchmakingQueue {
  id: string
  game_id: string
  bet_amount: number
  match_type: string
  expires_at: string
  created_at: string
  games: {
    name: string
  }
  users: {
    username: string
    display_name?: string
    avatar_url?: string
  }
}

interface MatchmakingRealtimeProps {
  initialQueues: MatchmakingQueue[]
  currentUserId: string
}

export default function MatchmakingRealtime({ initialQueues, currentUserId }: MatchmakingRealtimeProps) {
  const [queues, setQueues] = useState<MatchmakingQueue[]>(initialQueues)

  useEffect(() => {
    console.log("🔄 Setting up matchmaking queue real-time updates")

    // Set up real-time subscription for matchmaking_queue changes
    const subscription = supabase
      .channel('matchmaking-queue-updates')
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to all events (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'matchmaking_queue'
        },
        (payload) => {
          console.log('🔄 Matchmaking queue change detected:', payload)
          
          // Refresh the queues when any change occurs
          refreshQueues()
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to all events (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'matches'
        },
        (payload) => {
          console.log('🔄 Match change detected:', payload)
          
          // Refresh the queues when matches change (cancelled, completed, etc.)
          refreshQueues()
        }
      )
      .subscribe((status) => {
        console.log('🔄 Matchmaking subscription status:', status)
      })

    // Also poll every 2 seconds as backup (more aggressive)
    const pollInterval = setInterval(refreshQueues, 2000)

    return () => {
      console.log("🧹 Cleaning up matchmaking real-time subscription")
      subscription.unsubscribe()
      clearInterval(pollInterval)
    }
  }, [currentUserId])

  const refreshQueues = async () => {
    try {
      console.log("🔄 Refreshing matchmaking queues...")
      
      // First, let's see ALL queue entries for debugging
      const { data: allQueues } = await supabase
        .from("matchmaking_queue")
        .select("id, status, expires_at, created_at")
        .order("created_at", { ascending: false })
        .limit(20)
      
      console.log("🔍 All queue entries in database:", allQueues)

      const { data: updatedQueues, error } = await supabase
        .from("matchmaking_queue")
        .select(
          `
          id,
          game_id,
          bet_amount,
          match_type,
          expires_at,
          created_at,
          status,
          user_id,
          games (name)
        `,
        )
        .eq("status", "waiting")
        .neq("user_id", currentUserId) // Don't show user's own queue entries
        .gt("expires_at", new Date().toISOString()) // Only show non-expired entries
        .order("created_at", { ascending: false })
        .limit(10)

      if (error) {
        console.error("❌ Error refreshing matchmaking queues:", error)
        return
      }

      // Manually fetch user data for each queue
      const queuesWithUsers = await Promise.all(
        (updatedQueues || []).map(async (queue) => {
          console.log('🔍 Fetching user data for queue:', queue.id, 'user_id:', queue.user_id)
          
          try {
            const { data: userData, error: userError } = await supabase
              .from("users")
              .select("username, display_name, avatar_url")
              .eq("id", queue.user_id)
              .single()
            
            if (userError) {
              console.error('❌ Error fetching user data for user_id', queue.user_id, ':', userError)
              // Return queue with null users if fetch fails
              return {
                ...queue,
                users: null
              }
            }
            
            console.log('✅ User data fetched successfully:', userData)
            
            return {
              ...queue,
              users: userData
            }
          } catch (error) {
            console.error('❌ Exception fetching user data for user_id', queue.user_id, ':', error)
            return {
              ...queue,
              users: null
            }
          }
        })
      )

      console.log("✅ Updated matchmaking queues with users:", queuesWithUsers?.length || 0, queuesWithUsers)
      console.log("🔍 First queue user data:", queuesWithUsers?.[0]?.users)
      setQueues(queuesWithUsers || [])
    } catch (error) {
      console.error("❌ Error in refreshQueues:", error)
    }
  }

  return <MatchmakingQueueList queues={queues} />
}

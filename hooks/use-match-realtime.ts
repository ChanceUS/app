import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase/client'
import type { Match } from '@/lib/supabase/client'

interface UseMatchRealtimeProps {
  matchId: string
  onMatchUpdate?: (match: Match) => void
  onGameDataUpdate?: (gameData: any) => void
}

export function useMatchRealtime({ 
  matchId, 
  onMatchUpdate, 
  onGameDataUpdate 
}: UseMatchRealtimeProps) {
  const [match, setMatch] = useState<Match | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch initial match data
  const fetchMatch = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('matches')
        .select('*')
        .eq('id', matchId)
        .single()

      if (error) throw error
      setMatch(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch match')
    }
  }, [matchId])

  // Subscribe to real-time updates
  useEffect(() => {
    if (!matchId) return

    // Fetch initial data
    fetchMatch()

    // Subscribe to match updates
    const matchSubscription = supabase
      .channel(`match:${matchId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'matches',
          filter: `id=eq.${matchId}`
        },
        (payload) => {
          console.log('Match update received:', payload)
          
          if (payload.eventType === 'UPDATE' && payload.new) {
            const updatedMatch = payload.new as Match
            setMatch(updatedMatch)
            onMatchUpdate?.(updatedMatch)
            
            // If game data changed, trigger game update callback
            if (payload.old?.game_data !== payload.new?.game_data) {
              onGameDataUpdate?.(updatedMatch.game_data)
            }
          }
        }
      )
      .subscribe((status) => {
        setIsConnected(status === 'SUBSCRIBED')
        if (status === 'SUBSCRIBED') {
          console.log(`Subscribed to match ${matchId}`)
        }
      })

    // Subscribe to match history updates
    const historySubscription = supabase
      .channel(`match_history:${matchId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'match_history',
          filter: `match_id=eq.${matchId}`
        },
        (payload) => {
          console.log('Match history update received:', payload)
          // Refresh match data when new history is added
          fetchMatch()
        }
      )
      .subscribe()

    return () => {
      matchSubscription.unsubscribe()
      historySubscription.unsubscribe()
    }
  }, [matchId, fetchMatch, onMatchUpdate, onGameDataUpdate])

  // Function to update match
  const updateMatch = useCallback(async (updates: Partial<Match>) => {
    try {
      const { data, error } = await supabase
        .from('matches')
        .update(updates)
        .eq('id', matchId)
        .select()
        .single()

      if (error) throw error
      return data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update match')
      return null
    }
  }, [matchId])

  // Function to add match history entry
  const addMatchHistory = useCallback(async (actionType: string, actionData: any) => {
    try {
      const { error } = await supabase
        .from('match_history')
        .insert({
          match_id: matchId,
          user_id: (await supabase.auth.getUser()).data.user?.id,
          action_type: actionType,
          action_data: actionData
        })

      if (error) throw error
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add match history')
    }
  }, [matchId])

  return {
    match,
    isConnected,
    error,
    updateMatch,
    addMatchHistory,
    refreshMatch: fetchMatch
  }
}

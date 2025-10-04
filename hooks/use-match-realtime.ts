import { useEffect, useState, useCallback, useRef } from 'react'
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client'
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
  const [disableRealtime, setDisableRealtime] = useState(true) // Force disable Realtime due to binding issues
  
  // Use refs to prevent infinite loops
  const isConnectingRef = useRef(false)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null)


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

  // Use polling only (Realtime disabled due to binding issues)
  useEffect(() => {
    if (!matchId || isConnectingRef.current) {
      return
    }
    
    console.log('🔌 Using polling only (Realtime disabled due to binding issues)')
    setError('Using polling fallback - Realtime disabled due to binding issues')
    
    // Fetch initial data
    fetchMatch()
    
    // Set up polling
    pollIntervalRef.current = setInterval(() => {
      console.log('🔄 Polling for match updates...')
      fetchMatch()
    }, 2000) // Poll every 2 seconds for better responsiveness

    // Cleanup function
    return () => {
      isConnectingRef.current = false
      
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current)
        pollIntervalRef.current = null
      }

      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
        reconnectTimeoutRef.current = null
      }
    }
  }, [matchId, fetchMatch]) // Only depend on matchId and fetchMatch to prevent infinite loops

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

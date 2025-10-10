"use client"

import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { joinMatchmakingQueue } from "@/lib/matchmaking-actions"
import { useRouter } from "next/navigation"
import { useState } from "react"

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

interface MatchmakingQueueListProps {
  queues: MatchmakingQueue[]
}

export default function MatchmakingQueueList({ queues }: MatchmakingQueueListProps) {
  const router = useRouter()
  const [joiningQueue, setJoiningQueue] = useState<string | null>(null)

  const handleJoinQueue = async (queue: MatchmakingQueue) => {
    setJoiningQueue(queue.id)
    
    try {
      console.log('🎯 Joining matchmaking queue:', queue.id)
      
      // Join the matchmaking queue - this should automatically pair with the existing queue entry
      const result = await joinMatchmakingQueue(
        queue.game_id,
        queue.bet_amount,
        queue.match_type as 'free' | 'tokens' | 'cash5' | 'cash10'
      )
      
      if (result.error) {
        console.error('❌ Failed to join queue:', result.error)
        alert(`Failed to join matchmaking: ${result.error}`)
        return
      }
      
      console.log('🔍 Join queue result:', result)
      
      if (result.matchType === 'matched' && result.matchId) {
        console.log('✅ Successfully joined and matched!', result.matchId)
        // Redirect to the match
        router.push(`/games/match/${result.matchId}`)
      } else if (result.matchType === 'priority_joined' && result.matchId) {
        console.log('✅ Successfully joined priority match!', result.matchId)
        // Redirect to the match
        router.push(`/games/match/${result.matchId}`)
      } else {
        console.log('⏳ Joined queue, waiting for match...', result)
        // This shouldn't happen since we're joining an existing queue, but handle it just in case
        alert('Joined queue successfully! You should be matched automatically.')
      }
    } catch (error) {
      console.error('❌ Error joining queue:', error)
      alert('An error occurred while joining the matchmaking queue.')
    } finally {
      setJoiningQueue(null)
    }
  }

  const formatTimeRemaining = (expiresAt: string) => {
    const now = new Date()
    const expires = new Date(expiresAt)
    const diffMs = expires.getTime() - now.getTime()
    
    if (diffMs <= 0) return "0:00"
    
    const minutes = Math.floor(diffMs / (1000 * 60))
    const seconds = Math.floor((diffMs % (1000 * 60)) / 1000)
    
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  const getMatchTypeDisplay = (matchType: string, betAmount: number) => {
    switch (matchType) {
      case 'free':
        return 'Free Play'
      case 'tokens':
        return `${betAmount} Tokens`
      case 'cash5':
        return '$5 Cash Pool'
      case 'cash10':
        return '$10 Cash Pool'
      default:
        return `${betAmount} Tokens`
    }
  }

  if (queues.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-gray-400 mb-2">No active matchmaking</div>
        <div className="text-gray-500 text-sm">Be the first to start searching!</div>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {queues.map((queue) => {
        console.log('🔍 Queue data:', queue) // Debug log
        const [minutes, seconds] = formatTimeRemaining(queue.expires_at).split(':').map(Number)
        
        return (
          <div key={queue.id} className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-3">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={queue.users?.avatar_url} />
                  <AvatarFallback className="bg-gray-700 text-gray-300 text-xs">
                    {queue.users?.username?.charAt(0).toUpperCase() || '?'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="text-white font-medium text-sm">
                    {queue.users?.display_name || queue.users?.username || 'Loading...'}
                  </div>
                  <div className="text-gray-400 text-xs">
                    {queue.games?.name || 'Unknown Game'} • {getMatchTypeDisplay(queue.match_type, queue.bet_amount)}
                  </div>
                  {/* Debug info */}
                  <div className="text-red-400 text-xs">
                    Debug: {JSON.stringify(queue.users)}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-orange-400 font-bold text-sm">
                  {minutes}:{seconds.toString().padStart(2, '0')}
                </div>
                <div className="text-gray-400 text-xs">Time left</div>
              </div>
            </div>
            <button 
              className="w-full bg-orange-500 hover:bg-orange-600 text-black font-semibold py-2 px-4 rounded-lg text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={() => handleJoinQueue(queue)}
              disabled={joiningQueue === queue.id}
            >
              {joiningQueue === queue.id ? 'Joining...' : 'Join Matchmaking'}
            </button>
          </div>
        )
      })}
    </div>
  )
}

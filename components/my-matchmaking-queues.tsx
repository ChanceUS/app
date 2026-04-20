"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { cancelMatchmakingQueue } from "@/lib/matchmaking-actions"

interface MyMatchmakingQueue {
  id: string
  bet_amount: number
  match_type: string
  expires_at: string
  created_at: string
  games: {
    name: string
  }
}

interface MyMatchmakingQueuesProps {
  queues: MyMatchmakingQueue[]
}

export default function MyMatchmakingQueues({ queues }: MyMatchmakingQueuesProps) {
  const [cancellingQueue, setCancellingQueue] = useState<string | null>(null)

  const handleCancelQueue = async (queueId: string) => {
    try {
      setCancellingQueue(queueId)
      const result = await cancelMatchmakingQueue(queueId)
      if (result.success) {
        window.location.reload()
      } else {
        alert("Failed to cancel matchmaking: " + (result.error || "Unknown error"))
      }
    } catch (error) {
      console.error("Error cancelling queue:", error)
      alert("Failed to cancel matchmaking: " + (error instanceof Error ? error.message : "Unknown error"))
    } finally {
      setCancellingQueue(null)
    }
  }

  if (queues.length === 0) {
    return null
  }

  return (
    <div>
      <h4 className="text-sm font-medium text-orange-300 mb-2">Your Active Matchmaking</h4>
      <div className="space-y-2">
        {queues.map((queue) => (
          <div key={queue.id} className="bg-orange-900/20 border border-orange-600 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-white font-medium text-sm">
                  {queue.games?.name || 'Unknown Game'}
                </div>
                <div className="text-orange-300 text-xs">
                  {queue.match_type === 'free' ? 'Free Play' : 
                   queue.match_type === 'tokens' ? `${queue.bet_amount} Tokens` :
                   queue.match_type === 'cash5' ? '$5 Cash Pool' : '$10 Cash Pool'}
                </div>
                <div className="text-gray-400 text-xs">
                  Searching for opponent...
                </div>
              </div>
              <div className="text-right">
                <div className="text-orange-400 font-bold text-sm">
                  {Math.max(0, Math.floor((new Date(queue.expires_at).getTime() - new Date().getTime()) / 1000 / 60))}:
                  {Math.max(0, Math.floor((new Date(queue.expires_at).getTime() - new Date().getTime()) / 1000) % 60).toString().padStart(2, '0')}
                </div>
                <div className="text-gray-400 text-xs">Time left</div>
              </div>
            </div>
            <div className="mt-2">
              <Button 
                size="sm" 
                variant="outline"
                className="w-full border-red-600 text-red-300 hover:bg-red-600 hover:text-white"
                onClick={() => handleCancelQueue(queue.id)}
                disabled={cancellingQueue === queue.id}
              >
                {cancellingQueue === queue.id ? 'Cancelling...' : 'Cancel Matchmaking'}
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

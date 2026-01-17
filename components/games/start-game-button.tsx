"use client"

import { Button } from "@/components/ui/button"
import { Clock } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

interface StartGameButtonProps {
  matchId: string
  onGameStarted: () => void
}

export default function StartGameButton({ matchId, onGameStarted }: StartGameButtonProps) {
  const supabase = createClient()

  const handleStartGame = async () => {
    try {
      console.log('🚀 Force starting game...')
      // Start the match
      const { error } = await supabase
        .from('matches')
        .update({ status: 'in_progress', started_at: new Date().toISOString() })
        .eq('id', matchId)
      
      if (error) {
        console.error('Error starting match:', error)
        alert('Failed to start match: ' + error.message)
      } else {
        console.log('✅ Match started successfully!')
        alert('Game started!')
        onGameStarted()
        // Don't reload the page, let the parent component handle the state update
      }
    } catch (error) {
      console.error('Error starting match:', error)
      alert('Failed to start match: ' + error)
    }
  }

  return (
    <div className="bg-orange-500 text-white text-lg px-8 py-3 rounded cursor-pointer inline-flex items-center">
      <Clock className="mr-2 h-5 w-5" />
      🚀 FORCE START GAME
    </div>
  )
}

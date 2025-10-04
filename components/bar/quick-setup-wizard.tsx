"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { 
  Play, 
  Plus, 
  CheckCircle, 
  ArrowRight,
  Trophy,
  Clock,
  Users,
  Zap
} from "lucide-react"
import { toast } from "sonner"
import { createBarTriviaGame, createBarTriviaSession } from "@/lib/bar-actions"

interface QuickSetupWizardProps {
  barId: string
  onGameCreated: () => void
  onSessionCreated: (sessionCode: string) => void
}

export default function QuickSetupWizard({ barId, onGameCreated, onSessionCreated }: QuickSetupWizardProps) {
  const [step, setStep] = useState(1)
  const [isCreating, setIsCreating] = useState(false)
  const [gameData, setGameData] = useState({
    name: "",
    description: "",
    max_questions: 10,
    time_per_question: 30
  })

  const handleCreateGameAndSession = async () => {
    if (!gameData.name.trim()) {
      toast.error("Please enter a game name")
      return
    }

    console.log("QuickSetupWizard: Creating game and session")
    console.log("barId:", barId)
    console.log("gameData:", gameData)
    
    setIsCreating(true)
    try {
      // Check if this is a demo bar (stored in localStorage)
      const demoBarData = localStorage.getItem('demoBar')
      console.log("demoBarData from localStorage:", demoBarData)
      console.log("barId.startsWith('demo-bar-'):", barId.startsWith('demo-bar-'))
      
      if (demoBarData || barId.startsWith('demo-bar-')) {
        // Create mock game and session for demo
        const mockGame = {
          id: "demo-game-" + Date.now(),
          name: gameData.name,
          description: gameData.description,
          max_questions: gameData.max_questions,
          time_per_question: gameData.time_per_question
        }
        
        const mockSession = {
          id: "demo-session-" + Date.now(),
          session_code: "DEMO" + Math.random().toString(36).substr(2, 4).toUpperCase(),
          status: "active",
          total_players: 0,
          created_at: new Date().toISOString()
        }
        
        // Store mock data in localStorage
        localStorage.setItem('demoGames', JSON.stringify([mockGame]))
        localStorage.setItem('demoSessions', JSON.stringify([mockSession]))
        
        onGameCreated()
        toast.success("Demo trivia game created!")
        
        setStep(2)
        onSessionCreated(mockSession.session_code)
        toast.success("Demo trivia session started!")
      } else {
        console.log("Creating real game in database...")
        
        // Create the trivia game
        const formData = new FormData()
        Object.entries(gameData).forEach(([key, value]) => {
          formData.append(key, value.toString())
        })
        
        console.log("FormData contents:", Object.fromEntries(formData.entries()))
        
        const game = await createBarTriviaGame(barId, formData)
        console.log("Game created successfully:", game)
        
        onGameCreated()
        toast.success("Trivia game created!")
        
        // Move to step 2
        setStep(2)
        
        // Create a session immediately
        console.log("Creating session for game:", game.id)
        const session = await createBarTriviaSession(barId, game.id)
        console.log("Session created successfully:", session)
        
        onSessionCreated(session.session_code)
        toast.success("Trivia session started!")
      }
    } catch (error: any) {
      console.error("Error creating game and session:", error)
      console.error("Error details:", {
        message: error.message,
        stack: error.stack,
        barId,
        gameData
      })
      toast.error(`Failed to create game and session: ${error.message}`)
    } finally {
      setIsCreating(false)
    }
  }

  if (step === 1) {
    return (
      <Card className="bg-gradient-to-br from-purple-900/50 to-blue-900/50 border-purple-500/20">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Quick Setup - Create Your First Game
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center">
            <Trophy className="h-16 w-16 text-yellow-400 mx-auto mb-4" />
            <h3 className="text-white text-xl font-medium mb-2">Let's get your bar trivia running!</h3>
            <p className="text-white/80">
              Create a trivia game and start your first session in just a few clicks.
            </p>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="game-name" className="text-white">Game Name *</Label>
              <Input
                id="game-name"
                value={gameData.name}
                onChange={(e) => setGameData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Monday Night Trivia"
                className="bg-white/20 border-white/30 text-white placeholder:text-white/60"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="game-description" className="text-white">Description</Label>
              <Textarea
                id="game-description"
                value={gameData.description}
                onChange={(e) => setGameData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Optional description for your trivia game"
                className="bg-white/20 border-white/30 text-white placeholder:text-white/60"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="max-questions" className="text-white">Questions</Label>
                <Input
                  id="max-questions"
                  type="number"
                  min="5"
                  max="20"
                  value={gameData.max_questions}
                  onChange={(e) => setGameData(prev => ({ ...prev, max_questions: parseInt(e.target.value) || 10 }))}
                  className="bg-white/20 border-white/30 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="time-per-question" className="text-white">Time per Question (s)</Label>
                <Input
                  id="time-per-question"
                  type="number"
                  min="10"
                  max="60"
                  value={gameData.time_per_question}
                  onChange={(e) => setGameData(prev => ({ ...prev, time_per_question: parseInt(e.target.value) || 30 }))}
                  className="bg-white/20 border-white/30 text-white"
                />
              </div>
            </div>
          </div>

          <div className="bg-white/5 rounded-lg p-4">
            <h4 className="text-white font-medium mb-2">What happens next?</h4>
            <div className="space-y-2 text-white/80 text-sm">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-400" />
                <span>Creates a trivia game with your settings</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-400" />
                <span>Starts a live session immediately</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-400" />
                <span>Generates a join code for customers</span>
              </div>
            </div>
          </div>

          <Button
            onClick={handleCreateGameAndSession}
            disabled={isCreating || !gameData.name.trim()}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white text-lg py-6"
          >
            {isCreating ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Creating Game & Session...
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Play className="h-5 w-5" />
                Create Game & Start Session
                <ArrowRight className="h-4 w-4" />
              </div>
            )}
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-gradient-to-br from-green-900/50 to-blue-900/50 border-green-500/20">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <CheckCircle className="h-5 w-5" />
          Setup Complete!
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="text-center">
          <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="h-8 w-8 text-white" />
          </div>
          <h3 className="text-white text-xl font-medium mb-2">Your trivia game is ready!</h3>
          <p className="text-white/80">
            Customers can now join your trivia session using the join code.
          </p>
        </div>

        <div className="bg-white/5 rounded-lg p-4">
          <h4 className="text-white font-medium mb-3">Next Steps:</h4>
          <div className="space-y-2 text-white/80 text-sm">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-blue-400" />
              <span>Share the join code with customers</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-yellow-400" />
              <span>Wait for players to join (or start with 1 player)</span>
            </div>
            <div className="flex items-center gap-2">
              <Trophy className="h-4 w-4 text-purple-400" />
              <span>Start the game when ready</span>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-green-400" />
              <span>Monitor live scores and manage rewards</span>
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            onClick={() => setStep(1)}
            variant="outline"
            className="flex-1 bg-white/10 border-white/30 text-white hover:bg-white/20"
          >
            Create Another Game
          </Button>
          <Button
            onClick={() => window.location.reload()}
            className="flex-1 bg-green-600 hover:bg-green-700 text-white"
          >
            Go to Dashboard
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

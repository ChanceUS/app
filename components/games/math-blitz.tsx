"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Trophy, Timer, Target, Zap } from "lucide-react"
import { useMathBlitz } from "@/hooks/use-math-blitz"

interface MathBlitzProps {
  savedGameData?: any
  onGameUpdate?: (gameData: any) => void
}

export default function MathBlitz({ savedGameData, onGameUpdate }: MathBlitzProps) {
  const [showInstructions, setShowInstructions] = useState(!savedGameData?.isGameActive)
  const {
    gameState,
    currentProblem,
    score,
    timeRemaining,
    problemsSolved,
    streak,
    gameResult,
    startGame,
    submitAnswer,
    resetGame,
    isGameActive
  } = useMathBlitz(savedGameData, onGameUpdate)

  const handleStartGame = () => {
    console.log("🎮 Start game button clicked!")
    setShowInstructions(false)
    startGame()
  }

  const handleAnswer = (answer: number) => {
    submitAnswer(answer)
  }

  const handlePlayAgain = () => {
    setShowInstructions(true)
    resetGame()
  }

  if (showInstructions) {
    return (
      <Card className="w-full max-w-2xl mx-auto bg-black border-gray-800">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-orange-500 rounded-full">
              <Target className="h-8 w-8 text-black" />
            </div>
          </div>
          <CardTitle className="text-3xl font-bold text-white">Math Blitz</CardTitle>
          <p className="text-gray-400 text-lg">Test your mental math skills!</p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid md:grid-cols-2 gap-4 text-center">
            <div className="p-4 bg-gray-900 rounded-lg">
              <Timer className="h-6 w-6 text-orange-500 mx-auto mb-2" />
              <h3 className="font-semibold text-white">Time Challenge</h3>
              <p className="text-gray-400 text-sm">Solve problems before time runs out</p>
            </div>
            <div className="p-4 bg-gray-900 rounded-lg">
              <Zap className="h-6 w-6 text-orange-500 mx-auto mb-2" />
              <h3 className="font-semibold text-white">Speed Bonus</h3>
              <p className="text-gray-400 text-sm">Faster answers = more points</p>
            </div>
            <div className="p-4 bg-gray-900 rounded-lg">
              <Target className="h-6 w-6 text-orange-500 mx-auto mb-2" />
              <h3 className="font-semibold text-white">10 Problems</h3>
              <p className="text-gray-400 text-sm">Mix of easy, medium, and hard</p>
            </div>
            <div className="p-4 bg-gray-900 rounded-lg">
              <Trophy className="h-6 w-6 text-orange-500 mx-auto mb-2" />
              <h3 className="font-semibold text-white">Streak Bonus</h3>
              <p className="text-gray-400 text-sm">Consecutive correct answers</p>
            </div>
          </div>
          
          <Button 
            onClick={handleStartGame}
            className="w-full bg-orange-500 hover:bg-orange-600 text-black font-bold py-6 text-lg"
          >
            Start Math Blitz!
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (gameResult) {
    return (
      <Card className="w-full max-w-2xl mx-auto bg-black border-gray-800">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-orange-500 rounded-full">
              <Trophy className="h-8 w-8 text-black" />
            </div>
          </div>
          <CardTitle className="text-3xl font-bold text-white">Game Complete!</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 gap-4 text-center">
            <div className="p-4 bg-gray-900 rounded-lg">
              <h3 className="text-2xl font-bold text-orange-500">{gameResult.finalScore}</h3>
              <p className="text-gray-400">Final Score</p>
            </div>
            <div className="p-4 bg-gray-900 rounded-lg">
              <h3 className="text-2xl font-bold text-green-500">{gameResult.problemsSolved}/10</h3>
              <p className="text-gray-400">Problems Solved</p>
            </div>
            <div className="p-4 bg-gray-900 rounded-lg">
              <h3 className="text-2xl font-bold text-blue-500">{gameResult.accuracy}%</h3>
              <p className="text-gray-400">Accuracy</p>
            </div>
            <div className="p-4 bg-gray-900 rounded-lg">
              <h3 className="text-2xl font-bold text-purple-500">{gameResult.streak}</h3>
              <p className="text-gray-400">Best Streak</p>
            </div>
          </div>
          
          <div className="flex gap-4">
            <Button 
              onClick={handlePlayAgain}
              className="flex-1 bg-orange-500 hover:bg-orange-600 text-black font-bold py-4"
            >
              Play Again
            </Button>
            <Button 
              onClick={() => setShowInstructions(true)}
              variant="outline"
              className="flex-1 border-orange-500 text-orange-500 hover:bg-orange-500 hover:text-black"
            >
              Back to Menu
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!currentProblem) {
    console.log("🔍 No current problem found. Game state:", { isGameActive, currentProblem, problemsSolved })
    return (
      <Card className="w-full max-w-2xl mx-auto bg-black border-gray-800">
        <CardContent className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading problem...</p>
          <p className="text-gray-500 text-sm mt-2">isGameActive: {isGameActive ? 'true' : 'false'}</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-2xl mx-auto bg-black border-gray-800">
      <CardHeader className="text-center">
        <div className="flex justify-between items-center mb-4">
          <div className="text-left">
            <p className="text-gray-400">Problem {problemsSolved + 1}/10</p>
            <p className="text-2xl font-bold text-white">{score} pts</p>
          </div>
          <div className="text-center">
            <h1 className="text-3xl font-bold text-white">Math Blitz</h1>
            <p className="text-gray-400">Solve the math problem!</p>
          </div>
          <div className="text-right">
            <p className="text-gray-400">Streak</p>
            <p className="text-2xl font-bold text-orange-500">{streak}</p>
          </div>
        </div>
        
        {/* Timer */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-gray-400">Time Remaining</span>
            <span className={`text-lg font-bold ${timeRemaining <= 10 ? 'text-red-500' : 'text-green-500'}`}>
              {timeRemaining}s
            </span>
          </div>
          <Progress 
            value={(timeRemaining / currentProblem.timeLimit) * 100} 
            className="h-2"
          />
        </div>
      </CardHeader>
      
      <CardContent className="space-y-8">
        {/* Math Problem */}
        <div className="text-center">
          <h2 className="text-4xl font-bold text-white mb-8">{currentProblem.question}</h2>
          
          {/* Answer Options */}
          <div className="grid grid-cols-2 gap-4">
            {currentProblem.options.map((option, index) => (
              <Button
                key={index}
                onClick={() => handleAnswer(option)}
                className="h-16 text-xl font-bold bg-gray-800 hover:bg-gray-700 border-gray-700 text-white"
                disabled={!isGameActive}
              >
                {option}
              </Button>
            ))}
          </div>
        </div>
        
        {/* Game Stats */}
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="p-3 bg-gray-900 rounded-lg">
            <p className="text-gray-400 text-sm">Difficulty</p>
            <p className="text-white font-semibold capitalize">{currentProblem.difficulty}</p>
          </div>
          <div className="p-3 bg-gray-900 rounded-lg">
            <p className="text-gray-400 text-sm">Base Points</p>
            <p className="text-white font-semibold">{currentProblem.points}</p>
          </div>
          <div className="p-3 bg-gray-900 rounded-lg">
            <p className="text-gray-400 text-sm">Time Limit</p>
            <p className="text-white font-semibold">{currentProblem.timeLimit}s</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

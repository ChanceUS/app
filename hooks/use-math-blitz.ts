import { useState, useEffect, useCallback, useRef } from 'react'
import { 
  MathProblem, 
  GameState, 
  GameResult, 
  generateMathProblem, 
  checkAnswer, 
  calculateScore,
  initializeGameState 
} from '@/lib/game-logic'

export function useMathBlitz(savedGameData?: any, onGameUpdate?: (gameData: any) => void) {
  const [gameState, setGameState] = useState<GameState>(() => {
    // Try to restore from saved data, otherwise initialize fresh
    if (savedGameData?.isGameActive) {
      return {
        currentProblem: savedGameData.currentProblem,
        score: savedGameData.score || 0,
        timeRemaining: savedGameData.timeRemaining || 30,
        problemsSolved: savedGameData.problemsSolved || 0,
        streak: savedGameData.streak || 0,
        isGameActive: true,
        gameStartTime: savedGameData.gameStartTime || Date.now()
      }
    }
    return initializeGameState()
  })
  
  const [problems, setProblems] = useState<MathProblem[]>(savedGameData?.problems || [])
  const [currentProblemIndex, setCurrentProblemIndex] = useState(savedGameData?.currentProblemIndex || 0)
  const [gameResult, setGameResult] = useState<GameResult | null>(savedGameData?.gameResult || null)
  
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const gameStartTimeRef = useRef<number | null>(savedGameData?.gameStartTime || null)

  // Start a new game
  const startGame = useCallback(() => {
    const newProblems = Array.from({ length: 10 }, () => generateMathProblem())
    const firstProblem = newProblems[0]
    
    console.log("🎮 Starting new game with first problem:", firstProblem)
    
    // Set all state at once to avoid null currentProblem
    setProblems(newProblems)
    setCurrentProblemIndex(0)
    setGameResult(null)
    gameStartTimeRef.current = Date.now()
    
    // Set game state with the first problem
    setGameState({
      currentProblem: firstProblem,
      score: 0,
      timeRemaining: firstProblem.timeLimit,
      problemsSolved: 0,
      streak: 0,
      isGameActive: true,
      gameStartTime: Date.now()
    })
    
    // Save game state
    if (onGameUpdate) {
      onGameUpdate({
        problems: newProblems,
        currentProblemIndex: 0,
        currentProblem: firstProblem,
        score: 0,
        timeRemaining: firstProblem.timeLimit,
        problemsSolved: 0,
        streak: 0,
        isGameActive: true,
        gameStartTime: Date.now(),
        lastSaveTime: Date.now()
      })
    }
    
    // Start timer
    startTimer(firstProblem.timeLimit)
  }, [onGameUpdate])



  // Start timer for current problem
  const startTimer = useCallback((timeLimit: number) => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
    }
    
    timerRef.current = setInterval(() => {
      setGameState(prev => {
        if (prev.timeRemaining <= 1) {
          // Time's up - move to next problem
          handleTimeUp()
          return prev
        }
        
        const newState = {
          ...prev,
          timeRemaining: prev.timeRemaining - 1
        }
        
        // Save game progress every few seconds
        if (onGameUpdate && prev.timeRemaining % 5 === 0) {
          onGameUpdate({
            problems,
            currentProblemIndex,
            currentProblem: newState.currentProblem,
            score: newState.score,
            timeRemaining: newState.timeRemaining,
            problemsSolved: newState.problemsSolved,
            streak: newState.streak,
            isGameActive: true,
            gameStartTime: gameStartTimeRef.current,
            lastSaveTime: Date.now()
          })
        }
        
        return newState
      })
    }, 1000)
  }, [onGameUpdate, problems, currentProblemIndex])

  // Handle time up
  const handleTimeUp = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
    }
    
    // Move to next problem or end game
    if (currentProblemIndex < problems.length - 1) {
      nextProblem()
    } else {
      endGame()
    }
  }, [currentProblemIndex, problems.length])

  // Submit answer
  const submitAnswer = useCallback((answer: number) => {
    if (!gameState.currentProblem || !gameState.isGameActive) return
    
    const isCorrect = checkAnswer(gameState.currentProblem, answer)
    const timeBonus = Math.floor((gameState.timeRemaining / gameState.currentProblem.timeLimit) * 10)
    const streakBonus = Math.floor(gameState.streak / 3) * 5
    
    const points = isCorrect 
      ? gameState.currentProblem.points + timeBonus + streakBonus 
      : 0
    
    const newStreak = isCorrect ? gameState.streak + 1 : 0
    
    console.log(`🎯 Answer submitted: ${isCorrect ? 'CORRECT' : 'WRONG'}`)
    console.log(`📊 Previous streak: ${gameState.streak}, New streak: ${newStreak}`)
    console.log(`💰 Points earned: ${points} (base: ${gameState.currentProblem.points}, time bonus: ${timeBonus}, streak bonus: ${streakBonus})`)
    
    const newGameState = {
      ...gameState,
      score: gameState.score + points,
      problemsSolved: gameState.problemsSolved + (isCorrect ? 1 : 0),
      streak: newStreak
    }
    
    setGameState(newGameState)
    
    // Save game progress after each answer
    if (onGameUpdate) {
      onGameUpdate({
        problems,
        currentProblemIndex,
        currentProblem: newGameState.currentProblem,
        score: newGameState.score,
        timeRemaining: newGameState.timeRemaining,
        problemsSolved: newGameState.problemsSolved,
        streak: newGameState.streak,
        isGameActive: true,
        gameStartTime: gameStartTimeRef.current,
        lastSaveTime: Date.now()
      })
    }
    
    // Move to next problem or end game
    if (currentProblemIndex < problems.length - 1) {
      nextProblem()
    } else {
      endGame()
    }
  }, [gameState, currentProblemIndex, problems.length, onGameUpdate, problems])

  // Move to next problem
  const nextProblem = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
    }
    
    const nextIndex = currentProblemIndex + 1
    const nextProblem = problems[nextIndex]
    
    // Preserve the current game state (score, streak, problemsSolved) when moving to next problem
    setCurrentProblemIndex(nextIndex)
    setGameState(prev => {
      console.log(`🔄 Moving to next problem. Preserving: score=${prev.score}, streak=${prev.streak}, problemsSolved=${prev.problemsSolved}`)
      return {
        ...prev,
        currentProblem: nextProblem,
        timeRemaining: nextProblem.timeLimit
      }
    })
    
    // Save game progress when moving to next problem
    if (onGameUpdate) {
      onGameUpdate({
        problems,
        currentProblemIndex: nextIndex,
        currentProblem: nextProblem,
        score: gameState.score,
        timeRemaining: nextProblem.timeLimit,
        problemsSolved: gameState.problemsSolved,
        streak: gameState.streak,
        isGameActive: true,
        gameStartTime: gameStartTimeRef.current,
        lastSaveTime: Date.now()
      })
    }
    
    // Start timer for next problem
    startTimer(nextProblem.timeLimit)
  }, [currentProblemIndex, problems, startTimer, gameState, onGameUpdate])

  // End game
  const endGame = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
    }
    
    const totalTime = gameStartTimeRef.current ? Date.now() - gameStartTimeRef.current : 0
    const accuracy = (gameState.problemsSolved / problems.length) * 100
    
    const result: GameResult = {
      finalScore: gameState.score,
      problemsSolved: gameState.problemsSolved,
      accuracy: Math.round(accuracy * 100) / 100,
      totalTime: Math.round(totalTime / 1000),
      streak: gameState.streak
    }
    
    setGameResult(result)
    setGameState(prev => ({
      ...prev,
      isGameActive: false,
      currentProblem: null
    }))
  }, [gameState.score, gameState.problemsSolved, gameState.streak, problems.length])

  // Reset game
  const resetGame = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
    }
    setGameState(initializeGameState())
    setProblems([])
    setCurrentProblemIndex(0)
    setGameResult(null)
    gameStartTimeRef.current = null
  }, [])

  // Auto-restore game when saved data is available
  useEffect(() => {
    if (savedGameData?.isGameActive && savedGameData.problems?.length > 0) {
      console.log('🎮 Restoring game from saved data...')
      console.log('⏰ Saved time remaining:', savedGameData.timeRemaining)
      
      // Calculate how much time has passed since the last save
      const now = Date.now()
      const lastSaveTime = savedGameData.lastSaveTime || now
      const timePassed = Math.floor((now - lastSaveTime) / 1000) // seconds
      
      // Adjust the remaining time based on time passed
      const adjustedTimeRemaining = Math.max(0, savedGameData.timeRemaining - timePassed)
      console.log(`⏱️ Time passed since save: ${timePassed}s, Adjusted time: ${adjustedTimeRemaining}s`)
      
      // Update the game state with the adjusted time
      setGameState(prev => ({
        ...prev,
        timeRemaining: adjustedTimeRemaining
      }))
      
      // Start timer with the adjusted time if there's still time left
      if (adjustedTimeRemaining > 0) {
        startTimer(adjustedTimeRemaining)
      } else {
        // Time ran out while away - handle time up
        console.log('⏰ Time ran out while away, handling time up...')
        handleTimeUp()
      }
      
      console.log('✅ Game restored successfully')
    }
  }, [savedGameData]) // Remove restoreGame dependency

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [])

  return {
    gameState,
    problems,
    currentProblemIndex,
    gameResult,
    startGame,
    submitAnswer,
    resetGame,
    isGameActive: gameState.isGameActive,
    currentProblem: gameState.currentProblem,
    score: gameState.score,
    timeRemaining: gameState.timeRemaining,
    problemsSolved: gameState.problemsSolved,
    streak: gameState.streak
  }
}

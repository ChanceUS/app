"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Trophy, Timer, Brain, Users, CheckCircle, UserPlus, Clock } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { sendFriendRequest, getFriends, getSentRequests, getPendingRequests, acceptFriendRequest } from "@/lib/friends-actions"
import { 
  TriviaQuestion,
  TriviaAnswer,
  MultiplayerTriviaState,
  TriviaResult,
  getRandomTriviaQuestionFromDB
} from "@/lib/game-logic"

interface MultiplayerTriviaChallengeProps {
  matchId: string
  currentUserId: string
  player1Id: string
  player2Id: string
  onGameComplete?: (result: TriviaResult) => void
}

const TOTAL_QUESTIONS = 8
const QUESTION_TIME_LIMIT = 45

export default function MultiplayerTriviaChallenge({ 
  matchId, 
  currentUserId, 
  player1Id, 
  player2Id,
  onGameComplete 
}: MultiplayerTriviaChallengeProps) {
  const [gameState, setGameState] = useState<MultiplayerTriviaState | null>(null)
  const [currentQuestion, setCurrentQuestion] = useState<TriviaQuestion | null>(null)
  const [timeRemaining, setTimeRemaining] = useState<number>(0)
  const [gameResult, setGameResult] = useState<TriviaResult | null>(null)
  const [localAnswerSubmitted, setLocalAnswerSubmitted] = useState(false)
  const [myCurrentQuestionIndex, setMyCurrentQuestionIndex] = useState(0)
  const [bothPlayersReady, setBothPlayersReady] = useState(false)
  const [matchReady, setMatchReady] = useState(false)
  
  // Rematch state
  const [isTournamentMatch, setIsTournamentMatch] = useState(false)
  const [rematchStatus, setRematchStatus] = useState<'none' | 'requested' | 'received' | 'accepted' | 'rejected'>('none')
  const [rematchRequestedBy, setRematchRequestedBy] = useState<string | null>(null)
  const [isLoadingRematch, setIsLoadingRematch] = useState(false)
  const [betAmount, setBetAmount] = useState(0)
  const [gameId, setGameId] = useState<string | null>(null)
  const router = useRouter()
  
  // Friend request state
  const [friendStatus, setFriendStatus] = useState<'none' | 'friends' | 'request_sent' | 'request_received' | 'checking'>('checking')
  const [isLoadingFriend, setIsLoadingFriend] = useState(false)
  const [pendingRequestId, setPendingRequestId] = useState<string | null>(null)
  const [opponentId, setOpponentId] = useState<string | null>(null)
  const [opponentName, setOpponentName] = useState<string | null>(null)
  
  const isPlayer1 = currentUserId === player1Id
  
  // Save game state to database
  const saveGameStateToDatabase = useCallback(async (state: MultiplayerTriviaState, finalResult?: TriviaResult) => {
    try {
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()
      
      const { data: matchData } = await supabase
        .from('matches')
        .select('game_data')
        .eq('id', matchId)
        .single()
      
      const currentGameData = matchData?.game_data || {}
      
      const updateData: any = {
        gameState: state
      }
      
      if (finalResult) {
        updateData.finalResult = finalResult
      }
      
      await supabase
        .from('matches')
        .update({
          game_data: {
            ...currentGameData,
            ...updateData
          }
        })
        .eq('id', matchId)
    } catch (error) {
      console.error('Error saving game state:', error)
    }
  }, [matchId])

  // Load match data and check for tournament/rematch
  useEffect(() => {
    const loadMatchData = async () => {
      try {
        const supabase = createClient()
        
        // Load match data
        const { data: matchData, error } = await supabase
          .from('matches')
          .select('bet_amount, game_id, game_data, status')
          .eq('id', matchId)
          .single()
        
        if (error) {
          console.error('Error loading match data:', error)
          return
        }
        
        if (matchData) {
          setBetAmount(matchData.bet_amount || 0)
          setGameId(matchData.game_id)
          
          // Check if this is a tournament match
          const { data: tournamentMatch } = await supabase
            .from('tournament_matches')
            .select('tournament_id')
            .eq('match_id', matchId)
            .single()
          
          if (tournamentMatch) {
            setIsTournamentMatch(true)
            console.log('🏆 This is a tournament match, rematch disabled')
          }
          
          // Check for rematch requests if game is completed
          if (matchData.status === 'completed' && !tournamentMatch) {
            const gameData = matchData.game_data || {}
            if (gameData.rematch_requested_by) {
              const requestedBy = gameData.rematch_requested_by
              if (requestedBy !== currentUserId) {
                setRematchStatus('received')
                setRematchRequestedBy(requestedBy)
              } else {
                setRematchStatus('requested')
                setRematchRequestedBy(currentUserId)
              }
            }
          }
        }
      } catch (error) {
        console.error('Error loading match data:', error)
      }
    }
    
    loadMatchData()
    
    // Poll for rematch updates every 2 seconds
    const interval = setInterval(loadMatchData, 2000)
    return () => clearInterval(interval)
  }, [matchId, currentUserId])

  // Load game state from database
  useEffect(() => {
    const loadGameState = async () => {
      try {
        console.log('🔄 Loading trivia game state for match:', matchId)
        const { createClient } = await import('@/lib/supabase/client')
        const supabase = createClient()
        
        const { data: matchData } = await supabase
          .from('matches')
          .select('game_data')
          .eq('id', matchId)
          .single()
        
        console.log('🔄 Match data retrieved:', { hasGameData: !!matchData?.game_data?.gameState })
        
        if (matchData?.game_data?.gameState) {
          const loadedState = matchData.game_data.gameState as MultiplayerTriviaState
          console.log('🔄 Loaded trivia game state from database:', {
            p1Answers: loadedState.player1Answers.length,
            p2Answers: loadedState.player2Answers.length,
            p1Score: loadedState.player1Score,
            p2Score: loadedState.player2Score
          })
          
          // Always update state if there are any changes (not just progress)
          const hasChanges = !gameState || 
            loadedState.player1Answers.length !== gameState.player1Answers.length || 
            loadedState.player2Answers.length !== gameState.player2Answers.length ||
            loadedState.player1Score !== gameState.player1Score ||
            loadedState.player2Score !== gameState.player2Score ||
            loadedState.player1Finished !== gameState.player1Finished ||
            loadedState.player2Finished !== gameState.player2Finished
            
          console.log('🔄 Should update state?', {
            hasGameState: !!gameState,
            p1Progress: loadedState.player1Answers.length,
            p2Progress: loadedState.player2Answers.length,
            hasChanges
          })
          
          if (hasChanges) {
            setGameState(loadedState)
            
            // Set player's current question index
            const myAnswers = isPlayer1 ? loadedState.player1Answers : loadedState.player2Answers
            console.log('✅ Updating player question index to:', myAnswers.length)
            setMyCurrentQuestionIndex(myAnswers.length)
          } else {
            console.log('⏭️ Skipping state update - no changes detected')
          }
          
          // Check if both finished - always check for finalResult, even if state didn't change
          if (loadedState.player1Finished && loadedState.player2Finished) {
            // If finalResult exists in database, use it
            if (matchData.game_data.finalResult) {
              console.log('✅ Loading finalResult from database')
              setGameResult(matchData.game_data.finalResult)
              setMatchReady(true)
              return
            } else {
              // If both finished but no finalResult yet, calculate it
              console.log('✅ Both players finished, calculating result from loaded state...')
              const result = calculateTriviaResult(loadedState)
              setGameResult(result)
              // Save it to database so the other player can see it
              await saveGameStateToDatabase(loadedState, result)
              setMatchReady(true)
              return
            }
          }
          
          // Check if match is ready
          if (player1Id && player2Id) {
            setMatchReady(true)
            setBothPlayersReady(true)
          }
        } else if (!gameState) {
          // Only initialize if we don't have any state yet
          // Initialize new game
          const questions: TriviaQuestion[] = []
          for (let i = 0; i < TOTAL_QUESTIONS; i++) {
            const q = await getRandomTriviaQuestionFromDB()
            if (q) {
              questions.push({ ...q, timeLimit: QUESTION_TIME_LIMIT })
            } else {
              // If question failed to load, skip it
              console.warn(`Failed to load question ${i + 1}, skipping`)
            }
          }
          
          // If we have no questions at all, fall back to generating 8 random questions
          if (questions.length === 0) {
            console.error('Failed to load any questions, using fallback')
            // Generate fallback questions
            for (let i = 0; i < TOTAL_QUESTIONS; i++) {
              const { getRandomTriviaQuestion } = await import('@/lib/game-logic')
              const q = getRandomTriviaQuestion()
              questions.push({ ...q, timeLimit: QUESTION_TIME_LIMIT })
            }
          }
          
          console.log(`Loaded ${questions.length} questions for game`)
          
          const initialState: MultiplayerTriviaState = {
            questions,
            currentQuestionIndex: 0,
            player1Score: 0,
            player2Score: 0,
            player1Answers: [],
            player2Answers: [],
            player1Finished: false,
            player2Finished: false,
            gameStartTime: Date.now()
          }
          
          setGameState(initialState)
          setMyCurrentQuestionIndex(0)
          
          if (player1Id && player2Id) {
            setMatchReady(true)
            setBothPlayersReady(true)
            
            // Save initial state
            await saveGameStateToDatabase(initialState)
          }
        }
      } catch (error) {
        console.error('Error loading game state:', error)
      }
    }
    
    loadGameState()
    
    // Poll for updates every 500ms for better real-time sync
    const interval = setInterval(loadGameState, 500)
    return () => clearInterval(interval)
  }, [matchId, isPlayer1, player1Id, player2Id, saveGameStateToDatabase, gameState])

  // Update current question when index changes
  useEffect(() => {
    if (!gameState || !gameState.questions) return
    
    // Only react to the current player's answers
    const currentPlayerAnswers = isPlayer1 ? gameState.player1Answers : gameState.player2Answers
    const nextQuestionIndex = currentPlayerAnswers.length
    
    // Don't update question if player has finished - clear current question
    if (nextQuestionIndex >= TOTAL_QUESTIONS) {
      setCurrentQuestion(null)
      return
    }
    
    // Set the current question based on the player's answer count
    if (nextQuestionIndex < gameState.questions.length) {
      const question = gameState.questions[nextQuestionIndex]
      setCurrentQuestion(question)
      setTimeRemaining(question.timeLimit || QUESTION_TIME_LIMIT)
      setLocalAnswerSubmitted(false)
      setMyCurrentQuestionIndex(nextQuestionIndex)
    }
  }, [isPlayer1 ? gameState?.player1Answers?.length : gameState?.player2Answers?.length, gameState, isPlayer1])

  // Timer countdown
  useEffect(() => {
    if (!matchReady || !currentQuestion || timeRemaining <= 0 || gameResult) return
    
    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          handleAnswer(-1) // Timeout
          return 0
        }
        return prev - 1
      })
    }, 1000)
    
    return () => clearInterval(timer)
  }, [matchReady, currentQuestion, timeRemaining, gameResult])

  // Handle answer submission
  const handleAnswer = async (selectedAnswerIndex: number) => {
    if (!currentQuestion || !gameState || localAnswerSubmitted) return
    if (gameState.player1Finished && isPlayer1) return
    if (gameState.player2Finished && !isPlayer1) return
    
    // Check if player has already answered all questions
    const currentPlayerAnswers = isPlayer1 ? gameState.player1Answers : gameState.player2Answers
    if (currentPlayerAnswers.length >= TOTAL_QUESTIONS) {
      console.log('Player already finished all questions')
      return
    }
    
    setLocalAnswerSubmitted(true)
    
    const startTime = Date.now() - (QUESTION_TIME_LIMIT - timeRemaining) * 1000
    const isCorrect = selectedAnswerIndex === currentQuestion.correctAnswer
    const answerTime = Date.now() - startTime
    const points = isCorrect ? Math.max(5, Math.floor(QUESTION_TIME_LIMIT - answerTime / 1000)) : 0
    
    const answer: TriviaAnswer = {
      questionId: currentQuestion.id || currentQuestion.question,
      answer: selectedAnswerIndex,
      isCorrect,
      timeSpent: answerTime,
      timestamp: Date.now()
    }
    
    // Update game state
    const updatedAnswers = isPlayer1 
      ? [...gameState.player1Answers, answer]
      : [...gameState.player2Answers, answer]
    
    const newState: MultiplayerTriviaState = {
      ...gameState,
      player1Answers: isPlayer1 ? updatedAnswers : gameState.player1Answers,
      player2Answers: !isPlayer1 ? updatedAnswers : gameState.player2Answers,
      player1Score: isPlayer1 ? gameState.player1Score + points : gameState.player1Score,
      player2Score: !isPlayer1 ? gameState.player2Score + points : gameState.player2Score,
      player1Finished: isPlayer1 && updatedAnswers.length >= TOTAL_QUESTIONS,
      player2Finished: !isPlayer1 && updatedAnswers.length >= TOTAL_QUESTIONS
    }
    
    setGameState(newState)
    
    // Check if both players finished
    if (newState.player1Finished && newState.player2Finished) {
      const result = calculateTriviaResult(newState)
      setGameResult(result)
      await saveGameStateToDatabase(newState, result)
      
      if (onGameComplete) {
        // Pass the winner string, not the full result
        onGameComplete(result.winner)
      }
    } else {
      await saveGameStateToDatabase(newState)
    }
    
    // Question will update automatically via useEffect when state changes
  }

  // Calculate trivia result
  const calculateTriviaResult = (state: MultiplayerTriviaState): TriviaResult => {
    const p1Correct = state.player1Answers.filter(a => a.isCorrect).length
    const p2Correct = state.player2Answers.filter(a => a.isCorrect).length
    const p1TotalTime = state.player1Answers.reduce((sum, a) => sum + a.timeSpent, 0)
    const p2TotalTime = state.player2Answers.reduce((sum, a) => sum + a.timeSpent, 0)
    
    return {
      player1Result: {
        score: state.player1Score,
        questionsAnswered: state.player1Answers.length,
        correctAnswers: p1Correct,
        accuracy: state.player1Answers.length > 0 ? (p1Correct / state.player1Answers.length) * 100 : 0,
        totalTime: p1TotalTime,
        averageTime: state.player1Answers.length > 0 ? p1TotalTime / state.player1Answers.length : 0
      },
      player2Result: {
        score: state.player2Score,
        questionsAnswered: state.player2Answers.length,
        correctAnswers: p2Correct,
        accuracy: state.player2Answers.length > 0 ? (p2Correct / state.player2Answers.length) * 100 : 0,
        totalTime: p2TotalTime,
        averageTime: state.player2Answers.length > 0 ? p2TotalTime / state.player2Answers.length : 0
      },
      winner: (() => {
        // Calculate accuracies
        const p1Accuracy = state.player1Answers.length > 0 ? (p1Correct / state.player1Answers.length) * 100 : 0
        const p2Accuracy = state.player2Answers.length > 0 ? (p2Correct / state.player2Answers.length) * 100 : 0
        
        // Primary: Accuracy (higher accuracy wins)
        if (p1Accuracy > p2Accuracy) return 'player1'
        if (p2Accuracy > p1Accuracy) return 'player2'
        
        // Tiebreaker 1: Total time (faster wins - lower time is better)
        if (p1TotalTime < p2TotalTime) return 'player1'
        if (p2TotalTime < p1TotalTime) return 'player2'
        
        // Tiebreaker 2: Average time per question (faster average wins)
        const p1AvgTime = state.player1Answers.length > 0 ? p1TotalTime / state.player1Answers.length : 0
        const p2AvgTime = state.player2Answers.length > 0 ? p2TotalTime / state.player2Answers.length : 0
        if (p1AvgTime < p2AvgTime) return 'player1'
        if (p2AvgTime < p1AvgTime) return 'player2'
        
        // Tiebreaker 3: Score (as additional tiebreaker)
        if (state.player1Score > state.player2Score) return 'player1'
        if (state.player2Score > state.player1Score) return 'player2'
        
        // Tiebreaker 4: More correct answers
        if (p1Correct > p2Correct) return 'player1'
        if (p2Correct > p1Correct) return 'player2'
        
        // Tiebreaker 5: More questions answered
        if (state.player1Answers.length > state.player2Answers.length) return 'player1'
        if (state.player2Answers.length > state.player1Answers.length) return 'player2'
        
        // Ultimate tiebreaker: Compare by earliest answer timestamp (who answered first question faster)
        // This ensures no ties even in the most extreme case
        if (state.player1Answers.length > 0 && state.player2Answers.length > 0) {
          const p1FirstAnswerTime = state.player1Answers[0]?.timestamp || 0
          const p2FirstAnswerTime = state.player2Answers[0]?.timestamp || 0
          if (p1FirstAnswerTime < p2FirstAnswerTime) return 'player1'
          if (p2FirstAnswerTime < p1FirstAnswerTime) return 'player2'
        }
        
        // Final fallback: Player 1 wins (should never reach here, but ensures no ties)
        return 'player1'
      })()
    }
  }

  // Continuous check for completion (polling-based)
  // Note: This is a backup check. The main check happens in loadGameState
  const completionCheckedRef = useRef(false)
  useEffect(() => {
    if (!gameState || gameResult || completionCheckedRef.current) return
    
    const checkCompletion = async () => {
      const p1Finished = gameState.player1Answers.length >= TOTAL_QUESTIONS
      const p2Finished = gameState.player2Answers.length >= TOTAL_QUESTIONS
      
      if (p1Finished && p2Finished && !gameResult) {
        console.log('✅ Both players finished (backup check), calculating result...')
        completionCheckedRef.current = true // Prevent multiple calls
        const result = calculateTriviaResult(gameState)
        setGameResult(result)
        await saveGameStateToDatabase(gameState, result)
        
        if (onGameComplete) {
          // Pass the winner string, not the full result
          onGameComplete(result.winner)
        }
      }
    }
    
    checkCompletion()
  }, [gameState, gameResult, onGameComplete, saveGameStateToDatabase])

  // Determine opponent info
  useEffect(() => {
    if (player1Id && player2Id && currentUserId) {
      const opponent = currentUserId === player1Id ? player2Id : player1Id
      setOpponentId(opponent)
      
      // Fetch opponent name
      const fetchOpponentName = async () => {
        try {
          const supabase = createClient()
          const { data } = await supabase
            .from('users')
            .select('username, full_name')
            .eq('id', opponent)
            .single()
          
          if (data) {
            setOpponentName(data.full_name || data.username || 'Opponent')
          }
        } catch (error) {
          console.error('Error fetching opponent name:', error)
        }
      }
      
      fetchOpponentName()
    }
  }, [player1Id, player2Id, currentUserId])
  
  // Check friend status
  useEffect(() => {
    const checkFriendStatus = async () => {
      if (!currentUserId || !opponentId) return
      
      setFriendStatus('checking')
      try {
        const [friendsResult, sentRequestsResult, pendingRequestsResult] = await Promise.all([
          getFriends(),
          getSentRequests(),
          getPendingRequests()
        ])
        
        // Check if already friends
        if (friendsResult.data && friendsResult.data.some((f: any) => 
          (f.user_id === currentUserId && f.friend_id === opponentId) ||
          (f.user_id === opponentId && f.friend_id === currentUserId)
        )) {
          setFriendStatus('friends')
          return
        }
        
        // Check if request was sent
        if (sentRequestsResult.data && sentRequestsResult.data.some((r: any) => r.friend_id === opponentId)) {
          setFriendStatus('request_sent')
          return
        }
        
        // Check if request was received
        if (pendingRequestsResult.data) {
          const receivedRequest = pendingRequestsResult.data.find((r: any) => r.user_id === opponentId)
          if (receivedRequest) {
            setFriendStatus('request_received')
            setPendingRequestId(receivedRequest.id)
            return
          }
        }
        
        setFriendStatus('none')
      } catch (error) {
        console.error('Error checking friend status:', error)
        setFriendStatus('none')
      }
    }
    
    if (currentUserId && opponentId) {
      checkFriendStatus()
    }
  }, [currentUserId, opponentId])

  // Show loading
  if (!gameState) {
    return (
      <Card className="w-full max-w-4xl mx-auto bg-black border-gray-800">
        <CardContent className="py-12 text-center">
          <div className="inline-block animate-spin">
            <Brain className="h-8 w-8 text-orange-500" />
          </div>
          <p className="text-gray-400 mt-4">Loading game...</p>
        </CardContent>
      </Card>
    )
  }
  
  // Handle add friend
  const handleAddFriend = async () => {
    if (!currentUserId || !opponentId || isLoadingFriend) return
    
    setIsLoadingFriend(true)
    try {
      if (friendStatus === 'request_received' && pendingRequestId) {
        // Accept pending request
        await acceptFriendRequest(pendingRequestId)
        setFriendStatus('friends')
        setPendingRequestId(null)
      } else if (friendStatus === 'none') {
        // Send new request
        await sendFriendRequest(currentUserId, opponentId)
        setFriendStatus('request_sent')
      }
    } catch (error) {
      console.error('Error handling friend request:', error)
      alert('Failed to process friend request. Please try again.')
    } finally {
      setIsLoadingFriend(false)
    }
  }
  
  // Rematch functions
  const requestRematch = async () => {
    if (!currentUserId || !player1Id || !player2Id || !gameId) return
    
    setIsLoadingRematch(true)
    try {
      const supabase = createClient()
      
      // Check if there's already a rematch request
      const { data: matchData } = await supabase
        .from('matches')
        .select('game_data')
        .eq('id', matchId)
        .single()
      
      if (matchData?.game_data?.rematch_requested_by) {
        alert('A rematch request has already been sent for this match.')
        setIsLoadingRematch(false)
        return
      }
      
      // Store rematch request in matches table
      const currentGameData = matchData?.game_data || {}
      const { error: matchError } = await supabase
        .from('matches')
        .update({
          game_data: {
            ...currentGameData,
            rematch_requested_by: currentUserId,
            rematch_requested_at: new Date().toISOString()
          }
        })
        .eq('id', matchId)
      
      if (matchError) {
        console.error('Error storing rematch request:', matchError)
        alert('Failed to request rematch. Please try again.')
        setIsLoadingRematch(false)
        return
      }
      
      // Also store in match_history as backup
      await supabase
        .from('match_history')
        .insert({
          match_id: matchId,
          user_id: currentUserId,
          action_type: 'rematch_requested',
          action_data: {
            requested_by: currentUserId,
            requested_at: new Date().toISOString(),
            original_match_id: matchId
          }
        })
      
      setRematchStatus('requested')
      setRematchRequestedBy(currentUserId)
    } catch (error) {
      console.error('Error requesting rematch:', error)
    } finally {
      setIsLoadingRematch(false)
    }
  }

  const acceptRematch = async () => {
    if (!currentUserId || !player1Id || !player2Id || !gameId) {
      alert('Missing player information. Cannot create rematch.')
      return
    }
    
    setIsLoadingRematch(true)
    try {
      const supabase = createClient()
      
      // Create new match with same players and bet amount
      const { data: newMatch, error: matchError } = await supabase
        .from('matches')
        .insert({
          game_id: gameId,
          player1_id: player1Id,
          player2_id: player2Id,
          bet_amount: betAmount,
          status: 'in_progress',
          started_at: new Date().toISOString(),
          game_data: {}
        })
        .select()
        .single()
      
      if (matchError || !newMatch) {
        console.error('Error creating rematch:', matchError)
        alert(`Failed to create rematch: ${matchError?.message || 'Unknown error'}`)
        setIsLoadingRematch(false)
        return
      }
      
      // Save rematch acceptance to match_history
      await supabase
        .from('match_history')
        .insert({
          match_id: matchId,
          user_id: currentUserId,
          action_type: 'rematch_accepted',
          action_data: {
            accepted_by: currentUserId,
            new_match_id: newMatch.id,
            accepted_at: new Date().toISOString()
          }
        })
      
      setRematchStatus('accepted')
      router.replace(`/games/match/${newMatch.id}`)
    } catch (error) {
      console.error('Error accepting rematch:', error)
    } finally {
      setIsLoadingRematch(false)
    }
  }

  const rejectRematch = async () => {
    if (!currentUserId) return
    
    setIsLoadingRematch(true)
    try {
      const supabase = createClient()
      
      await supabase
        .from('match_history')
        .insert({
          match_id: matchId,
          user_id: currentUserId,
          action_type: 'rematch_rejected',
          action_data: {
            rejected_by: currentUserId,
            rejected_at: new Date().toISOString()
          }
        })
      
      setRematchStatus('rejected')
    } catch (error) {
      console.error('Error rejecting rematch:', error)
    } finally {
      setIsLoadingRematch(false)
    }
  }

  // Show results if both players finished
  if (gameResult) {
    const myResult = isPlayer1 ? gameResult.player1Result : gameResult.player2Result
    const opponentResult = isPlayer1 ? gameResult.player2Result : gameResult.player1Result
    const iWon = gameResult.winner === (isPlayer1 ? 'player1' : 'player2')
    
    return (
      <Card className="w-full max-w-4xl mx-auto bg-black border-gray-800">
        <CardHeader>
          <CardTitle className="text-center text-white flex items-center justify-center gap-2">
            <Trophy className="h-6 w-6 text-yellow-400" />
            Game Complete!
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center">
            <p className="text-3xl font-bold text-white mb-2">
              {iWon ? 'You Won! 🎉' : gameResult.winner === 'draw' ? "It's a Draw!" : 'You Lost'}
            </p>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-800">
              <div className="text-cyan-400 font-semibold mb-2">Your Score</div>
              <div className="text-white text-3xl font-bold">{myResult.score}</div>
              <div className="text-gray-400 text-sm mt-2">
                {myResult.correctAnswers}/{myResult.questionsAnswered} correct ({Math.round(myResult.accuracy)}%)
              </div>
            </div>
            <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-800">
              <div className="text-yellow-400 font-semibold mb-2">Opponent Score</div>
              <div className="text-white text-3xl font-bold">{opponentResult.score}</div>
              <div className="text-gray-400 text-sm mt-2">
                {opponentResult.correctAnswers}/{opponentResult.questionsAnswered} correct ({Math.round(opponentResult.accuracy)}%)
              </div>
            </div>
          </div>
          
          {/* Rematch Request Section - Only show for non-tournament matches */}
          {!isTournamentMatch && (
            <div className="mt-6 bg-gray-800/50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-white mb-4">Rematch Request</h3>
              
              {rematchStatus === 'none' && (
                <div className="text-center">
                  <p className="text-gray-300 mb-4">Want to play again?</p>
                  <button
                    onClick={requestRematch}
                    disabled={isLoadingRematch}
                    className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
                  >
                    {isLoadingRematch ? 'Requesting...' : 'Request Rematch'}
                  </button>
                  <p className="text-gray-500 text-xs mt-2">Only one player can request a rematch</p>
                </div>
              )}
              
              {rematchStatus === 'requested' && (
                <div className="text-center">
                  <p className="text-blue-400 mb-4">✅ Rematch request sent!</p>
                  <p className="text-gray-400 text-sm">Waiting for opponent to respond...</p>
                </div>
              )}
              
              {rematchStatus === 'accepted' && (
                <div className="text-center">
                  <p className="text-green-400 mb-4">🎉 Rematch accepted! Creating new game...</p>
                  <p className="text-gray-400 text-sm">Redirecting to new match...</p>
                </div>
              )}
              
              {rematchStatus === 'received' && (
                <div className="text-center">
                  <p className="text-yellow-400 mb-4">🎮 Opponent wants a rematch!</p>
                  <div className="flex gap-3 justify-center">
                    <button
                      onClick={acceptRematch}
                      disabled={isLoadingRematch}
                      className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
                    >
                      {isLoadingRematch ? 'Accepting...' : 'Accept'}
                    </button>
                    <button
                      onClick={rejectRematch}
                      disabled={isLoadingRematch}
                      className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
                    >
                      {isLoadingRematch ? 'Rejecting...' : 'Decline'}
                    </button>
                  </div>
                </div>
              )}
              
              {rematchStatus === 'rejected' && (
                <div className="text-center">
                  <p className="text-red-400 mb-4">❌ Rematch declined by opponent</p>
                  <button
                    onClick={() => {
                      setRematchStatus('none')
                      setRematchRequestedBy(null)
                    }}
                    className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                  >
                    Request Again
                  </button>
                </div>
              )}
            </div>
          )}
          
        </CardContent>
      </Card>
    )
  }

  // Show waiting screen if one player finished
  const myAnswerCount = isPlayer1 ? gameState.player1Answers.length : gameState.player2Answers.length
  const opponentAnswerCount = isPlayer1 ? gameState.player2Answers.length : gameState.player1Answers.length
  const myFinished = myAnswerCount >= TOTAL_QUESTIONS
  const opponentFinished = opponentAnswerCount >= TOTAL_QUESTIONS
  const opponentProgress = opponentAnswerCount // Derive directly from gameState
  
  // If player has finished, don't show questions anymore - show waiting screen or results
  if (myFinished && !opponentFinished) {
    const opponentName = isPlayer1 ? 'Player 2' : 'Player 1'
    return (
      <Card className="w-full max-w-4xl mx-auto bg-black border-gray-800">
        <CardContent className="py-12 text-center">
          <Trophy className="h-16 w-16 text-orange-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">You've Finished!</h2>
          <p className="text-gray-400">
            Waiting for {opponentName} to finish their questions...
          </p>
          <div className="mt-6">
            <Progress value={100} className="w-64 mx-auto" />
            <p className="text-sm text-gray-400 mt-2">Your score: {isPlayer1 ? gameState.player1Score : gameState.player2Score} points</p>
            <p className="text-sm text-gray-400">Opponent progress: {opponentProgress}/{TOTAL_QUESTIONS}</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Show main game
  if (!matchReady) {
    return (
      <Card className="w-full max-w-4xl mx-auto bg-black border-gray-800">
        <CardContent className="py-12 text-center">
          <p className="text-gray-400">Waiting for game to start...</p>
        </CardContent>
      </Card>
    )
  }

  // Don't show questions if player has finished
  if (myFinished) {
    // If both finished, results should already be shown above
    // If only this player finished, waiting screen should already be shown above
    // This is a fallback to prevent showing questions
    return (
      <Card className="w-full max-w-4xl mx-auto bg-black border-gray-800">
        <CardContent className="py-12 text-center">
          <Trophy className="h-16 w-16 text-orange-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">You've Finished!</h2>
          <p className="text-gray-400">
            Waiting for opponent to finish their questions...
          </p>
        </CardContent>
      </Card>
    )
  }

  if (!currentQuestion) return null

  // Derive opponent progress from gameState for main game view
  const mainOpponentProgress = isPlayer1 ? gameState.player2Answers.length : gameState.player1Answers.length

  return (
    <Card className="w-full max-w-4xl mx-auto bg-black border-gray-800">
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <p className="text-gray-400">Question {myCurrentQuestionIndex + 1}/{TOTAL_QUESTIONS}</p>
            <p className="text-2xl font-bold text-white">
              {isPlayer1 ? gameState.player1Score : gameState.player2Score} pts
            </p>
          </div>
          <div className="text-center">
            <h1 className="text-3xl font-bold text-white">Multiplayer Trivia</h1>
            <p className="text-gray-400">Trivia Challenge</p>
          </div>
          <div className="text-right">
            <p className="text-gray-400">Opponent Progress</p>
            <p className="text-2xl font-bold text-orange-500">{mainOpponentProgress}/{TOTAL_QUESTIONS}</p>
            <p className="text-sm text-gray-400 mt-1">
              Score: {isPlayer1 ? gameState.player2Score : gameState.player1Score} pts
            </p>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Timer */}
        <div className="mb-6">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Timer className="h-5 w-5 text-orange-500" />
            <span className="text-lg font-bold text-white">{timeRemaining}s</span>
          </div>
          <Progress 
            value={(timeRemaining / QUESTION_TIME_LIMIT) * 100} 
            className="h-2"
          />
        </div>

        {/* Question */}
        <div className="space-y-4">
          <div className="text-center">
            <Badge className="bg-purple-500/20 text-purple-400 mb-2">
              {currentQuestion.category}
            </Badge>
            <div className="text-2xl font-bold text-white mt-4">
              {currentQuestion.question}
            </div>
          </div>
          
          {/* Answer options */}
          <div className="space-y-3">
            {currentQuestion.options.map((option, index) => (
              <Button
                key={index}
                onClick={() => handleAnswer(index)}
                className="w-full h-16 text-left px-4 bg-gray-800 hover:bg-gray-700 text-white justify-start text-lg"
                disabled={localAnswerSubmitted}
              >
                <span className="mr-3 text-purple-400 font-mono">
                  {String.fromCharCode(65 + index)}.
                </span>
                {option}
              </Button>
            ))}
          </div>
        </div>

        {/* Instructions */}
        <div className="text-center text-sm text-gray-400">
          Answer correctly to earn points! Faster answers = more points.
        </div>
        
      </CardContent>
    </Card>
  )
}


// Math Blitz Game Logic
export interface MathProblem {
  id: string
  question: string
  answer: number
  options: number[]
  difficulty: 'easy' | 'medium' | 'hard'
  timeLimit: number
  points: number
}

export interface GameState {
  currentProblem: MathProblem | null
  score: number
  timeRemaining: number
  problemsSolved: number
  streak: number
  isGameActive: boolean
  gameStartTime: number | null
}

export interface GameResult {
  finalScore: number
  problemsSolved: number
  accuracy: number
  totalTime: number
  streak: number
}

// Multiplayer game interfaces
export interface MultiplayerGameState {
  problems: MathProblem[]
  currentProblemIndex: number
  player1Score: number
  player2Score: number
  player1Answers: PlayerAnswer[]
  player2Answers: PlayerAnswer[]
  player1Finished: boolean
  player2Finished: boolean
  gameStartTime: number
  gameEndTime?: number
  winner?: 'player1' | 'player2' | 'draw'
}

export interface PlayerAnswer {
  problemId: string
  answer: number
  isCorrect: boolean
  timeSpent: number
  timestamp: number
}

export interface MultiplayerResult {
  player1Result: {
    score: number
    problemsSolved: number
    accuracy: number
    totalTime: number
    streak: number
    compositeScore?: number
    scoreBreakdown?: {
      baseScore: number
      accuracyBonus: number
      speedBonus: number
      consistencyBonus: number
      completionBonus: number
    }
  }
  player2Result: {
    score: number
    problemsSolved: number
    accuracy: number
    totalTime: number
    streak: number
    compositeScore?: number
    scoreBreakdown?: {
      baseScore: number
      accuracyBonus: number
      speedBonus: number
      consistencyBonus: number
      completionBonus: number
    }
  }
  winner: 'player1' | 'player2' | 'draw'
  winReason: 'score' | 'composite' | 'accuracy' | 'time' | 'consistency'
}

// Generate random math problems
export function generateMathProblem(difficulty: 'easy' | 'medium' | 'hard' = 'easy'): MathProblem {
  let num1: number, num2: number, answer: number, question: string
  let options: number[] = []
  
  switch (difficulty) {
    case 'easy':
      num1 = Math.floor(Math.random() * 20) + 1
      num2 = Math.floor(Math.random() * 20) + 1
      answer = num1 + num2
      question = `${num1} + ${num2} = ?`
      options = generateOptions(answer, 4, 5)
      break
      
    case 'medium':
      num1 = Math.floor(Math.random() * 50) + 10
      num2 = Math.floor(Math.random() * 50) + 10
      answer = num1 + num2
      question = `${num1} + ${num2} = ?`
      options = generateOptions(answer, 4, 10)
      break
      
    case 'hard':
      num1 = Math.floor(Math.random() * 100) + 20
      num2 = Math.floor(Math.random() * 100) + 20
      answer = num1 + num2
      question = `${num1} + ${num2} = ?`
      options = generateOptions(answer, 4, 15)
      break
  }
  
  return {
    id: Math.random().toString(36).substr(2, 9),
    question,
    answer,
    options: shuffleArray(options),
    difficulty,
    timeLimit: difficulty === 'easy' ? 30 : difficulty === 'medium' ? 25 : 20,
    points: difficulty === 'easy' ? 10 : difficulty === 'medium' ? 15 : 20
  }
}

// Generate multiplication problems for multiplayer (synchronized)
export function generateMultiplicationProblem(difficulty: 'easy' | 'medium' | 'hard' = 'easy'): MathProblem {
  let num1: number, num2: number, answer: number, question: string
  let options: number[] = []
  
  switch (difficulty) {
    case 'easy':
      num1 = Math.floor(Math.random() * 12) + 1  // 1-12 times tables
      num2 = Math.floor(Math.random() * 12) + 1
      answer = num1 * num2
      question = `${num1} × ${num2} = ?`
      options = generateOptions(answer, 4, 10)
      break
      
    case 'medium':
      num1 = Math.floor(Math.random() * 15) + 1  // 1-15 times tables
      num2 = Math.floor(Math.random() * 15) + 1
      answer = num1 * num2
      question = `${num1} × ${num2} = ?`
      options = generateOptions(answer, 4, 15)
      break
      
    case 'hard':
      num1 = Math.floor(Math.random() * 20) + 1  // 1-20 times tables
      num2 = Math.floor(Math.random() * 20) + 1
      answer = num1 * num2
      question = `${num1} × ${num2} = ?`
      options = generateOptions(answer, 4, 25)
      break
  }
  
  return {
    id: Math.random().toString(36).substr(2, 9),
    question,
    answer,
    options: shuffleArray(options),
    difficulty,
    timeLimit: difficulty === 'easy' ? 15 : difficulty === 'medium' ? 12 : 10, // Shorter for multiplication
    points: difficulty === 'easy' ? 10 : difficulty === 'medium' ? 15 : 20
  }
}

// Generate synchronized problem set for multiplayer
export function generateSynchronizedProblems(seed: string, count: number = 10): MathProblem[] {
  // Use seed to ensure both players get same problems
  const problems: MathProblem[] = []
  const difficulties: ('easy' | 'medium' | 'hard')[] = ['easy', 'medium', 'hard']
  
  // Simple seeded random number generator
  let seedNum = 0
  for (let i = 0; i < seed.length; i++) {
    seedNum += seed.charCodeAt(i)
  }
  
  for (let i = 0; i < count; i++) {
    // Use seed + index to generate consistent problems
    const problemSeed = `${seed}-${i}`
    const difficulty = difficulties[i % 3] // Rotate through difficulties
    
    // Generate multiplication problem with consistent seed
    const problem = generateSeededMultiplicationProblem(problemSeed, difficulty)
    problems.push(problem)
  }
  
  return problems
}

// Generate multiplication problem with seed for consistency
function generateSeededMultiplicationProblem(seed: string, difficulty: 'easy' | 'medium' | 'hard'): MathProblem {
  let seedNum = 0
  for (let i = 0; i < seed.length; i++) {
    seedNum += seed.charCodeAt(i)
  }
  
  // Simple seeded random
  const seededRandom = () => {
    seedNum = (seedNum * 9301 + 49297) % 233280
    return seedNum / 233280
  }
  
  let num1: number, num2: number, answer: number, question: string
  let options: number[] = []
  
  switch (difficulty) {
    case 'easy':
      num1 = Math.floor(seededRandom() * 12) + 1
      num2 = Math.floor(seededRandom() * 12) + 1
      answer = num1 * num2
      question = `${num1} × ${num2} = ?`
      options = generateSeededOptions(answer, 4, 10, seededRandom)
      break
      
    case 'medium':
      num1 = Math.floor(seededRandom() * 15) + 1
      num2 = Math.floor(seededRandom() * 15) + 1
      answer = num1 * num2
      question = `${num1} × ${num2} = ?`
      options = generateSeededOptions(answer, 4, 15, seededRandom)
      break
      
    case 'hard':
      num1 = Math.floor(seededRandom() * 20) + 1
      num2 = Math.floor(seededRandom() * 20) + 1
      answer = num1 * num2
      question = `${num1} × ${num2} = ?`
      options = generateSeededOptions(answer, 4, 25, seededRandom)
      break
  }
  
  return {
    id: seed,
    question,
    answer,
    options: shuffleSeededArray(options, seededRandom),
    difficulty,
    timeLimit: difficulty === 'easy' ? 15 : difficulty === 'medium' ? 12 : 10,
    points: difficulty === 'easy' ? 10 : difficulty === 'medium' ? 15 : 20
  }
}

// Generate options with seeded random
function generateSeededOptions(correctAnswer: number, count: number, variance: number, seededRandom: () => number): number[] {
  const options = [correctAnswer]
  
  while (options.length < count) {
    const wrongAnswer = correctAnswer + (seededRandom() > 0.5 ? 1 : -1) * Math.floor(seededRandom() * variance) + 1
    if (wrongAnswer > 0 && !options.includes(wrongAnswer)) {
      options.push(wrongAnswer)
    }
  }
  
  return options
}

// Shuffle array with seeded random
function shuffleSeededArray<T>(array: T[], seededRandom: () => number): T[] {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(seededRandom() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

// Generate multiple choice options
function generateOptions(correctAnswer: number, count: number, variance: number): number[] {
  const options = [correctAnswer]
  
  while (options.length < count) {
    const wrongAnswer = correctAnswer + (Math.random() > 0.5 ? 1 : -1) * Math.floor(Math.random() * variance) + 1
    if (wrongAnswer > 0 && !options.includes(wrongAnswer)) {
      options.push(wrongAnswer)
    }
  }
  
  return options
}

// Shuffle array (Fisher-Yates algorithm)
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

// Calculate score based on time and difficulty
export function calculateScore(
  correct: boolean,
  timeRemaining: number,
  totalTime: number,
  difficulty: 'easy' | 'medium' | 'hard',
  streak: number
): number {
  if (!correct) return 0
  
  const basePoints = difficulty === 'easy' ? 10 : difficulty === 'medium' ? 15 : 20
  const timeBonus = Math.floor((timeRemaining / totalTime) * 10)
  const streakBonus = Math.floor(streak / 3) * 5
  
  return basePoints + timeBonus + streakBonus
}

// Check if answer is correct
export function checkAnswer(problem: MathProblem, userAnswer: number): boolean {
  return userAnswer === problem.answer
}

// Generate a series of problems for a game
export function generateGameProblems(count: number = 10): MathProblem[] {
  const problems: MathProblem[] = []
  const difficulties: ('easy' | 'medium' | 'hard')[] = ['easy', 'medium', 'hard']
  
  for (let i = 0; i < count; i++) {
    const difficulty = difficulties[Math.floor(Math.random() * difficulties.length)]
    problems.push(generateMathProblem(difficulty))
  }
  
  return problems
}

// Initialize game state
export function initializeGameState(): GameState {
  return {
    currentProblem: null,
    score: 0,
    timeRemaining: 0,
    problemsSolved: 0,
    streak: 0,
    isGameActive: false,
    gameStartTime: null
  }
}

// 4 In a Row game logic
export type FourInARowCell = "empty" | "player1" | "player2"
export type FourInARowBoard = FourInARowCell[][]

export function createEmptyBoard(): FourInARowBoard {
  return Array(6)
    .fill(null)
    .map(() => Array(7).fill("empty"))
}

export function dropPiece(board: FourInARowBoard, column: number, player: "player1" | "player2"): FourInARowBoard | null {
  const newBoard = board.map((row) => [...row])

  // Find the lowest empty row in the column
  for (let row = 5; row >= 0; row--) {
    if (newBoard[row][column] === "empty") {
      newBoard[row][column] = player
      return newBoard
    }
  }

  return null // Column is full
}

export function checkWinner(board: FourInARowBoard): "player1" | "player2" | "draw" | null {
  // Check horizontal
  for (let row = 0; row < 6; row++) {
    for (let col = 0; col < 4; col++) {
      const cell = board[row][col]
      if (
        cell !== "empty" &&
        cell === board[row][col + 1] &&
        cell === board[row][col + 2] &&
        cell === board[row][col + 3]
      ) {
        return cell
      }
    }
  }

  // Check vertical
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 7; col++) {
      const cell = board[row][col]
      if (
        cell !== "empty" &&
        cell === board[row + 1][col] &&
        cell === board[row + 2][col] &&
        cell === board[row + 3][col]
      ) {
        return cell
      }
    }
  }

  // Check diagonal (top-left to bottom-right)
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 4; col++) {
      const cell = board[row][col]
      if (
        cell !== "empty" &&
        cell === board[row + 1][col + 1] &&
        cell === board[row + 2][col + 2] &&
        cell === board[row + 3][col + 3]
      ) {
        return cell
      }
    }
  }

  // Check diagonal (top-right to bottom-left)
  for (let row = 0; row < 3; row++) {
    for (let col = 3; col < 7; col++) {
      const cell = board[row][col]
      if (
        cell !== "empty" &&
        cell === board[row + 1][col - 1] &&
        cell === board[row + 2][col - 2] &&
        cell === board[row + 3][col - 3]
      ) {
        return cell
      }
    }
  }

  // Check for draw
  const isFull = board.every((row) => row.every((cell) => cell !== "empty"))
  if (isFull) return "draw"

  return null
}

// Trivia game logic
export interface TriviaQuestion {
  question: string
  options: string[]
  correctAnswer: number
  category: string
}

export const triviaQuestions: TriviaQuestion[] = [
  {
    question: "What is the capital of France?",
    options: ["London", "Berlin", "Paris", "Madrid"],
    correctAnswer: 2,
    category: "Geography",
  },
  {
    question: "Which planet is known as the Red Planet?",
    options: ["Venus", "Mars", "Jupiter", "Saturn"],
    correctAnswer: 1,
    category: "Science",
  },
  {
    question: "Who painted the Mona Lisa?",
    options: ["Vincent van Gogh", "Pablo Picasso", "Leonardo da Vinci", "Michelangelo"],
    correctAnswer: 2,
    category: "Art",
  },
  {
    question: "What is the largest mammal in the world?",
    options: ["African Elephant", "Blue Whale", "Giraffe", "Polar Bear"],
    correctAnswer: 1,
    category: "Nature",
  },
  {
    question: "In which year did World War II end?",
    options: ["1944", "1945", "1946", "1947"],
    correctAnswer: 1,
    category: "History",
  },
  {
    question: "What is the chemical symbol for gold?",
    options: ["Go", "Gd", "Au", "Ag"],
    correctAnswer: 2,
    category: "Science",
  },
  {
    question: "Which is the longest river in the world?",
    options: ["Amazon River", "Nile River", "Mississippi River", "Yangtze River"],
    correctAnswer: 1,
    category: "Geography",
  },
  {
    question: "Who wrote 'Romeo and Juliet'?",
    options: ["Charles Dickens", "William Shakespeare", "Jane Austen", "Mark Twain"],
    correctAnswer: 1,
    category: "Literature",
  },
]

export function getRandomTriviaQuestion(): TriviaQuestion {
  return triviaQuestions[Math.floor(Math.random() * triviaQuestions.length)]
}

// Multiplayer game functions
export function initializeMultiplayerGame(matchId: string): MultiplayerGameState {
  const problems = generateSynchronizedProblems(matchId, 10)
  
  return {
    problems,
    currentProblemIndex: 0,
    player1Score: 0,
    player2Score: 0,
    player1Answers: [],
    player2Answers: [],
    player1Finished: false,
    player2Finished: false,
    gameStartTime: Date.now(),
  }
}

export function submitPlayerAnswer(
  gameState: MultiplayerGameState,
  playerId: 'player1' | 'player2',
  answer: number,
  timeSpent: number
): MultiplayerGameState {
  const currentProblem = gameState.problems[gameState.currentProblemIndex]
  const isCorrect = answer === currentProblem.answer
  
  // Check if player has already answered this problem
  const playerAnswers = playerId === 'player1' ? gameState.player1Answers : gameState.player2Answers
  const hasAnsweredThisProblem = playerAnswers.some(a => a.problemId === currentProblem.id)
  
  if (hasAnsweredThisProblem) {
    console.log(`⚠️ Player ${playerId} already answered this problem, ignoring duplicate answer`)
    return gameState // Don't process duplicate answers
  }
  
  const playerAnswer: PlayerAnswer = {
    problemId: currentProblem.id,
    answer,
    isCorrect,
    timeSpent,
    timestamp: Date.now()
  }
  
  const newState = { ...gameState }
  
  if (playerId === 'player1') {
    newState.player1Answers = [...newState.player1Answers, playerAnswer]
    if (isCorrect) {
      newState.player1Score += calculateScore(true, timeSpent, currentProblem.timeLimit, currentProblem.difficulty, getCurrentStreak(newState.player1Answers))
    }
  } else {
    newState.player2Answers = [...newState.player2Answers, playerAnswer]
    if (isCorrect) {
      newState.player2Score += calculateScore(true, timeSpent, currentProblem.timeLimit, currentProblem.difficulty, getCurrentStreak(newState.player2Answers))
    }
  }
  
  // Advance to next question immediately after any player answers
  // No need to wait for both players
  console.log('🚀 Advancing to next question immediately!')
  newState.currentProblemIndex++
  console.log('➡️ New problem index:', newState.currentProblemIndex)
  
  // Check if this specific player is finished
  console.log(`🔍 Player ${playerId} completion check:`, {
    currentIndex: newState.currentProblemIndex,
    problemsLength: newState.problems.length,
    isFinished: newState.currentProblemIndex >= newState.problems.length
  })
  
  if (newState.currentProblemIndex >= newState.problems.length) {
    console.log(`🏁 Player ${playerId} finished!`)
    newState.gameEndTime = Date.now()
    // Only mark the current player as finished
    if (playerId === 'player1') {
      newState.player1Finished = true
      console.log('✅ Marked player1 as finished')
    } else {
      newState.player2Finished = true
      console.log('✅ Marked player2 as finished')
    }
    newState.winner = 'draw' // Will be calculated properly by calculateMultiplayerResult
    
    console.log('🏁 Player finished state:', {
      player1Finished: newState.player1Finished,
      player2Finished: newState.player2Finished,
      currentIndex: newState.currentProblemIndex,
      problemsLength: newState.problems.length
    })
  }
  
  return newState
}

export function markPlayerFinished(
  gameState: MultiplayerGameState,
  playerId: 'player1' | 'player2'
): MultiplayerGameState {
  const newState = { ...gameState }
  
  if (playerId === 'player1') {
    newState.player1Finished = true
  } else {
    newState.player2Finished = true
  }
  
  // If both players are finished, determine winner
  if (newState.player1Finished && newState.player2Finished) {
    newState.gameEndTime = Date.now()
    newState.winner = determineWinner(newState)
  }
  
  return newState
}

function getCurrentStreak(answers: PlayerAnswer[]): number {
  let streak = 0
  for (let i = answers.length - 1; i >= 0; i--) {
    if (answers[i].isCorrect) {
      streak++
    } else {
      break
    }
  }
  return streak
}

function determineWinner(gameState: MultiplayerGameState): 'player1' | 'player2' | 'draw' {
  const player1Result = calculatePlayerResult(gameState.player1Answers, gameState.problems)
  const player2Result = calculatePlayerResult(gameState.player2Answers, gameState.problems)
  
  // Primary: Score comparison
  if (player1Result.score > player2Result.score) return 'player1'
  if (player2Result.score > player1Result.score) return 'player2'
  
  // Secondary: Accuracy comparison
  if (player1Result.accuracy > player2Result.accuracy) return 'player1'
  if (player2Result.accuracy > player1Result.accuracy) return 'player2'
  
  // Tertiary: Time comparison (faster is better)
  if (player1Result.totalTime < player2Result.totalTime) return 'player1'
  if (player2Result.totalTime < player1Result.totalTime) return 'player2'
  
  return 'draw'
}

function calculatePlayerResult(answers: PlayerAnswer[], problems: MathProblem[]): {
  score: number
  problemsSolved: number
  accuracy: number
  totalTime: number
  streak: number
} {
  const correctAnswers = answers.filter(a => a.isCorrect)
  const problemsSolved = correctAnswers.length
  const accuracy = problems.length > 0 ? (problemsSolved / problems.length) * 100 : 0
  const totalTime = answers.reduce((sum, a) => sum + a.timeSpent, 0)
  
  // Calculate final score
  let score = 0
  let streak = 0
  let maxStreak = 0
  
  for (let i = 0; i < answers.length; i++) {
    const answer = answers[i]
    const problem = problems[i]
    
    if (answer.isCorrect) {
      streak++
      maxStreak = Math.max(maxStreak, streak)
      score += calculateScore(true, answer.timeSpent, problem.timeLimit, problem.difficulty, streak)
    } else {
      streak = 0
    }
  }
  
  return {
    score,
    problemsSolved,
    accuracy: Math.round(accuracy),
    totalTime,
    streak: maxStreak
  }
}

export function calculateMultiplayerResult(gameState: MultiplayerGameState): MultiplayerResult {
  console.log('🏆 ===== CALCULATING FINAL RESULT =====')
  console.log('📊 Game State:', {
    player1Answers: gameState.player1Answers.length,
    player2Answers: gameState.player2Answers.length,
    totalProblems: gameState.problems.length,
    player1Finished: gameState.player1Finished,
    player2Finished: gameState.player2Finished
  })
  
  const player1Result = calculatePlayerResult(gameState.player1Answers, gameState.problems)
  const player2Result = calculatePlayerResult(gameState.player2Answers, gameState.problems)
  
  console.log('🎯 Player 1 Basic Results:', {
    score: player1Result.score,
    problemsSolved: player1Result.problemsSolved,
    accuracy: `${(player1Result.accuracy * 100).toFixed(1)}%`,
    totalTime: `${player1Result.totalTime.toFixed(1)}s`,
    streak: player1Result.streak
  })
  
  console.log('🎯 Player 2 Basic Results:', {
    score: player2Result.score,
    problemsSolved: player2Result.problemsSolved,
    accuracy: `${(player2Result.accuracy * 100).toFixed(1)}%`,
    totalTime: `${player2Result.totalTime.toFixed(1)}s`,
    streak: player2Result.streak
  })
  
  // Calculate composite scores that balance multiple factors
  const calculateCompositeScore = (result: PlayerResult, playerName: string) => {
    // Base score (0-1000 points)
    const baseScore = result.score
    
    // Accuracy bonus (0-200 points) - rewards high accuracy
    const accuracyBonus = result.problemsSolved > 0 ? Math.round(result.accuracy * 200) : 0
    
    // Speed bonus (0-150 points) - rewards faster completion
    // Faster time = higher bonus (inverse relationship)
    const maxTime = 300 // 30 seconds per problem * 10 problems (in seconds)
    const speedBonus = result.totalTime > 0 ? Math.round(Math.max(0, (maxTime - result.totalTime) / maxTime * 150)) : 0
    
    // Consistency bonus (0-100 points) - rewards consistent performance
    // Based on streak and avoiding long gaps between correct answers
    const consistencyBonus = result.problemsSolved > 0 ? Math.round(Math.min(100, result.streak * 10)) : 0
    
    // Completion bonus (0-50 points) - rewards finishing all problems
    const completionBonus = result.problemsSolved === gameState.problems.length ? 50 : 0
    
    const compositeScore = baseScore + accuracyBonus + speedBonus + consistencyBonus + completionBonus
    
    console.log(`📈 ${playerName} Score Breakdown:`, {
      baseScore,
      accuracyBonus,
      speedBonus,
      consistencyBonus,
      completionBonus,
      totalCompositeScore: compositeScore
    })
    
    return {
      compositeScore,
      breakdown: {
        baseScore,
        accuracyBonus,
        speedBonus,
        consistencyBonus,
        completionBonus
      }
    }
  }
  
  const player1Composite = calculateCompositeScore(player1Result, 'Player 1')
  const player2Composite = calculateCompositeScore(player2Result, 'Player 2')
  
  let winner: 'player1' | 'player2' | 'draw' = 'draw'
  let winReason: 'score' | 'composite' | 'accuracy' | 'time' | 'consistency' = 'composite'
  
  console.log('🥊 Winner Determination:')
  console.log(`   Player 1 Composite Score: ${player1Composite.compositeScore}`)
  console.log(`   Player 2 Composite Score: ${player2Composite.compositeScore}`)
  
  // Determine winner based on composite score
  if (player1Composite.compositeScore > player2Composite.compositeScore) {
    winner = 'player1'
    winReason = 'composite'
    console.log('🏆 Winner: Player 1 (Higher Composite Score)')
  } else if (player2Composite.compositeScore > player1Composite.compositeScore) {
    winner = 'player2'
    winReason = 'composite'
    console.log('🏆 Winner: Player 2 (Higher Composite Score)')
  } else {
    console.log('🤝 Composite scores tied, checking tiebreakers...')
    // If composite scores are tied, fall back to individual factors
    if (player1Result.accuracy > player2Result.accuracy) {
      winner = 'player1'
      winReason = 'accuracy'
      console.log(`🏆 Winner: Player 1 (Higher Accuracy: ${(player1Result.accuracy * 100).toFixed(1)}% vs ${(player2Result.accuracy * 100).toFixed(1)}%)`)
    } else if (player2Result.accuracy > player1Result.accuracy) {
      winner = 'player2'
      winReason = 'accuracy'
      console.log(`🏆 Winner: Player 2 (Higher Accuracy: ${(player2Result.accuracy * 100).toFixed(1)}% vs ${(player1Result.accuracy * 100).toFixed(1)}%)`)
    } else if (player1Result.totalTime < player2Result.totalTime) {
      winner = 'player1'
      winReason = 'time'
      console.log(`🏆 Winner: Player 1 (Faster Time: ${player1Result.totalTime.toFixed(1)}s vs ${player2Result.totalTime.toFixed(1)}s)`)
    } else if (player2Result.totalTime < player1Result.totalTime) {
      winner = 'player2'
      winReason = 'time'
      console.log(`🏆 Winner: Player 2 (Faster Time: ${player2Result.totalTime.toFixed(1)}s vs ${player1Result.totalTime.toFixed(1)}s)`)
    } else {
      winner = 'draw'
      winReason = 'composite'
      console.log('🤝 Result: Draw (All factors tied)')
    }
  }
  
  const finalResult = {
    player1Result: {
      ...player1Result,
      compositeScore: player1Composite.compositeScore,
      scoreBreakdown: player1Composite.breakdown
    },
    player2Result: {
      ...player2Result,
      compositeScore: player2Composite.compositeScore,
      scoreBreakdown: player2Composite.breakdown
    },
    winner,
    winReason
  }
  
  console.log('🎉 ===== FINAL RESULT =====')
  console.log('🏆 Winner:', winner)
  console.log('📊 Win Reason:', winReason)
  console.log('📈 Final Scores:', {
    player1: finalResult.player1Result.compositeScore,
    player2: finalResult.player2Result.compositeScore
  })
  console.log('=====================================')
  
  return finalResult
}

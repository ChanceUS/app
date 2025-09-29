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
  }
  player2Result: {
    score: number
    problemsSolved: number
    accuracy: number
    totalTime: number
    streak: number
  }
  winner: 'player1' | 'player2' | 'draw'
  winReason: 'score' | 'time' | 'accuracy'
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

// Connect 4 game logic
export type Connect4Cell = "empty" | "player1" | "player2"
export type Connect4Board = Connect4Cell[][]

export function createEmptyBoard(): Connect4Board {
  return Array(6)
    .fill(null)
    .map(() => Array(7).fill("empty"))
}

export function dropPiece(board: Connect4Board, column: number, player: "player1" | "player2"): Connect4Board | null {
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

export function checkWinner(board: Connect4Board): "player1" | "player2" | "draw" | null {
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
  
  // Check if both players have answered the current problem
  // Both players need to have answered exactly currentProblemIndex + 1 problems
  const requiredAnswers = gameState.currentProblemIndex + 1
  console.log('🔍 Question advancement check:', {
    currentProblemIndex: gameState.currentProblemIndex,
    requiredAnswers,
    player1Answers: newState.player1Answers.length,
    player2Answers: newState.player2Answers.length,
    player1HasEnough: newState.player1Answers.length >= requiredAnswers,
    player2HasEnough: newState.player2Answers.length >= requiredAnswers
  })
  
  if (newState.player1Answers.length >= requiredAnswers && 
      newState.player2Answers.length >= requiredAnswers) {
    console.log('✅ Both players answered, advancing to next question!')
    newState.currentProblemIndex++
    console.log('➡️ New problem index:', newState.currentProblemIndex)
    
    // Check if game is finished
    if (newState.currentProblemIndex >= newState.problems.length) {
      console.log('🏁 Game finished!')
      newState.gameEndTime = Date.now()
      newState.player1Finished = true
      newState.player2Finished = true
      newState.winner = determineWinner(newState)
    }
  } else {
    console.log('⏳ Waiting for both players to answer...')
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
  const accuracy = answers.length > 0 ? (problemsSolved / answers.length) * 100 : 0
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
  const player1Result = calculatePlayerResult(gameState.player1Answers, gameState.problems)
  const player2Result = calculatePlayerResult(gameState.player2Answers, gameState.problems)
  
  let winner: 'player1' | 'player2' | 'draw' = 'draw'
  let winReason: 'score' | 'time' | 'accuracy' = 'score'
  
  // Determine winner and reason
  if (player1Result.score > player2Result.score) {
    winner = 'player1'
    winReason = 'score'
  } else if (player2Result.score > player1Result.score) {
    winner = 'player2'
    winReason = 'score'
  } else if (player1Result.accuracy > player2Result.accuracy) {
    winner = 'player1'
    winReason = 'accuracy'
  } else if (player2Result.accuracy > player1Result.accuracy) {
    winner = 'player2'
    winReason = 'accuracy'
  } else if (player1Result.totalTime < player2Result.totalTime) {
    winner = 'player1'
    winReason = 'time'
  } else if (player2Result.totalTime < player1Result.totalTime) {
    winner = 'player2'
    winReason = 'time'
  }
  
  return {
    player1Result,
    player2Result,
    winner,
    winReason
  }
}

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

  // Check for draw - if board is full, determine winner by piece count
  const isFull = board.every((row) => row.every((cell) => cell !== "empty"))
  if (isFull) {
    // Count pieces for each player
    let player1Count = 0
    let player2Count = 0
    for (let row = 0; row < 6; row++) {
      for (let col = 0; col < 7; col++) {
        if (board[row][col] === "player1") player1Count++
        else if (board[row][col] === "player2") player2Count++
      }
    }
    // Player with more pieces wins (in Connect Four, players alternate, so counts should be close)
    // If still tied, player1 wins by default (ensures no ties)
    return player1Count >= player2Count ? "player1" : "player2"
  }

  return null
}

// Trivia game logic
export interface TriviaQuestion {
  id?: string
  question: string
  options: string[]
  correctAnswer: number
  category: string
  difficulty?: 'easy' | 'medium' | 'hard'
  timeLimit?: number
}

// Multiplayer Trivia interfaces
export interface TriviaAnswer {
  questionId: string
  answer: number
  isCorrect: boolean
  timeSpent: number
  timestamp: number
}

export interface MultiplayerTriviaState {
  questions: TriviaQuestion[]
  currentQuestionIndex: number
  player1Score: number
  player2Score: number
  player1Answers: TriviaAnswer[]
  player2Answers: TriviaAnswer[]
  player1Finished: boolean
  player2Finished: boolean
  gameStartTime: number
  gameEndTime?: number
  winner?: 'player1' | 'player2' | 'draw'
}

export interface TriviaResult {
  player1Result: {
    score: number
    questionsAnswered: number
    correctAnswers: number
    accuracy: number
    totalTime: number
    averageTime: number
  }
  player2Result: {
    score: number
    questionsAnswered: number
    correctAnswers: number
    accuracy: number
    totalTime: number
    averageTime: number
  }
  winner: 'player1' | 'player2' | 'draw'
}

// Enhanced trivia questions with pop culture and animal questions
export const triviaQuestions: TriviaQuestion[] = [
  // Pop Culture Questions (Easy)
  {
    question: "What pop star embarked on the record-breaking Eras Tour starting in 2023?",
    options: ["Taylor Swift", "Ariana Grande", "Billie Eilish", "Olivia Rodrigo"],
    correctAnswer: 0,
    category: "Pop Culture",
  },
  {
    question: "Which social media platform is primarily known for its short-form video content and viral dance challenges?",
    options: ["Instagram", "TikTok", "Snapchat", "Twitter"],
    correctAnswer: 1,
    category: "Pop Culture",
  },
  {
    question: "What Marvel superhero wields the hammer Mjölnir?",
    options: ["Iron Man", "Thor", "Captain America", "Hulk"],
    correctAnswer: 1,
    category: "Pop Culture",
  },
  {
    question: "The song \"Hotline Bling\" is a major hit for which Canadian rapper?",
    options: ["Drake", "The Weeknd", "Justin Bieber", "Shawn Mendes"],
    correctAnswer: 0,
    category: "Pop Culture",
  },
  {
    question: "What actress starred as Barbie in the 2023 movie Barbie?",
    options: ["Emma Stone", "Margot Robbie", "Scarlett Johansson", "Jennifer Lawrence"],
    correctAnswer: 1,
    category: "Pop Culture",
  },
  {
    question: "Who is often referred to as the \"King of Pop\"?",
    options: ["Elvis Presley", "Michael Jackson", "Prince", "Stevie Wonder"],
    correctAnswer: 1,
    category: "Pop Culture",
  },
  {
    question: "What name did Taylor Swift give to her re-recorded albums (e.g., Fearless (Taylor's Version))?",
    options: ["Taylor's Version (TV)", "Re-recorded", "Taylor's Edition", "Swift Version"],
    correctAnswer: 0,
    category: "Pop Culture",
  },
  {
    question: "Which iconic '90s boy band sang the hit \"I Want It That Way\"?",
    options: ["NSYNC", "Backstreet Boys", "New Kids on the Block", "Boyz II Men"],
    correctAnswer: 1,
    category: "Pop Culture",
  },
  {
    question: "\"You Only Live Once,\" often abbreviated to YOLO, was popularized by which Drake song?",
    options: ["Started From the Bottom", "The Motto", "God's Plan", "Hotline Bling"],
    correctAnswer: 1,
    category: "Pop Culture",
  },
  {
    question: "In the US version of The Office, what paper company does the show focus on?",
    options: ["Dunder Mifflin", "Staples", "Office Depot", "Paper Company"],
    correctAnswer: 0,
    category: "Pop Culture",
  },
  
  // Animal Questions (Easy)
  {
    question: "What is the tallest animal in the world?",
    options: ["Giraffe", "Elephant", "Ostrich", "Camel"],
    correctAnswer: 0,
    category: "Animals",
  },
  {
    question: "How many legs does an octopus have?",
    options: ["Eight", "Six", "Ten", "Twelve"],
    correctAnswer: 0,
    category: "Animals",
  },
  {
    question: "What bird can fly backward?",
    options: ["Hummingbird", "Eagle", "Owl", "Parrot"],
    correctAnswer: 0,
    category: "Animals",
  },
  {
    question: "What do you call a baby kangaroo?",
    options: ["A joey", "A cub", "A pup", "A kit"],
    correctAnswer: 0,
    category: "Animals",
  },
  {
    question: "Which large mammal cannot jump?",
    options: ["Elephant", "Hippo", "Rhino", "Giraffe"],
    correctAnswer: 0,
    category: "Animals",
  },
  {
    question: "What is a group of lions called?",
    options: ["A pride", "A pack", "A herd", "A flock"],
    correctAnswer: 0,
    category: "Animals",
  },
  {
    question: "What is the largest mammal on Earth?",
    options: ["Blue whale", "African elephant", "Giraffe", "Polar bear"],
    correctAnswer: 0,
    category: "Animals",
  },
  {
    question: "Which animal is often called \"man's best friend\"?",
    options: ["Dog", "Cat", "Horse", "Bird"],
    correctAnswer: 0,
    category: "Animals",
  },
  {
    question: "What fish is Nemo from Finding Nemo?",
    options: ["Clownfish", "Goldfish", "Angelfish", "Tropical fish"],
    correctAnswer: 0,
    category: "Animals",
  },
  {
    question: "What color is a polar bear's skin (under its fur)?",
    options: ["Black", "White", "Pink", "Brown"],
    correctAnswer: 0,
    category: "Animals",
  },
  
  // Classic Questions (for backward compatibility)
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

// Database-powered trivia question functions
export async function getRandomTriviaQuestionFromDB(difficulty?: 'easy' | 'medium' | 'hard', category?: string): Promise<TriviaQuestion | null> {
  try {
    const { createClient } = await import('@/lib/supabase/client')
    const supabase = createClient()

    let query = supabase
      .from('trivia_questions')
      .select('*')
      .order('random()')
      .limit(1)

    if (difficulty) {
      query = query.eq('difficulty', difficulty)
    }

    if (category) {
      query = query.eq('category', category)
    }

    const { data, error } = await query

    if (error) {
      // Log full error details for debugging
      console.warn('⚠️ Database query failed (this is OK, will use local questions):', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      })
      // Fallback to local questions - try to match category if possible
      return getRandomTriviaQuestion(category || undefined)
    }

    if (!data || data.length === 0) {
      console.warn('⚠️ No trivia questions found in database, using local questions')
      // Fallback to local questions - try to match category if possible
      return getRandomTriviaQuestion(category || undefined)
    }

    const question = data[0]
    return {
      question: question.question,
      options: question.options,
      correctAnswer: question.correct_answer,
      category: question.category
    }
  } catch (error) {
    console.error('Error in getRandomTriviaQuestionFromDB:', error)
    return getRandomTriviaQuestion(category || undefined)
  }
}

export async function getRandomMultiplicationQuestionFromDB(difficulty?: 'easy' | 'medium' | 'hard'): Promise<MathProblem | null> {
  try {
    const { createClient } = await import('@/lib/supabase/client')
    const supabase = createClient()

    let query = supabase
      .from('multiplication_questions')
      .select('*')
      .order('random()')
      .limit(1)

    if (difficulty) {
      query = query.eq('difficulty', difficulty)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching multiplication question:', error)
      return null
    }

    if (!data || data.length === 0) {
      console.warn('No multiplication questions found, falling back to generated question')
      return generateMultiplicationProblem(difficulty || 'easy')
    }

    const question = data[0]
    const answer = question.product
    const questionText = `${question.factor1} × ${question.factor2} = ?`
    
    // Generate options with the correct answer
    const options = generateOptions(answer, 4, 15)
    
    return {
      id: question.id,
      question: questionText,
      answer: answer,
      options: options,
      difficulty: question.difficulty as 'easy' | 'medium' | 'hard',
      timeLimit: question.time_limit,
      points: question.points
    }
  } catch (error) {
    console.error('Error in getRandomMultiplicationQuestionFromDB:', error)
    return generateMultiplicationProblem(difficulty || 'easy')
  }
}

// Legacy function for backward compatibility
export function getRandomTriviaQuestion(category?: string): TriviaQuestion {
  if (category) {
    const filtered = triviaQuestions.filter(q => q.category === category)
    if (filtered.length > 0) {
      return filtered[Math.floor(Math.random() * filtered.length)]
    }
  }
  return triviaQuestions[Math.floor(Math.random() * triviaQuestions.length)]
}

// Generate synchronized question set for multiplayer trivia (SYNCHRONOUS - like Math Blitz)
// Uses matchId as seed to ensure both players get same questions
export function generateSynchronizedTriviaQuestionsSync(
  matchId: string, 
  category: string | null, 
  count: number = 8
): TriviaQuestion[] {
  const questions: TriviaQuestion[] = []
  
  // Use matchId as seed for consistency (both players get same questions)
  // Simple seeded random number generator (same approach as Math Blitz)
  let seedNum = 0
  for (let i = 0; i < matchId.length; i++) {
    seedNum += matchId.charCodeAt(i)
  }
  
  // Filter questions by category if specified
  let availableQuestions = triviaQuestions
  if (category) {
    availableQuestions = triviaQuestions.filter(q => q.category === category)
    // If no questions match category, use all questions
    if (availableQuestions.length === 0) {
      console.warn(`⚠️ No questions found for category ${category}, using all questions`)
      availableQuestions = triviaQuestions
    }
  }
  
  // Generate questions using seeded selection (deterministic based on matchId)
  for (let i = 0; i < count; i++) {
    // Use seed + index to generate consistent question selection
    // This ensures both players get the same questions in the same order
    const questionSeed = seedNum + i * 17 // Multiply by prime for better distribution
    const index = questionSeed % availableQuestions.length
    
    const q = availableQuestions[index]
    
    // Check for duplicates (shouldn't happen with good seed, but just in case)
    if (questions.some(existing => existing.question === q.question)) {
      // If duplicate, use next question
      const nextIndex = (index + 1) % availableQuestions.length
      questions.push({ ...availableQuestions[nextIndex], timeLimit: 45 })
    } else {
      questions.push({ ...q, timeLimit: 45 })
    }
  }
  
  console.log(`✅ Generated ${questions.length} questions synchronously (requested: ${count}, category: ${category || 'all'})`)
  return questions
}

// Generate synchronized question set for multiplayer trivia (ASYNC - with database fallback)
// DEPRECATED: Use generateSynchronizedTriviaQuestionsSync instead for consistency
export async function generateSynchronizedTriviaQuestions(
  matchId: string, 
  category: string | null, 
  count: number = 8
): Promise<TriviaQuestion[]> {
  const questions: TriviaQuestion[] = []
  const usedQuestionIds = new Set<string>()
  
  // Use matchId as seed for consistency (both players get same questions)
  // Simple seeded approach: use matchId hash to determine question order
  let seedNum = 0
  for (let i = 0; i < matchId.length; i++) {
    seedNum += matchId.charCodeAt(i)
  }
  
  // Try to get questions from database first, then fall back to local
  // IMPORTANT: Always generate exactly `count` questions - never skip
  // Skip database entirely if it's failing - just use local questions
  let useDatabase = true
  
  for (let i = 0; i < count; i++) {
    let q: TriviaQuestion | null = null
    
    // Try database first (only 1 attempt to avoid delays)
    if (useDatabase) {
      try {
        q = await getRandomTriviaQuestionFromDB(undefined, category || undefined)
        
        // Check if valid and not duplicate
        if (q && !usedQuestionIds.has(q.question) && !questions.some(existing => existing.question === q!.question)) {
          // Accept if category matches OR if no category specified
          if (!category || q.category === category) {
            // Good question - use it
            console.log(`✅ DB question ${i + 1}/${count}: ${q.question.substring(0, 40)}...`)
          } else {
            // Category doesn't match - reject and fall back to local
            q = null
          }
        } else {
          // Duplicate or invalid - reject
          q = null
        }
      } catch (error) {
        // Database failed - disable database for rest of questions
        console.warn(`⚠️ Database failed, switching to local questions only for remaining questions`)
        useDatabase = false
        q = null
      }
    }
    
    // If database failed or returned wrong category, use local questions
    if (!q) {
      // Try to get a local question matching the category
      if (category) {
        const filtered = triviaQuestions.filter(
          localQ => localQ.category === category && 
          !usedQuestionIds.has(localQ.question) &&
          !questions.some(existing => existing.question === localQ.question)
        )
        if (filtered.length > 0) {
          q = filtered[Math.floor(Math.random() * filtered.length)]
          console.log(`✅ Local question ${i + 1}/${count} (category match): ${q.question.substring(0, 40)}...`)
        }
      }
      
      // If no category match or no category specified, use any unused local question
      if (!q) {
        const unused = triviaQuestions.filter(
          localQ => !usedQuestionIds.has(localQ.question) &&
          !questions.some(existing => existing.question === localQ.question)
        )
        if (unused.length > 0) {
          q = unused[Math.floor(Math.random() * unused.length)]
          console.log(`✅ Local question ${i + 1}/${count} (any unused): ${q.question.substring(0, 40)}...`)
        }
      }
      
      // If still no question, use any local question (even if duplicate or wrong category)
      if (!q) {
        q = getRandomTriviaQuestion(category || undefined)
        // Remove from usedQuestionIds if it was there (to allow reuse if necessary)
        usedQuestionIds.delete(q.question)
        console.log(`✅ Local question ${i + 1}/${count} (fallback): ${q.question.substring(0, 40)}...`)
      }
    }
    
    // ALWAYS add a question - this should never fail
    if (q) {
      usedQuestionIds.add(q.question)
      questions.push({ ...q, timeLimit: 45 })
    } else {
      // This should NEVER happen, but if it does, use emergency fallback
      console.error(`❌ CRITICAL: Could not generate question ${i + 1}/${count}, using emergency fallback`)
      const emergencyQ = getRandomTriviaQuestion(category || undefined)
      usedQuestionIds.add(emergencyQ.question)
      questions.push({ ...emergencyQ, timeLimit: 45 })
    }
  }
  
  console.log(`✅ Generated ${questions.length} questions total (requested: ${count})`)
  if (questions.length !== count) {
    console.error(`❌ CRITICAL: Question count mismatch! Expected ${count}, got ${questions.length}`)
  }
  
  return questions
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

// Initialize multiplayer trivia game (similar to Math Blitz pattern)
export async function initializeMultiplayerTriviaGame(
  matchId: string, 
  category: string | null, 
  totalQuestions: number = 8
): Promise<MultiplayerTriviaState> {
  const questions = await generateSynchronizedTriviaQuestions(matchId, category, totalQuestions)
  
  return {
    questions,
    currentQuestionIndex: 0,
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
  
  // Safety check - if currentProblem is undefined, return the game state unchanged
  if (!currentProblem) {
    console.error('⚠️ Current problem is undefined at index:', gameState.currentProblemIndex, 'Total problems:', gameState.problems.length)
    return gameState
  }
  
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
  
  // For independent play, we need to track each player's progress separately
  // Update the currentProblemIndex to reflect the player's progress
  const currentPlayerAnswers = playerId === 'player1' ? newState.player1Answers : newState.player2Answers
  const answeredCount = currentPlayerAnswers.length
  
  // Set currentProblemIndex to the next unanswered problem index
  // This helps the UI know which problem to show next
  newState.currentProblemIndex = answeredCount
  
  console.log('🔄 Independent play mode - updated currentProblemIndex:', {
    playerId,
    answeredCount,
    newCurrentIndex: newState.currentProblemIndex,
    totalProblems: newState.problems.length
  })
  
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
  const calculateCompositeScore = (result: { score: number; problemsSolved: number; accuracy: number; totalTime: number; streak: number }, playerName: string) => {
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
      // Final tiebreaker: Use problems solved count (more problems = winner)
      if (player1Result.problemsSolved > player2Result.problemsSolved) {
        winner = 'player1'
        winReason = 'composite'
        console.log(`🏆 Winner: Player 1 (More Problems Solved: ${player1Result.problemsSolved} vs ${player2Result.problemsSolved})`)
      } else if (player2Result.problemsSolved > player1Result.problemsSolved) {
        winner = 'player2'
        winReason = 'composite'
        console.log(`🏆 Winner: Player 2 (More Problems Solved: ${player2Result.problemsSolved} vs ${player1Result.problemsSolved})`)
      } else {
        // Ultimate tiebreaker: Use streak (longer streak = winner)
        if (player1Result.streak > player2Result.streak) {
          winner = 'player1'
          winReason = 'composite'
          console.log(`🏆 Winner: Player 1 (Longer Streak: ${player1Result.streak} vs ${player2Result.streak})`)
        } else if (player2Result.streak > player1Result.streak) {
          winner = 'player2'
          winReason = 'composite'
          console.log(`🏆 Winner: Player 2 (Longer Streak: ${player2Result.streak} vs ${player1Result.streak})`)
        } else {
          // Absolute last resort: Player 1 wins by default (ensures no ties)
          winner = 'player1'
          winReason = 'composite'
          console.log('🏆 Winner: Player 1 (Default - All factors tied, Player 1 wins by default)')
        }
      }
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

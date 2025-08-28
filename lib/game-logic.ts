// Math Blitz game logic
export interface MathBlitzQuestion {
  question: string
  answer: number
  options: number[]
}

export function generateMathQuestion(): MathBlitzQuestion {
  const operations = ["+", "-", "*"]
  const operation = operations[Math.floor(Math.random() * operations.length)]

  let num1: number, num2: number, answer: number

  switch (operation) {
    case "+":
      num1 = Math.floor(Math.random() * 50) + 1
      num2 = Math.floor(Math.random() * 50) + 1
      answer = num1 + num2
      break
    case "-":
      num1 = Math.floor(Math.random() * 50) + 25
      num2 = Math.floor(Math.random() * 25) + 1
      answer = num1 - num2
      break
    case "*":
      num1 = Math.floor(Math.random() * 12) + 1
      num2 = Math.floor(Math.random() * 12) + 1
      answer = num1 * num2
      break
    default:
      num1 = 1
      num2 = 1
      answer = 2
  }

  const question = `${num1} ${operation} ${num2}`

  // Generate wrong options
  const wrongOptions = []
  for (let i = 0; i < 3; i++) {
    let wrongAnswer
    do {
      wrongAnswer = answer + Math.floor(Math.random() * 20) - 10
    } while (wrongAnswer === answer || wrongOptions.includes(wrongAnswer) || wrongAnswer < 0)
    wrongOptions.push(wrongAnswer)
  }

  const options = [answer, ...wrongOptions].sort(() => Math.random() - 0.5)

  return { question, answer, options }
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

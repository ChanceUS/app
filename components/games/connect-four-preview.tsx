"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { createEmptyBoard, dropPiece, checkWinner, type FourInARowBoard } from "@/lib/game-logic"
import ConnectFour from "./connect-four"

export default function ConnectFourPreview() {
  const [board, setBoard] = useState<FourInARowBoard>(createEmptyBoard())
  const [currentPlayer, setCurrentPlayer] = useState<"player1" | "player2">("player1")
  const [gameWinner, setGameWinner] = useState<"player1" | "player2" | "draw" | null>(null)
  const [isComputerThinking, setIsComputerThinking] = useState(false)
  const isProcessingMove = useRef(false)

  // Check for winner when board changes
  useEffect(() => {
    const winner = checkWinner(board)
    if (winner && !gameWinner) {
      setGameWinner(winner)
    }
  }, [board, gameWinner])

  // Computer makes a random move
  const makeComputerMove = useCallback((currentBoard: FourInARowBoard) => {
    if (isProcessingMove.current || gameWinner) return

    isProcessingMove.current = true
    setIsComputerThinking(true)
    
    // Small delay to make it feel more natural
    setTimeout(() => {
      // Find all available columns (not full)
      const availableColumns: number[] = []
      for (let col = 0; col < 7; col++) {
        if (currentBoard[0][col] === "empty") {
          availableColumns.push(col)
        }
      }

      if (availableColumns.length === 0) {
        setIsComputerThinking(false)
        isProcessingMove.current = false
        return
      }

      // Pick a random available column
      const randomCol = availableColumns[Math.floor(Math.random() * availableColumns.length)]
      const newBoard = dropPiece(currentBoard, randomCol, "player2")
      
      if (newBoard) {
        setBoard(newBoard)
        
        // Check if computer won
        const winner = checkWinner(newBoard)
        if (winner) {
          setGameWinner(winner)
        } else {
          setCurrentPlayer("player1")
        }
      }
      
      setIsComputerThinking(false)
      isProcessingMove.current = false
    }, 500) // 500ms delay for computer "thinking"
  }, [gameWinner])

  // Handle player move - called when player makes a move
  const handlePlayerMove = useCallback((moveData: any) => {
    if (isProcessingMove.current || gameWinner || currentPlayer !== "player1") return
    
    const newBoard = moveData.board
    setBoard(newBoard)
    
    // Check if player won
    const winner = checkWinner(newBoard)
    if (winner) {
      setGameWinner(winner)
      return
    }
    
    // Switch to computer's turn and make computer move
    setCurrentPlayer("player2")
    makeComputerMove(newBoard)
  }, [currentPlayer, gameWinner, makeComputerMove])

  // Reset game function
  const handleGameEnd = useCallback((winner: "player1" | "player2" | "draw") => {
    // Reset after a short delay
    setTimeout(() => {
      setBoard(createEmptyBoard())
      setCurrentPlayer("player1")
      setGameWinner(null)
      isProcessingMove.current = false
    }, 2000)
  }, [])

  return (
    <ConnectFour
      onGameEnd={handleGameEnd}
      isActive={!gameWinner && !isComputerThinking}
      currentPlayer={currentPlayer}
      isMyTurn={currentPlayer === "player1" && !isComputerThinking}
      gameData={{ board }}
      onMove={handlePlayerMove}
    />
  )
}


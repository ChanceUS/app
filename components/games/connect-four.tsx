"use client"

import { useState, useEffect, useCallback, useMemo, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Grid3X3, User, Trophy } from "lucide-react"
import { createEmptyBoard, dropPiece, checkWinner, type FourInARowBoard, type FourInARowCell } from "@/lib/game-logic"

interface ConnectFourProps {
  onGameEnd: (winner: "player1" | "player2" | "draw") => void
  isActive: boolean
  currentPlayer: "player1" | "player2"
  isMyTurn: boolean
  gameData?: any
  onMove?: (moveData: any) => void
}

export default function ConnectFour({ 
  onGameEnd, 
  isActive, 
  currentPlayer, 
  isMyTurn, 
  gameData, 
  onMove 
}: ConnectFourProps) {
  const [board, setBoard] = useState<FourInARowBoard>(createEmptyBoard())
  const [gameWinner, setGameWinner] = useState<"player1" | "player2" | "draw" | null>(null)
  const [isProcessingMove, setIsProcessingMove] = useState(false)
  const isProcessingMoveRef = useRef(false)
  const boardRef = useRef<FourInARowBoard>(board)

  // Debug props (only log when props change)
  useEffect(() => {
    console.log('🎮 Four in a Row component props:', {
      isActive,
      currentPlayer,
      isMyTurn,
      gameData,
      hasOnMove: !!onMove
    })
  }, [isActive, currentPlayer, isMyTurn, gameData, onMove])

  // Initialize board from game data or create empty board
  useEffect(() => {
    if (gameData?.board) {
      setBoard(gameData.board)
      boardRef.current = gameData.board
    } else {
      const emptyBoard = createEmptyBoard()
      setBoard(emptyBoard)
      boardRef.current = emptyBoard
    }
  }, [gameData?.board])

  // Keep boardRef in sync with board state
  useEffect(() => {
    boardRef.current = board
  }, [board])

  // Check for winner when board changes
  useEffect(() => {
    const winner = checkWinner(board)
    if (winner && !gameWinner) {
      setGameWinner(winner)
      onGameEnd(winner)
    }
  }, [board, gameWinner, onGameEnd])

  // Reset processing flag when turn changes (safety measure)
  useEffect(() => {
    if (!isMyTurn) {
      setIsProcessingMove(false)
      isProcessingMoveRef.current = false
    }
  }, [isMyTurn])

  const handleColumnClick = useCallback((column: number) => {
    console.log('🎯 Four in a Row column click:', {
      column,
      isActive,
      isMyTurn,
      gameWinner,
      currentPlayer,
      isProcessingMove: isProcessingMoveRef.current
    })
    
    // Prevent multiple simultaneous moves - use ref for synchronous check
    if (isProcessingMoveRef.current) {
      console.log('❌ Move already in progress, ignoring click')
      return
    }
    
    if (!isActive || !isMyTurn || gameWinner) {
      console.log('❌ Four in a Row click blocked:', {
        isActive,
        isMyTurn,
        gameWinner
      })
      return
    }

    // Set processing flag immediately (synchronously) to prevent multiple clicks
    isProcessingMoveRef.current = true
    setIsProcessingMove(true)

    // Use ref to get the latest board state synchronously (prevents stale closure issues)
    const currentBoard = boardRef.current
    
    // Additional safety check: verify column is not already full
    if (currentBoard[0][column] !== "empty") {
      console.log('❌ Column is already full (safety check):', column)
      isProcessingMoveRef.current = false
      setIsProcessingMove(false)
      return
    }
    
    const newBoard = dropPiece(currentBoard, column, currentPlayer)
    if (!newBoard) {
      console.log('❌ Column is full:', column)
      isProcessingMoveRef.current = false
      setIsProcessingMove(false)
      return // Column is full
    }

    // Update local state immediately for responsive UI
    setBoard(newBoard)
    boardRef.current = newBoard // Update ref immediately

    // Send move to opponent through real-time system
    if (onMove) {
      onMove({
        board: newBoard,
        column,
        player: currentPlayer,
        timestamp: new Date().toISOString()
      })
    }

    // Check for winner
    const winner = checkWinner(newBoard)
    if (winner) {
      setGameWinner(winner)
      onGameEnd(winner)
    }

    // Reset processing flag after move is complete
    // Use a small timeout to ensure the board state has fully updated
    // This prevents the next click from reading stale state
    setTimeout(() => {
      isProcessingMoveRef.current = false
      setIsProcessingMove(false)
    }, 50)
  }, [isActive, isMyTurn, gameWinner, currentPlayer, onMove, onGameEnd])

  const getCellColor = (cell: FourInARowCell) => {
    switch (cell) {
      case "player1":
        return "bg-cyan-500"
      case "player2":
        return "bg-yellow-500"
      default:
        return "bg-gray-700 hover:bg-gray-600"
    }
  }

  const getPlayerName = (player: "player1" | "player2") => {
    return player === "player1" ? "You" : "Opponent"
  }

  return (
    <Card className="bg-gray-900/50 border-yellow-500/20 mx-2 sm:mx-0">
      <CardHeader className="pb-3 sm:pb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
          <CardTitle className="text-white flex items-center text-lg sm:text-xl">
            <Grid3X3 className="mr-2 h-5 w-5 text-yellow-400" />
            4 In a Row
          </CardTitle>
          <div className="flex items-center space-x-2">
            <Badge
              className={`text-xs sm:text-sm ${currentPlayer === "player1" ? "bg-cyan-500/20 text-cyan-400" : "bg-gray-500/20 text-gray-400"}`}
            >
              <User className="mr-1 h-3 w-3" />
              You
            </Badge>
            <Badge
              className={`text-xs sm:text-sm ${currentPlayer === "player2" ? "bg-yellow-500/20 text-yellow-400" : "bg-gray-500/20 text-gray-400"}`}
            >
              <User className="mr-1 h-3 w-3" />
              Opponent
            </Badge>
          </div>
        </div>

        {gameWinner ? (
          <div className="text-center mt-2">
            <Badge className="bg-green-500/20 text-green-400 text-sm sm:text-lg px-3 sm:px-4 py-1 sm:py-2">
              <Trophy className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
              {gameWinner === "draw" ? "Draw!" : `${getPlayerName(gameWinner)} Wins!`}
            </Badge>
          </div>
        ) : (
          <div className="text-center mt-2">
            <p className="text-gray-400 text-sm sm:text-base">
              {isMyTurn ? "Your turn" : "Waiting for opponent..."}
            </p>
            {!isMyTurn && (
              <div className="mt-2">
                <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse mx-auto"></div>
              </div>
            )}
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div className="space-y-3 sm:space-y-2">
          {/* Game board container with aligned arrows */}
          <div className="bg-blue-900/30 p-3 sm:p-4 rounded-lg">
            {/* Column buttons - aligned with board columns, full width clickable */}
            <div className="grid grid-cols-7 gap-1 sm:gap-1 mb-2 mx-auto max-w-fit" style={{ width: 'fit-content' }}>
              {useMemo(() => Array.from({ length: 7 }, (_, col) => {
                const isDisabled = !isActive || !isMyTurn || gameWinner !== null || isProcessingMove
                return (
                  <button
                    key={col}
                    onClick={() => handleColumnClick(col)}
                    disabled={isDisabled}
                    className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-800 hover:bg-gray-700 text-white text-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center rounded-t-md transition-colors"
                    type="button"
                  >
                    ↓
                  </button>
                )
              }), [isActive, isMyTurn, gameWinner, isProcessingMove, handleColumnClick])}
            </div>

            {/* Game board - aligned with arrows above, clickable columns */}
            <div className="grid grid-cols-7 gap-1 sm:gap-1 mx-auto max-w-fit" style={{ width: 'fit-content' }}>
              {Array.from({ length: 7 }, (_, colIndex) => {
                const isDisabled = !isActive || !isMyTurn || gameWinner !== null || isProcessingMove
                return (
                  <div
                    key={`col-${colIndex}`}
                    onClick={!isDisabled ? () => handleColumnClick(colIndex) : undefined}
                    className={`flex flex-col gap-1 sm:gap-1 ${
                      !isDisabled ? 'cursor-pointer' : ''
                    }`}
                  >
                    {board.map((row, rowIndex) => (
                      <div
                        key={`${rowIndex}-${colIndex}`}
                        className={`aspect-square rounded-full border-2 border-gray-600 transition-all duration-300 ${getCellColor(row[colIndex])} w-10 h-10 sm:w-12 sm:h-12 ${
                          !isDisabled ? 'hover:border-gray-400' : ''
                        }`}
                      />
                    ))}
                  </div>
                )
              })}
            </div>
          </div>

          <div className="text-center text-xs sm:text-sm text-gray-400 mt-4 px-2">
            Get four in a row horizontally, vertically, or diagonally to win!
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
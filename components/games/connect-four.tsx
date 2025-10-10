"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
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

  // Debug props (only log when props change)
  useEffect(() => {
    console.log('🎮 Connect 4 component props:', {
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
    } else {
      setBoard(createEmptyBoard())
    }
  }, [gameData?.board])

  // Check for winner when board changes
  useEffect(() => {
    const winner = checkWinner(board)
    if (winner && !gameWinner) {
      setGameWinner(winner)
      onGameEnd(winner)
    }
  }, [board, gameWinner, onGameEnd])

  const handleColumnClick = useCallback((column: number) => {
    console.log('🎯 Connect 4 column click:', {
      column,
      isActive,
      isMyTurn,
      gameWinner,
      currentPlayer
    })
    
    if (!isActive || !isMyTurn || gameWinner) {
      console.log('❌ Connect 4 click blocked:', {
        isActive,
        isMyTurn,
        gameWinner
      })
      return
    }

    const newBoard = dropPiece(board, column, currentPlayer)
    if (!newBoard) {
      console.log('❌ Column is full:', column)
      return // Column is full
    }

    // Update local state immediately for responsive UI
    setBoard(newBoard)

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
  }, [isActive, isMyTurn, gameWinner, currentPlayer, board, onMove, onGameEnd])

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
          {/* Column buttons */}
          <div className="grid grid-cols-7 gap-3 sm:gap-1 mb-4">
            {useMemo(() => Array.from({ length: 7 }, (_, col) => {
              const isDisabled = !isActive || !isMyTurn || gameWinner !== null
              return (
                <Button
                  key={col}
                  onClick={() => handleColumnClick(col)}
                  disabled={isDisabled}
                  className="h-8 sm:h-8 bg-gray-800 hover:bg-gray-700 text-white text-sm disabled:opacity-50 disabled:cursor-not-allowed min-w-0"
                >
                  ↓
                </Button>
              )
            }), [isActive, isMyTurn, gameWinner, handleColumnClick])}
          </div>

          {/* Game board */}
          <div className="bg-blue-900/30 p-3 sm:p-4 rounded-lg">
            <div className="flex flex-col gap-2 sm:gap-1 mx-auto max-w-fit">
              {board.map((row, rowIndex) => (
                <div key={rowIndex} className="flex gap-2 sm:gap-1">
                  {row.map((cell, colIndex) => (
                    <div
                      key={`${rowIndex}-${colIndex}`}
                      className={`aspect-square rounded-full border-2 border-gray-600 transition-all duration-300 ${getCellColor(cell)} w-8 h-8 sm:w-12 sm:h-12`}
                    />
                  ))}
                </div>
              ))}
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

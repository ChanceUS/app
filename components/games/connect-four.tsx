"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Grid3X3, User, Trophy } from "lucide-react"
import { createEmptyBoard, dropPiece, checkWinner, type Connect4Board, type Connect4Cell } from "@/lib/game-logic"

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
  const [board, setBoard] = useState<Connect4Board>(createEmptyBoard())
  const [gameWinner, setGameWinner] = useState<"player1" | "player2" | "draw" | null>(null)

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

  const handleColumnClick = (column: number) => {
    if (!isActive || !isMyTurn || gameWinner) return

    const newBoard = dropPiece(board, column, currentPlayer)
    if (!newBoard) return // Column is full

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
  }

  const getCellColor = (cell: Connect4Cell) => {
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
    <Card className="bg-gray-900/50 border-yellow-500/20">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-white flex items-center">
            <Grid3X3 className="mr-2 h-5 w-5 text-yellow-400" />
            Connect 4
          </CardTitle>
          <div className="flex items-center space-x-2">
            <Badge
              className={`${currentPlayer === "player1" ? "bg-cyan-500/20 text-cyan-400" : "bg-gray-500/20 text-gray-400"}`}
            >
              <User className="mr-1 h-3 w-3" />
              You
            </Badge>
            <Badge
              className={`${currentPlayer === "player2" ? "bg-yellow-500/20 text-yellow-400" : "bg-gray-500/20 text-gray-400"}`}
            >
              <User className="mr-1 h-3 w-3" />
              Opponent
            </Badge>
          </div>
        </div>

        {gameWinner ? (
          <div className="text-center">
            <Badge className="bg-green-500/20 text-green-400 text-lg px-4 py-2">
              <Trophy className="mr-2 h-4 w-4" />
              {gameWinner === "draw" ? "Draw!" : `${getPlayerName(gameWinner)} Wins!`}
            </Badge>
          </div>
        ) : (
          <div className="text-center">
            <p className="text-gray-400">
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
        <div className="space-y-2">
          {/* Column buttons */}
          <div className="grid grid-cols-7 gap-1 mb-4">
            {Array.from({ length: 7 }, (_, col) => (
              <Button
                key={col}
                onClick={() => handleColumnClick(col)}
                disabled={!isActive || !isMyTurn || gameWinner !== null}
                className="h-8 bg-gray-800 hover:bg-gray-700 text-white text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                ↓
              </Button>
            ))}
          </div>

          {/* Game board */}
          <div className="bg-blue-900/30 p-4 rounded-lg">
            <div className="grid grid-cols-7 gap-1">
              {board.map((row, rowIndex) =>
                row.map((cell, colIndex) => (
                  <div
                    key={`${rowIndex}-${colIndex}`}
                    className={`w-12 h-12 rounded-full border-2 border-gray-600 transition-all duration-300 ${getCellColor(cell)}`}
                  />
                )),
              )}
            </div>
          </div>

          <div className="text-center text-sm text-gray-400 mt-4">
            Get four in a row horizontally, vertically, or diagonally to win!
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

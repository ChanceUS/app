"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"

interface SimpleConnectFourProps {
  matchId: string
  betAmount: number
  status: string
  currentUserId?: string
  player1Id?: string
  player2Id?: string
}

export default function SimpleConnectFour({ matchId, betAmount, status, currentUserId, player1Id, player2Id }: SimpleConnectFourProps) {
  const [board, setBoard] = useState(Array(42).fill(null))
  const [currentStatus, setCurrentStatus] = useState(status)
  const [isLoading, setIsLoading] = useState(false)
  const [currentPlayer, setCurrentPlayer] = useState<'player1' | 'player2'>('player1')
  const [winner, setWinner] = useState<'player1' | 'player2' | 'draw' | null>(null)
  const [playerNames, setPlayerNames] = useState<{player1: string, player2: string}>({player1: 'Player 1', player2: 'Player 2'})
  
  // Determine if it's the current user's turn
  const isMyTurn = currentPlayer === 'player1' ? currentUserId === player1Id : currentUserId === player2Id
  const myPlayer = currentUserId === player1Id ? 'player1' : currentUserId === player2Id ? 'player2' : null
  

  // Load game state from database and check for updates
  useEffect(() => {
    const loadGameState = async () => {
      try {
        const supabase = createClient()
        
        // Load player names
        if (player1Id && player2Id) {
          const { data: players, error: playersError } = await supabase
            .from('users')
            .select('id, display_name, username')
            .in('id', [player1Id, player2Id])
          
          if (!playersError && players) {
            const player1Data = players.find(p => p.id === player1Id)
            const player2Data = players.find(p => p.id === player2Id)
            setPlayerNames({
              player1: player1Data?.display_name || player1Data?.username || 'Player 1',
              player2: player2Data?.display_name || player2Data?.username || 'Player 2'
            })
          }
        }
        
        const { data, error } = await supabase
          .from('matches')
          .select('status, game_data, winner_id, player1_id, player2_id')
          .eq('id', matchId)
          .single()

        if (error) {
          console.error('Error loading game state:', error)
          return
        }

        if (data) {
          // Update status if changed
          if (data.status !== currentStatus) {
            console.log('Status changed from', currentStatus, 'to', data.status)
            setCurrentStatus(data.status)
          }

          // Update game state if available
          if (data.game_data) {
            const gameData = data.game_data
            
            // Update board if different
            if (gameData.board && JSON.stringify(gameData.board) !== JSON.stringify(board)) {
              setBoard(gameData.board)
            }
            
            // Update current player if different
            if (gameData.currentPlayer !== undefined && gameData.currentPlayer !== currentPlayer) {
              setCurrentPlayer(gameData.currentPlayer)
            }
            
            // Update winner if different
            if (gameData.winner !== undefined && gameData.winner !== winner) {
              setWinner(gameData.winner)
            }
          }

          // Check winner from match winner_id if game_data doesn't have winner
          if (data.status === 'completed' && !winner) {
            console.log('🔍 Checking winner from match data:', {
              winner_id: data.winner_id,
              player1_id: data.player1_id,
              player2_id: data.player2_id,
              currentWinner: winner
            })
            
            if (data.winner_id === data.player1_id) {
              console.log('🏆 Setting winner to player1')
              setWinner('player1')
            } else if (data.winner_id === data.player2_id) {
              console.log('🏆 Setting winner to player2')
              setWinner('player2')
            } else if (!data.winner_id) {
              console.log('🤝 Setting winner to draw')
              setWinner('draw')
            }
          }
        }
      } catch (error) {
        console.error('Error loading game state:', error)
      }
    }

    // Load initial state
    loadGameState()

    // Check for updates every 2 seconds
    const interval = setInterval(loadGameState, 2000)
    return () => clearInterval(interval)
  }, [matchId, currentStatus, board, currentPlayer, winner])

  // Game logic functions
  const dropPiece = async (column: number) => {
    if (winner || currentStatus !== 'in_progress' || !isMyTurn) return
    
    // Find the lowest available row in the column
    for (let row = 5; row >= 0; row--) {
      const index = row * 7 + column
      if (board[index] === null) {
        // Place the piece locally first for immediate feedback
        const newBoard = [...board]
        newBoard[index] = currentPlayer
        setBoard(newBoard)
        
        // Save to database for opponent sync
        const nextPlayer = currentPlayer === 'player1' ? 'player2' : 'player1'
        try {
          const supabase = createClient()
          const { error } = await supabase
            .from('matches')
            .update({
              game_data: {
                board: newBoard,
                currentPlayer: nextPlayer, // Switch for next turn
                winner: null
              }
            })
            .eq('id', matchId)
          
          if (error) {
            console.error('Failed to save move to database:', error)
            // Revert local change if database save failed
            setBoard(board)
            return
          }
          
          console.log('✅ Move saved to database for opponent sync')
        } catch (error) {
          console.error('Error saving move:', error)
          // Revert local change if database save failed
          setBoard(board)
          return
        }
        
        // Check for winner
        if (checkWinner(newBoard, row, column, currentPlayer)) {
          setWinner(currentPlayer)
          setCurrentStatus('completed') // Update local status immediately
          // Save winner and mark match as completed
          try {
            const supabase = createClient()
            await supabase
              .from('matches')
              .update({
                status: 'completed',
                winner_id: currentPlayer === 'player1' ? player1Id : player2Id,
                completed_at: new Date().toISOString(),
                game_data: {
                  board: newBoard,
                  currentPlayer: currentPlayer,
                  winner: currentPlayer
                }
              })
              .eq('id', matchId)
            console.log('✅ Match completed and winner saved to database')
          } catch (error) {
            console.error('Error saving winner:', error)
          }
          return
        }
        
        // Check for draw
        if (newBoard.every(cell => cell !== null)) {
          setWinner('draw')
          setCurrentStatus('completed') // Update local status immediately
          // Save draw and mark match as completed
          try {
            const supabase = createClient()
            await supabase
              .from('matches')
              .update({
                status: 'completed',
                winner_id: null, // No winner in a draw
                completed_at: new Date().toISOString(),
                game_data: {
                  board: newBoard,
                  currentPlayer: currentPlayer,
                  winner: 'draw'
                }
              })
              .eq('id', matchId)
            console.log('✅ Match completed as draw and saved to database')
          } catch (error) {
            console.error('Error saving draw:', error)
          }
          return
        }
        
        // Switch players
        setCurrentPlayer(currentPlayer === 'player1' ? 'player2' : 'player1')
        return
      }
    }
  }

  const checkWinner = (board: (string | null)[], row: number, col: number, player: string) => {
    // Check horizontal
    let count = 1
    for (let i = col - 1; i >= 0 && board[row * 7 + i] === player; i--) count++
    for (let i = col + 1; i < 7 && board[row * 7 + i] === player; i++) count++
    if (count >= 4) return true

    // Check vertical
    count = 1
    for (let i = row - 1; i >= 0 && board[i * 7 + col] === player; i--) count++
    for (let i = row + 1; i < 6 && board[i * 7 + col] === player; i++) count++
    if (count >= 4) return true

    // Check diagonal (top-left to bottom-right)
    count = 1
    for (let i = 1; row - i >= 0 && col - i >= 0 && board[(row - i) * 7 + (col - i)] === player; i++) count++
    for (let i = 1; row + i < 6 && col + i < 7 && board[(row + i) * 7 + (col + i)] === player; i++) count++
    if (count >= 4) return true

    // Check diagonal (top-right to bottom-left)
    count = 1
    for (let i = 1; row - i >= 0 && col + i < 7 && board[(row - i) * 7 + (col + i)] === player; i++) count++
    for (let i = 1; row + i < 6 && col - i >= 0 && board[(row + i) * 7 + (col - i)] === player; i++) count++
    if (count >= 4) return true

    return false
  }

  const resetGame = () => {
    setBoard(Array(42).fill(null))
    setCurrentPlayer('player1')
    setWinner(null)
  }

  return (
    <div className="min-h-screen bg-gray-950 relative p-4">
      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-950/20 via-purple-950/10 to-transparent pointer-events-none"></div>
      
      <div className="max-w-4xl mx-auto relative z-10">
        <div className="bg-gray-900/80 rounded-lg p-6">
          <h1 className="text-2xl font-bold text-white mb-6">Connect 4 Match</h1>
          
          {/* Match Info */}
          <div className="bg-gray-800/80 rounded-lg p-4 mb-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-gray-300">Match ID: {matchId}</p>
                <p className="text-gray-300">Status: {currentStatus}</p>
                <p className="text-gray-300">Bet: {betAmount} tokens</p>
              </div>
              <div className={`px-3 py-1 rounded text-white ${
                currentStatus === 'cancelled' ? 'bg-red-500' :
                currentStatus === 'completed' ? 'bg-blue-500' :
                currentStatus === 'in_progress' ? 'bg-green-500' :
                'bg-yellow-500'
              }`}>
                {currentStatus === 'cancelled' ? 'Cancelled' :
                 currentStatus === 'completed' ? 'Completed' :
                 currentStatus === 'in_progress' ? 'In Progress' :
                 'Waiting'}
              </div>
            </div>
          </div>
          
          {/* Connect 4 Game */}
          <div className="bg-gray-800/80 rounded-lg p-6">
            <h2 className="text-xl text-white mb-4 text-center">Connect 4 Game</h2>
            <div className="text-center">
              {currentStatus === 'cancelled' ? (
                <div className="text-red-400 mb-6">
                  <p className="text-xl font-bold">Match Cancelled</p>
                  <p>This match has been cancelled and is no longer playable.</p>
                </div>
              ) : currentStatus === 'completed' ? (
                <div className="text-blue-400 mb-6">
                  {winner ? (
                    <div>
                      <p className="text-xl font-bold">
                        {winner === 'draw' ? (
                          <span className="text-gray-400">It's a Draw!</span>
                        ) : winner === 'player1' ? (
                          <span className="text-red-400">{playerNames.player1} Wins! 🎉</span>
                        ) : winner === 'player2' ? (
                          <span className="text-yellow-400">{playerNames.player2} Wins! 🎉</span>
                        ) : (
                          <span className="text-green-400">{playerNames.player1} Wins! 🎉</span>
                        )}
                      </p>
                      <p>This match has finished.</p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-xl font-bold">Match Completed</p>
                      <p>This match has finished.</p>
                    </div>
                  )}
                </div>
              ) : currentStatus === 'in_progress' ? (
                <>
                  <p className="text-gray-300 mb-6">Click on column arrows to place chips</p>
                  
                  {/* Column buttons - NOW WITH REAL MULTIPLAYER LOGIC! */}
                  <div className="grid grid-cols-7 gap-2 sm:gap-2 md:gap-1 max-w-md mx-auto mb-4">
                    {Array.from({ length: 7 }, (_, col) => {
                      // Check if column is full
                      const isColumnFull = board[col] !== null
                      const canPlay = !isColumnFull && !winner && isMyTurn && currentStatus === 'in_progress'
                      
                      return (
                        <button
                          key={col}
                          onClick={() => dropPiece(col)}
                          disabled={!canPlay}
                          className={`h-8 md:h-12 text-white text-sm md:text-xl rounded font-bold transition-colors flex items-center justify-center ${
                            canPlay
                              ? 'bg-blue-600 hover:bg-blue-500 cursor-pointer'
                              : 'bg-gray-500 cursor-not-allowed opacity-50'
                          }`}
                        >
                          ↓
                        </button>
                      )
                    })}
                  </div>
                  
                  <div className="mt-6 text-gray-300 text-center">
                    {winner ? (
                      <div className="text-2xl font-bold">
                        {winner === 'draw' ? (
                          <span className="text-gray-400">It's a Draw!</span>
                        ) : winner === 'player1' ? (
                          <span className="text-red-400">{playerNames.player1} Wins! 🎉</span>
                        ) : winner === 'player2' ? (
                          <span className="text-yellow-400">{playerNames.player2} Wins! 🎉</span>
                        ) : (
                          <span className="text-green-400">{playerNames.player1} Wins! 🎉</span>
                        )}
                      </div>
                    ) : currentStatus === 'completed' ? (
                      <div className="text-2xl font-bold">
                        {winner ? (
                          winner === 'draw' ? (
                            <span className="text-gray-400">It's a Draw!</span>
                          ) : winner === 'player1' ? (
                            <span className="text-red-400">{playerNames.player1} Wins! 🎉</span>
                          ) : winner === 'player2' ? (
                            <span className="text-yellow-400">{playerNames.player2} Wins! 🎉</span>
                          ) : (
                            <span className="text-green-400">{playerNames.player1} Wins! 🎉</span>
                          )
                        ) : (
                          <span className="text-green-400">Match Completed!</span>
                        )}
                      </div>
                    ) : (
                      <div>
                        <p>Get four in a row to win!</p>
                        <p className="text-lg font-semibold mt-2">
                          {isMyTurn ? (
                            <span className="text-green-400">Your turn! Place your piece</span>
                          ) : (
                            <span className="text-yellow-400">Waiting for opponent...</span>
                          )}
                        </p>
                        <p className="text-sm text-gray-400 mt-1">
                          Current Player: <span className={currentPlayer === 'player1' ? 'text-red-400' : 'text-yellow-400'}>
                            {currentPlayer === 'player1' ? `${playerNames.player1} (Red)` : `${playerNames.player2} (Yellow)`}
                          </span>
                        </p>
                        {myPlayer && (
                          <p className="text-sm text-blue-400 mt-1">
                            You are: <span className={myPlayer === 'player1' ? 'text-red-400' : 'text-yellow-400'}>
                              {myPlayer === 'player1' ? `${playerNames.player1} (Red)` : `${playerNames.player2} (Yellow)`}
                            </span>
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="text-yellow-400 mb-6">
                  <p className="text-xl font-bold">Waiting to Start</p>
                  <p>Game will begin when both players are ready</p>
                </div>
              )}
              
              {/* Game board */}
              <div className="grid grid-cols-7 gap-2 sm:gap-2 md:gap-1 max-w-md mx-auto">
                {Array.from({ length: 7 }, (_, col) => {
                  const canPlay = isMyTurn && !winner && currentStatus === 'in_progress'
                  
                  return (
                    <button
                      key={col}
                      onClick={() => dropPiece(col)}
                      disabled={!canPlay}
                      className={`flex flex-col gap-2 md:gap-1 p-1 rounded transition-colors ${
                        canPlay
                          ? 'hover:bg-blue-500/10 cursor-pointer'
                          : 'cursor-not-allowed'
                      }`}
                    >
                      {Array.from({ length: 6 }, (_, row) => {
                        const i = col + (row * 7)
                        const piece = board[i]
                        let pieceColor = 'bg-gray-700 border-gray-600'
                        
                        if (piece === 'player1') {
                          pieceColor = 'bg-red-500 border-red-400'
                        } else if (piece === 'player2') {
                          pieceColor = 'bg-yellow-400 border-yellow-300'
                        }
                        
                        return (
                          <div
                            key={i}
                            className={`w-9 h-9 md:w-12 md:h-12 rounded-full border-2 transition-all duration-300 ${pieceColor} ${
                              currentStatus === 'cancelled' 
                                ? 'opacity-50' 
                                : 'hover:scale-110'
                            }`}
                          />
                        )
                      })}
                    </button>
                  )
                })}
              </div>
              
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

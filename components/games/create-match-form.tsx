"use client"

import { useActionState } from "react"
import { useFormStatus } from "react-dom"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"
import { Loader2, Trophy } from "lucide-react"
import { createMatch } from "@/lib/game-actions"
import { useState } from "react"
import type { Game } from "@/lib/supabase/client"

function SubmitButton() {
  const { pending } = useFormStatus()

  return (
    <Button
      type="submit"
      disabled={pending}
      className="w-full bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 text-black font-semibold py-6 text-lg rounded-xl glow-cyan"
    >
      {pending ? (
        <>
          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          Creating Match...
        </>
      ) : (
        <>
          <Trophy className="mr-2 h-5 w-5" />
          Create Match
        </>
      )}
    </Button>
  )
}

interface CreateMatchFormProps {
  game: Game
  userBalance: number
}

export default function CreateMatchForm({ game, userBalance }: CreateMatchFormProps) {
  const [state, formAction] = useActionState(createMatch, null)
  const [betAmount, setBetAmount] = useState([Math.min(game.min_bet * 2, userBalance)])

  const maxBet = Math.min(game.max_bet, userBalance)

  return (
    <Card className="bg-gray-900/50 border-gray-800">
      <CardHeader className="text-center">
        <div className="flex justify-center mb-4">
          <div className="p-4 bg-gradient-to-br from-cyan-500 to-yellow-500 rounded-full">
            <Trophy className="h-8 w-8 text-black" />
          </div>
        </div>
        <CardTitle className="text-white text-2xl">Create {game.name} Match</CardTitle>
        <CardDescription className="text-gray-400 text-lg">{game.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-6">
          <input type="hidden" name="gameId" value={game.id} />

          {state?.error && (
            <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg text-center">
              {state.error}
            </div>
          )}

          {/* Bet Amount Slider */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-300">Bet Amount</label>
              <div className="text-right">
                <div className="text-2xl font-bold text-yellow-400">{betAmount[0].toLocaleString()}</div>
                <div className="text-sm text-gray-400">tokens</div>
              </div>
            </div>

            <Slider
              value={betAmount}
              onValueChange={setBetAmount}
              max={maxBet}
              min={game.min_bet}
              step={game.min_bet}
              className="w-full"
            />

            <div className="flex justify-between text-sm text-gray-400">
              <span>Min: {game.min_bet}</span>
              <span>Max: {maxBet.toLocaleString()}</span>
            </div>
          </div>

          {/* Hidden input for form submission */}
          <input type="hidden" name="betAmount" value={betAmount[0]} />

          {/* Balance Check */}
          <div className="bg-gray-800/30 p-4 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Your Balance:</span>
              <span className="text-white font-semibold">{userBalance.toLocaleString()} tokens</span>
            </div>
            <div className="flex justify-between items-center mt-2">
              <span className="text-gray-400">After Bet:</span>
              <span className={`font-semibold ${userBalance - betAmount[0] >= 0 ? "text-green-400" : "text-red-400"}`}>
                {(userBalance - betAmount[0]).toLocaleString()} tokens
              </span>
            </div>
          </div>

          {/* Quick Bet Buttons */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">Quick Select</label>
            <div className="grid grid-cols-4 gap-2">
              {[game.min_bet, game.min_bet * 2, game.min_bet * 5, game.min_bet * 10]
                .filter((amount) => amount <= maxBet)
                .map((amount) => (
                  <Button
                    key={amount}
                    type="button"
                    variant="outline"
                    size="sm"
                    className="border-gray-700 text-gray-300 hover:text-white hover:bg-gray-800 bg-transparent"
                    onClick={() => setBetAmount([amount])}
                  >
                    {amount}
                  </Button>
                ))}
            </div>
          </div>

          <SubmitButton />

          <div className="text-xs text-gray-500 text-center">
            Your bet will be held until the match is completed. Winner takes all tokens.
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

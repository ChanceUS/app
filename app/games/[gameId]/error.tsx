"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertTriangle, RefreshCw, ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function GameError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("Game error:", error)
  }, [error])

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-gray-900/50 border-gray-800">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <AlertTriangle className="h-12 w-12 text-red-400" />
          </div>
          <CardTitle className="text-white text-xl">Game Error</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-gray-300 text-center">
            There was an error loading the game. Please try again or return to the games list.
          </p>
          <div className="flex flex-col gap-2">
            <Button
              onClick={reset}
              className="w-full bg-orange-500 hover:bg-orange-600 text-black font-semibold"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Try Again
            </Button>
            <Button asChild variant="outline" className="w-full border-gray-600 text-gray-300 hover:bg-gray-800">
              <Link href="/games">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Games
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

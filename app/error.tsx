"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertTriangle, RefreshCw } from "lucide-react"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error("Application error:", error)
  }, [error])

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-gray-900/50 border-gray-800">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <AlertTriangle className="h-12 w-12 text-red-400" />
          </div>
          <CardTitle className="text-white text-xl">Something went wrong!</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-gray-300 text-center">
            We encountered an unexpected error. Please try refreshing the page.
          </p>
          <div className="flex flex-col gap-2">
            <Button
              onClick={reset}
              className="w-full bg-orange-500 hover:bg-orange-600 text-black font-semibold"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Try again
            </Button>
            <Button
              variant="outline"
              onClick={() => window.location.href = "/"}
              className="w-full border-gray-600 text-gray-300 hover:bg-gray-800"
            >
              Go to Home
            </Button>
          </div>
          {process.env.NODE_ENV === "development" && (
            <details className="mt-4">
              <summary className="text-gray-400 cursor-pointer text-sm">
                Error Details (Development)
              </summary>
              <pre className="mt-2 text-xs text-gray-500 bg-gray-800 p-2 rounded overflow-auto">
                {error.message}
                {error.stack && `\n\n${error.stack}`}
              </pre>
            </details>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

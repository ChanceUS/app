"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Play, Pause, SkipBack, SkipForward, Share2, Copy } from "lucide-react"
import { getReplayByMatchId, getReplayByShareToken } from "@/lib/replay-actions"
import { formatDistanceToNow } from "date-fns"
import { toast } from "sonner"
import SimpleConnectFour from "./simple-connect-four"
import MathBlitz from "./math-blitz"
import MultiplayerMathBlitz from "./multiplayer-math-blitz"
import TriviaChallenge from "./trivia-challenge"
import MultiplayerTriviaChallenge from "./multiplayer-trivia-challenge"

interface ReplayPlayerProps {
  matchId?: string
  shareToken?: string
  gameType: string
  player1Id: string
  player2Id?: string
}

export default function ReplayPlayer({
  matchId,
  shareToken,
  gameType,
  player1Id,
  player2Id,
}: ReplayPlayerProps) {
  const [replayData, setReplayData] = useState<any>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [replaySteps, setReplaySteps] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [playbackSpeed, setPlaybackSpeed] = useState(1)
  const playbackIntervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    const loadReplay = async () => {
      setLoading(true)
      try {
        let result
        if (shareToken) {
          result = await getReplayByShareToken(shareToken)
        } else if (matchId) {
          result = await getReplayByMatchId(matchId)
        } else {
          toast.error("No match ID or share token provided")
          return
        }

        if (result.error || !result.data) {
          toast.error(result.error || "Replay not found")
          return
        }

        setReplayData(result.data)
        // Parse replay data into steps
        if (result.data.replay_data?.steps) {
          setReplaySteps(result.data.replay_data.steps)
        } else if (result.data.replay_data?.history) {
          setReplaySteps(result.data.replay_data.history)
        }
      } catch (error) {
        console.error("Error loading replay:", error)
        toast.error("Failed to load replay")
      } finally {
        setLoading(false)
      }
    }

    loadReplay()
  }, [matchId, shareToken])

  useEffect(() => {
    if (isPlaying && replaySteps.length > 0) {
      playbackIntervalRef.current = setInterval(() => {
        setCurrentStep((prev) => {
          if (prev >= replaySteps.length - 1) {
            setIsPlaying(false)
            return prev
          }
          return prev + 1
        })
      }, 1000 / playbackSpeed) // Adjust interval based on speed
    } else {
      if (playbackIntervalRef.current) {
        clearInterval(playbackIntervalRef.current)
        playbackIntervalRef.current = null
      }
    }

    return () => {
      if (playbackIntervalRef.current) {
        clearInterval(playbackIntervalRef.current)
      }
    }
  }, [isPlaying, replaySteps.length, playbackSpeed])

  const handlePlayPause = () => {
    if (currentStep >= replaySteps.length - 1) {
      setCurrentStep(0) // Reset to beginning
    }
    setIsPlaying(!isPlaying)
  }

  const handleStepBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
      setIsPlaying(false)
    }
  }

  const handleStepForward = () => {
    if (currentStep < replaySteps.length - 1) {
      setCurrentStep(currentStep + 1)
      setIsPlaying(false)
    }
  }

  const handleSeek = (value: number[]) => {
    const step = Math.floor((value[0] / 100) * replaySteps.length)
    setCurrentStep(step)
    setIsPlaying(false)
  }

  const handleShare = async () => {
    const shareUrl = shareToken
      ? `${window.location.origin}/replays/${shareToken}`
      : matchId
        ? `${window.location.origin}/replays/${matchId}`
        : ""

    if (shareUrl) {
      await navigator.clipboard.writeText(shareUrl)
      toast.success("Replay link copied to clipboard!")
    }
  }

  if (loading) {
    return (
      <Card className="bg-gray-900/80 border-gray-800">
        <CardContent className="p-6">
          <p className="text-center text-gray-400">Loading replay...</p>
        </CardContent>
      </Card>
    )
  }

  if (!replayData || replaySteps.length === 0) {
    return (
      <Card className="bg-gray-900/80 border-gray-800">
        <CardContent className="p-6">
          <p className="text-center text-gray-400">No replay data available</p>
        </CardContent>
      </Card>
    )
  }

  const currentState = replaySteps[currentStep] || replaySteps[0]
  const progress = replaySteps.length > 0 ? (currentStep / (replaySteps.length - 1)) * 100 : 0

  return (
    <div className="space-y-4">
      <Card className="bg-gray-900/80 border-gray-800">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Match Replay</CardTitle>
            <Button
              onClick={handleShare}
              variant="outline"
              size="sm"
              className="gap-2"
            >
              <Share2 className="h-4 w-4" />
              Share
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Playback Controls */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Button
                onClick={handleStepBack}
                variant="outline"
                size="sm"
                disabled={currentStep === 0}
              >
                <SkipBack className="h-4 w-4" />
              </Button>
              <Button
                onClick={handlePlayPause}
                variant="default"
                size="sm"
                className="flex-1"
              >
                {isPlaying ? (
                  <Pause className="h-4 w-4" />
                ) : (
                  <Play className="h-4 w-4" />
                )}
              </Button>
              <Button
                onClick={handleStepForward}
                variant="outline"
                size="sm"
                disabled={currentStep >= replaySteps.length - 1}
              >
                <SkipForward className="h-4 w-4" />
              </Button>
            </div>

            {/* Progress Slider */}
            <div className="space-y-1">
              <Slider
                value={[progress]}
                onValueChange={handleSeek}
                max={100}
                step={0.1}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500">
                <span>Step {currentStep + 1} of {replaySteps.length}</span>
                <span>{Math.round(progress)}%</span>
              </div>
            </div>

            {/* Speed Control */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-400">Speed:</span>
              <div className="flex gap-1">
                {[0.5, 1, 1.5, 2].map((speed) => (
                  <Button
                    key={speed}
                    onClick={() => {
                      setPlaybackSpeed(speed)
                      setIsPlaying(false)
                    }}
                    variant={playbackSpeed === speed ? "default" : "outline"}
                    size="sm"
                    className="h-7"
                  >
                    {speed}x
                  </Button>
                ))}
              </div>
            </div>
          </div>

          {/* Replay Info */}
          <div className="text-sm text-gray-400 space-y-1">
            <p>
              Views: {replayData.view_count || 0}
            </p>
            {replayData.created_at && (
              <p>
                Created: {formatDistanceToNow(new Date(replayData.created_at), { addSuffix: true })}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Game Display */}
      <Card className="bg-gray-900/80 border-gray-800">
        <CardContent className="p-6">
          {gameType === "connect-four" && (
            <SimpleConnectFour
              matchId={matchId || ""}
              betAmount={0}
              status="completed"
              currentUserId={player1Id}
              player1Id={player1Id}
              player2Id={player2Id}
              replayState={currentState}
            />
          )}
          {gameType === "math-blitz" && (
            <MultiplayerMathBlitz
              matchId={matchId || ""}
              betAmount={0}
              status="completed"
              currentUserId={player1Id}
              player1Id={player1Id}
              player2Id={player2Id}
              replayState={currentState}
            />
          )}
          {gameType === "trivia-challenge" && (
            <MultiplayerTriviaChallenge
              matchId={matchId || ""}
              betAmount={0}
              status="completed"
              currentUserId={player1Id}
              player1Id={player1Id}
              player2Id={player2Id}
              replayState={currentState}
            />
          )}
        </CardContent>
      </Card>
    </div>
  )
}


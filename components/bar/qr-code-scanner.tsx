"use client"

import { useState, useRef, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { QrCode, Camera, CameraOff, Search } from "lucide-react"
import { toast } from "sonner"

interface QRCodeScannerProps {
  onCodeScanned: (code: string) => void
  onManualCode: (code: string) => void
  onSessionCode?: (code: string) => void
}

export default function QRCodeScanner({ onCodeScanned, onManualCode, onSessionCode }: QRCodeScannerProps) {
  const [isScanning, setIsScanning] = useState(false)
  const [manualCode, setManualCode] = useState("")
  const [sessionCode, setSessionCode] = useState("")
  const [hasCamera, setHasCamera] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  useEffect(() => {
    // Check if camera is available
    navigator.mediaDevices.getUserMedia({ video: true })
      .then(() => setHasCamera(true))
      .catch(() => setHasCamera(false))
  }, [])

  const startScanning = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: "environment" // Use back camera on mobile
        } 
      })
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        streamRef.current = stream
        setIsScanning(true)
        
        // Start scanning for QR codes
        scanForQRCode()
      }
    } catch (error) {
      console.error("Error accessing camera:", error)
      toast.error("Camera access denied or not available")
    }
  }

  const stopScanning = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    setIsScanning(false)
  }

  const scanForQRCode = () => {
    if (!isScanning || !videoRef.current || !canvasRef.current) return

    const video = videoRef.current
    const canvas = canvasRef.current
    const context = canvas.getContext("2d")

    if (!context) return

    // Set canvas size to match video
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight

    // Draw video frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height)

    // Get image data
    const imageData = context.getImageData(0, 0, canvas.width, canvas.height)
    
    // Simple QR code detection (in a real app, you'd use a proper QR library)
    // For now, we'll just continue scanning
    requestAnimationFrame(scanForQRCode)
  }

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (manualCode.trim()) {
      onManualCode(manualCode.trim().toUpperCase())
    }
  }

  const handleSessionCodeSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (sessionCode.trim() && onSessionCode) {
      onSessionCode(sessionCode.trim().toUpperCase())
    }
  }


  return (
    <Card className="w-full max-w-md bg-gray-900/50 border-gray-800">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          <QrCode className="h-5 w-5" />
          Join Bar Trivia
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Camera Scanner */}
        {hasCamera && (
          <div className="space-y-4">
            <div className="relative">
              <video
                ref={videoRef}
                className="w-full h-48 bg-black/30 rounded-lg object-cover border border-purple-500/20"
                autoPlay
                playsInline
                muted
                style={{ display: isScanning ? "block" : "none" }}
              />
              {!isScanning && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-lg border border-purple-500/20">
                  <div className="text-center">
                    <Camera className="h-12 w-12 text-purple-400 mx-auto mb-2" />
                    <p className="text-sm text-white">Camera ready</p>
                  </div>
                </div>
              )}
              <canvas
                ref={canvasRef}
                className="hidden"
              />
            </div>

            <div className="flex gap-2">
              {!isScanning ? (
                <Button onClick={startScanning} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white">
                  <Camera className="h-4 w-4 mr-2" />
                  Start Scanning
                </Button>
              ) : (
                <Button onClick={stopScanning} variant="outline" className="flex-1 border-orange-500/40 text-white hover:bg-orange-500/20">
                  <CameraOff className="h-4 w-4 mr-2" />
                  Stop Scanning
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Divider */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-purple-500/20" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-black px-2 text-white/60">Or</span>
          </div>
        </div>

        {/* Manual Code Entry */}
        <div className="space-y-4">
          <form onSubmit={handleManualSubmit} className="space-y-2">
            <Label htmlFor="venue-code" className="text-white">Enter Venue Code</Label>
            <div className="flex gap-2">
              <Input
                id="venue-code"
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value.toUpperCase())}
                placeholder="Enter venue code (e.g. 0K945T)"
                maxLength={20}
                className="font-mono text-center text-lg bg-gray-800 border-gray-600 text-white placeholder:text-white/60"
              />
              <Button type="submit" disabled={!manualCode.trim()} className="bg-blue-600 hover:bg-blue-700 text-white">
                <Search className="h-4 w-4" />
              </Button>
            </div>
          </form>

          {/* Session Code Entry */}
          {onSessionCode && (
            <>
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-gray-600" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-gray-900 px-2 text-white/60">Or</span>
                </div>
              </div>

              <form onSubmit={handleSessionCodeSubmit} className="space-y-2">
                <Label htmlFor="session-code" className="text-white">Enter Session Code</Label>
                <div className="flex gap-2">
                  <Input
                    id="session-code"
                    value={sessionCode}
                    onChange={(e) => setSessionCode(e.target.value.toUpperCase())}
                    placeholder="Enter session code (e.g. SES1234567890ABC)"
                    maxLength={30}
                    className="font-mono text-center text-sm bg-gray-800 border-gray-600 text-white placeholder:text-white/60"
                  />
                  <Button type="submit" disabled={!sessionCode.trim()} className="bg-green-600 hover:bg-green-700 text-white">
                    <Search className="h-4 w-4" />
                  </Button>
                </div>
              </form>
            </>
          )}
        </div>


        {/* Instructions */}
        <div className="text-xs text-white/60 space-y-1">
          <p><strong className="text-white">How to join:</strong></p>
          <p>• Scan the QR code at the bar with your camera</p>
          <p>• Enter the venue code manually (to find the bar)</p>
          {onSessionCode && <p>• Or enter the session code directly (if you have it)</p>}
          <p>• Start playing trivia and win drinks!</p>
        </div>
      </CardContent>
    </Card>
  )
}

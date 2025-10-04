"use client"

import { useState, useEffect } from "react"
import QRCode from "qrcode"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Download, Copy, QrCode } from "lucide-react"
import { toast } from "sonner"

interface QRCodeGeneratorProps {
  barCode: string
  barName: string
  type: "qr" | "venue"
}

export default function QRCodeGenerator({ barCode, barName, type }: QRCodeGeneratorProps) {
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>("")
  const [isGenerating, setIsGenerating] = useState(false)

  const generateQRCode = async () => {
    setIsGenerating(true)
    try {
      const url = `${window.location.origin}/bar/join?code=${barCode}`
      console.log("Generating QR code for URL:", url)
      
      const dataUrl = await QRCode.toDataURL(url, {
        width: 300,
        margin: 2,
        color: {
          dark: "#000000",
          light: "#FFFFFF"
        },
        errorCorrectionLevel: 'M'
      })
      
      console.log("QR code generated successfully")
      setQrCodeDataUrl(dataUrl)
    } catch (error) {
      console.error("Error generating QR code:", error)
      toast.error(`Failed to generate QR code: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsGenerating(false)
    }
  }

  const downloadQRCode = () => {
    if (!qrCodeDataUrl) return
    
    const link = document.createElement("a")
    link.download = `${barName}-${type === "qr" ? "qr-code" : "venue-code"}.png`
    link.href = qrCodeDataUrl
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.success("QR code downloaded")
  }

  const copyCode = () => {
    navigator.clipboard.writeText(barCode)
    toast.success(`${type === "qr" ? "QR" : "Venue"} code copied to clipboard`)
  }

  const copyJoinUrl = () => {
    const url = `${window.location.origin}/bar/join?code=${barCode}`
    navigator.clipboard.writeText(url)
    toast.success("Join URL copied to clipboard")
  }

  useEffect(() => {
    if (barCode) {
      generateQRCode()
    }
  }, [barCode])

  return (
    <Card className="w-full max-w-md bg-gray-900/50 border-gray-800">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          <QrCode className="h-5 w-5" />
          {type === "qr" ? "QR Code" : "Venue Code"}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Code Display */}
        <div className="space-y-2">
          <Label htmlFor="code" className="text-white">Code</Label>
          <div className="flex gap-2">
            <Input
              id="code"
              value={barCode}
              readOnly
              className="font-mono text-lg text-center bg-gray-800 border-gray-600 text-white"
            />
            <Button
              variant="outline"
              size="icon"
              onClick={copyCode}
              className="bg-gray-800 border-gray-600 text-white hover:bg-gray-700"
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* QR Code Display */}
        {isGenerating ? (
          <div className="flex items-center justify-center h-[300px] bg-gray-800 rounded-lg">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
              <p className="text-sm text-white">Generating QR code...</p>
            </div>
          </div>
        ) : qrCodeDataUrl ? (
          <div className="text-center">
            <img
              src={qrCodeDataUrl}
              alt={`QR Code for ${barName}`}
              className="mx-auto border-2 border-gray-600 rounded-lg bg-white p-2"
            />
            <p className="text-xs text-gray-300 mt-2">
              Scan to join trivia at {barName}
            </p>
          </div>
        ) : (
          <div className="flex items-center justify-center h-[300px] bg-gray-800 rounded-lg">
            <Button 
              onClick={generateQRCode} 
              variant="outline"
              className="bg-gray-700 border-gray-600 text-white hover:bg-gray-600"
            >
              Generate QR Code
            </Button>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button
            onClick={downloadQRCode}
            disabled={!qrCodeDataUrl}
            className="flex-1 bg-blue-600 hover:bg-blue-700"
          >
            <Download className="h-4 w-4 mr-2" />
            Download
          </Button>
          <Button
            onClick={copyJoinUrl}
            variant="outline"
            className="flex-1 bg-gray-800 border-gray-600 text-white hover:bg-gray-700"
          >
            <Copy className="h-4 w-4 mr-2" />
            Copy URL
          </Button>
        </div>

        {/* Instructions */}
        <div className="text-xs text-gray-300 space-y-1">
          <p><strong>For customers:</strong></p>
          <p>• Scan QR code or visit the URL</p>
          <p>• Enter the venue code: <code className="bg-gray-700 px-1 rounded text-white">{barCode}</code></p>
          <p>• Join trivia games and compete for drinks!</p>
        </div>
      </CardContent>
    </Card>
  )
}

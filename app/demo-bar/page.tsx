"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { 
  Building, 
  MapPin, 
  Phone, 
  Globe, 
  QrCode, 
  Play,
  Trophy,
  Users,
  Zap
} from "lucide-react"
import { toast } from "sonner"
import { createBar } from "@/lib/bar-actions"

export default function DemoBarPage() {
  const router = useRouter()
  const [isCreating, setIsCreating] = useState(false)
  const [barData, setBarData] = useState({
    name: "Demo Bar & Grill",
    description: "A great place for trivia and drinks!",
    address: "123 Main Street",
    city: "Demo City",
    state: "DC",
    zip_code: "12345",
    phone: "(555) 123-4567",
    email: "demo@bargrill.com",
    website: "https://demo-bargrill.com"
  })

  const handleCreateDemoBar = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsCreating(true)

    try {
      // Create in database with user association
      const formData = new FormData()
      Object.entries(barData).forEach(([key, value]) => {
        formData.append(key, value)
      })
      // Mark as demo bar
      formData.append('is_demo', 'true')

      const bar = await createBar(formData)
      toast.success("Demo bar created successfully!")
      router.push(`/bars/${bar.id}/dashboard`)
    } catch (error: any) {
      console.error("Failed to create demo bar:", error)
      toast.error("Failed to create demo bar. Please try again.")
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white mb-2">Demo Bar Setup</h1>
          <p className="text-white/80 text-lg">
            Create a demo bar to test the trivia system
          </p>
        </div>

        {/* Demo Bar Preview */}
        <Card className="bg-white/10 backdrop-blur-sm border-white/20">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Building className="h-5 w-5" />
              Demo Bar Preview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-center">
                <h3 className="text-2xl font-bold text-white">{barData.name}</h3>
                <p className="text-white/80 mt-1">{barData.description}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-white/80">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  <span>{barData.address}, {barData.city}, {barData.state} {barData.zip_code}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  <span>{barData.phone}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  <a href={barData.website} target="_blank" rel="noopener noreferrer" className="hover:text-white underline">
                    {barData.website}
                  </a>
                </div>
              </div>

              <div className="bg-white/5 rounded-lg p-4">
                <h4 className="text-white font-medium mb-2">What you'll get:</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <QrCode className="h-4 w-4 text-purple-400" />
                    <span>QR Code & Venue Code</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Trophy className="h-4 w-4 text-yellow-400" />
                    <span>Trivia Game Management</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-blue-400" />
                    <span>Live Session Control</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Form */}
        <Card className="bg-white/10 backdrop-blur-sm border-white/20">
          <CardHeader>
            <CardTitle className="text-white">Customize Demo Bar</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateDemoBar} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-white">Bar Name</Label>
                  <Input
                    id="name"
                    value={barData.name}
                    onChange={(e) => setBarData(prev => ({ ...prev, name: e.target.value }))}
                    className="bg-white/20 border-white/30 text-white placeholder:text-white/60"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-white">Phone</Label>
                  <Input
                    id="phone"
                    value={barData.phone}
                    onChange={(e) => setBarData(prev => ({ ...prev, phone: e.target.value }))}
                    className="bg-white/20 border-white/30 text-white placeholder:text-white/60"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="text-white">Description</Label>
                <Textarea
                  id="description"
                  value={barData.description}
                  onChange={(e) => setBarData(prev => ({ ...prev, description: e.target.value }))}
                  className="bg-white/20 border-white/30 text-white placeholder:text-white/60"
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="address" className="text-white">Address</Label>
                  <Input
                    id="address"
                    value={barData.address}
                    onChange={(e) => setBarData(prev => ({ ...prev, address: e.target.value }))}
                    className="bg-white/20 border-white/30 text-white placeholder:text-white/60"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="city" className="text-white">City</Label>
                  <Input
                    id="city"
                    value={barData.city}
                    onChange={(e) => setBarData(prev => ({ ...prev, city: e.target.value }))}
                    className="bg-white/20 border-white/30 text-white placeholder:text-white/60"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state" className="text-white">State</Label>
                  <Input
                    id="state"
                    value={barData.state}
                    onChange={(e) => setBarData(prev => ({ ...prev, state: e.target.value }))}
                    className="bg-white/20 border-white/30 text-white placeholder:text-white/60"
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={isCreating}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white text-lg py-6"
              >
                {isCreating ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Creating Demo Bar...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Zap className="h-5 w-5" />
                    Create Demo Bar & Start Testing
                    <Play className="h-4 w-4" />
                  </div>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Instructions */}
        <Card className="bg-white/10 backdrop-blur-sm border-white/20">
          <CardContent className="p-6">
            <h3 className="text-white font-medium mb-3">What happens next?</h3>
            <div className="space-y-2 text-white/80 text-sm">
              <p>1. <strong>Bar Creation:</strong> Your demo bar will be created with unique QR and venue codes</p>
              <p>2. <strong>Quick Setup:</strong> You'll be taken to a setup wizard to create your first trivia game</p>
              <p>3. <strong>Live Session:</strong> Start a trivia session and get a join code for customers</p>
              <p>4. <strong>Test Flow:</strong> Open another browser tab to test the customer experience</p>
              <p>5. <strong>Management:</strong> Use the dashboard to monitor players and manage rewards</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
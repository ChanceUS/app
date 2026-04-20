"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft, MapPin, Phone, Mail, Globe, Building } from "lucide-react"
import { toast } from "sonner"
import { createBar } from "@/lib/bar-actions"

export default function CreateBarPage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const formData = new FormData(e.currentTarget)
      const bar = await createBar(formData)
      
      toast.success("Bar created successfully!")
      router.push(`/bars/${bar.id}`)
    } catch (error: any) {
      toast.error(error.message || "Failed to create bar")
      console.error("Error creating bar:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => router.back()}
            className="bg-white/10 border-white/30 text-white hover:bg-white/20"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-white">Create New Bar</h1>
            <p className="text-white/80 mt-1">Add a new venue for trivia games</p>
          </div>
        </div>

        {/* Form */}
        <Card className="bg-white/10 backdrop-blur-sm border-white/20">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Building className="h-5 w-5" />
              Bar Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-white">
                    Bar Name *
                  </Label>
                  <Input
                    id="name"
                    name="name"
                    required
                    placeholder="Enter bar name"
                    className="bg-white/20 border-white/30 text-white placeholder:text-white/60"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description" className="text-white">
                    Description
                  </Label>
                  <Textarea
                    id="description"
                    name="description"
                    placeholder="Brief description of your bar"
                    className="bg-white/20 border-white/30 text-white placeholder:text-white/60"
                    rows={3}
                  />
                </div>
              </div>

              {/* Location Information */}
              <div className="space-y-4">
                <h3 className="text-white font-medium flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Location
                </h3>
                
                <div className="space-y-2">
                  <Label htmlFor="address" className="text-white">
                    Address
                  </Label>
                  <Input
                    id="address"
                    name="address"
                    placeholder="Street address"
                    className="bg-white/20 border-white/30 text-white placeholder:text-white/60"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city" className="text-white">
                      City
                    </Label>
                    <Input
                      id="city"
                      name="city"
                      placeholder="City"
                      className="bg-white/20 border-white/30 text-white placeholder:text-white/60"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="state" className="text-white">
                      State
                    </Label>
                    <Input
                      id="state"
                      name="state"
                      placeholder="State"
                      className="bg-white/20 border-white/30 text-white placeholder:text-white/60"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="zip_code" className="text-white">
                      ZIP Code
                    </Label>
                    <Input
                      id="zip_code"
                      name="zip_code"
                      placeholder="ZIP"
                      className="bg-white/20 border-white/30 text-white placeholder:text-white/60"
                    />
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div className="space-y-4">
                <h3 className="text-white font-medium flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  Contact Information
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-white">
                      Phone Number
                    </Label>
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      placeholder="(555) 123-4567"
                      className="bg-white/20 border-white/30 text-white placeholder:text-white/60"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-white">
                      Email
                    </Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="contact@bar.com"
                      className="bg-white/20 border-white/30 text-white placeholder:text-white/60"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="website" className="text-white">
                    Website
                  </Label>
                  <Input
                    id="website"
                    name="website"
                    type="url"
                    placeholder="https://www.bar.com"
                    className="bg-white/20 border-white/30 text-white placeholder:text-white/60"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex gap-4 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                  className="flex-1 bg-white/10 border-white/30 text-white hover:bg-white/20"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 bg-purple-600 hover:bg-purple-700 text-white"
                >
                  {isSubmitting ? "Creating..." : "Create Bar"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Information Card */}
        <Card className="bg-white/10 backdrop-blur-sm border-white/20">
          <CardContent className="p-6">
            <h3 className="text-white font-medium mb-3">What happens next?</h3>
            <div className="space-y-2 text-white/80 text-sm">
              <p>• Your bar will be assigned unique QR and venue codes</p>
              <p>• You can create trivia games for your venue</p>
              <p>• Customers can scan QR codes to join games</p>
              <p>• High scorers automatically earn drink rewards</p>
              <p>• You'll get a management dashboard to track everything</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

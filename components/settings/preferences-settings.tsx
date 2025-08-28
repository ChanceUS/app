"use client"

import { useActionState } from "react"
import { useFormStatus } from "react-dom"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, Settings, Save } from "lucide-react"
import { updatePreferences } from "@/lib/settings-actions"

function SubmitButton() {
  const { pending } = useFormStatus()

  return (
    <Button
      type="submit"
      disabled={pending}
      className="bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-black font-semibold"
    >
      {pending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Saving...
        </>
      ) : (
        <>
          <Save className="mr-2 h-4 w-4" />
          Save Preferences
        </>
      )}
    </Button>
  )
}

export default function PreferencesSettings() {
  const [state, formAction] = useActionState(updatePreferences, null)

  return (
    <Card className="bg-gray-900/50 border-gray-800">
      <CardHeader>
        <CardTitle className="text-white flex items-center">
          <Settings className="mr-2 h-5 w-5 text-yellow-400" />
          Preferences
        </CardTitle>
        <CardDescription className="text-gray-400">Customize your gaming experience</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-6">
          {state?.error && (
            <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg text-center">
              {state.error}
            </div>
          )}

          {state?.success && (
            <div className="bg-green-500/10 border border-green-500/50 text-green-400 px-4 py-3 rounded-lg text-center">
              {state.success}
            </div>
          )}

          {/* Notifications */}
          <div className="space-y-4">
            <h3 className="text-white font-semibold">Notifications</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-gray-300 font-medium">Email Notifications</label>
                  <p className="text-gray-400 text-sm">Receive match updates and promotions via email</p>
                </div>
                <Switch name="emailNotifications" defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-gray-300 font-medium">Push Notifications</label>
                  <p className="text-gray-400 text-sm">Get notified when opponents make moves</p>
                </div>
                <Switch name="pushNotifications" defaultChecked />
              </div>
            </div>
          </div>

          {/* Game Settings */}
          <div className="space-y-4">
            <h3 className="text-white font-semibold">Game Settings</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-gray-300 font-medium">Sound Effects</label>
                  <p className="text-gray-400 text-sm">Play sounds during gameplay</p>
                </div>
                <Switch name="soundEffects" defaultChecked />
              </div>
              <div className="space-y-2">
                <label className="text-gray-300 font-medium">Theme</label>
                <Select name="theme" defaultValue="dark">
                  <SelectTrigger className="bg-gray-800/50 border-gray-700 text-white focus:border-yellow-500">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-900 border-gray-800">
                    <SelectItem value="dark" className="text-white hover:bg-gray-800">
                      Dark Theme
                    </SelectItem>
                    <SelectItem value="light" className="text-white hover:bg-gray-800">
                      Light Theme
                    </SelectItem>
                    <SelectItem value="auto" className="text-white hover:bg-gray-800">
                      Auto (System)
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Privacy */}
          <div className="space-y-4">
            <h3 className="text-white font-semibold">Privacy</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-gray-300 font-medium">Show Online Status</label>
                  <p className="text-gray-400 text-sm">Let other players see when you're online</p>
                </div>
                <Switch name="showOnlineStatus" defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-gray-300 font-medium">Public Match History</label>
                  <p className="text-gray-400 text-sm">Allow others to view your match statistics</p>
                </div>
                <Switch name="publicMatchHistory" defaultChecked />
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <SubmitButton />
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

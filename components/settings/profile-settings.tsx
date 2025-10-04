"use client"

import { useActionState } from "react"
import { useFormStatus } from "react-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Loader2, User, Save } from "lucide-react"
import { updateProfile } from "@/lib/settings-actions"
import type { User as UserType } from "@/lib/supabase/client"

function SubmitButton() {
  const { pending } = useFormStatus()

  return (
    <Button
      type="submit"
      disabled={pending}
      className="bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 text-black font-semibold"
    >
      {pending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Saving...
        </>
      ) : (
        <>
          <Save className="mr-2 h-4 w-4" />
          Save Changes
        </>
      )}
    </Button>
  )
}

interface ProfileSettingsProps {
  user: UserType
}

export default function ProfileSettings({ user }: ProfileSettingsProps) {
  const [state, formAction] = useActionState(updateProfile, null)

  return (
    <Card className="bg-gray-900/80 border-gray-800">
      <CardHeader>
        <CardTitle className="text-white flex items-center">
          <User className="mr-2 h-5 w-5 text-cyan-400" />
          Profile Settings
        </CardTitle>
        <CardDescription className="text-gray-400">Update your profile information and preferences</CardDescription>
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

          {/* Avatar Section */}
          <div className="flex items-center space-x-6">
            <Avatar className="h-20 w-20">
              <AvatarImage src={user.avatar_url || ""} alt={user.display_name || user.username} />
              <AvatarFallback className="bg-gradient-to-br from-cyan-500 to-yellow-500 text-black font-semibold text-2xl">
                {(user.display_name || user.username).charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="text-white font-semibold">Profile Picture</h3>
              <p className="text-gray-400 text-sm">Upload a new avatar to personalize your profile</p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-2 border-gray-700 text-gray-300 hover:text-white bg-transparent"
              >
                Change Avatar
              </Button>
            </div>
          </div>

          {/* Profile Form */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label htmlFor="displayName" className="block text-sm font-medium text-gray-300">
                Display Name
              </label>
              <Input
                id="displayName"
                name="displayName"
                type="text"
                defaultValue={user.display_name || ""}
                required
                className="bg-gray-800/50 border-gray-700 text-white placeholder:text-gray-500 focus:border-cyan-500 focus:ring-cyan-500/20 rounded-lg h-12"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="username" className="block text-sm font-medium text-gray-300">
                Username
              </label>
              <Input
                id="username"
                name="username"
                type="text"
                defaultValue={user.username}
                required
                className="bg-gray-800/50 border-gray-700 text-white placeholder:text-gray-500 focus:border-cyan-500 focus:ring-cyan-500/20 rounded-lg h-12"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="email" className="block text-sm font-medium text-gray-300">
                Email Address
              </label>
              <Input
                id="email"
                name="email"
                type="email"
                defaultValue={user.email}
                disabled
                className="bg-gray-800/30 border-gray-700 text-gray-400 rounded-lg h-12"
              />
              <p className="text-xs text-gray-500">Email cannot be changed from this page</p>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-300">Member Since</label>
              <div className="bg-gray-800/30 border border-gray-700 rounded-lg h-12 flex items-center px-3 text-gray-400">
                {new Date(user.created_at).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
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

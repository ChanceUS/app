"use server"

import { createServerActionClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { revalidatePath } from "next/cache"

// Update user profile
export async function updateProfile(prevState: any, formData: FormData) {
  if (!formData) {
    return { error: "Form data is missing" }
  }

  const displayName = formData.get("displayName")
  const username = formData.get("username")

  if (!displayName || !username) {
    return { error: "Display name and username are required" }
  }

  const cookieStore = cookies()
  const supabase = createServerActionClient({ cookies: () => cookieStore })

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { error: "User not authenticated" }
    }

    // Check if username is already taken (excluding current user)
    const { data: existingUser } = await supabase
      .from("users")
      .select("id")
      .eq("username", username.toString())
      .neq("id", user.id)
      .single()

    if (existingUser) {
      return { error: "Username is already taken" }
    }

    // Update user profile
    const { error: updateError } = await supabase
      .from("users")
      .update({
        display_name: displayName.toString(),
        username: username.toString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id)

    if (updateError) {
      console.error("Profile update error:", updateError)
      return { error: "Failed to update profile" }
    }

    revalidatePath("/profile")
    revalidatePath("/settings")
    return { success: "Profile updated successfully!" }
  } catch (error) {
    console.error("Update profile error:", error)
    return { error: "An unexpected error occurred. Please try again." }
  }
}

// Update user preferences (mock implementation)
export async function updatePreferences(prevState: any, formData: FormData) {
  if (!formData) {
    return { error: "Form data is missing" }
  }

  // In a real app, you'd save these to a user_preferences table
  const emailNotifications = formData.get("emailNotifications") === "on"
  const pushNotifications = formData.get("pushNotifications") === "on"
  const soundEffects = formData.get("soundEffects") === "on"
  const theme = formData.get("theme")

  try {
    // Mock success - in real app, save to database
    revalidatePath("/settings")
    return { success: "Preferences updated successfully!" }
  } catch (error) {
    console.error("Update preferences error:", error)
    return { error: "An unexpected error occurred. Please try again." }
  }
}

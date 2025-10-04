"use server"

import { createServerActionClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { getCallbackUrl, getDashboardUrl } from "./config"

// Sign in action
export async function signIn(prevState: any, formData: FormData) {
  // Check if formData is valid
  if (!formData) {
    return { error: "Form data is missing" }
  }

  const email = formData.get("email")
  const password = formData.get("password")
  const redirectUrl = formData.get("redirect")

  // Validate required fields
  if (!email || !password) {
    return { error: "Email and password are required" }
  }

  const cookieStore = await cookies()
  const supabase = createServerActionClient({ cookies: () => cookieStore })

  try {
    const { error } = await supabase.auth.signInWithPassword({
      email: email.toString(),
      password: password.toString(),
    })

    if (error) {
      return { error: error.message }
    }

    // Redirect to the specified URL or dashboard
    const finalRedirectUrl = redirectUrl ? redirectUrl.toString() : "/dashboard"
    console.log("🔍 DEBUG: Sign in successful, redirecting to:", finalRedirectUrl)
    redirect(finalRedirectUrl)
  } catch (error) {
    console.error("Login error:", error)
    return { error: "An unexpected error occurred. Please try again." }
  }
}

export async function signInWithGoogle() {
  try {
    const cookieStore = await cookies()
  const supabase = createServerActionClient({ cookies: () => cookieStore })

    const redirectUrl = getCallbackUrl()
    console.log("Google OAuth redirect URL:", redirectUrl)

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: redirectUrl,
      },
    })

    if (error) {
      console.error("Google sign-in error:", error)
      redirect("/auth/login?error=" + encodeURIComponent(error.message))
    }

    if (data?.url) {
      console.log("Redirecting to Google OAuth:", data.url)
      redirect(data.url)
    } else {
      console.error("No OAuth URL returned from Supabase")
      redirect("/auth/login?error=no_oauth_url")
    }
  } catch (error: any) {
    // Check if this is a redirect error (which is expected)
    if (error.message === "NEXT_REDIRECT") {
      // This is actually a successful redirect, not an error
      throw error
    }
    console.error("Google sign-in exception:", error)
    redirect("/auth/login?error=" + encodeURIComponent("OAuth configuration error"))
  }
}

// Sign up action
export async function signUp(prevState: any, formData: FormData) {
  // Check if formData is valid
  if (!formData) {
    return { error: "Form data is missing" }
  }

  const email = formData.get("email")
  const password = formData.get("password")
  const username = formData.get("username")
  const displayName = formData.get("displayName")

  // Validate required fields
  if (!email || !password || !username) {
    return { error: "Email, password, and username are required" }
  }

  const cookieStore = await cookies()
  const supabase = createServerActionClient({ cookies: () => cookieStore })

  try {
    const { error } = await supabase.auth.signUp({
      email: email.toString(),
      password: password.toString(),
      options: {
        emailRedirectTo: getDashboardUrl(),
        data: {
          username: username.toString(),
          display_name: displayName?.toString() || username.toString(),
        },
      },
    })

    if (error) {
      return { error: error.message }
    }

    return { success: "Check your email to confirm your account and start gaming!" }
  } catch (error) {
    console.error("Sign up error:", error)
    return { error: "An unexpected error occurred. Please try again." }
  }
}

// Sign out action
export async function signOut() {
  const cookieStore = await cookies()
  const supabase = createServerActionClient({ cookies: () => cookieStore })

  await supabase.auth.signOut()
  redirect(`${getCallbackUrl("/auth/login")}`)
}

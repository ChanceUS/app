import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get("code")
  const next = requestUrl.searchParams.get("next")
  const redirect = requestUrl.searchParams.get("redirect")
  
  // Use redirect parameter if available, otherwise next, otherwise dashboard
  const redirectUrl = redirect || next || "/dashboard"

  if (code) {
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

    try {
      await supabase.auth.exchangeCodeForSession(code)
    } catch (error) {
      console.error("Error exchanging code for session:", error)
      return NextResponse.redirect(new URL("/auth/login?error=auth_error", request.url))
    }
  }

  // Redirect to the specified URL
  return NextResponse.redirect(new URL(redirectUrl, request.url))
}

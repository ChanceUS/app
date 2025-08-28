import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs"
import { NextResponse, type NextRequest } from "next/server"

// Specify Edge Runtime
export const runtime = 'edge'

export async function updateSession(request: NextRequest) {
  const res = NextResponse.next()

  try {
    // Create a Supabase client configured to use cookies
    const supabase = createMiddlewareClient({ req: request, res })

    // Refresh session if expired - required for Server Components
    const {
      data: { session },
    } = await supabase.auth.getSession()

    const isAuthRoute = request.nextUrl.pathname.startsWith("/auth/")
    const isProtectedRoute =
      request.nextUrl.pathname.startsWith("/dashboard") ||
      request.nextUrl.pathname.startsWith("/games") ||
      request.nextUrl.pathname.startsWith("/wallet") ||
      request.nextUrl.pathname.startsWith("/matches") ||
      request.nextUrl.pathname.startsWith("/profile") ||
      request.nextUrl.pathname.startsWith("/settings")

    // Redirect authenticated users away from auth pages
    if (session && isAuthRoute && !request.nextUrl.pathname.startsWith("/auth/callback")) {
      return NextResponse.redirect(new URL("/dashboard", request.url))
    }

    // Redirect unauthenticated users from protected routes
    if (!session && isProtectedRoute) {
      return NextResponse.redirect(new URL("/auth/login", request.url))
    }

    return res
  } catch (error) {
    // If there's an error (e.g., Supabase not configured), just continue
    console.warn("Middleware error:", error)
    return res
  }
}

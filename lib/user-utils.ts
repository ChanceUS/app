import { createClient } from "@/lib/supabase/client"
import type { User } from "@/lib/supabase/client"

/**
 * Fetches complete user data from the users table, with fallback to auth user data
 * This ensures consistent user data across all components
 */
export async function getCompleteUserData(): Promise<User | null> {
  const supabase = createClient()
  
  // Get auth user first
  const { data: { user: authUser }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !authUser) {
    console.log("🔍 DEBUG: No authenticated user found")
    return null
  }
  
  console.log("🔍 DEBUG: Auth user found:", authUser.id)
  
  // Try to fetch complete user data from users table
  const { data: userProfile, error: profileError } = await supabase
    .from("users")
    .select("*")
    .eq("id", authUser.id)
    .single()
  
  if (userProfile && !profileError) {
    console.log("🔍 DEBUG: User profile found in database:", userProfile)
    return userProfile
  }
  
  // User doesn't exist in users table, create fallback user object
  console.log("🔍 DEBUG: User not found in database, creating fallback user")
  console.log("🔍 DEBUG: Profile error:", profileError)
  
  const fallbackUser: User = {
    id: authUser.id,
    username: authUser.user_metadata?.username || authUser.email?.split('@')[0] || 'user',
    email: authUser.email || '',
    display_name: authUser.user_metadata?.display_name || authUser.user_metadata?.full_name || authUser.email?.split('@')[0] || 'User',
    avatar_url: authUser.user_metadata?.avatar_url || null,
    tokens: 1000, // Default starting tokens
    total_games_played: 0,
    total_games_won: 0,
    win_rate: 0,
    created_at: authUser.created_at,
    updated_at: authUser.updated_at || authUser.created_at
  }
  
  console.log("🔍 DEBUG: Fallback user created:", fallbackUser)
  return fallbackUser
}


// Auth fix utility for handling token issues
import { supabase } from './supabase/client'

export async function clearAuthAndRedirect() {
  try {
    // Sign out completely
    await supabase.auth.signOut()
    
    // Clear any cached data
    localStorage.clear()
    sessionStorage.clear()
    
    // Redirect to login
    window.location.href = '/auth/login'
  } catch (error) {
    console.error('Error clearing auth:', error)
    // Force redirect anyway
    window.location.href = '/auth/login'
  }
}

// Call this if you get refresh token errors
export function handleAuthError() {
  console.log('Auth error detected, clearing session...')
  clearAuthAndRedirect()
}

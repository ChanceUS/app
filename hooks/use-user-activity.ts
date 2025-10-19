"use client"

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'

export function useUserActivity() {
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    // Get the current user
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
    }

    getUser()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (!user) return

    const updateUserActivity = async () => {
      try {
        // Update user's last_seen timestamp and online status
        await supabase
          .from('users')
          .update({ 
            last_seen: new Date().toISOString(),
            is_online: true 
          })
          .eq('id', user.id)
      } catch (error) {
        console.error('Error updating user activity:', error)
      }
    }

    // Update immediately
    updateUserActivity()

    // Update every 30 seconds while user is active
    const interval = setInterval(updateUserActivity, 30000)

    // Update on page visibility change (when user comes back to tab)
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        updateUserActivity()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    // Cleanup on unmount
    return () => {
      clearInterval(interval)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      
      // Mark user as offline when they leave
      supabase
        .from('users')
        .update({ is_online: false })
        .eq('id', user.id)
        .then(() => {
          console.log('User marked as offline')
        })
        .catch(console.error)
    }
  }, [user])
}

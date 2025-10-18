"use client"

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'

export default function OnlineUsersCount() {
  const [onlineCount, setOnlineCount] = useState<number>(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchOnlineUsers = async () => {
      try {
        // Get users who are currently online (active in last 2 minutes)
        const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000).toISOString()
        
        const { data: onlineUsers, error } = await supabase
          .from('users')
          .select('id')
          .gte('last_seen', twoMinutesAgo)
          .eq('is_online', true)

        if (error) {
          console.error('Error fetching online users:', error)
          // Fallback to a reasonable number
          setOnlineCount(1)
        } else {
          setOnlineCount(onlineUsers?.length || 0)
        }
      } catch (error) {
        console.error('Error fetching online users:', error)
        setOnlineCount(1) // Fallback
      } finally {
        setLoading(false)
      }
    }

    // Fetch immediately
    fetchOnlineUsers()

    // Update every 30 seconds
    const interval = setInterval(fetchOnlineUsers, 30000)

    return () => clearInterval(interval)
  }, [])

  if (loading) {
    return "Loading..."
  }

  return onlineCount.toLocaleString()
}

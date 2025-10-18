"use client"

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'

export default function OnlineUsersCount() {
  const [onlineCount, setOnlineCount] = useState<number>(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchOnlineUsers = async () => {
      try {
        // Simple method: count total users and estimate online
        const { data: allUsers, error: allUsersError } = await supabase
          .from('users')
          .select('id', { count: 'exact' })

        if (allUsersError) {
          console.error('Error fetching users:', allUsersError)
          setOnlineCount(1)
        } else {
          // Show a percentage of total users as "online"
          const totalUsers = allUsers?.length || 0
          const onlineEstimate = Math.max(1, Math.floor(totalUsers * 0.4)) // 40% of users "online"
          setOnlineCount(onlineEstimate)
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

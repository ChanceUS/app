"use client"

import { useEffect } from 'react'
import { cleanupExpiredMatches } from '@/lib/cleanup-actions'

export default function CleanupHandler() {
  useEffect(() => {
    // Run cleanup when component mounts (client-side)
    const runCleanup = async () => {
      try {
        await cleanupExpiredMatches()
      } catch (error) {
        console.error("Cleanup failed:", error)
      }
    }

    // Run cleanup immediately and then every 10 seconds
    runCleanup() // Run immediately
    const interval = setInterval(runCleanup, 10000) // Every 10 seconds
    
    return () => clearInterval(interval)
  }, [])

  return null // This component doesn't render anything
}

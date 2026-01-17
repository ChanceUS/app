"use client"

import { useUserActivity } from "@/hooks/use-user-activity"

export default function DashboardClient() {
  // Track user activity when this component mounts
  useUserActivity()
  
  // This component doesn't render anything, just tracks activity
  return null
}

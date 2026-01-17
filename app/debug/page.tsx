"use client"

import { createClient } from "@supabase/supabase-js"
import { useEffect, useState } from "react"

export default function DebugPage() {
  const [envVars, setEnvVars] = useState<any>({})
  const [supabaseStatus, setSupabaseStatus] = useState<string>("Testing...")
  const [error, setError] = useState<string>("")

  useEffect(() => {
    // Check environment variables
    setEnvVars({
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
      siteUrl: process.env.NEXT_PUBLIC_SITE_URL,
      hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    })

    // Test Supabase connection
    const testSupabase = async () => {
      try {
        const supabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        )
        
        const { data, error } = await supabase.from('games').select('count').limit(1)
        
        if (error) {
          setSupabaseStatus(`Error: ${error.message}`)
          setError(error.message)
        } else {
          setSupabaseStatus("✅ Connected to Supabase successfully!")
        }
      } catch (err: any) {
        setSupabaseStatus(`❌ Connection failed: ${err.message}`)
        setError(err.message)
      }
    }

    testSupabase()
  }, [])

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <h1 className="text-3xl font-bold mb-8">Supabase Debug Page</h1>
      
      <div className="space-y-6">
        <div className="bg-gray-900 p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Environment Variables</h2>
          <div className="space-y-2">
            <div><strong>Supabase URL:</strong> {envVars.supabaseUrl || "Not set"}</div>
            <div><strong>Site URL:</strong> {envVars.siteUrl || "Not set"}</div>
            <div><strong>Has Anon Key:</strong> {envVars.hasAnonKey ? "Yes" : "No"}</div>
          </div>
        </div>

        <div className="bg-gray-900 p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Supabase Connection</h2>
          <div className="text-lg">{supabaseStatus}</div>
          {error && <div className="text-red-400 mt-2">Error: {error}</div>}
        </div>

        <div className="bg-gray-900 p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Current URL</h2>
          <div className="break-all">{typeof window !== 'undefined' ? window.location.href : 'Server side'}</div>
        </div>
      </div>
    </div>
  )
}
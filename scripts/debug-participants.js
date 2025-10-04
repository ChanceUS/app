const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://qhggmqttxbmuehugwbzi.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFoZ2dtcXR0eGJtdWVodWd3YnppIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUyODMzODYsImV4cCI6MjA3MDg1OTM4Nn0.JRDx-BTayKoB7-_EdtcmKtgMWqAPs7wc0avQ0g0cGd0'

const supabase = createClient(supabaseUrl, supabaseKey)

async function debugParticipants() {
  console.log('🔍 Debugging participants...')
  
  // Get all participants
  const { data: allParticipants, error: allError } = await supabase
    .from('bar_trivia_participants')
    .select('*')
    .order('joined_at', { ascending: false })
    .limit(10)
  
  console.log('📊 All participants (last 10):', { allParticipants, allError })
  
  // Get participants for the specific session
  const sessionId = 'ba5fd4df-c2fd-4300-a036-07098f4e3b15'
  const { data: sessionParticipants, error: sessionError } = await supabase
    .from('bar_trivia_participants')
    .select('*')
    .eq('session_id', sessionId)
  
  console.log(`📊 Participants for session ${sessionId}:`, { sessionParticipants, sessionError })
  
  // Get all sessions
  const { data: allSessions, error: sessionsError } = await supabase
    .from('bar_trivia_sessions')
    .select('*')
    .order('joined_at', { ascending: false })
    .limit(5)
  
  console.log('📊 All sessions (last 5):', { allSessions, sessionsError })
}

debugParticipants()

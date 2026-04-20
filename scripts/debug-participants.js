const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing required environment variables:')
  console.error('   - NEXT_PUBLIC_SUPABASE_URL')
  console.error('   - NEXT_PUBLIC_SUPABASE_ANON_KEY')
  process.exit(1)
}

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

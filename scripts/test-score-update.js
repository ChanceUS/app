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

async function testScoreUpdate() {
  console.log('🧪 Testing score update...')
  
  const participantId = 'c44f711e-08aa-4664-b4fd-a657e3417671'
  const sessionId = 'ba5fd4df-c2fd-4300-a036-07098f4e3b15'
  
  // First, check current participant data
  const { data: beforeUpdate, error: fetchError } = await supabase
    .from('bar_trivia_participants')
    .select('*')
    .eq('id', participantId)
    .single()
  
  console.log('📊 Before update:', { beforeUpdate, fetchError })
  
  // Update the score
  const { data: updateData, error: updateError } = await supabase
    .from('bar_trivia_participants')
    .update({
      score: 58,
      questions_answered: 10,
      correct_answers: 2,
      finished_at: new Date().toISOString()
    })
    .eq('id', participantId)
    .select()
  
  console.log('🔄 Update result:', { updateData, updateError })
  
  // Check after update
  const { data: afterUpdate, error: afterError } = await supabase
    .from('bar_trivia_participants')
    .select('*')
    .eq('id', participantId)
    .single()
  
  console.log('📊 After update:', { afterUpdate, afterError })
  
  // Check all participants for this session
  const { data: sessionParticipants, error: sessionError } = await supabase
    .from('bar_trivia_participants')
    .select('*')
    .eq('session_id', sessionId)
  
  console.log('📊 Session participants after update:', { sessionParticipants, sessionError })
}

testScoreUpdate()

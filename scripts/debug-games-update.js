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

async function debugGamesUpdate() {
  console.log('🔍 Debugging games update...')
  
  // First, let's try to update with more verbose logging
  const connect4Id = '69bf26d2-110b-40d9-b20a-d5cfab14d133'
  
  console.log('🔍 Attempting to update game with ID:', connect4Id)
  
  const { data, error } = await supabase
    .from('games')
    .update({ name: '4 In a Row' })
    .eq('id', connect4Id)
    .select()
  
  console.log('🔍 Update result:', { data, error })
  
  if (error) {
    console.error('❌ Error details:', {
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint
    })
  }
  
  // Let's also try to check if we can read the game
  const { data: gameData, error: gameError } = await supabase
    .from('games')
    .select('*')
    .eq('id', connect4Id)
    .single()
  
  console.log('🔍 Game read result:', { gameData, gameError })
  
  // Check all games
  const { data: allGames, error: allGamesError } = await supabase
    .from('games')
    .select('*')
  
  console.log('📊 All games:', { allGames, allGamesError })
}

debugGamesUpdate()

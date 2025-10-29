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

async function fixGameNames() {
  console.log('🔧 Fixing game names by ID...')
  
  // Update the Connect 4 game by its ID
  const connect4Id = '69bf26d2-110b-40d9-b20a-d5cfab14d133'
  
  const { data, error } = await supabase
    .from('games')
    .update({ name: 'Four in a Row' })
    .eq('id', connect4Id)
    .select()
  
  if (error) {
    console.error('❌ Error updating game name:', error)
  } else {
    console.log('✅ Updated game name:', data)
  }
  
  // Check all games
  const { data: allGames } = await supabase
    .from('games')
    .select('*')
  
  console.log('📊 All games after update:', allGames)
}

fixGameNames()

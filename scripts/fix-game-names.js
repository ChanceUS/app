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
  console.log('🔧 Fixing game names...')
  
  // Update "Connect 4" to "4 In a Row"
  const { data, error } = await supabase
    .from('games')
    .update({ name: '4 In a Row' })
    .eq('name', 'Connect 4')
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

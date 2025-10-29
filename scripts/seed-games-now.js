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

async function seedGames() {
  console.log('🌱 Seeding games...')
  
  // First, check if games already exist
  const { data: existingGames, error: fetchError } = await supabase
    .from('games')
    .select('*')
  
  if (fetchError) {
    console.error('❌ Error fetching existing games:', fetchError)
    return
  }
  
  console.log('📊 Existing games:', existingGames)
  
  if (existingGames && existingGames.length > 0) {
    console.log('✅ Games already exist in database')
    return
  }
  
  // Insert games
  const games = [
    {
      name: 'Math Blitz',
      description: 'Fast-paced arithmetic challenges. Solve math problems quickly to win!',
      min_bet: 10,
      max_bet: 500,
      is_active: true
    },
    {
      name: '4 In a Row',
      description: 'Classic strategy game. Get four in a row to win!',
      min_bet: 25,
      max_bet: 1000,
      is_active: true
    },
    {
      name: 'Trivia Challenge',
      description: 'Test your knowledge across various categories!',
      min_bet: 15,
      max_bet: 750,
      is_active: true
    }
  ]
  
  const { data, error } = await supabase
    .from('games')
    .insert(games)
    .select()
  
  if (error) {
    console.error('❌ Error inserting games:', error)
  } else {
    console.log('✅ Games seeded successfully:', data)
  }
}

seedGames()

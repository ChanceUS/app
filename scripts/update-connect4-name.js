const { createClient } = require('@supabase/supabase-js')

// Using service role key for admin operations
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:')
  console.error('   - NEXT_PUBLIC_SUPABASE_URL')
  console.error('   - SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function updateGameName() {
  console.log('🔧 Updating Connect 4 to Four in a Row...')
  
  try {
    // First, let's check the current state
    const { data: currentGames, error: fetchError } = await supabase
      .from('games')
      .select('*')
      .eq('id', '69bf26d2-110b-40d9-b20a-d5cfab14d133')
    
    if (fetchError) {
      console.error('❌ Error fetching games:', fetchError)
      return
    }
    
    console.log('📊 Current game:', currentGames)
    
    // Update the game name
    const { data, error } = await supabase
      .from('games')
      .update({ name: 'Four in a Row' })
      .eq('id', '69bf26d2-110b-40d9-b20a-d5cfab14d133')
      .select()
    
    if (error) {
      console.error('❌ Error updating game name:', error)
    } else {
      console.log('✅ Successfully updated game name:', data)
    }
    
    // Verify the update
    const { data: updatedGames } = await supabase
      .from('games')
      .select('*')
      .eq('id', '69bf26d2-110b-40d9-b20a-d5cfab14d133')
    
    console.log('📊 Updated game:', updatedGames)
    
  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

updateGameName()

const { createClient } = require('@supabase/supabase-js')

// Using service role key for admin operations
const supabaseUrl = 'https://qhggmqttxbmuehugwbzi.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFoZ2dtcXR0eGJtdWVodWd3YnppIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTI4MzM4NiwiZXhwIjoyMDcwODU5Mzg2fQ.YourServiceRoleKeyHere'

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

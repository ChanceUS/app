const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://qhggmqttxbmuehugwbzi.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFoZ2dtcXR0eGJtdWVodWd3YnppIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUyODMzODYsImV4cCI6MjA3MDg1OTM4Nn0.JRDx-BTayKoB7-_EdtcmKtgMWqAPs7wc0avQ0g0cGd0'

const supabase = createClient(supabaseUrl, supabaseKey)

async function fixGameNames() {
  console.log('🔧 Fixing game names by ID...')
  
  // Update the Connect 4 game by its ID
  const connect4Id = '69bf26d2-110b-40d9-b20a-d5cfab14d133'
  
  const { data, error } = await supabase
    .from('games')
    .update({ name: '4 In a Row' })
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

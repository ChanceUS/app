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

async function testMatchCreation() {
  console.log('🧪 Testing match creation...')
  
  try {
    // Test creating a match with the same structure as the rematch
    const testMatchData = {
      game_id: '69bf26d2-110b-40d9-b20a-d5cfab14d133', // Four in a Row game ID
      player1_id: 'test-player-1',
      player2_id: 'test-player-2', 
      bet_amount: 100,
      status: 'waiting',
      game_data: {
        board: Array(42).fill(null),
        currentPlayer: 'player1',
        winner: null
      }
    }
    
    console.log('🔄 Attempting to create test match with data:', testMatchData)
    
    const { data: newMatch, error: matchError } = await supabase
      .from('matches')
      .insert(testMatchData)
      .select()
      .single()
    
    if (matchError) {
      console.error('❌ Match creation failed:', matchError)
      console.error('❌ Error details:', {
        code: matchError.code,
        message: matchError.message,
        details: matchError.details,
        hint: matchError.hint
      })
    } else {
      console.log('✅ Test match created successfully:', newMatch)
      
      // Clean up the test match
      await supabase
        .from('matches')
        .delete()
        .eq('id', newMatch.id)
      
      console.log('🧹 Test match cleaned up')
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

testMatchCreation()

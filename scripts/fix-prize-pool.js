// Script to fix prize pool for a tournament
// Usage: node scripts/fix-prize-pool.js <tournament-id>

const { createClient } = require('@supabase/supabase-js')

const tournamentId = process.argv[2]

if (!tournamentId) {
  console.error('Usage: node scripts/fix-prize-pool.js <tournament-id>')
  process.exit(1)
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing required environment variables:')
  console.error('   - NEXT_PUBLIC_SUPABASE_URL')
  console.error('   - NEXT_PUBLIC_SUPABASE_ANON_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function fixPrizePool() {
  console.log(`🔍 Fixing prize pool for tournament: ${tournamentId}`)

  // Get participant count
  const { count: participantCount, error: countError } = await supabase
    .from('tournament_participants')
    .select('*', { count: 'exact', head: true })
    .eq('tournament_id', tournamentId)

  if (countError) {
    console.error('Error counting participants:', countError)
    process.exit(1)
  }

  console.log(`📊 Found ${participantCount} participants`)

  // Get tournament entry fee
  const { data: tournament, error: tournamentError } = await supabase
    .from('tournaments')
    .select('entry_fee, prize_pool, name')
    .eq('id', tournamentId)
    .single()

  if (tournamentError || !tournament) {
    console.error('Error fetching tournament:', tournamentError)
    process.exit(1)
  }

  console.log(`💰 Entry fee: ${tournament.entry_fee} tokens`)
  console.log(`💵 Current prize pool: ${tournament.prize_pool} tokens`)

  // Calculate correct prize pool
  const correctPrizePool = (participantCount || 0) * tournament.entry_fee

  console.log(`✅ Correct prize pool: ${correctPrizePool} tokens (${participantCount} × ${tournament.entry_fee})`)

  if (tournament.prize_pool === correctPrizePool) {
    console.log('✨ Prize pool is already correct!')
    return
  }

  // Update prize pool
  const { error: updateError } = await supabase
    .from('tournaments')
    .update({ prize_pool: correctPrizePool })
    .eq('id', tournamentId)

  if (updateError) {
    console.error('❌ Error updating prize pool:', updateError)
    process.exit(1)
  }

  console.log(`🎉 Successfully updated prize pool to ${correctPrizePool} tokens!`)
}

fixPrizePool().catch(console.error)


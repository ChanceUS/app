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

async function cleanupDuplicateMatches() {
  console.log('🧹 Starting cleanup of duplicate tournament matches...')
  
  // Get the tournament ID from command line or use a specific one
  const tournamentId = process.argv[2]
  
  if (!tournamentId) {
    console.error('❌ Please provide a tournament ID as an argument')
    console.error('   Usage: node cleanup-duplicate-tournament-matches.js <tournament-id>')
    process.exit(1)
  }

  console.log(`🔍 Checking tournament: ${tournamentId}`)

  // Get all tournament matches for this tournament
  const { data: tournamentMatches, error: fetchError } = await supabase
    .from('tournament_matches')
    .select('*, matches(*)')
    .eq('tournament_id', tournamentId)
    .order('created_at', { ascending: true })

  if (fetchError) {
    console.error('❌ Error fetching tournament matches:', fetchError)
    return
  }

  if (!tournamentMatches || tournamentMatches.length === 0) {
    console.log('✅ No tournament matches found')
    return
  }

  console.log(`📊 Found ${tournamentMatches.length} tournament matches`)

  // Group by round_number and bracket_position to find duplicates
  const matchGroups = {}
  const duplicates = []

  tournamentMatches.forEach((tm) => {
    const key = `${tm.round_number}-${tm.bracket_position}`
    if (!matchGroups[key]) {
      matchGroups[key] = []
    }
    matchGroups[key].push(tm)
  })

  // Find duplicates (more than one match with same round and bracket position)
  Object.keys(matchGroups).forEach((key) => {
    if (matchGroups[key].length > 1) {
      console.log(`⚠️ Found ${matchGroups[key].length} matches for Round ${matchGroups[key][0].round_number}, Position ${matchGroups[key][0].bracket_position}`)
      // Keep the first one (oldest), mark others as duplicates
      const sorted = matchGroups[key].sort((a, b) => 
        new Date(a.created_at) - new Date(b.created_at)
      )
      duplicates.push(...sorted.slice(1)) // All except the first
    }
  })

  if (duplicates.length === 0) {
    console.log('✅ No duplicate matches found')
    return
  }

  console.log(`🗑️ Found ${duplicates.length} duplicate matches to delete:`)
  duplicates.forEach((dup) => {
    console.log(`   - Tournament Match ID: ${dup.id}, Match ID: ${dup.match_id}, Created: ${dup.created_at}`)
  })

  // Delete duplicate tournament_matches
  const duplicateIds = duplicates.map(d => d.id)
  const { error: deleteError } = await supabase
    .from('tournament_matches')
    .delete()
    .in('id', duplicateIds)

  if (deleteError) {
    console.error('❌ Error deleting duplicate tournament matches:', deleteError)
    return
  }

  console.log(`✅ Deleted ${duplicates.length} duplicate tournament match records`)

  // Optionally delete the associated match records if they're not used elsewhere
  const matchIds = duplicates.map(d => d.match_id).filter(Boolean)
  if (matchIds.length > 0) {
    console.log(`🗑️ Checking if associated matches can be deleted...`)
    
    for (const matchId of matchIds) {
      // Check if this match is used in any other tournament_match
      const { data: otherTournamentMatches } = await supabase
        .from('tournament_matches')
        .select('id')
        .eq('match_id', matchId)
        .limit(1)

      if (!otherTournamentMatches || otherTournamentMatches.length === 0) {
        // Not used elsewhere, safe to delete
        const { error: matchDeleteError } = await supabase
          .from('matches')
          .delete()
          .eq('id', matchId)

        if (matchDeleteError) {
          console.error(`⚠️ Error deleting match ${matchId}:`, matchDeleteError)
        } else {
          console.log(`✅ Deleted orphaned match: ${matchId}`)
        }
      } else {
        console.log(`ℹ️ Match ${matchId} is still referenced, keeping it`)
      }
    }
  }

  console.log('✅ Cleanup complete!')
}

cleanupDuplicateMatches()
  .then(() => {
    console.log('🎉 Done!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Error:', error)
    process.exit(1)
  })


#!/usr/bin/env node

/**
 * Simple script to execute the trivia questions SQL
 */

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables')
  console.error('   NEXT_PUBLIC_SUPABASE_URL:', !!supabaseUrl)
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', !!supabaseServiceKey)
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function executeTriviaSQL() {
  try {
    console.log('🚀 Executing trivia questions SQL...')
    
    // Read the SQL file
    const sqlPath = path.join(__dirname, '07-add-trivia-questions.sql')
    const sqlContent = fs.readFileSync(sqlPath, 'utf8')
    
    console.log('📄 SQL file loaded, executing...')
    
    // Split the SQL into individual statements
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'))
    
    console.log(`📝 Found ${statements.length} SQL statements`)
    
    let successCount = 0
    let errorCount = 0
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i]
      if (statement.trim()) {
        try {
          const { error } = await supabase.rpc('exec_sql', { sql: statement + ';' })
          if (error) {
            console.error(`❌ Error in statement ${i + 1}:`, error.message)
            errorCount++
          } else {
            successCount++
          }
        } catch (err) {
          console.error(`❌ Exception in statement ${i + 1}:`, err.message)
          errorCount++
        }
      }
    }
    
    console.log(`✅ Completed: ${successCount} successful, ${errorCount} errors`)
    
    // Check if tables exist and have data
    const { data: triviaCount } = await supabase
      .from('trivia_questions')
      .select('id', { count: 'exact' })
    
    const { data: mathCount } = await supabase
      .from('multiplication_questions')
      .select('id', { count: 'exact' })
    
    console.log('📊 Results:')
    console.log(`   Trivia Questions: ${triviaCount?.length || 0}`)
    console.log(`   Multiplication Questions: ${mathCount?.length || 0}`)
    
    return true
    
  } catch (error) {
    console.error('❌ Unexpected error:', error)
    return false
  }
}

async function main() {
  console.log('🎯 Trivia Questions SQL Executor')
  console.log('================================')
  
  const success = await executeTriviaSQL()
  
  if (success) {
    console.log('\n🎉 SQL execution completed!')
  } else {
    console.log('\n❌ SQL execution failed!')
  }
}

if (require.main === module) {
  main().catch(console.error)
}

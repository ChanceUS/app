#!/usr/bin/env node

/**
 * Script to seed the database with trivia questions and multiplication tables
 * This script reads the SQL file and executes it against the Supabase database
 */

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:')
  console.error('   NEXT_PUBLIC_SUPABASE_URL:', !!supabaseUrl)
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', !!supabaseServiceKey)
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function seedTriviaQuestions() {
  try {
    console.log('🚀 Starting trivia questions seeding...')
    
    // Read the SQL file
    const sqlPath = path.join(__dirname, '07-add-trivia-questions.sql')
    const sqlContent = fs.readFileSync(sqlPath, 'utf8')
    
    console.log('📄 SQL file loaded, executing...')
    
    // Execute the SQL
    const { data, error } = await supabase.rpc('exec_sql', { sql: sqlContent })
    
    if (error) {
      console.error('❌ Error executing SQL:', error)
      return false
    }
    
    console.log('✅ SQL executed successfully!')
    
    // Verify the data was inserted
    const { data: triviaCount, error: triviaError } = await supabase
      .from('trivia_questions')
      .select('id', { count: 'exact' })
    
    if (triviaError) {
      console.error('❌ Error counting trivia questions:', triviaError)
      return false
    }
    
    const { data: mathCount, error: mathError } = await supabase
      .from('multiplication_questions')
      .select('id', { count: 'exact' })
    
    if (mathError) {
      console.error('❌ Error counting multiplication questions:', mathError)
      return false
    }
    
    console.log('📊 Database Summary:')
    console.log(`   Trivia Questions: ${triviaCount?.length || 0}`)
    console.log(`   Multiplication Questions: ${mathCount?.length || 0}`)
    
    // Show breakdown by category and difficulty
    const { data: triviaBreakdown } = await supabase
      .from('trivia_questions')
      .select('category, difficulty')
    
    if (triviaBreakdown) {
      const breakdown = triviaBreakdown.reduce((acc, q) => {
        const key = `${q.category} - ${q.difficulty}`
        acc[key] = (acc[key] || 0) + 1
        return acc
      }, {})
      
      console.log('📈 Trivia Questions Breakdown:')
      Object.entries(breakdown).forEach(([key, count]) => {
        console.log(`   ${key}: ${count} questions`)
      })
    }
    
    const { data: mathBreakdown } = await supabase
      .from('multiplication_questions')
      .select('difficulty')
    
    if (mathBreakdown) {
      const breakdown = mathBreakdown.reduce((acc, q) => {
        acc[q.difficulty] = (acc[q.difficulty] || 0) + 1
        return acc
      }, {})
      
      console.log('📈 Multiplication Questions Breakdown:')
      Object.entries(breakdown).forEach(([difficulty, count]) => {
        console.log(`   ${difficulty}: ${count} questions`)
      })
    }
    
    console.log('🎉 Trivia questions seeding completed successfully!')
    return true
    
  } catch (error) {
    console.error('❌ Unexpected error:', error)
    return false
  }
}

// Alternative approach if the RPC doesn't work
async function seedTriviaQuestionsAlternative() {
  try {
    console.log('🚀 Starting alternative trivia questions seeding...')
    
    // First, create the tables if they don't exist
    console.log('📋 Creating tables...')
    
    // Create trivia_questions table
    const { error: triviaTableError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS public.trivia_questions (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          question TEXT NOT NULL,
          options JSONB NOT NULL,
          correct_answer INTEGER NOT NULL,
          category VARCHAR(100) NOT NULL,
          difficulty VARCHAR(20) DEFAULT 'medium',
          points INTEGER DEFAULT 10,
          time_limit INTEGER DEFAULT 30,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    })
    
    if (triviaTableError) {
      console.error('❌ Error creating trivia_questions table:', triviaTableError)
    }
    
    // Create multiplication_questions table
    const { error: mathTableError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS public.multiplication_questions (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          factor1 INTEGER NOT NULL,
          factor2 INTEGER NOT NULL,
          product INTEGER NOT NULL,
          difficulty VARCHAR(20) DEFAULT 'medium',
          time_limit INTEGER DEFAULT 15,
          points INTEGER DEFAULT 10,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    })
    
    if (mathTableError) {
      console.error('❌ Error creating multiplication_questions table:', mathTableError)
    }
    
    console.log('✅ Tables created successfully!')
    console.log('📝 Note: You may need to manually run the SQL file to insert the questions.')
    console.log('   Run: psql -h your-host -U your-user -d your-database -f scripts/07-add-trivia-questions.sql')
    
    return true
    
  } catch (error) {
    console.error('❌ Unexpected error in alternative approach:', error)
    return false
  }
}

// Main execution
async function main() {
  console.log('🎯 Trivia Questions Seeding Script')
  console.log('=====================================')
  
  const success = await seedTriviaQuestions()
  
  if (!success) {
    console.log('\n🔄 Trying alternative approach...')
    await seedTriviaQuestionsAlternative()
  }
  
  console.log('\n✨ Script completed!')
}

if (require.main === module) {
  main().catch(console.error)
}

module.exports = { seedTriviaQuestions, seedTriviaQuestionsAlternative }

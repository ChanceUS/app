#!/usr/bin/env node

/**
 * Script to insert trivia questions directly into the database
 */

const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Sample trivia questions to insert
const triviaQuestions = [
  // Easy Pop Culture Questions
  {
    question: "What pop star embarked on the record-breaking Eras Tour starting in 2023?",
    options: ["Taylor Swift", "Ariana Grande", "Billie Eilish", "Olivia Rodrigo"],
    correct_answer: 0,
    category: "Pop Culture",
    difficulty: "easy",
    points: 10,
    time_limit: 30
  },
  {
    question: "Which social media platform is primarily known for its short-form video content and viral dance challenges?",
    options: ["Instagram", "TikTok", "Snapchat", "Twitter"],
    correct_answer: 1,
    category: "Pop Culture",
    difficulty: "easy",
    points: 10,
    time_limit: 30
  },
  {
    question: "What Marvel superhero wields the hammer Mjölnir?",
    options: ["Iron Man", "Thor", "Captain America", "Hulk"],
    correct_answer: 1,
    category: "Pop Culture",
    difficulty: "easy",
    points: 10,
    time_limit: 30
  },
  {
    question: "The song \"Hotline Bling\" is a major hit for which Canadian rapper?",
    options: ["Drake", "The Weeknd", "Justin Bieber", "Shawn Mendes"],
    correct_answer: 0,
    category: "Pop Culture",
    difficulty: "easy",
    points: 10,
    time_limit: 30
  },
  {
    question: "What actress starred as Barbie in the 2023 movie Barbie?",
    options: ["Emma Stone", "Margot Robbie", "Scarlett Johansson", "Jennifer Lawrence"],
    correct_answer: 1,
    category: "Pop Culture",
    difficulty: "easy",
    points: 10,
    time_limit: 30
  }
]

// Sample multiplication questions
const multiplicationQuestions = [
  { factor1: 1, factor2: 1, product: 1, difficulty: "easy", time_limit: 15, points: 10 },
  { factor1: 1, factor2: 2, product: 2, difficulty: "easy", time_limit: 15, points: 10 },
  { factor1: 1, factor2: 3, product: 3, difficulty: "easy", time_limit: 15, points: 10 },
  { factor1: 2, factor2: 2, product: 4, difficulty: "easy", time_limit: 15, points: 10 },
  { factor1: 2, factor2: 3, product: 6, difficulty: "easy", time_limit: 15, points: 10 },
  { factor1: 3, factor2: 3, product: 9, difficulty: "easy", time_limit: 15, points: 10 },
  { factor1: 4, factor2: 4, product: 16, difficulty: "easy", time_limit: 15, points: 10 },
  { factor1: 5, factor2: 5, product: 25, difficulty: "easy", time_limit: 15, points: 10 },
  { factor1: 6, factor2: 6, product: 36, difficulty: "easy", time_limit: 15, points: 10 },
  { factor1: 7, factor2: 7, product: 49, difficulty: "medium", time_limit: 12, points: 15 }
]

async function insertTriviaQuestions() {
  try {
    console.log('🚀 Inserting trivia questions...')
    
    const { data, error } = await supabase
      .from('trivia_questions')
      .insert(triviaQuestions)
      .select()
    
    if (error) {
      console.error('❌ Error inserting trivia questions:', error)
      return false
    }
    
    console.log(`✅ Inserted ${data?.length || 0} trivia questions`)
    return true
    
  } catch (error) {
    console.error('❌ Unexpected error inserting trivia questions:', error)
    return false
  }
}

async function insertMultiplicationQuestions() {
  try {
    console.log('🚀 Inserting multiplication questions...')
    
    const { data, error } = await supabase
      .from('multiplication_questions')
      .insert(multiplicationQuestions)
      .select()
    
    if (error) {
      console.error('❌ Error inserting multiplication questions:', error)
      return false
    }
    
    console.log(`✅ Inserted ${data?.length || 0} multiplication questions`)
    return true
    
  } catch (error) {
    console.error('❌ Unexpected error inserting multiplication questions:', error)
    return false
  }
}

async function main() {
  console.log('🎯 Trivia Questions Inserter')
  console.log('============================')
  
  const triviaSuccess = await insertTriviaQuestions()
  const mathSuccess = await insertMultiplicationQuestions()
  
  if (triviaSuccess && mathSuccess) {
    console.log('\n🎉 All questions inserted successfully!')
  } else {
    console.log('\n❌ Some insertions failed!')
  }
}

if (require.main === module) {
  main().catch(console.error)
}

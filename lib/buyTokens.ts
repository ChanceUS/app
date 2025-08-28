'use client'
import { supabase } from './supabaseClient'

export async function buyTokens(amount: 100 | 500 | 1000) {
  console.log('buyTokens function called with amount:', amount);
  // Supabase client will attach the user’s JWT automatically
  const { data, error } = await supabase.functions.invoke('buy_tokens', {
    body: { amount },
  })
  console.log('Supabase response:', { data, error });
  if (error) throw new Error(error.message)
  return data as { balance: number }
}
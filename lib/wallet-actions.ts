"use server"

import { createServerActionClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { revalidatePath } from "next/cache"

// Add tokens to user account (simulated purchase)
export async function addTokens(prevState: any, formData: FormData) {
  if (!formData) {
    return { error: "Form data is missing" }
  }

  const amount = formData.get("amount")
  const paymentMethod = formData.get("paymentMethod")

  if (!amount || !paymentMethod) {
    return { error: "Amount and payment method are required" }
  }

  const tokenAmount = Number.parseInt(amount.toString())
  if (tokenAmount < 10 || tokenAmount > 10000) {
    return { error: "Token amount must be between 10 and 10,000" }
  }

  const cookieStore = cookies()
  const supabase = createServerActionClient({ cookies: () => cookieStore })

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { error: "User not authenticated" }
    }

    // In a real app, this would integrate with a payment processor
    // For now, we'll simulate a successful purchase
    const { error: transactionError } = await supabase.from("transactions").insert({
      user_id: user.id,
      type: "bonus",
      amount: tokenAmount,
      description: `Token purchase via ${paymentMethod} - ${tokenAmount} tokens`,
    })

    if (transactionError) {
      console.error("Transaction error:", transactionError)
      return { error: "Failed to process token purchase" }
    }

    revalidatePath("/wallet")
    return { success: `Successfully added ${tokenAmount} tokens to your account!` }
  } catch (error) {
    console.error("Add tokens error:", error)
    return { error: "An unexpected error occurred. Please try again." }
  }
}

// Transfer tokens between users (for future features)
export async function transferTokens(prevState: any, formData: FormData) {
  if (!formData) {
    return { error: "Form data is missing" }
  }

  const recipient = formData.get("recipient")
  const amount = formData.get("amount")

  if (!recipient || !amount) {
    return { error: "Recipient and amount are required" }
  }

  const tokenAmount = Number.parseInt(amount.toString())
  if (tokenAmount < 1) {
    return { error: "Transfer amount must be at least 1 token" }
  }

  const cookieStore = cookies()
  const supabase = createServerActionClient({ cookies: () => cookieStore })

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { error: "User not authenticated" }
    }

    // Check if user has enough tokens
    const { data: userData } = await supabase.from("users").select("tokens").eq("id", user.id).single()

    if (!userData || userData.tokens < tokenAmount) {
      return { error: "Insufficient token balance" }
    }

    // Find recipient user
    const { data: recipientData } = await supabase
      .from("users")
      .select("id, username")
      .eq("username", recipient.toString())
      .single()

    if (!recipientData) {
      return { error: "Recipient user not found" }
    }

    if (recipientData.id === user.id) {
      return { error: "Cannot transfer tokens to yourself" }
    }

    // Create debit transaction for sender
    const { error: debitError } = await supabase.from("transactions").insert({
      user_id: user.id,
      type: "loss",
      amount: -tokenAmount,
      description: `Token transfer to @${recipient} - ${tokenAmount} tokens`,
    })

    if (debitError) {
      return { error: "Failed to process transfer" }
    }

    // Create credit transaction for recipient
    const { error: creditError } = await supabase.from("transactions").insert({
      user_id: recipientData.id,
      type: "bonus",
      amount: tokenAmount,
      description: `Token transfer from @${userData.username} - ${tokenAmount} tokens`,
    })

    if (creditError) {
      return { error: "Failed to complete transfer" }
    }

    revalidatePath("/wallet")
    return { success: `Successfully transferred ${tokenAmount} tokens to @${recipient}!` }
  } catch (error) {
    console.error("Transfer tokens error:", error)
    return { error: "An unexpected error occurred. Please try again." }
  }
}

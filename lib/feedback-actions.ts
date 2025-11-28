"use server"

import { createServerActionClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"

// Submit feedback
export async function submitFeedback(prevState: any, formData: FormData) {
  const cookieStore = await cookies()
  const supabase = createServerActionClient({ cookies: () => cookieStore })

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    const content = formData.get("content")?.toString()
    const feedbackType = (formData.get("feedbackType")?.toString() || "general") as "general" | "bug" | "feature" | "improvement"
    const pageUrl = formData.get("pageUrl")?.toString()

    if (!content || !content.trim()) {
      return { error: "Feedback cannot be empty" }
    }

    const { data, error } = await supabase
      .from("feedback")
      .insert({
        user_id: user?.id || null,
        content: content.trim(),
        feedback_type: feedbackType,
        page_url: pageUrl || null,
        status: "new",
      })
      .select()
      .single()

    if (error) {
      console.error("Error submitting feedback:", error)
      return { error: "Failed to submit feedback. Please try again." }
    }

    return { success: true, data }
  } catch (error) {
    console.error("Submit feedback error:", error)
    return { error: "An unexpected error occurred. Please try again." }
  }
}


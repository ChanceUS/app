"use server"

import { createServerActionClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { revalidatePath } from "next/cache"

// Send a message
export async function sendMessage(
  content: string,
  messageType: "match" | "global" | "dm" | "tournament",
  options?: {
    matchId?: string
    tournamentId?: string
    recipientId?: string
  }
) {
  const cookieStore = await cookies()
  const supabase = createServerActionClient({ cookies: () => cookieStore })

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { error: "User not authenticated" }
    }

    if (!content.trim()) {
      return { error: "Message cannot be empty" }
    }

    const { data, error } = await supabase
      .from("messages")
      .insert({
        sender_id: user.id,
        content: content.trim(),
        message_type: messageType,
        match_id: options?.matchId || null,
        tournament_id: options?.tournamentId || null,
        recipient_id: options?.recipientId || null,
      })
      .select()
      .single()

    if (error) {
      console.error("Error sending message:", error)
      return { error: "Failed to send message" }
    }

    // Revalidate relevant paths
    if (messageType === "match" && options?.matchId) {
      revalidatePath(`/games/match/${options.matchId}`)
    } else if (messageType === "tournament" && options?.tournamentId) {
      revalidatePath(`/tournaments/${options.tournamentId}`)
    } else if (messageType === "global") {
      revalidatePath("/chat")
    } else if (messageType === "dm" && options?.recipientId) {
      revalidatePath(`/chat/dm/${options.recipientId}`)
    }

    return { success: true, data }
  } catch (error) {
    console.error("Send message error:", error)
    return { error: "An unexpected error occurred" }
  }
}

// Mark messages as read
export async function markMessagesAsRead(
  messageIds: string[],
  messageType: "dm" | "match" | "tournament"
) {
  const cookieStore = await cookies()
  const supabase = createServerActionClient({ cookies: () => cookieStore })

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { error: "User not authenticated" }
    }

    const { error } = await supabase
      .from("messages")
      .update({ is_read: true })
      .in("id", messageIds)
      .eq("message_type", messageType)
      .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)

    if (error) {
      console.error("Error marking messages as read:", error)
      return { error: "Failed to mark messages as read" }
    }

    return { success: true }
  } catch (error) {
    console.error("Mark as read error:", error)
    return { error: "An unexpected error occurred" }
  }
}

// Delete a message
export async function deleteMessage(messageId: string) {
  const cookieStore = await cookies()
  const supabase = createServerActionClient({ cookies: () => cookieStore })

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { error: "User not authenticated" }
    }

    const { error } = await supabase
      .from("messages")
      .delete()
      .eq("id", messageId)
      .eq("sender_id", user.id)

    if (error) {
      console.error("Error deleting message:", error)
      return { error: "Failed to delete message" }
    }

    return { success: true }
  } catch (error) {
    console.error("Delete message error:", error)
    return { error: "An unexpected error occurred" }
  }
}


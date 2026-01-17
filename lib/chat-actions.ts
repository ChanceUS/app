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
      .update({ is_deleted: true })
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

// Add emoji reaction to a message
export async function addMessageReaction(messageId: string, emoji: string) {
  const cookieStore = await cookies()
  const supabase = createServerActionClient({ cookies: () => cookieStore })

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { error: "User not authenticated" }
    }

    // Check if reaction already exists
    const { data: existing } = await supabase
      .from("message_reactions")
      .select("id")
      .eq("message_id", messageId)
      .eq("user_id", user.id)
      .eq("emoji", emoji)
      .single()

    if (existing) {
      return { success: true, data: existing } // Already reacted
    }

    const { data, error } = await supabase
      .from("message_reactions")
      .insert({
        message_id: messageId,
        user_id: user.id,
        emoji: emoji,
      })
      .select()
      .single()

    if (error) {
      console.error("Error adding reaction:", error)
      return { error: "Failed to add reaction" }
    }

    return { success: true, data }
  } catch (error) {
    console.error("Add reaction error:", error)
    return { error: "An unexpected error occurred" }
  }
}

// Remove emoji reaction from a message
export async function removeMessageReaction(messageId: string, emoji: string) {
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
      .from("message_reactions")
      .delete()
      .eq("message_id", messageId)
      .eq("user_id", user.id)
      .eq("emoji", emoji)

    if (error) {
      console.error("Error removing reaction:", error)
      return { error: "Failed to remove reaction" }
    }

    return { success: true }
  } catch (error) {
    console.error("Remove reaction error:", error)
    return { error: "An unexpected error occurred" }
  }
}

// Get reactions for a message
export async function getMessageReactions(messageId: string) {
  const cookieStore = await cookies()
  const supabase = createServerActionClient({ cookies: () => cookieStore })

  try {
    const { data, error } = await supabase
      .from("message_reactions")
      .select(`
        *,
        user:users(id, username, display_name, avatar_url)
      `)
      .eq("message_id", messageId)

    if (error) {
      console.error("Error fetching reactions:", error)
      return { error: "Failed to fetch reactions", data: [] }
    }

    // Group reactions by emoji
    const grouped = (data || []).reduce((acc, reaction) => {
      if (!acc[reaction.emoji]) {
        acc[reaction.emoji] = []
      }
      acc[reaction.emoji].push(reaction.user)
      return acc
    }, {} as Record<string, any[]>)

    return { success: true, data: grouped }
  } catch (error) {
    console.error("Get reactions error:", error)
    return { error: "An unexpected error occurred", data: {} }
  }
}

// Edit a message
export async function editMessage(messageId: string, newContent: string) {
  const cookieStore = await cookies()
  const supabase = createServerActionClient({ cookies: () => cookieStore })

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { error: "User not authenticated" }
    }

    if (!newContent.trim()) {
      return { error: "Message cannot be empty" }
    }

    const { data, error } = await supabase
      .from("messages")
      .update({
        content: newContent.trim(),
        edited_at: new Date().toISOString(),
      })
      .eq("id", messageId)
      .eq("sender_id", user.id)
      .select()
      .single()

    if (error) {
      console.error("Error editing message:", error)
      return { error: "Failed to edit message" }
    }

    return { success: true, data }
  } catch (error) {
    console.error("Edit message error:", error)
    return { error: "An unexpected error occurred" }
  }
}

// Get user chat settings
export async function getUserChatSettings() {
  const cookieStore = await cookies()
  const supabase = createServerActionClient({ cookies: () => cookieStore })

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { error: "User not authenticated" }
    }

    const { data, error } = await supabase
      .from("user_chat_settings")
      .select("*")
      .eq("user_id", user.id)
      .single()

    if (error) {
      if (error.code === "PGRST116") {
        // Create default settings
        const { data: newSettings } = await supabase
          .from("user_chat_settings")
          .insert({
            user_id: user.id,
          })
          .select()
          .single()

        return { success: true, data: newSettings }
      }
      console.error("Error fetching chat settings:", error)
      return { error: "Failed to fetch chat settings", data: null }
    }

    return { success: true, data }
  } catch (error) {
    console.error("Get chat settings error:", error)
    return { error: "An unexpected error occurred", data: null }
  }
}

// Update user chat settings
export async function updateUserChatSettings(settings: {
  show_timestamps?: boolean
  show_read_receipts?: boolean
  mute_notifications?: boolean
  blocked_users?: string[]
}) {
  const cookieStore = await cookies()
  const supabase = createServerActionClient({ cookies: () => cookieStore })

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { error: "User not authenticated" }
    }

    const { data, error } = await supabase
      .from("user_chat_settings")
      .upsert({
        user_id: user.id,
        ...settings,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) {
      console.error("Error updating chat settings:", error)
      return { error: "Failed to update chat settings" }
    }

    return { success: true, data }
  } catch (error) {
    console.error("Update chat settings error:", error)
    return { error: "An unexpected error occurred" }
  }
}


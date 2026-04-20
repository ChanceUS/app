"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Send, Loader2, Smile, MoreVertical, Edit, Trash2 } from "lucide-react"
import { supabase } from "@/lib/supabase/client"
import {
  sendMessage,
  addMessageReaction,
  removeMessageReaction,
  getMessageReactions,
  editMessage,
  deleteMessage,
  getUserChatSettings,
} from "@/lib/chat-actions"
import type { Message, User } from "@/lib/supabase/client"
import { formatDistanceToNow } from "date-fns"
import { toast } from "sonner"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

// Common emojis for reactions
const EMOJI_OPTIONS = ["👍", "❤️", "😂", "😮", "😢", "🔥", "🎉", "👏"]

// Helper function to format time
const formatTime = (date: string) => {
  return formatDistanceToNow(new Date(date), { addSuffix: true })
}

interface EnhancedChatWindowProps {
  messageType: "match" | "global" | "dm" | "tournament"
  currentUser: User
  matchId?: string
  tournamentId?: string
  recipientId?: string
  title?: string
  maxHeight?: string
}

export default function EnhancedChatWindow({
  messageType,
  currentUser,
  matchId,
  tournamentId,
  recipientId,
  title,
  maxHeight = "400px",
}: EnhancedChatWindowProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isSending, setIsSending] = useState(false)
  const [showTimestamps, setShowTimestamps] = useState(true)
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null)
  const [editValue, setEditValue] = useState("")
  const [reactions, setReactions] = useState<Record<string, Record<string, any[]>>>({})
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const chatContainerRef = useRef<HTMLDivElement>(null)

  // Load chat settings
  useEffect(() => {
    const loadSettings = async () => {
      const result = await getUserChatSettings()
      if (result.data) {
        setShowTimestamps(result.data.show_timestamps ?? true)
      }
    }
    loadSettings()
  }, [])

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // Load initial messages
  useEffect(() => {
    loadMessages()
  }, [messageType, matchId, tournamentId, recipientId])

  // Load reactions for messages
  useEffect(() => {
    const loadReactions = async () => {
      const reactionsMap: Record<string, Record<string, any[]>> = {}
      for (const message of messages) {
        const result = await getMessageReactions(message.id)
        if (result.data) {
          reactionsMap[message.id] = result.data
        }
      }
      setReactions(reactionsMap)
    }

    if (messages.length > 0) {
      loadReactions()
    }
  }, [messages])

  // Subscribe to real-time updates
  useEffect(() => {
    if (isLoading) return

    const channelName = `messages-${messageType}-${matchId || tournamentId || recipientId || "global"}`
    const channel = supabase.channel(channelName)

    let filter: string
    if (messageType === "match" && matchId) {
      filter = `message_type=eq.match`
    } else if (messageType === "tournament" && tournamentId) {
      filter = `message_type=eq.tournament`
    } else if (messageType === "dm" && recipientId) {
      filter = `message_type=eq.dm`
    } else {
      filter = `message_type=eq.global`
    }

    channel
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: filter,
        },
        async (payload) => {
          const newMessage = payload.new as any

          if (messageType === "match" && matchId && newMessage.match_id !== matchId) {
            return
          }
          if (messageType === "tournament" && tournamentId && newMessage.tournament_id !== tournamentId) {
            return
          }
          if (messageType === "dm" && recipientId) {
            const isRelevant =
              (newMessage.sender_id === currentUser.id && newMessage.recipient_id === recipientId) ||
              (newMessage.sender_id === recipientId && newMessage.recipient_id === currentUser.id)
            if (!isRelevant) return
          }

          const { data: senderData } = await supabase
            .from("users")
            .select("id, username, display_name, avatar_url")
            .eq("id", newMessage.sender_id)
            .single()

          if (senderData) {
            setMessages((prev) => [...prev, { ...newMessage, sender: senderData } as Message])
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "messages",
          filter: filter,
        },
        (payload) => {
          const updatedMessage = payload.new as any
          setMessages((prev) =>
            prev.map((msg) => (msg.id === updatedMessage.id ? { ...msg, ...updatedMessage } : msg))
          )
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [messageType, matchId, tournamentId, recipientId, currentUser.id, isLoading])

  const loadMessages = async () => {
    setIsLoading(true)
    try {
      let query = supabase
        .from("messages")
        .select("*")
        .eq("message_type", messageType)
        .eq("is_deleted", false)
        .order("created_at", { ascending: false })
        .limit(50)

      if (messageType === "match" && matchId) {
        query = query.eq("match_id", matchId)
      } else if (messageType === "tournament" && tournamentId) {
        query = query.eq("tournament_id", tournamentId)
      } else if (messageType === "dm" && recipientId) {
        query = query.or(
          `and(sender_id.eq.${currentUser.id},recipient_id.eq.${recipientId}),and(sender_id.eq.${recipientId},recipient_id.eq.${currentUser.id})`
        )
      }

      const { data: messagesData, error } = await query

      if (error) {
        console.error("Error loading messages:", error)
        setMessages([])
        return
      }

      if (!messagesData || messagesData.length === 0) {
        setMessages([])
        return
      }

      const senderIds = [...new Set(messagesData.map((msg: any) => msg.sender_id))]

      const { data: sendersData } = await supabase
        .from("users")
        .select("id, username, display_name, avatar_url")
        .in("id", senderIds)

      const sendersMap = new Map((sendersData || []).map((sender) => [sender.id, sender]))

      const messagesWithSenders = messagesData.map((msg: any) => ({
        ...msg,
        sender: sendersMap.get(msg.sender_id) || null,
      })) as Message[]

      setMessages(messagesWithSenders.reverse())
    } catch (error) {
      console.error("Error loading messages:", error)
      setMessages([])
    } finally {
      setIsLoading(false)
    }
  }

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputValue.trim() || isSending) return

    setIsSending(true)
    const result = await sendMessage(inputValue.trim(), messageType, {
      matchId,
      tournamentId,
      recipientId,
    })

    if (result.error) {
      toast.error(result.error)
    } else {
      setInputValue("")
    }
    setIsSending(false)
  }

  const handleReaction = async (messageId: string, emoji: string) => {
    const currentReactions = reactions[messageId] || {}
    const hasReacted = currentReactions[emoji]?.some((user) => user.id === currentUser.id)

    if (hasReacted) {
      const result = await removeMessageReaction(messageId, emoji)
      if (result.success) {
        // Reload reactions
        const result = await getMessageReactions(messageId)
        if (result.data) {
          setReactions((prev) => ({ ...prev, [messageId]: result.data! }))
        }
      }
    } else {
      const result = await addMessageReaction(messageId, emoji)
      if (result.success) {
        // Reload reactions
        const result = await getMessageReactions(messageId)
        if (result.data) {
          setReactions((prev) => ({ ...prev, [messageId]: result.data! }))
        }
      }
    }
  }

  const handleEdit = async (messageId: string) => {
    if (!editValue.trim()) return

    const result = await editMessage(messageId, editValue)
    if (result.error) {
      toast.error(result.error)
    } else {
      setEditingMessageId(null)
      setEditValue("")
    }
  }

  const handleDelete = async (messageId: string) => {
    const result = await deleteMessage(messageId)
    if (result.error) {
      toast.error(result.error)
    }
  }

  return (
    <Card className="bg-gray-900/80 border-gray-800">
      {title && (
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
        </CardHeader>
      )}
      <CardContent className="p-0">
        <div
          ref={chatContainerRef}
          className="overflow-y-auto p-4 space-y-3"
          style={{ maxHeight }}
        >
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            </div>
          ) : messages.length === 0 ? (
            <p className="text-center text-gray-400 py-8">No messages yet</p>
          ) : (
            messages.map((message) => {
              const isOwnMessage = message.sender_id === currentUser.id
              const messageReactions = reactions[message.id] || {}

              return (
                <div
                  key={message.id}
                  className={`flex gap-2 ${isOwnMessage ? "flex-row-reverse" : ""}`}
                >
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={message.sender?.avatar_url} />
                    <AvatarFallback>
                      {message.sender?.username?.[0]?.toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className={`flex-1 ${isOwnMessage ? "items-end" : "items-start"} flex flex-col`}>
                    <div
                      className={`rounded-lg p-2 max-w-[80%] ${
                        isOwnMessage
                          ? "bg-blue-600 text-white"
                          : "bg-gray-800 text-gray-100"
                      }`}
                    >
                      {editingMessageId === message.id ? (
                        <div className="space-y-2">
                          <Input
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            className="bg-gray-700 text-white"
                            autoFocus
                          />
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleEdit(message.id)}
                              className="h-7"
                            >
                              Save
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setEditingMessageId(null)
                                setEditValue("")
                              }}
                              className="h-7"
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1">
                              {!isOwnMessage && (
                                <p className="text-xs font-medium mb-1">
                                  {message.sender?.display_name || message.sender?.username || "Unknown"}
                                </p>
                              )}
                              <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                              {message.edited_at && (
                                <p className="text-xs opacity-70 mt-1">(edited)</p>
                              )}
                            </div>
                            {isOwnMessage && (
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                                    <MoreVertical className="h-3 w-3" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem
                                    onClick={() => {
                                      setEditingMessageId(message.id)
                                      setEditValue(message.content)
                                    }}
                                  >
                                    <Edit className="h-4 w-4 mr-2" />
                                    Edit
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => handleDelete(message.id)}
                                    className="text-red-400"
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            )}
                          </div>
                          {showTimestamps && (
                            <p className="text-xs opacity-70 mt-1">
                              {formatTime(message.created_at)}
                            </p>
                          )}
                        </>
                      )}
                    </div>
                    {/* Reactions */}
                    <div className="flex gap-1 mt-1 flex-wrap">
                      {Object.entries(messageReactions).map(([emoji, users]) => (
                        <button
                          key={emoji}
                          onClick={() => handleReaction(message.id, emoji)}
                          className={`text-xs px-2 py-1 rounded-full border ${
                            users.some((u) => u.id === currentUser.id)
                              ? "bg-blue-500/20 border-blue-500/50"
                              : "bg-gray-800 border-gray-700"
                          } hover:bg-gray-700 transition-colors`}
                        >
                          {emoji} {users.length}
                        </button>
                      ))}
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-6 px-2">
                            <Smile className="h-3 w-3" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-2">
                          <div className="flex gap-1">
                            {EMOJI_OPTIONS.map((emoji) => (
                              <button
                                key={emoji}
                                onClick={() => handleReaction(message.id, emoji)}
                                className="text-xl hover:scale-125 transition-transform p-1"
                              >
                                {emoji}
                              </button>
                            ))}
                          </div>
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>
                </div>
              )
            })
          )}
          <div ref={messagesEndRef} />
        </div>
        <form onSubmit={handleSend} className="p-4 border-t border-gray-800">
          <div className="flex gap-2">
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Type a message..."
              className="bg-gray-800 border-gray-700"
              disabled={isSending}
            />
            <Button type="submit" disabled={isSending || !inputValue.trim()}>
              {isSending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}


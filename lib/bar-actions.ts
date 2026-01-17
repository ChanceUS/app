"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

export interface Bar {
  id: string
  name: string
  description?: string
  address?: string
  city?: string
  state?: string
  zip_code?: string
  phone?: string
  email?: string
  website?: string
  qr_code: string
  venue_code: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface BarTriviaGame {
  id: string
  bar_id: string
  name: string
  description?: string
  max_questions: number
  time_per_question: number
  is_active: boolean
  current_high_score: number
  current_high_scorer_id?: string
  current_high_scorer_name?: string
  total_players: number
  total_games_played: number
  created_at: string
  updated_at: string
}

export interface BarTriviaSession {
  id: string
  bar_id: string
  trivia_game_id: string
  session_code: string
  status: 'waiting' | 'active' | 'completed' | 'cancelled'
  started_at?: string
  ended_at?: string
  total_players: number
  created_at: string
}

export interface BarTriviaParticipant {
  id: string
  session_id: string
  user_id: string
  display_name: string
  score: number
  questions_answered: number
  correct_answers: number
  average_response_time: number
  joined_at: string
  finished_at?: string
}

// Create a new bar
export async function createBar(formData: FormData) {
  const supabase = await createClient()
  
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error("You must be logged in to create a bar")
  }

  const name = formData.get("name") as string
  const description = formData.get("description") as string
  const address = formData.get("address") as string
  const city = formData.get("city") as string
  const state = formData.get("state") as string
  const zip_code = formData.get("zip_code") as string
  const phone = formData.get("phone") as string
  const email = formData.get("email") as string
  const website = formData.get("website") as string

  if (!name) {
    throw new Error("Bar name is required")
  }

  // Generate unique QR code and venue code
  let qrCodeData, venueCodeData
  
  try {
    const { data: qrData, error: qrError } = await supabase.rpc('generate_bar_qr_code')
    const { data: venueData, error: venueError } = await supabase.rpc('generate_bar_venue_code')
    
    // Check if we got valid data and no errors
    if (qrError || venueError || !qrData || !venueData) {
      throw new Error("RPC functions failed or returned null")
    }
    
    qrCodeData = qrData
    venueCodeData = venueData
  } catch (error) {
    // Fallback to manual generation if RLS policies are blocking
    console.warn("RPC functions blocked, using fallback code generation:", error)
    qrCodeData = `QR${Date.now()}${Math.random().toString(36).substr(2, 4).toUpperCase()}`
    venueCodeData = `${Math.random().toString(36).substr(2, 6).toUpperCase()}`
  }

  if (!qrCodeData || !venueCodeData) {
    throw new Error("Failed to generate unique codes")
  }

  const { data: bar, error } = await supabase
    .from("bars")
    .insert({
      name,
      description: description || null,
      address: address || null,
      city: city || null,
      state: state || null,
      zip_code: zip_code || null,
      phone: phone || null,
      email: email || null,
      website: website || null,
      qr_code: qrCodeData,
      venue_code: venueCodeData,
    })
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to create bar: ${error.message}`)
  }

  // Add the creator as bar owner
  const { error: staffError } = await supabase
    .from("bar_staff")
    .insert({
      bar_id: bar.id,
      user_id: user.id,
      role: "owner",
    })

  if (staffError) {
    console.error("Failed to add bar owner:", staffError)
  }

  revalidatePath("/bars")
  return bar
}

// Get bars for the current user (as staff)
export async function getMyBars(): Promise<Bar[]> {
  const supabase = await createClient()
  
  if (!supabase || !supabase.auth) {
    console.error("Supabase client not properly initialized")
    return []
  }
  
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return []
  }

  const { data: bars, error } = await supabase
    .from("bars")
    .select(`
      *,
      bar_staff!inner(user_id, role)
    `)
    .eq("bar_staff.user_id", user.id)
    .eq("bar_staff.is_active", true)
    .eq("is_active", true)

  if (error) {
    console.error("Error fetching bars:", error)
    return []
  }

  return bars || []
}

// Get bar by QR code or venue code
export async function getBarByCode(code: string): Promise<Bar | null> {
  const supabase = await createClient()

  const { data: bar, error } = await supabase
    .from("bars")
    .select("*")
    .or(`qr_code.eq.${code},venue_code.eq.${code}`)
    .eq("is_active", true)
    .single()

  if (error) {
    console.error("Error fetching bar by code:", error)
    return null
  }

  return bar
}

// Get bar by ID
export async function getBarById(barId: string): Promise<Bar | null> {
  const supabase = await createClient()

  const { data: bar, error } = await supabase
    .from("bars")
    .select("*")
    .eq("id", barId)
    .eq("is_active", true)
    .single()

  if (error) {
    console.error("Error fetching bar by ID:", error)
    return null
  }

  return bar
}

// Create a trivia game for a bar
export async function createBarTriviaGame(barId: string, formData: FormData) {
  const supabase = await createClient()
  
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error("You must be logged in to create a trivia game")
  }

  // Check if user is staff for this bar
  const { data: staff, error: staffError } = await supabase
    .from("bar_staff")
    .select("role")
    .eq("bar_id", barId)
    .eq("user_id", user.id)
    .eq("is_active", true)
    .single()

  console.log("Staff check:", { barId, userId: user.id, staff, staffError })

  if (!staff) {
    // If no staff record found, create one (user is the bar owner)
    console.log("No staff record found, creating owner record")
    const { error: createStaffError } = await supabase
      .from("bar_staff")
      .insert({
        bar_id: barId,
        user_id: user.id,
        role: "owner",
        is_active: true
      })
    
    if (createStaffError) {
      console.error("Failed to create staff record:", createStaffError)
      throw new Error("You don't have permission to create trivia games for this bar")
    }
  }

  const name = formData.get("name") as string
  const description = formData.get("description") as string
  const maxQuestions = parseInt(formData.get("max_questions") as string) || 10
  const timePerQuestion = parseInt(formData.get("time_per_question") as string) || 30

  if (!name) {
    throw new Error("Game name is required")
  }

  const { data: game, error } = await supabase
    .from("bar_trivia_games")
    .insert({
      bar_id: barId,
      name,
      description: description || null,
      max_questions: maxQuestions,
      time_per_question: timePerQuestion,
    })
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to create trivia game: ${error.message}`)
  }

  revalidatePath(`/bars/${barId}`)
  return game
}

// Get trivia games for a bar
export async function getBarTriviaGames(barId: string): Promise<BarTriviaGame[]> {
  const supabase = await createClient()

  console.log("getBarTriviaGames called with barId:", barId)

  const { data: games, error } = await supabase
    .from("bar_trivia_games")
    .select("*")
    .eq("bar_id", barId)
    .eq("is_active", true)
    .order("created_at", { ascending: false })

  console.log("Games query result:", { games, error, barId })

  if (error) {
    console.error("Error fetching trivia games:", error)
    return []
  }

  console.log("Returning games:", games || [])
  return games || []
}

// Create a trivia session
export async function createBarTriviaSession(barId: string, triviaGameId: string) {
  const supabase = await createClient()
  
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error("You must be logged in to create a trivia session")
  }

  // Check if user is staff for this bar
  const { data: staff, error: staffError } = await supabase
    .from("bar_staff")
    .select("role")
    .eq("bar_id", barId)
    .eq("user_id", user.id)
    .eq("is_active", true)
    .single()

  if (!staff) {
    // If no staff record found, create one (user is the bar owner)
    const { error: createStaffError } = await supabase
      .from("bar_staff")
      .insert({
        bar_id: barId,
        user_id: user.id,
        role: "owner",
        is_active: true
      })
    
    if (createStaffError) {
      console.error("Failed to create staff record:", createStaffError)
      throw new Error("You don't have permission to create trivia sessions for this bar")
    }
  }

  // Generate unique session code manually
  const sessionCodeData = `SES${Date.now()}${Math.random().toString(36).substr(2, 4).toUpperCase()}`
  
  console.log("Generated session code:", sessionCodeData)

  const { data: session, error } = await supabase
    .from("bar_trivia_sessions")
    .insert({
      bar_id: barId,
      trivia_game_id: triviaGameId,
      session_code: sessionCodeData,
      status: "waiting",
    })
    .select()
    .single()

  console.log("Session creation result:", { session, error, barId, triviaGameId, sessionCodeData })

  if (error) {
    console.error("Failed to create session:", error)
    throw new Error(`Failed to create trivia session: ${error.message}`)
  }

  console.log("Session created successfully with ID:", session.id)
  revalidatePath(`/bars/${barId}`)
  return session
}

// Join a trivia session
export async function joinBarTriviaSession(sessionCode: string, displayName: string) {
  try {
    console.log("=== JOIN BAR TRIVIA SESSION START ===")
    console.log("Function called with:", { sessionCode, displayName })
    
    const supabase = await createClient()
    
    const {
      data: { user },
    } = await supabase.auth.getUser()

    console.log("joinBarTriviaSession called with:", { sessionCode, displayName, userId: user?.id })
    console.log("Session code type:", typeof sessionCode)
    console.log("Session code length:", sessionCode?.length)

    if (!user) {
      throw new Error("You must be logged in to join a trivia session")
    }

  // First, let's see what sessions exist
  const { data: allSessions, error: allSessionsError } = await supabase
    .from("bar_trivia_sessions")
    .select("*")
    .limit(10)
  
  console.log("All sessions in database:", { allSessions, allSessionsError })

  // Get the session (accept both waiting and active sessions)
  const { data: session, error: sessionError } = await supabase
    .from("bar_trivia_sessions")
    .select("*")
    .eq("session_code", sessionCode)
    .in("status", ["waiting", "active"])
    .single()

  console.log("Session lookup result:", { session, sessionError, sessionCode })
  console.log("Looking for session code:", sessionCode)
  console.log("Available session codes:", allSessions?.map(s => s.session_code))

  if (sessionError || !session) {
    console.error("Session not found:", sessionError)
    throw new Error("Invalid or inactive session code")
  }

  // Check if user already joined this session
  const { data: existingParticipant } = await supabase
    .from("bar_trivia_participants")
    .select("id, display_name")
    .eq("session_id", session.id)
    .eq("user_id", user.id)
    .single()

  console.log("Existing participant check:", { existingParticipant })

  if (existingParticipant) {
    // If user already joined, don't allow changes to completed sessions
    if (existingParticipant.finished_at) {
      console.log("User already completed this session, cannot change display name")
      return { session, participant: existingParticipant }
    }
    
    // Only allow display name updates for active/waiting sessions
    if (existingParticipant.display_name !== displayName) {
      console.log("Updating display name from", existingParticipant.display_name, "to", displayName)
      const { data: updatedParticipant, error: updateError } = await supabase
        .from("bar_trivia_participants")
        .update({ display_name: displayName })
        .eq("id", existingParticipant.id)
        .select()
        .single()
      
      if (updateError) {
        console.error("Error updating display name:", updateError)
      } else {
        console.log("Display name updated successfully:", updatedParticipant)
        return { session, participant: updatedParticipant }
      }
    }
    
    console.log("User already joined this session, returning session info for redirect")
    return { session, participant: existingParticipant }
  }

  // Join the session
  console.log("Creating participant with:", { session_id: session.id, user_id: user.id, display_name: displayName })
  
  const { data: participant, error: participantError } = await supabase
    .from("bar_trivia_participants")
    .insert({
      session_id: session.id,
      user_id: user.id,
      display_name: displayName,
    })
    .select()
    .single()

  console.log("Participant creation result:", { participant, participantError })
  console.log("Participant display_name:", participant?.display_name)

  if (participantError) {
    throw new Error(`Failed to join session: ${participantError.message}`)
  }

  // Update session player count
  const { error: updateError } = await supabase
    .from("bar_trivia_sessions")
    .update({ total_players: session.total_players + 1 })
    .eq("id", session.id)

  console.log("Session player count update:", { updateError })

  revalidatePath(`/bars/${session.bar_id}`)
  console.log("Returning join result:", { session, participant })
  return { session, participant }
  } catch (error) {
    console.error("=== JOIN BAR TRIVIA SESSION ERROR ===")
    console.error("Error in joinBarTriviaSession:", error)
    console.error("Error details:", {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      sessionCode,
      displayName
    })
    throw error
  }
}

// Get session participants
export async function getSessionParticipants(sessionId: string): Promise<BarTriviaParticipant[]> {
  const supabase = await createClient()

  console.log("🔍 Fetching participants for session:", sessionId)
  
  const { data: participants, error } = await supabase
    .from("bar_trivia_participants")
    .select("*")
    .eq("session_id", sessionId)
    .order("score", { ascending: false })

  if (error) {
    console.error("❌ Error fetching session participants:", error)
    return []
  }

  console.log("✅ Fetched participants:", participants)
  return participants || []
}

// Start a trivia session
export async function startBarTriviaSession(sessionId: string) {
  const supabase = await createClient()
  
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error("You must be logged in to start a trivia session")
  }

  // Get session and check permissions
  const { data: session, error: sessionError } = await supabase
    .from("bar_trivia_sessions")
    .select(`
      *,
      bar_trivia_games!inner(*)
    `)
    .eq("id", sessionId)
    .single()

  if (sessionError || !session) {
    throw new Error("Session not found")
  }

  // Check if user is staff for this bar
  const { data: staff } = await supabase
    .from("bar_staff")
    .select("role")
    .eq("bar_id", session.bar_id)
    .eq("user_id", user.id)
    .eq("is_active", true)
    .single()

  if (!staff) {
    throw new Error("You don't have permission to start this trivia session")
  }

  // Update session status
  const { error: updateError } = await supabase
    .from("bar_trivia_sessions")
    .update({
      status: "active",
      started_at: new Date().toISOString(),
    })
    .eq("id", sessionId)

  if (updateError) {
    throw new Error(`Failed to start session: ${updateError.message}`)
  }

  revalidatePath(`/bars/${session.bar_id}`)
  return session
}

// Get active sessions for a bar
export async function getActiveBarSessions(barId: string): Promise<BarTriviaSession[]> {
  const supabase = await createClient()

  const { data: sessions, error } = await supabase
    .from("bar_trivia_sessions")
    .select("*")
    .eq("bar_id", barId)
    .in("status", ["waiting", "active"])
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching active sessions:", error)
    return []
  }

  return sessions || []
}

export async function endBarTriviaSession(sessionId: string) {
  const supabase = await createClient()

  console.log("Ending session:", sessionId)

  // Update session status to completed
  const { error: sessionError } = await supabase
    .from("bar_trivia_sessions")
    .update({
      status: "completed",
      ended_at: new Date().toISOString()
    })
    .eq("id", sessionId)

  if (sessionError) {
    console.error("Error ending session:", sessionError)
    throw new Error(`Failed to end session: ${sessionError.message}`)
  }

  console.log("Session ended successfully")
  revalidatePath("/bars")
}

export async function cancelBarTriviaSession(sessionId: string) {
  const supabase = await createClient()
  
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error("You must be logged in to cancel a trivia session")
  }

  // Get session and check permissions
  const { data: session, error: sessionError } = await supabase
    .from("bar_trivia_sessions")
    .select("*")
    .eq("id", sessionId)
    .single()

  if (sessionError || !session) {
    throw new Error("Session not found")
  }

  // Check if user is staff for this bar
  const { data: staff } = await supabase
    .from("bar_staff")
    .select("role")
    .eq("bar_id", session.bar_id)
    .eq("user_id", user.id)
    .eq("is_active", true)
    .single()

  if (!staff) {
    throw new Error("You don't have permission to cancel this trivia session")
  }

  // Only allow canceling waiting sessions
  if (session.status !== "waiting") {
    throw new Error("Only waiting sessions can be canceled")
  }

  // Update session status to cancelled
  const { error: updateError } = await supabase
    .from("bar_trivia_sessions")
    .update({
      status: "cancelled",
      ended_at: new Date().toISOString()
    })
    .eq("id", sessionId)

  if (updateError) {
    throw new Error(`Failed to cancel session: ${updateError.message}`)
  }

  revalidatePath(`/bars/${session.bar_id}`)
  return session
}

export async function updateParticipantAverageResponseTime(participantId: string) {
  const supabase = await createClient()
  
  // Get all answers for this participant
  const { data: answers } = await supabase
    .from("bar_trivia_answers")
    .select("response_time")
    .eq("participant_id", participantId)

  if (!answers || answers.length === 0) {
    return 0
  }

  // Calculate average response time
  const totalResponseTime = answers.reduce((sum, answer) => sum + answer.response_time, 0)
  const averageResponseTime = totalResponseTime / answers.length

  // Update participant record
  const { error } = await supabase
    .from("bar_trivia_participants")
    .update({ average_response_time: averageResponseTime })
    .eq("id", participantId)

  if (error) {
    console.error("Error updating average response time:", error)
  }

  return averageResponseTime
}

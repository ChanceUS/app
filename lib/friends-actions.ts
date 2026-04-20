'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export interface FriendRequest {
  id: string
  user_id: string
  friend_id: string
  status: 'pending' | 'accepted' | 'blocked'
  created_at: string
  accepted_at: string | null
  user?: {
    id: string
    username: string
    display_name: string
    avatar_url: string | null
  }
  friend?: {
    id: string
    username: string
    display_name: string
    avatar_url: string | null
  }
}

export async function searchUsers(searchTerm: string): Promise<{ data: any[] | null, error: any }> {
  const supabase = await createClient()
  
  if (!searchTerm || searchTerm.trim().length < 2) {
    return { data: null, error: { message: 'Search term must be at least 2 characters' } }
  }

  try {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return { data: null, error: { message: 'Not authenticated' } }
    }

    // Search users by username or display name
    const { data, error } = await supabase
      .from('users')
      .select('id, username, display_name, avatar_url')
      .neq('id', user.id) // Exclude current user
      .or(`username.ilike.%${searchTerm}%,display_name.ilike.%${searchTerm}%`)
      .limit(20)

    return { data, error }
  } catch (error) {
    console.error('Error searching users:', error)
    return { data: null, error }
  }
}

export async function sendFriendRequest(friendId: string): Promise<{ success: boolean, error?: string }> {
  const supabase = await createClient()

  try {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    if (user.id === friendId) {
      return { success: false, error: 'Cannot send friend request to yourself' }
    }

    // Check if users exist
    const { data: friendData, error: friendError } = await supabase
      .from('users')
      .select('id')
      .eq('id', friendId)
      .single()

    if (friendError || !friendData) {
      return { success: false, error: 'User not found' }
    }

    // Check if already friends or request exists
    const { data: existingRequest, error: existingError } = await supabase
      .from('friends')
      .select('*')
      .or(`and(user_id.eq.${user.id},friend_id.eq.${friendId}),and(user_id.eq.${friendId},friend_id.eq.${user.id})`)
      .maybeSingle()

    if (existingRequest) {
      if (existingRequest.status === 'accepted') {
        return { success: false, error: 'Already friends' }
      } else if (existingRequest.status === 'pending') {
        if (existingRequest.user_id === user.id) {
          return { success: false, error: 'Friend request already sent' }
        } else {
          return { success: false, error: 'This user already sent you a friend request' }
        }
      }
    }

    // Send friend request
    const { error: insertError } = await supabase
      .from('friends')
      .insert({
        user_id: user.id,
        friend_id: friendId,
        status: 'pending'
      })

    if (insertError) {
      console.error('Error sending friend request:', insertError)
      return { success: false, error: 'Failed to send friend request' }
    }

    revalidatePath('/dashboard')
    revalidatePath('/friends')
    return { success: true }
  } catch (error) {
    console.error('Error in sendFriendRequest:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

export async function acceptFriendRequest(requestId: string): Promise<{ success: boolean, error?: string }> {
  const supabase = await createClient()

  try {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    // Verify the request is for the current user
    const { data: request, error: requestError } = await supabase
      .from('friends')
      .select('*')
      .eq('id', requestId)
      .single()

    if (requestError || !request) {
      return { success: false, error: 'Friend request not found' }
    }

    if (request.friend_id !== user.id) {
      return { success: false, error: 'Not authorized to accept this request' }
    }

    // Accept the request
    const { error: updateError } = await supabase
      .from('friends')
      .update({
        status: 'accepted',
        accepted_at: new Date().toISOString()
      })
      .eq('id', requestId)

    if (updateError) {
      console.error('Error accepting friend request:', updateError)
      return { success: false, error: 'Failed to accept friend request' }
    }

    revalidatePath('/friends')
    return { success: true }
  } catch (error) {
    console.error('Error in acceptFriendRequest:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

export async function rejectFriendRequest(requestId: string): Promise<{ success: boolean, error?: string }> {
  const supabase = await createClient()

  try {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    // Verify the request is for the current user
    const { data: request, error: requestError } = await supabase
      .from('friends')
      .select('*')
      .eq('id', requestId)
      .single()

    if (requestError || !request) {
      return { success: false, error: 'Friend request not found' }
    }

    if (request.friend_id !== user.id) {
      return { success: false, error: 'Not authorized to reject this request' }
    }

    // Delete the request (rejecting is the same as deleting)
    const { error: deleteError } = await supabase
      .from('friends')
      .delete()
      .eq('id', requestId)

    if (deleteError) {
      console.error('Error rejecting friend request:', deleteError)
      return { success: false, error: 'Failed to reject friend request' }
    }

    revalidatePath('/friends')
    return { success: true }
  } catch (error) {
    console.error('Error in rejectFriendRequest:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

export async function removeFriend(friendId: string): Promise<{ success: boolean, error?: string }> {
  const supabase = await createClient()

  try {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    // Remove the friend relationship
    const { error: deleteError } = await supabase
      .from('friends')
      .delete()
      .or(`and(user_id.eq.${user.id},friend_id.eq.${friendId}),and(user_id.eq.${friendId},friend_id.eq.${user.id})`)

    if (deleteError) {
      console.error('Error removing friend:', deleteError)
      return { success: false, error: 'Failed to remove friend' }
    }

    revalidatePath('/friends')
    return { success: true }
  } catch (error) {
    console.error('Error in removeFriend:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

export async function getFriends(): Promise<{ data: FriendRequest[] | null, error: any }> {
  const supabase = await createClient()

  try {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return { data: null, error: { message: 'Not authenticated' } }
    }

    const { data, error } = await supabase
      .from('friends')
      .select(`
        id,
        user_id,
        friend_id,
        status,
        created_at,
        accepted_at,
        user:users!friends_user_id_fkey(id, username, display_name, avatar_url),
        friend:users!friends_friend_id_fkey(id, username, display_name, avatar_url)
      `)
      .eq('status', 'accepted')
      .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`)

    return { data, error }
  } catch (error) {
    console.error('Error getting friends:', error)
    return { data: null, error }
  }
}

export async function getPendingRequests(): Promise<{ data: FriendRequest[] | null, error: any }> {
  const supabase = await createClient()

  try {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return { data: null, error: { message: 'Not authenticated' } }
    }

    console.log('🔍 Getting pending requests for user:', user.id)

    const { data, error } = await supabase
      .from('friends')
      .select(`
        id,
        user_id,
        friend_id,
        status,
        created_at,
        accepted_at,
        user:users!friends_user_id_fkey(id, username, display_name, avatar_url),
        friend:users!friends_friend_id_fkey(id, username, display_name, avatar_url)
      `)
      .eq('status', 'pending')
      .eq('friend_id', user.id)

    console.log('🔍 Pending requests query result:', { data, error, userId: user.id })

    return { data, error }
  } catch (error) {
    console.error('Error getting pending requests:', error)
    return { data: null, error }
  }
}

export async function getSentRequests(): Promise<{ data: FriendRequest[] | null, error: any }> {
  const supabase = await createClient()

  try {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return { data: null, error: { message: 'Not authenticated' } }
    }

    console.log('🔍 Getting sent requests for user:', user.id)

    const { data, error } = await supabase
      .from('friends')
      .select(`
        id,
        user_id,
        friend_id,
        status,
        created_at,
        accepted_at,
        user:users!friends_user_id_fkey(id, username, display_name, avatar_url),
        friend:users!friends_friend_id_fkey(id, username, display_name, avatar_url)
      `)
      .eq('status', 'pending')
      .eq('user_id', user.id)

    console.log('🔍 Sent requests query result:', { data, error, userId: user.id })

    return { data, error }
  } catch (error) {
    console.error('Error getting sent requests:', error)
    return { data: null, error }
  }
}


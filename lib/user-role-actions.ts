"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export interface BarStaffMember {
  id: string
  bar_id: string
  user_id: string
  role: 'owner' | 'manager' | 'staff'
  permissions: Record<string, any>
  is_active: boolean
  created_at: string
  user: {
    id: string
    username: string
    display_name: string
    email: string
  }
}

// Get all users (for admin to assign roles)
export async function getAllUsers(): Promise<Array<{
  id: string
  username: string
  display_name: string
  email: string
  created_at: string
}>> {
  const supabase = createClient()
  
  const { data: users, error } = await supabase
    .from("users")
    .select("id, username, display_name, email, created_at")
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching users:", error)
    return []
  }

  return users || []
}

// Get bar staff members
export async function getBarStaff(barId: string): Promise<BarStaffMember[]> {
  const supabase = createClient()
  
  const { data: staff, error } = await supabase
    .from("bar_staff")
    .select(`
      *,
      user:users!bar_staff_user_id_fkey(id, username, display_name, email)
    `)
    .eq("bar_id", barId)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching bar staff:", error)
    return []
  }

  return staff || []
}

// Add user as bar staff
export async function addBarStaff(
  barId: string, 
  userId: string, 
  role: 'owner' | 'manager' | 'staff' = 'staff',
  permissions: Record<string, any> = {}
) {
  const supabase = createClient()
  
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error("You must be logged in to add bar staff")
  }

  // Check if current user is bar owner/manager
  const { data: currentStaff } = await supabase
    .from("bar_staff")
    .select("role")
    .eq("bar_id", barId)
    .eq("user_id", user.id)
    .eq("is_active", true)
    .single()

  if (!currentStaff || !['owner', 'manager'].includes(currentStaff.role)) {
    throw new Error("You don't have permission to add bar staff")
  }

  // Check if user is already staff
  const { data: existingStaff } = await supabase
    .from("bar_staff")
    .select("id")
    .eq("bar_id", barId)
    .eq("user_id", userId)
    .single()

  if (existingStaff) {
    throw new Error("User is already a staff member")
  }

  const { data: staff, error } = await supabase
    .from("bar_staff")
    .insert({
      bar_id: barId,
      user_id: userId,
      role,
      permissions,
    })
    .select(`
      *,
      user:users!bar_staff_user_id_fkey(id, username, display_name, email)
    `)
    .single()

  if (error) {
    throw new Error(`Failed to add bar staff: ${error.message}`)
  }

  revalidatePath(`/bars/${barId}`)
  return staff
}

// Update bar staff role
export async function updateBarStaffRole(
  barId: string,
  staffId: string,
  newRole: 'owner' | 'manager' | 'staff',
  permissions: Record<string, any> = {}
) {
  const supabase = createClient()
  
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error("You must be logged in to update bar staff")
  }

  // Check if current user is bar owner
  const { data: currentStaff } = await supabase
    .from("bar_staff")
    .select("role")
    .eq("bar_id", barId)
    .eq("user_id", user.id)
    .eq("is_active", true)
    .single()

  if (!currentStaff || currentStaff.role !== 'owner') {
    throw new Error("Only bar owners can update staff roles")
  }

  const { data: staff, error } = await supabase
    .from("bar_staff")
    .update({
      role: newRole,
      permissions,
    })
    .eq("id", staffId)
    .eq("bar_id", barId)
    .select(`
      *,
      user:users!bar_staff_user_id_fkey(id, username, display_name, email)
    `)
    .single()

  if (error) {
    throw new Error(`Failed to update staff role: ${error.message}`)
  }

  revalidatePath(`/bars/${barId}`)
  return staff
}

// Remove bar staff
export async function removeBarStaff(barId: string, staffId: string) {
  const supabase = createClient()
  
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error("You must be logged in to remove bar staff")
  }

  // Check if current user is bar owner
  const { data: currentStaff } = await supabase
    .from("bar_staff")
    .select("role")
    .eq("bar_id", barId)
    .eq("user_id", user.id)
    .eq("is_active", true)
    .single()

  if (!currentStaff || currentStaff.role !== 'owner') {
    throw new Error("Only bar owners can remove staff")
  }

  // Don't allow removing the last owner
  const { data: ownerCount } = await supabase
    .from("bar_staff")
    .select("id")
    .eq("bar_id", barId)
    .eq("role", "owner")
    .eq("is_active", true)

  if (ownerCount && ownerCount.length <= 1) {
    const { data: staffToRemove } = await supabase
      .from("bar_staff")
      .select("role")
      .eq("id", staffId)
      .single()

    if (staffToRemove?.role === 'owner') {
      throw new Error("Cannot remove the last bar owner")
    }
  }

  const { error } = await supabase
    .from("bar_staff")
    .update({ is_active: false })
    .eq("id", staffId)
    .eq("bar_id", barId)

  if (error) {
    throw new Error(`Failed to remove bar staff: ${error.message}`)
  }

  revalidatePath(`/bars/${barId}`)
}

// Search users by username or email
export async function searchUsers(query: string): Promise<Array<{
  id: string
  username: string
  display_name: string
  email: string
}>> {
  const supabase = createClient()
  
  const { data: users, error } = await supabase
    .from("users")
    .select("id, username, display_name, email")
    .or(`username.ilike.%${query}%,display_name.ilike.%${query}%,email.ilike.%${query}%`)
    .limit(10)

  if (error) {
    console.error("Error searching users:", error)
    return []
  }

  return users || []
}

// Get user's bar roles
export async function getUserBarRoles(userId: string): Promise<Array<{
  bar_id: string
  bar_name: string
  role: string
  is_active: boolean
}>> {
  const supabase = createClient()
  
  const { data: roles, error } = await supabase
    .from("bar_staff")
    .select(`
      bar_id,
      role,
      is_active,
      bar:bars!bar_staff_bar_id_fkey(name)
    `)
    .eq("user_id", userId)

  if (error) {
    console.error("Error fetching user bar roles:", error)
    return []
  }

  return roles?.map(r => ({
    bar_id: r.bar_id,
    bar_name: r.bar?.name || 'Unknown Bar',
    role: r.role,
    is_active: r.is_active
  })) || []
}

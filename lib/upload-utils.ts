"use server"

import { createServerActionClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"

/**
 * Uploads a profile picture to Supabase storage
 * @param file - The file to upload
 * @param userId - The user's ID
 * @returns The public URL of the uploaded file, or null if upload failed
 */
export async function uploadProfilePicture(file: File, userId: string): Promise<string | null> {
  try {
    const cookieStore = await cookies()
    const supabase = createServerActionClient({ cookies: () => cookieStore })

    // Validate file type
    if (!file.type.startsWith("image/")) {
      throw new Error("File must be an image")
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      throw new Error("Image must be less than 5MB")
    }

    // Generate unique filename
    const fileExt = file.name.split(".").pop()
    const fileName = `${userId}-${Date.now()}.${fileExt}`

    // Upload to Supabase storage
    // Supabase accepts File, Blob, ArrayBuffer, or Uint8Array
    const { data, error } = await supabase.storage
      .from("avatars")
      .upload(fileName, file, {
        contentType: file.type,
        upsert: false,
      })

    if (error) {
      console.error("Upload error:", error)
      throw error
    }

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from("avatars").getPublicUrl(fileName)

    return publicUrl
  } catch (error) {
    console.error("Error uploading profile picture:", error)
    return null
  }
}

/**
 * Deletes a profile picture from Supabase storage
 * @param avatarUrl - The URL of the avatar to delete
 */
export async function deleteProfilePicture(avatarUrl: string): Promise<void> {
  try {
    const cookieStore = await cookies()
    const supabase = createServerActionClient({ cookies: () => cookieStore })

    // Extract filename from URL
    const urlParts = avatarUrl.split("/")
    const fileName = urlParts[urlParts.length - 1]

    // Delete from storage
    await supabase.storage.from("avatars").remove([fileName])
  } catch (error) {
    console.error("Error deleting profile picture:", error)
    // Don't throw - deletion is not critical
  }
}


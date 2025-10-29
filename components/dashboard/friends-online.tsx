"use client"

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { ChevronDown, Users, Circle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface Friend {
  id: string
  display_name: string
  username: string
  is_online: boolean
  last_seen: string
}

export default function FriendsOnline() {
  const [friends, setFriends] = useState<Friend[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const fetchFriends = async () => {
      try {
        // Get current user first
        const { data: { user: currentUser } } = await supabase.auth.getUser()
        
        if (!currentUser) {
          setFriends([])
          setLoading(false)
          return
        }

        // Fetch actual friends from friends table
        const { data: friendsData, error } = await supabase
          .from('friends')
          .select(`
            id,
            user_id,
            friend_id,
            status,
            user:users!friends_user_id_fkey(id, display_name, username, is_online, last_seen),
            friend:users!friends_friend_id_fkey(id, display_name, username, is_online, last_seen)
          `)
          .eq('status', 'accepted')
          .or(`user_id.eq.${currentUser.id},friend_id.eq.${currentUser.id}`)

        if (error) {
          console.error('Error fetching friends:', error)
          setFriends([])
        } else {
          // Map friends data to extract the other user's info
          const mappedFriends = (friendsData || []).map((friendship: any) => {
            const otherUser = friendship.user_id === currentUser.id ? friendship.friend : friendship.user
            return {
              id: otherUser.id,
              display_name: otherUser.display_name || otherUser.username,
              username: otherUser.username,
              is_online: otherUser.is_online || false,
              last_seen: otherUser.last_seen || new Date().toISOString()
            }
          })
          setFriends(mappedFriends)
        }
      } catch (error) {
        console.error('Error fetching friends:', error)
        setFriends([])
      } finally {
        setLoading(false)
      }
    }

    fetchFriends()
    
    // Refresh friends list periodically
    const interval = setInterval(fetchFriends, 30000) // Every 30 seconds
    
    return () => clearInterval(interval)
  }, [])

  const onlineFriends = friends.filter(friend => friend.is_online)
  const onlineCount = onlineFriends.length

  if (loading) {
    return (
      <div className="flex items-center space-x-2 text-gray-400">
        <Users className="h-4 w-4" />
        <span className="text-sm">Loading...</span>
      </div>
    )
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          className="flex items-center space-x-2 text-gray-300 hover:text-white hover:bg-gray-800/50 px-3 py-2 rounded-lg transition-colors"
        >
          <Users className="h-4 w-4" />
          <span className="text-sm font-medium">
            {onlineCount > 0 ? `${onlineCount} online` : 'No friends online'}
          </span>
          <ChevronDown className="h-3 w-3" />
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent 
        align="end" 
        className="w-64 bg-gray-900 border-gray-700 text-white"
      >
        <div className="px-3 py-2 border-b border-gray-700">
          <div className="flex items-center space-x-2">
            <Users className="h-4 w-4 text-gray-400" />
            <span className="text-sm font-medium">Friends Online</span>
          </div>
        </div>
        
        {friends.length === 0 ? (
          <div className="px-3 py-4 text-center text-gray-400 text-sm">
            No friends found
          </div>
        ) : (
          <div className="max-h-64 overflow-y-auto">
            {friends.map((friend) => (
              <DropdownMenuItem 
                key={friend.id}
                className="flex items-center space-x-3 px-3 py-2 hover:bg-gray-800 cursor-pointer"
                onClick={() => {
                  // You can add friend interaction logic here
                  console.log('Clicked friend:', friend.display_name)
                }}
              >
                <div className="relative">
                  <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center text-black font-bold text-sm">
                    {friend.display_name.charAt(0).toUpperCase()}
                  </div>
                  <Circle 
                    className={`absolute -bottom-1 -right-1 h-3 w-3 ${
                      friend.is_online 
                        ? 'text-green-500 fill-green-500' 
                        : 'text-gray-500 fill-gray-500'
                    }`} 
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-white truncate">
                    {friend.display_name}
                  </div>
                  <div className="text-xs text-gray-400 truncate">
                    @{friend.username}
                  </div>
                </div>
                <div className="text-xs text-gray-500">
                  {friend.is_online ? 'Online' : 'Offline'}
                </div>
              </DropdownMenuItem>
            ))}
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

"use client"

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
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

  useEffect(() => {
    const fetchFriends = async () => {
      try {
        // For now, get all users as "friends" (you can implement proper friend system later)
        const { data: allUsers, error } = await supabase
          .from('users')
          .select('id, display_name, username, is_online, last_seen')
          .limit(10) // Limit to 10 friends for dropdown

        if (error) {
          console.error('Error fetching friends:', error)
          // Fallback: create some mock friends
          setFriends([
            { id: '1', display_name: 'Alex', username: 'alex_gamer', is_online: true, last_seen: new Date().toISOString() },
            { id: '2', display_name: 'Sarah', username: 'sarah_plays', is_online: true, last_seen: new Date().toISOString() },
            { id: '3', display_name: 'Mike', username: 'mike_wins', is_online: false, last_seen: new Date(Date.now() - 300000).toISOString() },
          ])
        } else {
          setFriends(allUsers || [])
        }
      } catch (error) {
        console.error('Error fetching friends:', error)
        setFriends([])
      } finally {
        setLoading(false)
      }
    }

    fetchFriends()
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

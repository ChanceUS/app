'use client'

import { useState } from 'react'
import { searchUsers, sendFriendRequest, getPendingRequests, getSentRequests, acceptFriendRequest, rejectFriendRequest, FriendRequest } from '@/lib/friends-actions'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Search, UserPlus, CheckCircle, XCircle, Loader2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { useEffect } from 'react'

export default function AddFriendsSection() {
  const [searchTerm, setSearchTerm] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [pendingRequests, setPendingRequests] = useState<FriendRequest[]>([])
  const [sentRequests, setSentRequests] = useState<FriendRequest[]>([])
  const [isLoadingRequests, setIsLoadingRequests] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    loadPendingRequests()
  }, [])

  const loadPendingRequests = async () => {
    setIsLoadingRequests(true)
    
    const [pendingResult, sentResult] = await Promise.all([
      getPendingRequests(),
      getSentRequests()
    ])
    
    console.log('🔍 Loading pending requests, result:', pendingResult)
    console.log('🔍 Loading sent requests, result:', sentResult)
    
    if (!pendingResult.error && pendingResult.data) {
      setPendingRequests(pendingResult.data)
    }
    
    if (!sentResult.error && sentResult.data) {
      setSentRequests(sentResult.data)
    }
    
    setIsLoadingRequests(false)
  }

  const handleSearch = async () => {
    if (!searchTerm || searchTerm.trim().length < 2) {
      toast({
        title: "Search term too short",
        description: "Please enter at least 2 characters to search",
        variant: "destructive",
      })
      return
    }

    setIsSearching(true)
    const { data, error } = await searchUsers(searchTerm.trim())

    if (error) {
      toast({
        title: "Search failed",
        description: error.message || "Could not search for users",
        variant: "destructive",
      })
      setSearchResults([])
    } else {
      setSearchResults(data || [])
    }

    setIsSearching(false)
  }

  const handleSendRequest = async (userId: string, username: string) => {
    console.log('🔍 Sending friend request to:', userId, username)
    const result = await sendFriendRequest(userId)
    console.log('🔍 Full result:', result)
    console.log('🔍 Success:', result.success)
    console.log('🔍 Error:', result.error)

    if (result.success) {
      toast({
        title: "Friend request sent!",
        description: `Friend request sent to ${username}`,
      })
      loadPendingRequests()
    } else {
      toast({
        title: "Failed to send request",
        description: result.error || "Could not send friend request",
        variant: "destructive",
      })
    }
  }

  const handleAcceptRequest = async (requestId: string) => {
    const { success, error } = await acceptFriendRequest(requestId)

    if (success) {
      toast({
        title: "Friend request accepted!",
        description: "You are now friends",
      })
      loadPendingRequests()
    } else {
      toast({
        title: "Failed to accept request",
        description: error || "Could not accept friend request",
        variant: "destructive",
      })
    }
  }

  const handleRejectRequest = async (requestId: string) => {
    const { success, error } = await rejectFriendRequest(requestId)

    if (success) {
      toast({
        title: "Friend request rejected",
      })
      loadPendingRequests()
    } else {
      toast({
        title: "Failed to reject request",
        description: error || "Could not reject friend request",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-6 shadow-lg">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-white">Add Friends</h3>
      </div>
      
      {/* Search Input */}
      <div className="flex gap-2 mb-4">
        <Input
          placeholder="Search by username..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          className="bg-gray-700/50 border-gray-600 text-white flex-1 placeholder:text-gray-500"
        />
        <Button onClick={handleSearch} disabled={isSearching} size="sm">
          {isSearching ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Search className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Pending Friend Requests */}
      {isLoadingRequests ? (
        <div className="flex items-center justify-center py-4">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
        </div>
      ) : pendingRequests.length > 0 ? (
        <div className="mb-4">
          <p className="text-sm text-gray-400 mb-2">
            Pending Requests ({pendingRequests.length})
          </p>
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {pendingRequests.map((request) => (
              <div key={request.id} className="flex items-center justify-between p-2 bg-gray-700/50 rounded-lg border border-gray-600/30">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-orange-500/20 flex items-center justify-center ring-2 ring-orange-500/30">
                    <span className="text-orange-500 font-semibold text-xs">
                      {request.user?.display_name?.[0]?.toUpperCase() || request.user?.username?.[0]?.toUpperCase() || '?'}
                    </span>
                  </div>
                  <div>
                    <p className="text-white font-medium text-sm">{request.user?.display_name || request.user?.username}</p>
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant="default"
                    onClick={() => handleAcceptRequest(request.id)}
                    className="h-7 w-7 p-0"
                  >
                    <CheckCircle className="h-3 w-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleRejectRequest(request.id)}
                    className="h-7 w-7 p-0"
                  >
                    <XCircle className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {/* Sent Friend Requests */}
      {sentRequests.length > 0 && (
        <div className="mb-4">
          <p className="text-sm text-gray-400 mb-2">
            Sent Requests ({sentRequests.length})
          </p>
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {sentRequests.map((request) => (
              <div key={request.id} className="flex items-center justify-between p-2 bg-gray-700/50 rounded-lg border border-gray-600/30">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-orange-500/20 flex items-center justify-center ring-2 ring-orange-500/30">
                    <span className="text-orange-500 font-semibold text-xs">
                      {request.friend?.display_name?.[0]?.toUpperCase() || request.friend?.username?.[0]?.toUpperCase() || '?'}
                    </span>
                  </div>
                  <div>
                    <p className="text-white font-medium text-sm">{request.friend?.display_name || request.friend?.username}</p>
                    <p className="text-xs text-orange-500">Pending...</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Search Results */}
      {searchResults.length > 0 && (
        <div className="space-y-2 max-h-48 overflow-y-auto">
          <p className="text-sm text-gray-400">Results</p>
          {searchResults.map((user) => (
            <div key={user.id} className="flex items-center justify-between p-2 bg-gray-700/50 rounded-lg border border-gray-600/30 hover:bg-gray-700/70 transition-colors">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-orange-500/20 flex items-center justify-center ring-2 ring-orange-500/30">
                  <span className="text-orange-500 font-semibold text-xs">
                    {user.display_name?.[0]?.toUpperCase() || user.username?.[0]?.toUpperCase() || '?'}
                  </span>
                </div>
                <div>
                  <p className="text-white font-medium text-sm">{user.display_name || user.username}</p>
                  <p className="text-xs text-gray-400">@{user.username}</p>
                </div>
              </div>
              <Button
                size="sm"
                onClick={() => handleSendRequest(user.id, user.display_name || user.username)}
                className="h-7 px-3 bg-orange-500 hover:bg-orange-600 text-white"
              >
                <UserPlus className="h-3 w-3 mr-1" />
                Add
              </Button>
            </div>
          ))}
        </div>
      )}

      {searchTerm && searchResults.length === 0 && !isSearching && (
        <div className="text-center py-4 text-gray-400 text-sm">
          No results found
        </div>
      )}
    </div>
  )
}


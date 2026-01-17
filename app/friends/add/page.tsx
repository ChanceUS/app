'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { searchUsers, sendFriendRequest, getPendingRequests, acceptFriendRequest, rejectFriendRequest, FriendRequest } from '@/lib/friends-actions'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Search, UserPlus, CheckCircle, XCircle, Loader2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import Header from '@/components/navigation/header'

export default function AddFriendsPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [pendingRequests, setPendingRequests] = useState<FriendRequest[]>([])
  const [isLoadingRequests, setIsLoadingRequests] = useState(true)
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    loadPendingRequests()
  }, [])

  const loadPendingRequests = async () => {
    setIsLoadingRequests(true)
    const { data, error } = await getPendingRequests()
    
    if (!error && data) {
      setPendingRequests(data)
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
    const { success, error } = await sendFriendRequest(userId)

    if (success) {
      toast({
        title: "Friend request sent!",
        description: `Friend request sent to ${username}`,
      })
      loadPendingRequests() // Refresh pending requests
    } else {
      toast({
        title: "Failed to send request",
        description: error || "Could not send friend request",
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
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-950">
      <Header />
      
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Add Friends</h1>
          <p className="text-gray-400">Search for users and send friend requests</p>
        </div>
      </div>

      <div className="container mx-auto px-4 pb-8 max-w-4xl space-y-6">
        {/* Pending Friend Requests */}
        {isLoadingRequests ? (
          <Card>
            <CardContent className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </CardContent>
          </Card>
        ) : pendingRequests.length > 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>Pending Friend Requests</CardTitle>
              <CardDescription>You have {pendingRequests.length} pending friend request{pendingRequests.length > 1 ? 's' : ''}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {pendingRequests.map((request) => (
                <div key={request.id} className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
                      <span className="text-primary font-semibold">
                        {request.user?.display_name?.[0]?.toUpperCase() || request.user?.username?.[0]?.toUpperCase() || '?'}
                      </span>
                    </div>
                    <div>
                      <p className="text-white font-medium">{request.user?.display_name || request.user?.username}</p>
                      <p className="text-sm text-gray-400">@{request.user?.username}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="default"
                      onClick={() => handleAcceptRequest(request.id)}
                      className="gap-2"
                    >
                      <CheckCircle className="h-4 w-4" />
                      Accept
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleRejectRequest(request.id)}
                      className="gap-2"
                    >
                      <XCircle className="h-4 w-4" />
                      Reject
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        ) : null}

        {/* Search Section */}
        <Card>
          <CardHeader>
            <CardTitle>Search Users</CardTitle>
            <CardDescription>Find friends by username or display name</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2 mb-6">
              <Input
                placeholder="Search by username or display name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="bg-gray-800 border-gray-700 text-white"
              />
              <Button onClick={handleSearch} disabled={isSearching}>
                {isSearching ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Search className="h-4 w-4" />
                )}
              </Button>
            </div>

            {/* Search Results */}
            {searchResults.length > 0 ? (
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide">Results</h3>
                {searchResults.map((user) => (
                  <div key={user.id} className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg hover:bg-gray-800/70 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
                        <span className="text-primary font-semibold">
                          {user.display_name?.[0]?.toUpperCase() || user.username?.[0]?.toUpperCase() || '?'}
                        </span>
                      </div>
                      <div>
                        <p className="text-white font-medium">{user.display_name || user.username}</p>
                        <p className="text-sm text-gray-400">@{user.username}</p>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => handleSendRequest(user.id, user.display_name || user.username)}
                      className="gap-2"
                    >
                      <UserPlus className="h-4 w-4" />
                      Add Friend
                    </Button>
                  </div>
                ))}
              </div>
            ) : searchTerm && !isSearching ? (
              <div className="text-center py-8 text-gray-400">
                  <p>No results found</p>
                  <p className="text-sm text-gray-500 mt-2">Try a different search term</p>
                </div>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}


"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { 
  Trophy, 
  Gift, 
  CheckCircle, 
  Clock, 
  User, 
  Calendar,
  Search,
  Filter
} from "lucide-react"
import { toast } from "sonner"

interface DrinkReward {
  id: string
  participant_id: string
  participant_name: string
  session_id: string
  reward_type: string
  reward_description: string
  is_claimed: boolean
  claimed_at?: string
  claimed_by_staff_id?: string
  created_at: string
  score: number
}

interface DrinkRewardsManagerProps {
  barId: string
}

export default function DrinkRewardsManager({ barId }: DrinkRewardsManagerProps) {
  const [rewards, setRewards] = useState<DrinkReward[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterType, setFilterType] = useState<"all" | "unclaimed" | "claimed">("all")

  useEffect(() => {
    loadRewards()
  }, [barId])

  const loadRewards = async () => {
    setIsLoading(true)
    try {
      // This would typically fetch from the database
      // For now, we'll use mock data
      const mockRewards: DrinkReward[] = [
        {
          id: "1",
          participant_id: "p1",
          participant_name: "John Doe",
          session_id: "s1",
          reward_type: "high_score",
          reward_description: "Congratulations! You beat the high score and earned a free drink!",
          is_claimed: false,
          created_at: new Date().toISOString(),
          score: 850
        },
        {
          id: "2",
          participant_id: "p2",
          participant_name: "Jane Smith",
          session_id: "s1",
          reward_type: "perfect_score",
          reward_description: "Amazing! Perfect score earns you a premium drink!",
          is_claimed: true,
          claimed_at: new Date(Date.now() - 3600000).toISOString(),
          created_at: new Date(Date.now() - 7200000).toISOString(),
          score: 1000
        },
        {
          id: "3",
          participant_id: "p3",
          participant_name: "Mike Johnson",
          session_id: "s2",
          reward_type: "high_score",
          reward_description: "Congratulations! You beat the high score and earned a free drink!",
          is_claimed: false,
          created_at: new Date(Date.now() - 1800000).toISOString(),
          score: 920
        }
      ]
      
      setRewards(mockRewards)
    } catch (error) {
      console.error("Error loading rewards:", error)
      toast.error("Failed to load drink rewards")
    } finally {
      setIsLoading(false)
    }
  }

  const handleClaimReward = async (rewardId: string) => {
    try {
      // This would typically update the database
      setRewards(prev => 
        prev.map(reward => 
          reward.id === rewardId 
            ? { 
                ...reward, 
                is_claimed: true, 
                claimed_at: new Date().toISOString(),
                claimed_by_staff_id: "current_user_id" // This would be the actual user ID
              }
            : reward
        )
      )
      toast.success("Reward claimed successfully!")
    } catch (error) {
      console.error("Error claiming reward:", error)
      toast.error("Failed to claim reward")
    }
  }

  const filteredRewards = rewards.filter(reward => {
    const matchesSearch = reward.participant_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         reward.reward_type.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesFilter = filterType === "all" || 
                         (filterType === "unclaimed" && !reward.is_claimed) ||
                         (filterType === "claimed" && reward.is_claimed)
    
    return matchesSearch && matchesFilter
  })

  const unclaimedCount = rewards.filter(r => !r.is_claimed).length
  const claimedCount = rewards.filter(r => r.is_claimed).length

  if (isLoading) {
    return (
      <Card className="bg-white/10 backdrop-blur-sm border-white/20">
        <CardContent className="p-6">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto mb-4"></div>
            <p className="text-white/80">Loading drink rewards...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-white/10 backdrop-blur-sm border-white/20">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Gift className="h-5 w-5" />
          Drink Rewards Management
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white/5 p-4 rounded-lg text-center">
            <div className="text-2xl font-bold text-yellow-400">{unclaimedCount}</div>
            <div className="text-white/60 text-sm">Unclaimed</div>
          </div>
          <div className="bg-white/5 p-4 rounded-lg text-center">
            <div className="text-2xl font-bold text-green-400">{claimedCount}</div>
            <div className="text-white/60 text-sm">Claimed</div>
          </div>
          <div className="bg-white/5 p-4 rounded-lg text-center">
            <div className="text-2xl font-bold text-blue-400">{rewards.length}</div>
            <div className="text-white/60 text-sm">Total</div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-4">
          <div className="flex-1">
            <Label htmlFor="search" className="text-white">Search</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-white/60" />
              <Input
                id="search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by name or reward type..."
                className="pl-10 bg-white/20 border-white/30 text-white placeholder:text-white/60"
              />
            </div>
          </div>
          <div className="w-48">
            <Label htmlFor="filter" className="text-white">Filter</Label>
            <select
              id="filter"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as "all" | "unclaimed" | "claimed")}
              className="w-full p-2 rounded-md bg-white/20 border border-white/30 text-white"
            >
              <option value="all">All Rewards</option>
              <option value="unclaimed">Unclaimed Only</option>
              <option value="claimed">Claimed Only</option>
            </select>
          </div>
        </div>

        {/* Rewards List */}
        <div className="space-y-3">
          {filteredRewards.length === 0 ? (
            <div className="text-center py-8">
              <Gift className="h-12 w-12 text-white/40 mx-auto mb-4" />
              <p className="text-white/60">No rewards found</p>
              <p className="text-white/40 text-sm">
                {searchTerm ? "Try adjusting your search" : "No drink rewards yet"}
              </p>
            </div>
          ) : (
            filteredRewards.map((reward) => (
              <div
                key={reward.id}
                className={`p-4 rounded-lg border transition-colors ${
                  reward.is_claimed
                    ? "bg-green-500/10 border-green-500/30"
                    : "bg-yellow-500/10 border-yellow-500/30"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-white/80" />
                        <span className="text-white font-medium">{reward.participant_name}</span>
                      </div>
                      <Badge 
                        variant="outline"
                        className={
                          reward.is_claimed
                            ? "bg-green-500/20 text-green-400 border-green-500/30"
                            : "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
                        }
                      >
                        {reward.reward_type.replace("_", " ").toUpperCase()}
                      </Badge>
                      <div className="text-white/60 text-sm">
                        Score: {reward.score}
                      </div>
                    </div>
                    
                    <p className="text-white/80 text-sm mb-2">{reward.reward_description}</p>
                    
                    <div className="flex items-center gap-4 text-white/60 text-xs">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(reward.created_at).toLocaleDateString()}
                      </div>
                      {reward.is_claimed && reward.claimed_at && (
                        <div className="flex items-center gap-1">
                          <CheckCircle className="h-3 w-3" />
                          Claimed {new Date(reward.claimed_at).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {!reward.is_claimed && (
                    <Button
                      onClick={() => handleClaimReward(reward.id)}
                      size="sm"
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Claim
                    </Button>
                  )}
                  
                  {reward.is_claimed && (
                    <div className="flex items-center gap-1 text-green-400">
                      <CheckCircle className="h-4 w-4" />
                      <span className="text-sm">Claimed</span>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Instructions */}
        <div className="bg-white/5 rounded-lg p-4">
          <h4 className="text-white font-medium mb-2">How to Use</h4>
          <div className="text-white/80 text-sm space-y-1">
            <p>• <strong>Unclaimed rewards:</strong> Customers can show these to staff to claim their drinks</p>
            <p>• <strong>Claim rewards:</strong> Click "Claim" when a customer shows their reward</p>
            <p>• <strong>Reward types:</strong> High score, perfect score, first place, etc.</p>
            <p>• <strong>Verification:</strong> Always verify the customer's identity before claiming</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

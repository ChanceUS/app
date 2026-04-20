"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  Users, 
  UserPlus, 
  Search, 
  Crown, 
  Shield, 
  User, 
  Trash2, 
  Edit,
  Mail,
  CheckCircle,
  XCircle
} from "lucide-react"
import { toast } from "sonner"
import { 
  getBarStaff, 
  addBarStaff, 
  updateBarStaffRole, 
  removeBarStaff, 
  searchUsers 
} from "@/lib/user-role-actions"
import type { BarStaffMember } from "@/lib/user-role-actions"

interface StaffManagementProps {
  barId: string
}

export default function StaffManagement({ barId }: StaffManagementProps) {
  const [staff, setStaff] = useState<BarStaffMember[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<Array<{
    id: string
    username: string
    display_name: string
    email: string
  }>>([])
  const [isSearching, setIsSearching] = useState(false)
  const [selectedUser, setSelectedUser] = useState<string>("")
  const [selectedRole, setSelectedRole] = useState<'owner' | 'manager' | 'staff'>('staff')
  const [isAdding, setIsAdding] = useState(false)

  useEffect(() => {
    loadStaff()
  }, [barId])

  const loadStaff = async () => {
    try {
      const staffData = await getBarStaff(barId)
      setStaff(staffData)
    } catch (error) {
      console.error("Error loading staff:", error)
      toast.error("Failed to load staff members")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSearchUsers = async (query: string) => {
    if (query.length < 2) {
      setSearchResults([])
      return
    }

    setIsSearching(true)
    try {
      const results = await searchUsers(query)
      setSearchResults(results)
    } catch (error) {
      console.error("Error searching users:", error)
      toast.error("Failed to search users")
    } finally {
      setIsSearching(false)
    }
  }

  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedUser) {
      toast.error("Please select a user")
      return
    }

    setIsAdding(true)
    try {
      await addBarStaff(barId, selectedUser, selectedRole)
      await loadStaff()
      setShowAddForm(false)
      setSelectedUser("")
      setSelectedRole('staff')
      setSearchQuery("")
      setSearchResults([])
      toast.success("Staff member added successfully!")
    } catch (error: any) {
      toast.error(error.message || "Failed to add staff member")
    } finally {
      setIsAdding(false)
    }
  }

  const handleUpdateRole = async (staffId: string, newRole: 'owner' | 'manager' | 'staff') => {
    try {
      await updateBarStaffRole(barId, staffId, newRole)
      await loadStaff()
      toast.success("Role updated successfully!")
    } catch (error: any) {
      toast.error(error.message || "Failed to update role")
    }
  }

  const handleRemoveStaff = async (staffId: string, staffName: string) => {
    if (!confirm(`Are you sure you want to remove ${staffName} from the bar staff?`)) {
      return
    }

    try {
      await removeBarStaff(barId, staffId)
      await loadStaff()
      toast.success("Staff member removed successfully!")
    } catch (error: any) {
      toast.error(error.message || "Failed to remove staff member")
    }
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'owner':
        return <Crown className="h-4 w-4 text-yellow-500" />
      case 'manager':
        return <Shield className="h-4 w-4 text-blue-500" />
      default:
        return <User className="h-4 w-4 text-gray-500" />
    }
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'owner':
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
      case 'manager':
        return "bg-blue-500/20 text-blue-400 border-blue-500/30"
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/30"
    }
  }

  if (isLoading) {
    return (
      <Card className="bg-white/10 backdrop-blur-sm border-white/20">
        <CardContent className="p-6">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto mb-4"></div>
            <p className="text-white/80">Loading staff members...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-white/10 backdrop-blur-sm border-white/20">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-white flex items-center gap-2">
            <Users className="h-5 w-5" />
            Staff Management
          </CardTitle>
          <Button
            onClick={() => setShowAddForm(!showAddForm)}
            className="bg-purple-600 hover:bg-purple-700 text-white"
          >
            <UserPlus className="h-4 w-4 mr-2" />
            Add Staff
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Add Staff Form */}
        {showAddForm && (
          <div className="bg-white/5 rounded-lg p-4 space-y-4">
            <h3 className="text-white font-medium">Add New Staff Member</h3>
            
            <form onSubmit={handleAddStaff} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="user-search" className="text-white">Search Users</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-white/60" />
                  <Input
                    id="user-search"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value)
                      handleSearchUsers(e.target.value)
                    }}
                    placeholder="Search by username, name, or email..."
                    className="pl-10 bg-white/20 border-white/30 text-white placeholder:text-white/60"
                  />
                </div>
                
                {/* Search Results */}
                {searchResults.length > 0 && (
                  <div className="bg-black/30 rounded-lg p-2 space-y-1 max-h-40 overflow-y-auto">
                    {searchResults.map((user) => (
                      <div
                        key={user.id}
                        className={`p-2 rounded cursor-pointer transition-colors ${
                          selectedUser === user.id
                            ? "bg-purple-500/30"
                            : "hover:bg-white/10"
                        }`}
                        onClick={() => setSelectedUser(user.id)}
                      >
                        <div className="text-white font-medium">{user.display_name}</div>
                        <div className="text-white/60 text-sm">@{user.username} • {user.email}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="role-select" className="text-white">Role</Label>
                <Select value={selectedRole} onValueChange={(value: 'owner' | 'manager' | 'staff') => setSelectedRole(value)}>
                  <SelectTrigger className="bg-white/20 border-white/30 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="staff">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        Staff - Basic access
                      </div>
                    </SelectItem>
                    <SelectItem value="manager">
                      <div className="flex items-center gap-2">
                        <Shield className="h-4 w-4" />
                        Manager - Full management access
                      </div>
                    </SelectItem>
                    <SelectItem value="owner">
                      <div className="flex items-center gap-2">
                        <Crown className="h-4 w-4" />
                        Owner - Complete control
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-2">
                <Button
                  type="submit"
                  disabled={!selectedUser || isAdding}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                >
                  {isAdding ? "Adding..." : "Add Staff Member"}
                </Button>
                <Button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  variant="outline"
                  className="bg-white/10 border-white/30 text-white hover:bg-white/20"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        )}

        {/* Staff List */}
        <div className="space-y-3">
          {staff.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-white/40 mx-auto mb-4" />
              <p className="text-white/60">No staff members yet</p>
              <p className="text-white/40 text-sm">Add staff members to help manage the bar</p>
            </div>
          ) : (
            staff.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between bg-white/5 p-4 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    {getRoleIcon(member.role)}
                    <div>
                      <div className="text-white font-medium">{member.user.display_name}</div>
                      <div className="text-white/60 text-sm">@{member.user.username}</div>
                    </div>
                  </div>
                  
                  <Badge 
                    variant="outline"
                    className={getRoleColor(member.role)}
                  >
                    {member.role.toUpperCase()}
                  </Badge>
                  
                  <div className="flex items-center gap-1">
                    {member.is_active ? (
                      <CheckCircle className="h-4 w-4 text-green-400" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-400" />
                    )}
                    <span className="text-white/60 text-sm">
                      {member.is_active ? "Active" : "Inactive"}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {/* Role Change Dropdown */}
                  <Select
                    value={member.role}
                    onValueChange={(value: 'owner' | 'manager' | 'staff') => 
                      handleUpdateRole(member.id, value)
                    }
                  >
                    <SelectTrigger className="w-32 bg-white/10 border-white/30 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="staff">Staff</SelectItem>
                      <SelectItem value="manager">Manager</SelectItem>
                      <SelectItem value="owner">Owner</SelectItem>
                    </SelectContent>
                  </Select>

                  <Button
                    onClick={() => handleRemoveStaff(member.id, member.user.display_name)}
                    size="sm"
                    variant="outline"
                    className="bg-red-500/20 border-red-500/30 text-red-400 hover:bg-red-500/30"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Instructions */}
        <div className="bg-white/5 rounded-lg p-4">
          <h4 className="text-white font-medium mb-2">Role Permissions</h4>
          <div className="space-y-2 text-white/80 text-sm">
            <div className="flex items-center gap-2">
              <Crown className="h-4 w-4 text-yellow-500" />
              <span><strong>Owner:</strong> Complete control, can manage all staff and settings</span>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-blue-500" />
              <span><strong>Manager:</strong> Can manage trivia games and sessions, view analytics</span>
            </div>
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-gray-500" />
              <span><strong>Staff:</strong> Can start/stop sessions and manage drink rewards</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

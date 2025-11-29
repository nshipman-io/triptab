import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Check, Crown, UserX, ChevronDown } from 'lucide-react'
import { api } from '@/lib/api'
import type { TripMember, MemberRole } from '@/types'

interface MemberManagementProps {
  tripId: string
  members: TripMember[]
  currentUserId: string
  isOwner: boolean
  onMemberUpdate: () => void
}

const ROLE_OPTIONS: { value: MemberRole; label: string; description: string }[] = [
  { value: 'editor', label: 'Editor', description: 'Can edit itinerary and add items' },
  { value: 'viewer', label: 'Viewer', description: 'Can only view the trip' },
]

export function MemberManagement({
  tripId,
  members,
  currentUserId,
  isOwner,
  onMemberUpdate,
}: MemberManagementProps) {
  const [expandedMemberId, setExpandedMemberId] = useState<string | null>(null)
  const [updatingMemberId, setUpdatingMemberId] = useState<string | null>(null)

  const handleRoleChange = async (memberId: string, newRole: MemberRole) => {
    setUpdatingMemberId(memberId)
    try {
      await api.updateMemberStatus(tripId, memberId, { role: newRole })
      onMemberUpdate()
      setExpandedMemberId(null)
    } catch (error) {
      console.error('Failed to update member role:', error)
    } finally {
      setUpdatingMemberId(null)
    }
  }

  const handleRemoveMember = async (memberId: string) => {
    if (!confirm('Are you sure you want to remove this member?')) return
    setUpdatingMemberId(memberId)
    try {
      await api.removeMember(tripId, memberId)
      onMemberUpdate()
    } catch (error) {
      console.error('Failed to remove member:', error)
    } finally {
      setUpdatingMemberId(null)
    }
  }

  return (
    <Card className="p-6">
      <CardHeader className="p-0 mb-4">
        <CardTitle className="text-lg font-serif">Trip Members</CardTitle>
        {isOwner && (
          <CardDescription className="text-ink-light mt-1">
            Manage member permissions
          </CardDescription>
        )}
      </CardHeader>
      <CardContent className="p-0">
        {members.length === 0 ? (
          <p className="text-sm text-ink-light">No members yet. Share the link to invite people!</p>
        ) : (
          <div className="space-y-3">
            {members.map((member) => {
              const isSelf = member.user_id === currentUserId
              const isMemberOwner = member.role === 'owner'
              const isExpanded = expandedMemberId === member.id
              const isUpdating = updatingMemberId === member.id

              return (
                <div key={member.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-forest/10 text-sm font-medium text-forest">
                        {member.user.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-medium flex items-center gap-1">
                          {member.user.name}
                          {isMemberOwner && <Crown className="h-3 w-3 text-golden" />}
                          {isSelf && <span className="text-xs text-ink-light">(you)</span>}
                        </p>
                        <p className="text-xs text-ink-light capitalize">{member.role}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {member.tickets_confirmed && (
                        <span className="flex items-center gap-1 text-xs text-green-600">
                          <Check className="h-3 w-3" />
                        </span>
                      )}
                      {isOwner && !isMemberOwner && !isSelf && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setExpandedMemberId(isExpanded ? null : member.id)}
                          className="h-7 px-2"
                          disabled={isUpdating}
                        >
                          <ChevronDown className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Expanded Role Editor */}
                  {isExpanded && isOwner && !isMemberOwner && (
                    <div className="ml-11 space-y-2 rounded-lg border border-sand-dark bg-sand p-3">
                      <p className="text-xs font-medium text-ink-light mb-2">Change Role</p>
                      <div className="flex flex-wrap gap-2">
                        {ROLE_OPTIONS.map((role) => (
                          <Button
                            key={role.value}
                            variant={member.role === role.value ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => handleRoleChange(member.id, role.value)}
                            disabled={isUpdating}
                            className="text-xs"
                          >
                            {role.label}
                          </Button>
                        ))}
                      </div>
                      <div className="pt-2 border-t border-sand-dark mt-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveMember(member.id)}
                          disabled={isUpdating}
                          className="text-xs text-destructive hover:text-destructive hover:bg-destructive/10 gap-1"
                        >
                          <UserX className="h-3 w-3" />
                          Remove from trip
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

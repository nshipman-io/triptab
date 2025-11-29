import { useState, useEffect } from 'react'
import { Plus, Package, ListTodo, ShoppingCart } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { api } from '@/lib/api'
import type { Checklist, ChecklistType } from '@/types'
import { ChecklistCard } from './ChecklistCard'

const CHECKLIST_ICONS: Record<ChecklistType, React.ReactNode> = {
  packing: <Package className="h-4 w-4" />,
  todo: <ListTodo className="h-4 w-4" />,
  shopping: <ShoppingCart className="h-4 w-4" />,
}

const CHECKLIST_LABELS: Record<ChecklistType, string> = {
  packing: 'Packing List',
  todo: 'To-Do',
  shopping: 'Shopping',
}

interface ChecklistsTabProps {
  tripId: string
  canEdit?: boolean
}

export function ChecklistsTab({ tripId, canEdit = true }: ChecklistsTabProps) {
  const [checklists, setChecklists] = useState<Checklist[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newChecklistName, setNewChecklistName] = useState('')
  const [newChecklistType, setNewChecklistType] = useState<ChecklistType>('todo')

  useEffect(() => {
    loadChecklists()
  }, [tripId])

  const loadChecklists = async () => {
    try {
      const data = await api.getChecklists(tripId)
      setChecklists(data as Checklist[])
    } catch (error) {
      console.error('Failed to load checklists:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateChecklist = async () => {
    if (!newChecklistName.trim()) return

    try {
      const newChecklist = await api.createChecklist(tripId, {
        name: newChecklistName,
        type: newChecklistType,
        order: checklists.length,
      })
      setChecklists([...checklists, newChecklist as Checklist])
      setNewChecklistName('')
      setShowCreateForm(false)
    } catch (error) {
      console.error('Failed to create checklist:', error)
    }
  }

  const handleDeleteChecklist = async (checklistId: string) => {
    try {
      await api.deleteChecklist(tripId, checklistId)
      setChecklists(checklists.filter(c => c.id !== checklistId))
    } catch (error) {
      console.error('Failed to delete checklist:', error)
    }
  }

  const handleUpdateChecklist = (updatedChecklist: Checklist) => {
    setChecklists(checklists.map(c => c.id === updatedChecklist.id ? updatedChecklist : c))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-muted-foreground">Loading checklists...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Checklists</h2>
        {canEdit && (
          <Button onClick={() => setShowCreateForm(!showCreateForm)} size="sm">
            <Plus className="mr-2 h-4 w-4" />
            New Checklist
          </Button>
        )}
      </div>

      {/* Create Form */}
      {canEdit && showCreateForm && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Create New Checklist</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              placeholder="Checklist name"
              value={newChecklistName}
              onChange={(e) => setNewChecklistName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreateChecklist()}
            />
            <div className="flex gap-2">
              {(Object.keys(CHECKLIST_ICONS) as ChecklistType[]).map((type) => (
                <Button
                  key={type}
                  variant={newChecklistType === type ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setNewChecklistType(type)}
                  className="gap-2"
                >
                  {CHECKLIST_ICONS[type]}
                  {CHECKLIST_LABELS[type]}
                </Button>
              ))}
            </div>
            <div className="flex gap-2">
              <Button onClick={handleCreateChecklist} disabled={!newChecklistName.trim()}>
                Create
              </Button>
              <Button variant="outline" onClick={() => setShowCreateForm(false)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Checklists */}
      {checklists.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <ListTodo className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
            <h3 className="text-lg font-semibold">No checklists yet</h3>
            <p className="text-muted-foreground">
              Create a packing list, to-do, or shopping list for your trip
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:gap-6 grid-cols-1 md:grid-cols-2">
          {checklists.map((checklist) => (
            <ChecklistCard
              key={checklist.id}
              tripId={tripId}
              checklist={checklist}
              onUpdate={handleUpdateChecklist}
              onDelete={() => handleDeleteChecklist(checklist.id)}
              canEdit={canEdit}
            />
          ))}
        </div>
      )}
    </div>
  )
}

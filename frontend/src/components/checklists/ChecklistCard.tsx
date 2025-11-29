import { useState } from 'react'
import { Package, ListTodo, ShoppingCart, Trash2, Plus, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import { api } from '@/lib/api'
import type { Checklist, ChecklistItem, ChecklistType } from '@/types'
import { cn } from '@/lib/utils'

const CHECKLIST_ICONS: Record<ChecklistType, React.ReactNode> = {
  packing: <Package className="h-4 w-4" />,
  todo: <ListTodo className="h-4 w-4" />,
  shopping: <ShoppingCart className="h-4 w-4" />,
}

interface ChecklistCardProps {
  tripId: string
  checklist: Checklist
  onUpdate: (checklist: Checklist) => void
  onDelete: () => void
}

export function ChecklistCard({ tripId, checklist, onUpdate, onDelete }: ChecklistCardProps) {
  const [newItemContent, setNewItemContent] = useState('')
  const [isAdding, setIsAdding] = useState(false)

  const completedCount = checklist.items.filter(item => item.is_completed).length
  const totalCount = checklist.items.length
  const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0

  const handleAddItem = async () => {
    if (!newItemContent.trim()) return

    try {
      const newItem = await api.createChecklistItem(tripId, checklist.id, {
        content: newItemContent,
        order: checklist.items.length,
      })
      onUpdate({
        ...checklist,
        items: [...checklist.items, newItem as ChecklistItem],
      })
      setNewItemContent('')
      setIsAdding(false)
    } catch (error) {
      console.error('Failed to add item:', error)
    }
  }

  const handleToggleItem = async (item: ChecklistItem) => {
    try {
      await api.updateChecklistItem(tripId, checklist.id, item.id, {
        is_completed: !item.is_completed,
      })
      onUpdate({
        ...checklist,
        items: checklist.items.map(i =>
          i.id === item.id ? { ...i, is_completed: !i.is_completed } : i
        ),
      })
    } catch (error) {
      console.error('Failed to toggle item:', error)
    }
  }

  const handleDeleteItem = async (itemId: string) => {
    try {
      await api.deleteChecklistItem(tripId, checklist.id, itemId)
      onUpdate({
        ...checklist,
        items: checklist.items.filter(i => i.id !== itemId),
      })
    } catch (error) {
      console.error('Failed to delete item:', error)
    }
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            {CHECKLIST_ICONS[checklist.type as ChecklistType]}
            {checklist.name}
          </CardTitle>
          <Button variant="ghost" size="icon" onClick={onDelete} className="h-8 w-8 text-muted-foreground hover:text-destructive">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
        {totalCount > 0 && (
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{completedCount} of {totalCount} completed</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-1" />
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-2">
        {/* Items */}
        <div className="space-y-1">
          {checklist.items
            .sort((a, b) => a.order - b.order)
            .map((item) => (
              <div
                key={item.id}
                className="group flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-accent"
              >
                <button
                  onClick={() => handleToggleItem(item)}
                  className="flex-shrink-0"
                >
                  {item.is_completed ? (
                    <div className="flex h-5 w-5 items-center justify-center rounded border-2 border-primary bg-primary text-primary-foreground">
                      <Check className="h-3 w-3" />
                    </div>
                  ) : (
                    <div className="h-5 w-5 rounded border-2 border-muted-foreground/30" />
                  )}
                </button>
                <span
                  className={cn(
                    "flex-1 text-sm",
                    item.is_completed && "text-muted-foreground line-through"
                  )}
                >
                  {item.content}
                </span>
                <button
                  onClick={() => handleDeleteItem(item.id)}
                  className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            ))}
        </div>

        {/* Add Item */}
        {isAdding ? (
          <div className="flex gap-2">
            <Input
              placeholder="Add item..."
              value={newItemContent}
              onChange={(e) => setNewItemContent(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAddItem()
                if (e.key === 'Escape') {
                  setIsAdding(false)
                  setNewItemContent('')
                }
              }}
              autoFocus
              className="h-8 text-sm"
            />
            <Button size="sm" onClick={handleAddItem} className="h-8">
              Add
            </Button>
          </div>
        ) : (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsAdding(true)}
            className="w-full justify-start text-muted-foreground"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add item
          </Button>
        )}
      </CardContent>
    </Card>
  )
}

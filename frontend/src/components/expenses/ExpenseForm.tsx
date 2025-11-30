import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { Expense, ExpenseCategory, SplitType, TripMember } from '@/types'

const CATEGORIES: { value: ExpenseCategory; label: string }[] = [
  { value: 'food', label: 'Food & Drinks' },
  { value: 'transport', label: 'Transport' },
  { value: 'lodging', label: 'Lodging' },
  { value: 'activity', label: 'Activities' },
  { value: 'shopping', label: 'Shopping' },
  { value: 'other', label: 'Other' },
]

const SPLIT_TYPES: { value: SplitType; label: string; description: string }[] = [
  { value: 'equal', label: 'Equal', description: 'Split equally among all' },
  { value: 'percentage', label: 'Percentage', description: 'Custom percentages' },
]

interface ExpenseFormProps {
  expense?: Expense | null
  members: TripMember[]
  onSubmit: (data: Record<string, unknown>) => void
  onCancel: () => void
}

export function ExpenseForm({ expense, members, onSubmit, onCancel }: ExpenseFormProps) {
  const [description, setDescription] = useState(expense?.description || '')
  const [amount, setAmount] = useState(expense?.amount.toString() || '')
  const [category, setCategory] = useState<ExpenseCategory>(expense?.category || 'food')
  const [splitType, setSplitType] = useState<SplitType>(expense?.split_type || 'equal')
  const [expenseDate, setExpenseDate] = useState(
    expense?.expense_date || new Date().toISOString().split('T')[0]
  )
  const [notes, setNotes] = useState(expense?.notes || '')

  // Percentage split state - initialize with equal percentages for all members
  const [percentages, setPercentages] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {}
    const equalPct = members.length > 0 ? (100 / members.length).toFixed(1) : '0'
    members.forEach(m => {
      initial[m.user_id] = equalPct
    })
    return initial
  })

  // Update percentages when members change
  useEffect(() => {
    const equalPct = members.length > 0 ? (100 / members.length).toFixed(1) : '0'
    const newPercentages: Record<string, string> = {}
    members.forEach(m => {
      newPercentages[m.user_id] = percentages[m.user_id] || equalPct
    })
    setPercentages(newPercentages)
  }, [members])

  const totalPercentage = Object.values(percentages).reduce((sum, p) => sum + (parseFloat(p) || 0), 0)
  const percentageError = splitType === 'percentage' && Math.abs(totalPercentage - 100) > 0.1

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const data: Record<string, unknown> = {
      description,
      amount: parseFloat(amount),
      category,
      split_type: splitType,
      expense_date: expenseDate,
      notes: notes || undefined,
    }

    // Add split configs for percentage splits
    if (splitType === 'percentage') {
      data.split_configs = members.map(m => ({
        user_id: m.user_id,
        percentage: parseFloat(percentages[m.user_id]) || 0,
      }))
      data.member_ids = members.map(m => m.user_id)
    }

    onSubmit(data)
  }

  const isValid = description.trim() && parseFloat(amount) > 0 && !percentageError

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">
          {expense ? 'Edit Expense' : 'Add Expense'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              placeholder="What did you pay for?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          {/* Amount and Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Amount</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="pl-7"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={expenseDate}
                onChange={(e) => setExpenseDate(e.target.value)}
              />
            </div>
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label>Category</Label>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((cat) => (
                <Button
                  key={cat.value}
                  type="button"
                  variant={category === cat.value ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setCategory(cat.value)}
                >
                  {cat.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Split Type */}
          <div className="space-y-2">
            <Label>Split Type</Label>
            <div className="grid grid-cols-2 gap-2">
              {SPLIT_TYPES.map((type) => (
                <Button
                  key={type.value}
                  type="button"
                  variant={splitType === type.value ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSplitType(type.value)}
                  className="flex-col h-auto py-2"
                >
                  <span>{type.label}</span>
                  <span className="text-xs font-normal opacity-70 hidden sm:block">{type.description}</span>
                </Button>
              ))}
            </div>
          </div>

          {/* Percentage Split Configuration */}
          {splitType === 'percentage' && members.length > 0 && (
            <div className="space-y-3 p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center justify-between">
                <Label>Member Percentages</Label>
                <span className={`text-sm ${percentageError ? 'text-red-500' : 'text-muted-foreground'}`}>
                  Total: {totalPercentage.toFixed(1)}%
                  {percentageError && ' (must equal 100%)'}
                </span>
              </div>
              <div className="space-y-2">
                {members.map((member) => (
                  <div key={member.user_id} className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-medium text-primary shrink-0">
                      {member.user.name.charAt(0)}
                    </div>
                    <span className="flex-1 text-sm truncate">{member.user.name}</span>
                    <div className="relative w-24">
                      <Input
                        type="number"
                        step="0.1"
                        min="0"
                        max="100"
                        value={percentages[member.user_id] || '0'}
                        onChange={(e) => setPercentages(prev => ({
                          ...prev,
                          [member.user_id]: e.target.value
                        }))}
                        className="pr-6 text-right"
                      />
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">%</span>
                    </div>
                  </div>
                ))}
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  const equalPct = (100 / members.length).toFixed(1)
                  const newPercentages: Record<string, string> = {}
                  members.forEach(m => {
                    newPercentages[m.user_id] = equalPct
                  })
                  setPercentages(newPercentages)
                }}
                className="w-full text-xs"
              >
                Reset to equal split
              </Button>
            </div>
          )}

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes (optional)</Label>
            <Input
              id="notes"
              placeholder="Any additional details..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <Button type="submit" disabled={!isValid}>
              {expense ? 'Save Changes' : 'Add Expense'}
            </Button>
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

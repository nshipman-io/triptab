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
    <Card className="w-full">
      <CardHeader className="p-4 sm:p-6 pb-2 sm:pb-4">
        <CardTitle className="text-base sm:text-lg">
          {expense ? 'Edit Expense' : 'Add Expense'}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 sm:p-6 pt-0">
        <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
          {/* Description */}
          <div className="space-y-1.5">
            <Label htmlFor="description" className="text-sm">Description</Label>
            <Input
              id="description"
              placeholder="What did you pay for?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="h-9 sm:h-10"
            />
          </div>

          {/* Amount and Date */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="amount" className="text-sm">Amount</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="pl-7 h-9 sm:h-10"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="date" className="text-sm">Date</Label>
              <Input
                id="date"
                type="date"
                value={expenseDate}
                onChange={(e) => setExpenseDate(e.target.value)}
                className="h-9 sm:h-10"
              />
            </div>
          </div>

          {/* Category */}
          <div className="space-y-1.5">
            <Label className="text-sm">Category</Label>
            <div className="grid grid-cols-3 gap-1.5 sm:flex sm:flex-wrap sm:gap-2">
              {CATEGORIES.map((cat) => (
                <Button
                  key={cat.value}
                  type="button"
                  variant={category === cat.value ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setCategory(cat.value)}
                  className="h-8 text-xs sm:text-sm px-2 sm:px-3"
                >
                  {cat.label.split(' ')[0]}
                </Button>
              ))}
            </div>
          </div>

          {/* Split Type */}
          <div className="space-y-1.5">
            <Label className="text-sm">Split Type</Label>
            <div className="grid grid-cols-2 gap-2">
              {SPLIT_TYPES.map((type) => (
                <Button
                  key={type.value}
                  type="button"
                  variant={splitType === type.value ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSplitType(type.value)}
                  className="h-9 sm:h-auto sm:flex-col sm:py-2"
                >
                  <span className="text-sm">{type.label}</span>
                  <span className="text-xs font-normal opacity-70 hidden sm:block">{type.description}</span>
                </Button>
              ))}
            </div>
          </div>

          {/* Percentage Split Configuration */}
          {splitType === 'percentage' && members.length > 0 && (
            <div className="space-y-2 p-3 sm:p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center justify-between gap-2">
                <Label className="text-sm">Percentages</Label>
                <span className={`text-xs ${percentageError ? 'text-red-500' : 'text-muted-foreground'}`}>
                  {totalPercentage.toFixed(1)}%
                  {percentageError && ' ≠ 100%'}
                </span>
              </div>
              <div className="space-y-1.5">
                {members.map((member) => (
                  <div key={member.user_id} className="flex items-center gap-2">
                    <div className="flex h-6 w-6 sm:h-8 sm:w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary shrink-0">
                      {member.user.name.charAt(0)}
                    </div>
                    <span className="flex-1 text-xs sm:text-sm truncate">{member.user.name}</span>
                    <div className="relative w-20 sm:w-24">
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
                        className="pr-5 text-right h-8 sm:h-9 text-sm"
                      />
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">%</span>
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
                className="w-full text-xs h-8"
              >
                Reset to equal split
              </Button>
            </div>
          )}

          {/* Notes */}
          <div className="space-y-1.5">
            <Label htmlFor="notes" className="text-sm">Notes (optional)</Label>
            <Input
              id="notes"
              placeholder="Any additional details..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="h-9 sm:h-10"
            />
          </div>

          {/* Actions */}
          <div className="flex flex-col-reverse sm:flex-row gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onCancel} className="h-9 sm:h-10">
              Cancel
            </Button>
            <Button type="submit" disabled={!isValid} className="h-9 sm:h-10 flex-1 sm:flex-none">
              {expense ? 'Save' : 'Add Expense'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

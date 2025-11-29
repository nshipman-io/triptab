import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { Expense, ExpenseCategory, SplitType } from '@/types'

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
  { value: 'shares', label: 'Shares', description: 'By number of shares' },
  { value: 'exact', label: 'Exact', description: 'Specific amounts' },
]

interface ExpenseFormProps {
  expense?: Expense | null
  onSubmit: (data: Record<string, unknown>) => void
  onCancel: () => void
}

export function ExpenseForm({ expense, onSubmit, onCancel }: ExpenseFormProps) {
  const [description, setDescription] = useState(expense?.description || '')
  const [amount, setAmount] = useState(expense?.amount.toString() || '')
  const [category, setCategory] = useState<ExpenseCategory>(expense?.category || 'food')
  const [splitType, setSplitType] = useState<SplitType>(expense?.split_type || 'equal')
  const [expenseDate, setExpenseDate] = useState(
    expense?.expense_date || new Date().toISOString().split('T')[0]
  )
  const [notes, setNotes] = useState(expense?.notes || '')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    onSubmit({
      description,
      amount: parseFloat(amount),
      category,
      split_type: splitType,
      expense_date: expenseDate,
      notes: notes || undefined,
    })
  }

  const isValid = description.trim() && parseFloat(amount) > 0

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
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
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

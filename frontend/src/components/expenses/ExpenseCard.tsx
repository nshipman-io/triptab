import { Utensils, Car, Hotel, Ticket, ShoppingBag, MoreHorizontal, Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import type { Expense, ExpenseCategory } from '@/types'
import { cn } from '@/lib/utils'

const CATEGORY_ICONS: Record<ExpenseCategory, React.ReactNode> = {
  food: <Utensils className="h-4 w-4" />,
  transport: <Car className="h-4 w-4" />,
  lodging: <Hotel className="h-4 w-4" />,
  activity: <Ticket className="h-4 w-4" />,
  shopping: <ShoppingBag className="h-4 w-4" />,
  other: <MoreHorizontal className="h-4 w-4" />,
}

const CATEGORY_COLORS: Record<ExpenseCategory, string> = {
  food: 'bg-orange-100 text-orange-700',
  transport: 'bg-blue-100 text-blue-700',
  lodging: 'bg-purple-100 text-purple-700',
  activity: 'bg-green-100 text-green-700',
  shopping: 'bg-pink-100 text-pink-700',
  other: 'bg-gray-100 text-gray-700',
}

interface ExpenseCardProps {
  expense: Expense
  onEdit: () => void
  onDelete: () => void
  canEdit?: boolean
}

export function ExpenseCard({ expense, onEdit, onDelete, canEdit = true }: ExpenseCardProps) {
  const formattedDate = new Date(expense.expense_date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })

  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-4">
        {/* Category Icon */}
        <div className={cn(
          "flex h-10 w-10 items-center justify-center rounded-full",
          CATEGORY_COLORS[expense.category]
        )}>
          {CATEGORY_ICONS[expense.category]}
        </div>

        {/* Details */}
        <div className="flex-1 min-w-0">
          <h4 className="font-medium truncate">{expense.description}</h4>
          <p className="text-sm text-muted-foreground">
            {formattedDate} • {expense.split_type} split
          </p>
        </div>

        {/* Amount */}
        <div className="text-right">
          <p className="font-semibold">
            {expense.currency === 'USD' ? '$' : expense.currency}
            {Number(expense.amount).toFixed(2)}
          </p>
          <p className="text-xs text-muted-foreground">
            {expense.splits.length} {expense.splits.length === 1 ? 'person' : 'people'}
          </p>
        </div>

        {/* Actions */}
        {canEdit && (
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" onClick={onEdit} className="h-8 w-8">
              <Pencil className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={onDelete} className="h-8 w-8 text-muted-foreground hover:text-destructive">
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

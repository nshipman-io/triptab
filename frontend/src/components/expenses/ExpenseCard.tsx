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
    <Card className="w-full overflow-hidden">
      <CardContent className="p-3 sm:p-4">
        <div className="flex items-start sm:items-center gap-3">
          {/* Category Icon */}
          <div className={cn(
            "flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-full shrink-0",
            CATEGORY_COLORS[expense.category]
          )}>
            {CATEGORY_ICONS[expense.category]}
          </div>

          {/* Details & Amount */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <h4 className="font-medium truncate text-sm sm:text-base">{expense.description}</h4>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  {formattedDate} • {expense.split_type}
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className="font-semibold text-sm sm:text-base">
                  {expense.currency === 'USD' ? '$' : expense.currency}
                  {Number(expense.amount).toFixed(2)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {expense.splits.length} {expense.splits.length === 1 ? 'person' : 'people'}
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          {canEdit && (
            <div className="flex items-center gap-0.5 shrink-0">
              <Button variant="ghost" size="icon" onClick={onEdit} className="h-7 w-7 sm:h-8 sm:w-8">
                <Pencil className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={onDelete} className="h-7 w-7 sm:h-8 sm:w-8 text-muted-foreground hover:text-destructive">
                <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

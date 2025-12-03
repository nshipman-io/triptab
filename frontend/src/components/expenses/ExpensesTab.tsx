import { useState, useEffect, useRef } from 'react'
import { Plus, DollarSign, ArrowRight, Plane, Hotel, MapPin, Utensils, Car } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { api } from '@/lib/api'
import type { Expense, ExpenseSummary, SettlementPlan, TripMember, ItineraryItem, ItineraryItemType } from '@/types'
import { ExpenseCard } from './ExpenseCard'
import { ExpenseForm } from './ExpenseForm'
import { cn } from '@/lib/utils'

const ITEM_ICONS: Record<ItineraryItemType, React.ReactNode> = {
  flight: <Plane className="h-4 w-4" />,
  hotel: <Hotel className="h-4 w-4" />,
  experience: <MapPin className="h-4 w-4" />,
  restaurant: <Utensils className="h-4 w-4" />,
  transport: <Car className="h-4 w-4" />,
}

interface ExpensesTabProps {
  tripId: string
  members: TripMember[]
  currentUserId?: string
  canEdit?: boolean
  itineraryItems?: ItineraryItem[]
}

export function ExpensesTab({ tripId, members, currentUserId, canEdit = true, itineraryItems = [] }: ExpensesTabProps) {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [summary, setSummary] = useState<ExpenseSummary | null>(null)

  // Calculate itinerary costs
  const itineraryCosts = itineraryItems
    .filter(item => item.price && item.price > 0)
    .reduce((acc, item) => {
      acc.total += item.price || 0
      acc.byType[item.type] = (acc.byType[item.type] || 0) + (item.price || 0)
      acc.items.push(item)
      return acc
    }, { total: 0, byType: {} as Record<string, number>, items: [] as ItineraryItem[] })
  const [settlements, setSettlements] = useState<SettlementPlan | null>(null)
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null)
  const formRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    loadData()
  }, [tripId])

  // Scroll to form when it's shown
  useEffect(() => {
    if ((showForm || editingExpense) && formRef.current) {
      setTimeout(() => {
        formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }, 100)
    }
  }, [showForm, editingExpense])

  const loadData = async () => {
    try {
      const [expensesData, summaryData, settlementsData] = await Promise.all([
        api.getExpenses(tripId),
        api.getExpenseSummary(tripId),
        api.getSettlements(tripId),
      ])
      console.log('Expenses data:', expensesData)
      setExpenses(Array.isArray(expensesData) ? expensesData as Expense[] : [])
      setSummary(summaryData as ExpenseSummary)
      setSettlements(settlementsData as SettlementPlan)
    } catch (error) {
      console.error('Failed to load expenses:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateExpense = async (data: Record<string, unknown>) => {
    try {
      await api.createExpense(tripId, data)
      await loadData()
      setShowForm(false)
    } catch (error) {
      console.error('Failed to create expense:', error)
    }
  }

  const handleUpdateExpense = async (data: Record<string, unknown>) => {
    if (!editingExpense) return
    try {
      await api.updateExpense(tripId, editingExpense.id, data)
      await loadData()
      setEditingExpense(null)
    } catch (error) {
      console.error('Failed to update expense:', error)
    }
  }

  const handleDeleteExpense = async (expenseId: string) => {
    try {
      await api.deleteExpense(tripId, expenseId)
      await loadData()
    } catch (error) {
      console.error('Failed to delete expense:', error)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-muted-foreground">Loading expenses...</p>
      </div>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6 w-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg sm:text-xl font-serif text-ink">Expenses</h2>
        {canEdit && (
          <Button onClick={() => setShowForm(true)} size="sm" className="h-8 gap-1 px-2 sm:px-3">
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Add Expense</span>
            <span className="sm:hidden">Add</span>
          </Button>
        )}
      </div>

      {/* Itinerary Budget - show costs from booked items */}
      {itineraryCosts.total > 0 && (
        <Card className="bg-sand overflow-hidden">
          <CardHeader className="p-3 sm:p-6 pb-2 sm:pb-3">
            <CardTitle className="text-base sm:text-lg font-serif">Trip Budget</CardTitle>
            <p className="text-xl sm:text-2xl font-semibold">${itineraryCosts.total.toFixed(2)}</p>
            <CardDescription className="text-xs sm:text-sm">Estimated costs from your itinerary</CardDescription>
          </CardHeader>
          <CardContent className="p-3 sm:p-6 pt-0">
            <div className="space-y-1.5 sm:space-y-2">
              {Object.entries(itineraryCosts.byType).map(([type, amount]) => (
                <div key={type} className="flex items-center justify-between text-xs sm:text-sm">
                  <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                    {ITEM_ICONS[type as ItineraryItemType]}
                    <span className="capitalize">{type}s</span>
                  </div>
                  <span className="font-medium shrink-0">${amount.toFixed(2)}</span>
                </div>
              ))}
            </div>
            {itineraryCosts.items.length > 0 && (
              <div className="mt-3 sm:mt-4 pt-2 sm:pt-3 border-t border-sand-dark">
                <p className="text-xs text-ink-light mb-1.5 sm:mb-2">Items with prices:</p>
                <div className="space-y-1">
                  {itineraryCosts.items.slice(0, 3).map(item => (
                    <div key={item.id} className="flex items-center justify-between text-xs gap-2">
                      <span className="truncate min-w-0 flex-1">{item.title}</span>
                      <span className="shrink-0">${item.price?.toFixed(2)}</span>
                    </div>
                  ))}
                  {itineraryCosts.items.length > 3 && (
                    <p className="text-xs text-ink-light">
                      +{itineraryCosts.items.length - 3} more items
                    </p>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Summary Cards - Grid on mobile, 3 cols on desktop */}
      {summary && (
        <div className="grid grid-cols-3 gap-2 sm:gap-4">
          {/* Total */}
          <Card className="overflow-hidden">
            <CardHeader className="p-2 sm:p-6 pb-1 sm:pb-2">
              <CardDescription className="text-[10px] sm:text-xs">Expenses</CardDescription>
              <CardTitle className="text-sm sm:text-2xl">
                ${Number(summary.total_expenses).toFixed(0)}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-2 sm:p-6 pt-0">
              <p className="text-[10px] sm:text-xs text-muted-foreground">
                {summary.expense_count} item{summary.expense_count !== 1 ? 's' : ''}
              </p>
            </CardContent>
          </Card>

          {/* Balances */}
          <Card className="overflow-hidden">
            <CardHeader className="p-2 sm:p-6 pb-1 sm:pb-2">
              <CardDescription className="text-[10px] sm:text-xs">Balance</CardDescription>
              {(() => {
                const userBalance = currentUserId
                  ? summary.balances.find(b => b.user_id === currentUserId)
                  : summary.balances[0]
                return userBalance ? (
                  <CardTitle className={cn(
                    "text-sm sm:text-2xl",
                    userBalance.net_balance > 0 ? "text-green-600" : userBalance.net_balance < 0 ? "text-red-600" : ""
                  )}>
                    {userBalance.net_balance >= 0 ? '+' : ''}${Math.abs(Number(userBalance.net_balance)).toFixed(0)}
                  </CardTitle>
                ) : null
              })()}
            </CardHeader>
            <CardContent className="p-2 sm:p-6 pt-0">
              {(() => {
                const userBalance = currentUserId
                  ? summary.balances.find(b => b.user_id === currentUserId)
                  : summary.balances[0]
                return (
                  <p className="text-[10px] sm:text-xs text-muted-foreground">
                    {userBalance?.net_balance != null && userBalance.net_balance >= 0 ? 'Owed' : 'Owe'}
                  </p>
                )
              })()}
            </CardContent>
          </Card>

          {/* Settlements */}
          <Card className="overflow-hidden">
            <CardHeader className="p-2 sm:p-6 pb-1 sm:pb-2">
              <CardDescription className="text-[10px] sm:text-xs">Settle</CardDescription>
              <CardTitle className="text-sm sm:text-2xl">
                {settlements?.total_transactions || 0}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-2 sm:p-6 pt-0">
              <p className="text-[10px] sm:text-xs text-muted-foreground">
                pending
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Settlement Plan */}
      {settlements && settlements.settlements.length > 0 && (
        <Card className="overflow-hidden">
          <CardHeader className="p-3 sm:p-6 pb-2 sm:pb-4">
            <CardTitle className="text-base sm:text-lg">Settlement Plan</CardTitle>
            <CardDescription className="text-xs sm:text-sm">Payments to settle all balances</CardDescription>
          </CardHeader>
          <CardContent className="p-3 sm:p-6 pt-0">
            <div className="space-y-2">
              {settlements.settlements.map((settlement, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 rounded-lg border p-2 sm:p-3"
                >
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary shrink-0">
                    {settlement.from_user_name.charAt(0)}
                  </div>
                  <ArrowRight className="h-3 w-3 text-muted-foreground shrink-0" />
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary shrink-0">
                    {settlement.to_user_name.charAt(0)}
                  </div>
                  <span className="font-semibold text-green-600 text-sm shrink-0 ml-auto">
                    ${Number(settlement.amount).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Expense Form */}
      {canEdit && (showForm || editingExpense) && (
        <div ref={formRef}>
          <ExpenseForm
            expense={editingExpense}
            members={members}
            onSubmit={editingExpense ? handleUpdateExpense : handleCreateExpense}
            onCancel={() => {
              setShowForm(false)
              setEditingExpense(null)
            }}
          />
        </div>
      )}

      {/* Expenses List */}
      {expenses.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <DollarSign className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
            <h3 className="text-lg font-semibold">No expenses yet</h3>
            <p className="text-muted-foreground">
              Start tracking expenses to split costs with your travel companions
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {expenses.map((expense) => (
            <ExpenseCard
              key={expense.id}
              expense={expense}
              onEdit={() => setEditingExpense(expense)}
              onDelete={() => handleDeleteExpense(expense.id)}
              canEdit={canEdit}
            />
          ))}
        </div>
      )}
    </div>
  )
}

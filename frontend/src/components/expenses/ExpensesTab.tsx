import { useState, useEffect } from 'react'
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

  useEffect(() => {
    loadData()
  }, [tripId])

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
    <div className="space-y-6 w-full max-w-full overflow-x-hidden">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Expenses</h2>
        {canEdit && (
          <Button onClick={() => setShowForm(true)} size="sm">
            <Plus className="mr-2 h-4 w-4" />
            Add Expense
          </Button>
        )}
      </div>

      {/* Itinerary Budget - show costs from booked items */}
      {itineraryCosts.total > 0 && (
        <Card className="bg-sand">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-serif">Trip Budget</CardTitle>
              <span className="text-2xl font-semibold">${itineraryCosts.total.toFixed(2)}</span>
            </div>
            <CardDescription>Estimated costs from your itinerary</CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-2">
              {Object.entries(itineraryCosts.byType).map(([type, amount]) => (
                <div key={type} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    {ITEM_ICONS[type as ItineraryItemType]}
                    <span className="capitalize">{type}s</span>
                  </div>
                  <span className="font-medium">${amount.toFixed(2)}</span>
                </div>
              ))}
            </div>
            {itineraryCosts.items.length > 0 && (
              <div className="mt-4 pt-3 border-t border-sand-dark">
                <p className="text-xs text-ink-light mb-2">Items with prices:</p>
                <div className="space-y-1.5">
                  {itineraryCosts.items.slice(0, 5).map(item => (
                    <div key={item.id} className="flex items-center justify-between text-xs">
                      <span className="truncate mr-2">{item.title}</span>
                      <span className="shrink-0">${item.price?.toFixed(2)}</span>
                    </div>
                  ))}
                  {itineraryCosts.items.length > 5 && (
                    <p className="text-xs text-ink-light">
                      +{itineraryCosts.items.length - 5} more items
                    </p>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Summary Cards */}
      {summary && (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
          {/* Total */}
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Shared Expenses</CardDescription>
              <CardTitle className="text-2xl">
                ${Number(summary.total_expenses).toFixed(2)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                {summary.expense_count} expense{summary.expense_count !== 1 ? 's' : ''}
              </p>
            </CardContent>
          </Card>

          {/* Balances */}
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Your Balance</CardDescription>
              {(() => {
                const userBalance = currentUserId
                  ? summary.balances.find(b => b.user_id === currentUserId)
                  : summary.balances[0]
                return userBalance ? (
                  <>
                    <CardTitle className={cn(
                      "text-2xl",
                      userBalance.net_balance > 0 ? "text-green-600" : userBalance.net_balance < 0 ? "text-red-600" : ""
                    )}>
                      {userBalance.net_balance >= 0 ? '+' : ''}${Number(userBalance.net_balance).toFixed(2)}
                    </CardTitle>
                  </>
                ) : null
              })()}
            </CardHeader>
            <CardContent>
              {(() => {
                const userBalance = currentUserId
                  ? summary.balances.find(b => b.user_id === currentUserId)
                  : summary.balances[0]
                return (
                  <p className="text-xs text-muted-foreground">
                    {userBalance?.net_balance != null && userBalance.net_balance >= 0 ? 'You are owed' : 'You owe'}
                  </p>
                )
              })()}
            </CardContent>
          </Card>

          {/* Settlements */}
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Settlements Needed</CardDescription>
              <CardTitle className="text-2xl">
                {settlements?.total_transactions || 0}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                transaction{settlements?.total_transactions !== 1 ? 's' : ''} to settle up
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Settlement Plan */}
      {settlements && settlements.settlements.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Settlement Plan</CardTitle>
            <CardDescription>Optimized payments to settle all balances</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {settlements.settlements.map((settlement, index) => (
                <div
                  key={index}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-lg border p-3"
                >
                  <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                    <div className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full bg-primary/10 text-xs sm:text-sm font-medium text-primary shrink-0">
                      {settlement.from_user_name.charAt(0)}
                    </div>
                    <span className="font-medium text-sm sm:text-base truncate max-w-20 sm:max-w-none">{settlement.from_user_name}</span>
                    <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
                    <div className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full bg-primary/10 text-xs sm:text-sm font-medium text-primary shrink-0">
                      {settlement.to_user_name.charAt(0)}
                    </div>
                    <span className="font-medium text-sm sm:text-base truncate max-w-20 sm:max-w-none">{settlement.to_user_name}</span>
                  </div>
                  <span className="font-semibold text-green-600 text-right">
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
        <ExpenseForm
          expense={editingExpense}
          members={members}
          onSubmit={editingExpense ? handleUpdateExpense : handleCreateExpense}
          onCancel={() => {
            setShowForm(false)
            setEditingExpense(null)
          }}
        />
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

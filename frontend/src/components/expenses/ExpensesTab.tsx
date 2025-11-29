import { useState, useEffect } from 'react'
import { Plus, DollarSign, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { api } from '@/lib/api'
import type { Expense, ExpenseSummary, SettlementPlan } from '@/types'
import { ExpenseCard } from './ExpenseCard'
import { ExpenseForm } from './ExpenseForm'
import { cn } from '@/lib/utils'

interface ExpensesTabProps {
  tripId: string
}

export function ExpensesTab({ tripId }: ExpensesTabProps) {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [summary, setSummary] = useState<ExpenseSummary | null>(null)
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
      setExpenses(expensesData as Expense[])
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Expenses</h2>
        <Button onClick={() => setShowForm(true)} size="sm">
          <Plus className="mr-2 h-4 w-4" />
          Add Expense
        </Button>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid gap-4 md:grid-cols-3">
          {/* Total */}
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Expenses</CardDescription>
              <CardTitle className="text-2xl">
                ${summary.total_expenses.toFixed(2)}
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
              {summary.balances.length > 0 && (
                <CardTitle className={cn(
                  "text-2xl",
                  summary.balances[0].net_balance > 0 ? "text-green-600" : summary.balances[0].net_balance < 0 ? "text-red-600" : ""
                )}>
                  {summary.balances[0].net_balance >= 0 ? '+' : ''}${summary.balances[0].net_balance.toFixed(2)}
                </CardTitle>
              )}
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                {summary.balances[0]?.net_balance >= 0 ? 'You are owed' : 'You owe'}
              </p>
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
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-medium text-primary">
                      {settlement.from_user_name.charAt(0)}
                    </div>
                    <span className="font-medium">{settlement.from_user_name}</span>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-medium text-primary">
                      {settlement.to_user_name.charAt(0)}
                    </div>
                    <span className="font-medium">{settlement.to_user_name}</span>
                  </div>
                  <span className="font-semibold text-green-600">
                    ${settlement.amount.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Expense Form */}
      {(showForm || editingExpense) && (
        <ExpenseForm
          expense={editingExpense}
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
            />
          ))}
        </div>
      )}
    </div>
  )
}

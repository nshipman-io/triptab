import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router'
import { Search, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, Shield, ShieldOff } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { api } from '@/lib/api'

interface UserListItem {
  id: string
  email: string
  name: string
  auth_provider: string | null
  is_admin: boolean
  created_at: string
  trip_count: number
  guide_count: number
}

interface PaginatedUsers {
  users: UserListItem[]
  total: number
  page: number
  per_page: number
  total_pages: number
}

type SortField = 'created_at' | 'email' | 'name'
type SortOrder = 'asc' | 'desc'

export function AdminUsers() {
  const navigate = useNavigate()
  const [data, setData] = useState<PaginatedUsers | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState<SortField>('created_at')
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc')
  const [page, setPage] = useState(1)
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null)

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    try {
      const result = await api.getAdminUsers({
        page,
        per_page: 20,
        sort_by: sortBy,
        sort_order: sortOrder,
        search: search || undefined,
      })
      setData(result as PaginatedUsers)
    } catch (err) {
      if (err instanceof Error && err.message.includes('403')) {
        navigate('/dashboard')
      } else if (err instanceof Error && err.message.includes('401')) {
        navigate('/login')
      } else {
        setError('Failed to load users')
      }
    } finally {
      setLoading(false)
    }
  }, [navigate, page, sortBy, sortOrder, search])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1)
      fetchUsers()
    }, 300)
    return () => clearTimeout(timer)
  }, [search])

  const handleSort = (field: SortField) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(field)
      setSortOrder('desc')
    }
    setPage(1)
  }

  const handleToggleAdmin = async (user: UserListItem) => {
    if (updatingUserId) return

    setUpdatingUserId(user.id)
    try {
      await api.setUserAdminStatus(user.id, !user.is_admin)
      // Update local state
      setData((prev) => {
        if (!prev) return prev
        return {
          ...prev,
          users: prev.users.map((u) =>
            u.id === user.id ? { ...u, is_admin: !u.is_admin } : u
          ),
        }
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update admin status')
    } finally {
      setUpdatingUserId(null)
    }
  }

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortBy !== field) return null
    return sortOrder === 'asc' ? (
      <ChevronUp className="h-4 w-4" />
    ) : (
      <ChevronDown className="h-4 w-4" />
    )
  }

  if (error && !data) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-red-500">{error}</div>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div>
          <h2 className="text-2xl font-serif text-ink">Users</h2>
          <p className="text-ink-light mt-1">
            {data ? `${data.total} total users` : 'Loading...'}
          </p>
        </div>

        {/* Error Toast */}
        {error && data && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
            <button
              onClick={() => setError(null)}
              className="float-right font-bold"
            >
              &times;
            </button>
          </div>
        )}

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-light" />
          <Input
            placeholder="Search by email or name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Table */}
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-sand-dark bg-cream">
                  <tr>
                    <th
                      className="text-left px-6 py-3 text-xs font-semibold text-ink-light uppercase tracking-wider cursor-pointer hover:text-ink"
                      onClick={() => handleSort('name')}
                    >
                      <div className="flex items-center gap-1">
                        Name <SortIcon field="name" />
                      </div>
                    </th>
                    <th
                      className="text-left px-6 py-3 text-xs font-semibold text-ink-light uppercase tracking-wider cursor-pointer hover:text-ink"
                      onClick={() => handleSort('email')}
                    >
                      <div className="flex items-center gap-1">
                        Email <SortIcon field="email" />
                      </div>
                    </th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-ink-light uppercase tracking-wider">
                      Auth
                    </th>
                    <th className="text-center px-6 py-3 text-xs font-semibold text-ink-light uppercase tracking-wider">
                      Trips
                    </th>
                    <th className="text-center px-6 py-3 text-xs font-semibold text-ink-light uppercase tracking-wider">
                      Guides
                    </th>
                    <th
                      className="text-left px-6 py-3 text-xs font-semibold text-ink-light uppercase tracking-wider cursor-pointer hover:text-ink"
                      onClick={() => handleSort('created_at')}
                    >
                      <div className="flex items-center gap-1">
                        Joined <SortIcon field="created_at" />
                      </div>
                    </th>
                    <th className="text-center px-6 py-3 text-xs font-semibold text-ink-light uppercase tracking-wider">
                      Admin
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-sand">
                  {loading && !data ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-8 text-center text-ink-light">
                        Loading...
                      </td>
                    </tr>
                  ) : data?.users.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-8 text-center text-ink-light">
                        No users found
                      </td>
                    </tr>
                  ) : (
                    data?.users.map((user) => (
                      <tr key={user.id} className="hover:bg-sand/50">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{user.name}</span>
                            {user.is_admin && (
                              <span className="px-2 py-0.5 text-xs font-medium bg-forest text-white rounded">
                                Admin
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-ink-light">{user.email}</td>
                        <td className="px-6 py-4">
                          <span className="capitalize text-sm">
                            {user.auth_provider || 'email'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">{user.trip_count}</td>
                        <td className="px-6 py-4 text-center">{user.guide_count}</td>
                        <td className="px-6 py-4 text-ink-light text-sm">
                          {new Date(user.created_at).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <Button
                            variant={user.is_admin ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => handleToggleAdmin(user)}
                            disabled={updatingUserId === user.id}
                            className="w-24"
                          >
                            {updatingUserId === user.id ? (
                              '...'
                            ) : user.is_admin ? (
                              <>
                                <ShieldOff className="h-3 w-3 mr-1" />
                                Revoke
                              </>
                            ) : (
                              <>
                                <Shield className="h-3 w-3 mr-1" />
                                Grant
                              </>
                            )}
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {data && data.total_pages > 1 && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-sand">
                <p className="text-sm text-ink-light">
                  Showing {(data.page - 1) * data.per_page + 1} to{' '}
                  {Math.min(data.page * data.per_page, data.total)} of {data.total} users
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(page - 1)}
                    disabled={page <= 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-sm px-2">
                    Page {data.page} of {data.total_pages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(page + 1)}
                    disabled={page >= data.total_pages}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  )
}

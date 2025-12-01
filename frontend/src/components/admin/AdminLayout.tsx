import { Link, useLocation } from 'react-router'
import { LayoutDashboard, Users, BookOpen, ChevronLeft } from 'lucide-react'
import { cn } from '@/lib/utils'

interface AdminLayoutProps {
  children: React.ReactNode
}

const navItems = [
  { path: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/admin/users', label: 'Users', icon: Users },
  { path: '/admin/guides', label: 'Guides', icon: BookOpen },
]

export function AdminLayout({ children }: AdminLayoutProps) {
  const location = useLocation()

  return (
    <div className="min-h-screen bg-sand">
      {/* Header */}
      <header className="border-b border-sand-dark bg-cream sticky top-0 z-10">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <Link
              to="/dashboard"
              className="flex items-center gap-1 text-sm text-ink-light hover:text-ink transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
              Back to App
            </Link>
            <div className="h-6 w-px bg-sand-dark" />
            <h1 className="text-xl font-serif text-ink">Admin Dashboard</h1>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-56 border-r border-sand-dark bg-cream min-h-[calc(100vh-65px)] sticky top-[65px]">
          <nav className="p-4 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = location.pathname === item.path
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-forest text-white'
                      : 'text-ink-light hover:bg-sand hover:text-ink'
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              )
            })}
          </nav>
        </aside>

        {/* Main content */}
        <main className="flex-1 p-8">
          {children}
        </main>
      </div>
    </div>
  )
}

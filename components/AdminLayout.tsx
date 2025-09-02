"use client"

import { useEffect, useState, ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { useLanguage } from '@/contexts/LanguageContext'
import { LanguageSwitcher } from '@/components/LanguageSwitcher'
import Link from 'next/link'
import { 
  BarChart3,
  Users,
  Shield,
  FileText,
  Settings,
  LogOut,
  ChevronRight,
  Home,
  UserCog,
  Key,
  ClipboardList,
  Building
} from 'lucide-react'

interface User {
  id: string
  role: string
  firstName: string
  lastName: string
  email: string
}

interface AdminLayoutProps {
  children: ReactNode
  activeSection?: string
}

export function AdminLayout({ children, activeSection = 'dashboard' }: AdminLayoutProps) {
  const router = useRouter()
  const { t } = useLanguage()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(true)

  useEffect(() => {
    fetchUserData()
  }, [])

  const fetchUserData = async () => {
    try {
      const response = await fetch('/api/auth/me')
      if (response.ok) {
        const data = await response.json()
        setUser(data.user)
        
        // Check if user has admin privileges
        if (!['ADMIN', 'HR'].includes(data.user.role)) {
          router.push('/dashboard')
          return
        }
      } else {
        router.push('/login')
        return
      }
    } catch (error) {
      console.error('Error fetching user:', error)
      router.push('/login')
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
  }

  const navigationItems = [
    { 
      id: 'dashboard', 
      label: 'Dashboard', 
      href: '/admin/dashboard', 
      icon: Home,
      roles: ['ADMIN', 'HR']
    },
    { 
      id: 'users', 
      label: 'Users', 
      href: '/admin/users', 
      icon: Users,
      roles: ['ADMIN', 'HR']
    },
    { 
      id: 'roles', 
      label: 'Role Management', 
      href: '/admin/roles', 
      icon: Shield,
      roles: ['ADMIN']
    },
    { 
      id: 'reviews', 
      label: 'Review Periods', 
      href: '/admin', 
      icon: ClipboardList,
      roles: ['ADMIN', 'HR']
    },
    { 
      id: 'reports', 
      label: 'Reports', 
      href: '/admin/reports', 
      icon: FileText,
      roles: ['ADMIN', 'HR']
    },
    { 
      id: 'auth-config', 
      label: 'Authentication', 
      href: '/admin/auth-config', 
      icon: Key,
      roles: ['ADMIN']
    },
    { 
      id: 'settings', 
      label: 'System Settings', 
      href: '/admin/settings', 
      icon: Settings,
      roles: ['ADMIN']
    },
  ]

  const visibleNavItems = navigationItems.filter(item => 
    item.roles.includes(user?.role || '')
  )

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <BarChart3 className="w-12 h-12 text-blue-600 mx-auto mb-4 animate-pulse" />
          <p className="text-gray-600">{t.common.loading}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm shadow-sm border-b border-gray-100 sticky top-0 z-20">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors lg:hidden"
              >
                <BarChart3 className="w-6 h-6 text-gray-600" />
              </button>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-blue-600 rounded-xl flex items-center justify-center">
                  <BarChart3 className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">Admin Panel</h1>
                  <p className="text-sm text-gray-600 hidden sm:block">
                    {user?.firstName} {user?.lastName} • {user?.role}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <button
                onClick={() => router.push('/dashboard')}
                className="flex items-center space-x-2 px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
              >
                <Home className="w-4 h-4" />
                <span className="hidden sm:inline">Main Dashboard</span>
              </button>
              <LanguageSwitcher />
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">{t.common.logout}</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className={`${
          sidebarOpen ? 'w-64' : 'w-0 lg:w-20'
        } transition-all duration-300 bg-white shadow-sm border-r border-gray-100 fixed lg:relative h-[calc(100vh-4rem)] overflow-y-auto`}>
          <nav className="p-4 space-y-2">
            {visibleNavItems.map((item) => {
              const Icon = item.icon
              const isActive = activeSection === item.id
              
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-all ${
                    isActive
                      ? 'bg-blue-50 text-blue-600 font-medium'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  <span className={`${sidebarOpen ? 'block' : 'hidden lg:hidden'}`}>
                    {item.label}
                  </span>
                  {isActive && sidebarOpen && (
                    <ChevronRight className="w-4 h-4 ml-auto" />
                  )}
                </Link>
              )
            })}
          </nav>

          {/* User Info at Bottom */}
          {sidebarOpen && (
            <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-100">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-gray-400 to-gray-600 rounded-full flex items-center justify-center text-white font-medium">
                  {user?.firstName?.[0]}{user?.lastName?.[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {user?.firstName} {user?.lastName}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {user?.email}
                  </p>
                </div>
              </div>
            </div>
          )}
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
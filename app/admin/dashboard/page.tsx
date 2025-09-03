"use client"

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useLanguage } from '@/contexts/LanguageContext'
import { LanguageSwitcher } from '@/components/LanguageSwitcher'
import { 
  BarChart3,
  Users,
  Calendar,
  FileText,
  Clock,
  CheckCircle,
  AlertCircle,
  Settings,
  PieChart,
  Building,
  User,
  LogOut
} from 'lucide-react'

interface User {
  id: string
  role: string
  firstName: string
  lastName: string
}

interface DashboardStats {
  totalEmployees: number
  totalReviews: number
  activeReviews: number
  completedReviews: number
  overdueSelfEvaluations: number
  overdueSupervisorEvaluations: number
  reviewsByPhase: {
    NOT_STARTED: number
    SELF_EVALUATION: number
    SUPERVISOR_EVALUATION: number
    FINAL_MEETING: number
    COMPLETED: number
  }
  reviewsByDepartment: Array<{
    department: string
    total: number
    completed: number
    pending: number
  }>
  currentPeriods: Array<{
    id: string
    year: number
    type: string
    status: string
    totalReviews: number
    completedReviews: number
  }>
}

export default function AdminDashboard() {
  const router = useRouter()
  const { t } = useLanguage()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<DashboardStats | null>(null)

  useEffect(() => {
    fetchUserData()
    fetchDashboardStats()
  }, [fetchUserData, fetchDashboardStats])

  const fetchUserData = useCallback(async () => {
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
  }, [router])

  const fetchDashboardStats = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/dashboard-stats')
      if (response.ok) {
        const data = await response.json()
        setStats(data.stats)
      }
    } catch (error) {
      console.error('Error fetching dashboard stats:', error)
    }
  }, [])

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
  }


  const getCompletionPercentage = (completed: number, total: number) => {
    return total > 0 ? Math.round((completed / total) * 100) : 0
  }

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
      <header className="bg-white/80 backdrop-blur-sm shadow-sm border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-blue-600 rounded-xl flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Admin Dashboard</h1>
                <p className="text-sm text-gray-600 hidden sm:block">
                  Welcome, {user?.firstName} {user?.lastName}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
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

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Company Performance Overview</h2>
          <p className="text-gray-600">Monitor review progress and company-wide statistics</p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <span className="text-2xl font-bold text-gray-900">
                {stats?.totalEmployees || 0}
              </span>
            </div>
            <h3 className="text-sm font-medium text-gray-900">Total Employees</h3>
            <p className="text-xs text-gray-500 mt-1">Active staff members</p>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <FileText className="w-6 h-6 text-green-600" />
              </div>
              <span className="text-2xl font-bold text-gray-900">
                {stats?.totalReviews || 0}
              </span>
            </div>
            <h3 className="text-sm font-medium text-gray-900">Total Reviews</h3>
            <p className="text-xs text-gray-500 mt-1">All review processes</p>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
                <Clock className="w-6 h-6 text-amber-600" />
              </div>
              <span className="text-2xl font-bold text-gray-900">
                {stats?.activeReviews || 0}
              </span>
            </div>
            <h3 className="text-sm font-medium text-gray-900">Active Reviews</h3>
            <p className="text-xs text-gray-500 mt-1">In progress</p>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-purple-600" />
              </div>
              <span className="text-2xl font-bold text-gray-900">
                {stats?.completedReviews || 0}
              </span>
            </div>
            <h3 className="text-sm font-medium text-gray-900">Completed Reviews</h3>
            <p className="text-xs text-gray-500 mt-1">Finished processes</p>
          </div>
        </div>

        {/* Review Progress by Phase */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
                <PieChart className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Review Progress by Phase</h3>
                <p className="text-sm text-gray-600">Current status distribution</p>
              </div>
            </div>
            
            <div className="space-y-4">
              {stats?.reviewsByPhase && Object.entries(stats.reviewsByPhase).map(([phase, count]) => (
                <div key={phase} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {phase === 'NOT_STARTED' && <Clock className="w-4 h-4 text-gray-500" />}
                    {phase === 'SELF_EVALUATION' && <User className="w-4 h-4 text-blue-500" />}
                    {phase === 'SUPERVISOR_EVALUATION' && <Users className="w-4 h-4 text-amber-500" />}
                    {phase === 'FINAL_MEETING' && <Calendar className="w-4 h-4 text-purple-500" />}
                    {phase === 'COMPLETED' && <CheckCircle className="w-4 h-4 text-green-500" />}
                    <span className="text-sm text-gray-700">
                      {phase === 'NOT_STARTED' && 'Not Started'}
                      {phase === 'SELF_EVALUATION' && 'Self Evaluation'}
                      {phase === 'SUPERVISOR_EVALUATION' && 'Supervisor Review'}
                      {phase === 'FINAL_MEETING' && 'Final Meeting'}
                      {phase === 'COMPLETED' && 'Completed'}
                    </span>
                  </div>
                  <span className="font-semibold text-gray-900">{count}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Attention Required</h3>
                <p className="text-sm text-gray-600">Reviews needing immediate action</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200">
                <div>
                  <p className="text-sm font-medium text-red-800">Overdue Self-Evaluations</p>
                  <p className="text-xs text-red-600">Employees who haven&apos;t completed their review</p>
                </div>
                <span className="text-xl font-bold text-red-700">{stats?.overdueSelfEvaluations || 0}</span>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-amber-50 rounded-lg border border-amber-200">
                <div>
                  <p className="text-sm font-medium text-amber-800">Pending Supervisor Reviews</p>
                  <p className="text-xs text-amber-600">Waiting for supervisor evaluation</p>
                </div>
                <span className="text-xl font-bold text-amber-700">{stats?.overdueSupervisorEvaluations || 0}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Department Overview */}
        {stats?.reviewsByDepartment && stats.reviewsByDepartment.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-10 h-10 bg-teal-100 rounded-xl flex items-center justify-center">
                <Building className="w-5 h-5 text-teal-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Department Progress</h3>
                <p className="text-sm text-gray-600">Review completion by department</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {stats.reviewsByDepartment.map((dept) => (
                <div key={dept.department} className="p-4 border border-gray-200 rounded-xl">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-gray-900">{dept.department}</h4>
                    <span className="text-xs font-semibold text-gray-500">
                      {getCompletionPercentage(dept.completed, dept.total)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full" 
                      style={{ width: `${getCompletionPercentage(dept.completed, dept.total)}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-xs text-gray-600">
                    <span>Completed: {dept.completed}</span>
                    <span>Total: {dept.total}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
              <Settings className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Admin Actions</h3>
              <p className="text-sm text-gray-600">Manage review periods and system settings</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <button
              onClick={() => router.push('/admin')}
              className="flex items-center space-x-3 p-4 rounded-xl border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all group"
            >
              <Calendar className="w-5 h-5 text-gray-600 group-hover:text-blue-600" />
              <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">
                Review Periods
              </span>
            </button>
            
            <button
              onClick={() => router.push('/admin/reviews')}
              className="flex items-center space-x-3 p-4 rounded-xl border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all group"
            >
              <FileText className="w-5 h-5 text-gray-600 group-hover:text-blue-600" />
              <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">
                All Reviews
              </span>
            </button>
            
            <button
              onClick={() => router.push('/admin/users')}
              className="flex items-center space-x-3 p-4 rounded-xl border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all group"
            >
              <Users className="w-5 h-5 text-gray-600 group-hover:text-blue-600" />
              <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">
                Manage Users
              </span>
            </button>
            
            <button
              onClick={() => router.push('/admin/reports')}
              className="flex items-center space-x-3 p-4 rounded-xl border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all group"
            >
              <BarChart3 className="w-5 h-5 text-gray-600 group-hover:text-blue-600" />
              <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">
                Reports
              </span>
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}
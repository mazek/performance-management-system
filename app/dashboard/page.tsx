"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useLanguage } from '@/contexts/LanguageContext'
import { LanguageSwitcher } from '@/components/LanguageSwitcher'
import { 
  Users, 
  FileText, 
  TrendingUp, 
  Calendar,
  CheckCircle,
  Clock,
  AlertCircle,
  LogOut,
  Star,
  Target,
  Award,
  ChevronRight,
  BarChart3,
  Building,
  Briefcase,
  ArrowUp,
  ArrowDown
} from 'lucide-react'

interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  role: string
  department?: string
  position?: string
  supervisor?: {
    firstName: string
    lastName: string
  }
  subordinates?: Array<{
    id: string
    firstName: string
    lastName: string
  }>
}

export default function DashboardPage() {
  const router = useRouter()
  const { t } = useLanguage()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [reviews, setReviews] = useState<any[]>([])

  useEffect(() => {
    fetchUserData()
    fetchReviews()
  }, [])

  useEffect(() => {
    // Redirect admins to admin dashboard
    if (user && user.role === 'ADMIN') {
      router.push('/admin/dashboard')
      return
    }
  }, [user, router])

  const fetchUserData = async () => {
    try {
      const response = await fetch('/api/auth/me')
      if (!response.ok) {
        throw new Error('Not authenticated')
      }
      const data = await response.json()
      setUser(data.user)
    } catch (error) {
      router.push('/login')
    } finally {
      setLoading(false)
    }
  }

  const fetchReviews = async () => {
    try {
      const response = await fetch('/api/reviews')
      if (response.ok) {
        const data = await response.json()
        setReviews(data.reviews || [])
      }
    } catch (error) {
      console.error('Error fetching reviews:', error)
    }
  }

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
      </div>
    )
  }

  if (!user) return null

  const getPhaseLabel = (phase: string) => {
    const labels: Record<string, string> = {
      'NOT_STARTED': t.review.phase.notStarted,
      'SELF_EVALUATION': t.review.phase.selfEvaluation,
      'SUPERVISOR_EVALUATION': t.review.phase.supervisorEvaluation,
      'FINAL_MEETING': t.review.phase.finalMeeting,
      'COMPLETED': t.review.phase.completed
    }
    return labels[phase] || phase
  }

  const getPhaseColor = (phase: string) => {
    const colors: Record<string, string> = {
      'NOT_STARTED': 'bg-gray-100 text-gray-700 border-gray-200',
      'SELF_EVALUATION': 'bg-blue-50 text-blue-700 border-blue-200',
      'SUPERVISOR_EVALUATION': 'bg-amber-50 text-amber-700 border-amber-200',
      'FINAL_MEETING': 'bg-purple-50 text-purple-700 border-purple-200',
      'COMPLETED': 'bg-green-50 text-green-700 border-green-200'
    }
    return colors[phase] || 'bg-gray-100 text-gray-700 border-gray-200'
  }

  const getPhaseIcon = (phase: string) => {
    switch(phase) {
      case 'SELF_EVALUATION':
        return <Star className="w-4 h-4" />
      case 'SUPERVISOR_EVALUATION':
        return <Users className="w-4 h-4" />
      case 'FINAL_MEETING':
        return <Calendar className="w-4 h-4" />
      case 'COMPLETED':
        return <CheckCircle className="w-4 h-4" />
      default:
        return <Clock className="w-4 h-4" />
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('pl-PL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  const myReviews = reviews.filter(r => r.employeeId === user.id)
  const teamReviews = reviews.filter(r => r.supervisorId === user.id)
  const pendingActions = reviews.filter(r => 
    (r.phase === 'SELF_EVALUATION' && r.employeeId === user.id) ||
    (r.phase === 'SUPERVISOR_EVALUATION' && r.supervisorId === user.id)
  ).length

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm shadow-sm border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  {t.auth.loginTitle}
                </h1>
                <p className="text-sm text-gray-600 hidden sm:block">
                  {t.common.welcome}, {user.firstName} {user.lastName}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <LanguageSwitcher />
              <div className="hidden md:flex items-center space-x-2 px-3 py-1.5 bg-gray-50 rounded-lg">
                <Building className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-700">{user.department}</span>
              </div>
              <div className="hidden lg:flex items-center space-x-2 px-3 py-1.5 bg-gray-50 rounded-lg">
                <Briefcase className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-700">{user.position}</span>
              </div>
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
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            {t.dashboard.title}
          </h2>
          <p className="text-gray-600">
            {t.dashboard.subtitle}
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
              <span className="text-2xl font-bold text-gray-900">
                {myReviews.length}
              </span>
            </div>
            <h3 className="text-sm font-medium text-gray-900">{t.dashboard.myReviews}</h3>
            <p className="text-xs text-gray-500 mt-1">{t.dashboard.activeProcesses}</p>
          </div>

          {(user.role === 'SUPERVISOR' || user.role === 'ADMIN' || user.role === 'HR') && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                  <Users className="w-6 h-6 text-purple-600" />
                </div>
                <span className="text-2xl font-bold text-gray-900">
                  {user.subordinates?.length || teamReviews.length}
                </span>
              </div>
              <h3 className="text-sm font-medium text-gray-900">{t.dashboard.team}</h3>
              <p className="text-xs text-gray-500 mt-1">{t.dashboard.peopleToReview}</p>
            </div>
          )}

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
                <Clock className="w-6 h-6 text-amber-600" />
              </div>
              <span className="text-2xl font-bold text-gray-900">
                {pendingActions}
              </span>
            </div>
            <h3 className="text-sm font-medium text-gray-900">{t.dashboard.toDo}</h3>
            <p className="text-xs text-gray-500 mt-1">{t.dashboard.pendingActions}</p>
            {pendingActions > 0 && (
              <div className="mt-2 flex items-center text-xs text-amber-600">
                <AlertCircle className="w-3 h-3 mr-1" />
                {t.dashboard.requiresAttention}
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <span className="text-2xl font-bold text-gray-900">
                {reviews.filter(r => r.phase === 'COMPLETED').length}
              </span>
            </div>
            <h3 className="text-sm font-medium text-gray-900">{t.dashboard.completed}</h3>
            <p className="text-xs text-gray-500 mt-1">{t.dashboard.completedReviews}</p>
            {reviews.filter(r => r.phase === 'COMPLETED').length > 0 && (
              <div className="mt-2 flex items-center text-xs text-green-600">
                <ArrowUp className="w-3 h-3 mr-1" />
                100% więcej niż zeszły kwartał
              </div>
            )}
          </div>
        </div>

        {/* Reviews Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* My Reviews */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-transparent">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                    <Star className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{t.dashboard.myReviews}</h3>
                    <p className="text-sm text-gray-600">{t.dashboard.myReviewsDesc}</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="p-4 space-y-3 max-h-96 overflow-y-auto">
              {myReviews.length > 0 ? (
                myReviews.map((review) => (
                  <button
                    key={review.id}
                    onClick={() => router.push(`/review/${review.id}`)}
                    className="w-full text-left p-4 rounded-xl border border-gray-200 hover:border-blue-300 hover:bg-blue-50/50 transition-all group"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 mb-1">
                          {t.review.review} {review.reviewPeriod?.year} - {review.reviewPeriod?.type === 'MID_YEAR' ? 'Mid-Year' : 'End-Year'}
                        </h4>
                        <p className="text-sm text-gray-600">
                          {t.profile.supervisor}: {review.supervisor?.firstName} {review.supervisor?.lastName}
                        </p>
                        <div className="mt-2 flex items-center space-x-2">
                          <span className={`inline-flex items-center space-x-1 px-2 py-1 text-xs font-medium rounded-lg border ${getPhaseColor(review.phase)}`}>
                            {getPhaseIcon(review.phase)}
                            <span>{getPhaseLabel(review.phase)}</span>
                          </span>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600 transition-colors mt-1" />
                    </div>
                  </button>
                ))
              ) : (
                <div className="py-12 text-center">
                  <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">{t.dashboard.noActiveReviews}</p>
                  <p className="text-sm text-gray-400 mt-1">{t.dashboard.newReviewsWillAppear}</p>
                </div>
              )}
            </div>
          </div>

          {/* Team Reviews */}
          {(user.role === 'SUPERVISOR' || user.role === 'ADMIN' || user.role === 'HR') && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-purple-50 to-transparent">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                      <Users className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{t.dashboard.teamReviews}</h3>
                      <p className="text-sm text-gray-600">{t.dashboard.teamReviewsDesc}</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="p-4 space-y-3 max-h-96 overflow-y-auto">
                {teamReviews.length > 0 ? (
                  teamReviews.map((review) => (
                    <button
                      key={review.id}
                      onClick={() => router.push(`/review/${review.id}`)}
                      className="w-full text-left p-4 rounded-xl border border-gray-200 hover:border-purple-300 hover:bg-purple-50/50 transition-all group"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900 mb-1">
                            {review.employee?.firstName} {review.employee?.lastName}
                          </h4>
                          <p className="text-sm text-gray-600">
                            {review.reviewPeriod?.year} - {review.reviewPeriod?.type === 'MID_YEAR' ? 'Mid-Year' : 'End-Year'}
                          </p>
                          <div className="mt-2 flex items-center space-x-2">
                            <span className={`inline-flex items-center space-x-1 px-2 py-1 text-xs font-medium rounded-lg border ${getPhaseColor(review.phase)}`}>
                              {getPhaseIcon(review.phase)}
                              <span>{getPhaseLabel(review.phase)}</span>
                            </span>
                            {review.phase === 'SUPERVISOR_EVALUATION' && (
                              <span className="inline-flex items-center px-2 py-1 text-xs font-medium text-red-600 bg-red-50 rounded-lg">
                                {t.dashboard.requiresAction}
                              </span>
                            )}
                          </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-purple-600 transition-colors mt-1" />
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="py-12 text-center">
                    <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">{t.dashboard.noTeamReviews}</p>
                    <p className="text-sm text-gray-400 mt-1">{t.dashboard.teamReviewsWillAppear}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
              <Target className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">{t.dashboard.quickActions}</h3>
              <p className="text-sm text-gray-600">{t.dashboard.quickActionsDesc}</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {(user.role === 'HR' || user.role === 'ADMIN') && (
              <>
                <button
                  onClick={() => router.push('/admin/dashboard')}
                  className="flex items-center space-x-3 p-4 rounded-xl border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all group"
                >
                  <BarChart3 className="w-5 h-5 text-gray-600 group-hover:text-blue-600" />
                  <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">
                    Admin Dashboard
                  </span>
                </button>
                <button
                  onClick={() => router.push('/admin/reviews')}
                  className="flex items-center space-x-3 p-4 rounded-xl border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all group"
                >
                  <Calendar className="w-5 h-5 text-gray-600 group-hover:text-blue-600" />
                  <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">
                    {t.dashboard.manageReviews}
                  </span>
                </button>
                <button
                  onClick={() => router.push('/admin/employees')}
                  className="flex items-center space-x-3 p-4 rounded-xl border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all group"
                >
                  <Users className="w-5 h-5 text-gray-600 group-hover:text-blue-600" />
                  <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">
                    {t.dashboard.manageEmployees}
                  </span>
                </button>
              </>
            )}
            <button
              onClick={() => router.push('/profile')}
              className="flex items-center space-x-3 p-4 rounded-xl border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all group"
            >
              <Award className="w-5 h-5 text-gray-600 group-hover:text-blue-600" />
              <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">
                {t.common.profile}
              </span>
            </button>
            <button
              onClick={() => router.push('/help')}
              className="flex items-center space-x-3 p-4 rounded-xl border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all group"
            >
              <AlertCircle className="w-5 h-5 text-gray-600 group-hover:text-blue-600" />
              <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">
                {t.common.help}
              </span>
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}
"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useLanguage } from '@/contexts/LanguageContext'
import { LanguageSwitcher } from '@/components/LanguageSwitcher'
import { 
  ArrowLeft,
  Play,
  Pause,
  Archive,
  Plus,
  Clock,
  BarChart3,
  LogOut
} from 'lucide-react'

interface ReviewPeriod {
  id: string
  year: number
  type: 'MID_YEAR' | 'END_YEAR'
  status: 'PLANNED' | 'OPEN' | 'CLOSED' | 'ARCHIVED'
  startDate: string
  endDate: string
  openedAt?: string
  closedAt?: string
  _count?: {
    reviews: number
  }
}

interface User {
  id: string
  role: string
}

export default function AdminPage() {
  const router = useRouter()
  const { t } = useLanguage()
  const [, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [reviewPeriods, setReviewPeriods] = useState<ReviewPeriod[]>([])
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [formData, setFormData] = useState({
    year: new Date().getFullYear(),
    type: 'MID_YEAR' as 'MID_YEAR' | 'END_YEAR',
    startDate: '',
    endDate: ''
  })

  useEffect(() => {
    fetchUserData()
    fetchReviewPeriods()
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

  const fetchReviewPeriods = async () => {
    try {
      const response = await fetch('/api/admin/review-periods')
      if (response.ok) {
        const data = await response.json()
        setReviewPeriods(data.reviewPeriods)
      }
    } catch (error) {
      console.error('Error fetching review periods:', error)
    }
  }

  const createReviewPeriod = async () => {
    // Validation
    if (!formData.startDate || !formData.endDate) {
      alert('Please fill in all fields')
      return
    }
    
    if (new Date(formData.startDate) >= new Date(formData.endDate)) {
      alert('End date must be after start date')
      return
    }
    
    try {
      const response = await fetch('/api/admin/review-periods', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      
      if (response.ok) {
        setShowCreateForm(false)
        setFormData({
          year: new Date().getFullYear(),
          type: 'MID_YEAR',
          startDate: '',
          endDate: ''
        })
        fetchReviewPeriods()
      } else {
        const error = await response.json()
        alert(`Error: ${error.error || 'Failed to create review period'}`)
      }
    } catch (error) {
      console.error('Error creating review period:', error)
      alert('An error occurred while creating the review period')
    }
  }

  const updateReviewPeriodStatus = async (periodId: string, action: 'open' | 'close' | 'archive') => {
    try {
      const response = await fetch(`/api/admin/review-periods/${periodId}/${action}`, {
        method: 'PATCH'
      })
      
      if (response.ok) {
        const data = await response.json()
        console.log(`Successfully ${action}ed review period:`, data)
        fetchReviewPeriods()
      } else {
        const errorData = await response.json()
        console.error(`Error ${action}ing review period:`, errorData)
        alert(`Failed to ${action} review period: ${errorData.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error(`Error ${action}ing review period:`, error)
      alert(`An error occurred while trying to ${action} the review period`)
    }
  }

  const getStatusBadge = (status: string) => {
    const styles = {
      PLANNED: 'bg-gray-100 text-gray-700 border-gray-200',
      OPEN: 'bg-green-100 text-green-700 border-green-200',
      CLOSED: 'bg-blue-100 text-blue-700 border-blue-200',
      ARCHIVED: 'bg-purple-100 text-purple-700 border-purple-200'
    }
    
    const icons = {
      PLANNED: Clock,
      OPEN: Play,
      CLOSED: Pause,
      ARCHIVED: Archive
    }
    
    const Icon = icons[status as keyof typeof icons]
    
    return (
      <span className={`inline-flex items-center space-x-1 px-2 py-1 text-xs font-medium rounded-lg border ${styles[status as keyof typeof styles]}`}>
        <Icon className="w-3 h-3" />
        <span>{status.toLowerCase()}</span>
      </span>
    )
  }

  const getTypeLabel = (type: string) => {
    return type === 'MID_YEAR' ? 'Mid-Year Review' : 'End-Year Review'
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('pl-PL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
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
              <button
                onClick={() => router.push('/admin/dashboard')}
                className="flex items-center space-x-2 px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>{t.common.back}</span>
              </button>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Admin Panel</h1>
                <p className="text-sm text-gray-600">Manage review periods and sessions</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
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
        {/* Page Title */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Review Period Management</h2>
          <p className="text-gray-600">Create and manage review periods for mid-year and end-year evaluations</p>
        </div>

        {/* Create Review Period */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Review Periods</h3>
            <button
              onClick={() => setShowCreateForm(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Create Period</span>
            </button>
          </div>

          {showCreateForm && (
            <div className="bg-gray-50 rounded-xl p-4 mb-6">
              <h4 className="font-medium text-gray-900 mb-3">Create New Review Period</h4>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
                  <input
                    type="number"
                    value={formData.year}
                    onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as 'MID_YEAR' | 'END_YEAR' })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="MID_YEAR">Mid-Year</option>
                    <option value="END_YEAR">End-Year</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              <div className="flex items-center space-x-3 mt-4">
                <button
                  onClick={createReviewPeriod}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Create Period
                </button>
                <button
                  onClick={() => setShowCreateForm(false)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Review Periods List */}
          <div className="space-y-4">
            {reviewPeriods.map((period) => (
              <div key={period.id} className="border border-gray-200 rounded-xl p-4 hover:border-gray-300 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h4 className="font-medium text-gray-900">
                        {period.year} - {getTypeLabel(period.type)}
                      </h4>
                      {getStatusBadge(period.status)}
                    </div>
                    <div className="text-sm text-gray-600 space-y-1">
                      <p>Period: {formatDate(period.startDate)} - {formatDate(period.endDate)}</p>
                      <p>Reviews: {period._count?.reviews || 0}</p>
                      {period.openedAt && <p>Opened: {formatDate(period.openedAt)}</p>}
                      {period.closedAt && <p>Closed: {formatDate(period.closedAt)}</p>}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {period.status === 'PLANNED' && (
                      <button
                        onClick={() => updateReviewPeriodStatus(period.id, 'open')}
                        className="flex items-center space-x-1 px-3 py-1.5 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
                      >
                        <Play className="w-3 h-3" />
                        <span>Open</span>
                      </button>
                    )}
                    
                    {period.status === 'OPEN' && (
                      <button
                        onClick={() => updateReviewPeriodStatus(period.id, 'close')}
                        className="flex items-center space-x-1 px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                      >
                        <Pause className="w-3 h-3" />
                        <span>Close</span>
                      </button>
                    )}
                    
                    {period.status === 'CLOSED' && (
                      <button
                        onClick={() => updateReviewPeriodStatus(period.id, 'archive')}
                        className="flex items-center space-x-1 px-3 py-1.5 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors"
                      >
                        <Archive className="w-3 h-3" />
                        <span>Archive</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}
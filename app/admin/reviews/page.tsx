"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useLanguage } from '@/contexts/LanguageContext'
import { LanguageSwitcher } from '@/components/LanguageSwitcher'
import { 
  ArrowLeft,
  FileText,
  Users,
  Clock,
  CheckCircle,
  AlertCircle,
  Search,
  Filter,
  Eye,
  Star,
  Calendar,
  User,
  ChevronRight,
  Archive
} from 'lucide-react'

interface Review {
  id: string
  phase: string
  isArchived: boolean
  reviewPeriod: {
    year: number
    type: string
    status: string
  }
  employee: {
    id: string
    firstName: string
    lastName: string
    email: string
    department: string
  }
  supervisor: {
    id: string
    firstName: string
    lastName: string
    email: string
  }
}

export default function AdminReviewsPage() {
  const router = useRouter()
  const { t } = useLanguage()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [reviews, setReviews] = useState<Review[]>([])
  const [filteredReviews, setFilteredReviews] = useState<Review[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [phaseFilter, setPhaseFilter] = useState('')
  const [departmentFilter, setDepartmentFilter] = useState('')
  const [showArchived, setShowArchived] = useState(false)

  useEffect(() => {
    fetchUserData()
    fetchReviews()
  }, [showArchived])

  useEffect(() => {
    filterReviews()
  }, [reviews, searchTerm, phaseFilter, departmentFilter])

  const fetchUserData = async () => {
    try {
      const response = await fetch('/api/auth/me')
      if (response.ok) {
        const data = await response.json()
        setUser(data.user)
        
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

  const fetchReviews = async () => {
    try {
      const url = `/api/reviews${showArchived ? '?archived=true' : ''}`
      const response = await fetch(url)
      if (response.ok) {
        const data = await response.json()
        setReviews(data.reviews)
      }
    } catch (error) {
      console.error('Error fetching reviews:', error)
    }
  }

  const filterReviews = () => {
    let filtered = reviews

    if (searchTerm) {
      filtered = filtered.filter(review =>
        review.employee.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        review.employee.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        review.employee.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        review.employee.department?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (phaseFilter) {
      filtered = filtered.filter(review => review.phase === phaseFilter)
    }

    if (departmentFilter) {
      filtered = filtered.filter(review => review.employee.department === departmentFilter)
    }

    setFilteredReviews(filtered)
  }

  const getPhaseLabel = (phase: string) => {
    const labels: Record<string, string> = {
      'NOT_STARTED': 'Not Started',
      'SELF_EVALUATION': 'Self Evaluation',
      'SUPERVISOR_EVALUATION': 'Supervisor Review',
      'FINAL_MEETING': 'Final Meeting',
      'COMPLETED': 'Completed'
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

  const getUniqueDepartments = () => {
    return Array.from(new Set(reviews.map(r => r.employee.department).filter(Boolean)))
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('pl-PL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <FileText className="w-12 h-12 text-blue-600 mx-auto mb-4 animate-pulse" />
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
                <h1 className="text-xl font-bold text-gray-900">Review Management</h1>
                <p className="text-sm text-gray-600">Manage all employee reviews</p>
              </div>
            </div>
            <LanguageSwitcher />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center space-y-4 lg:space-y-0 lg:space-x-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search employees..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <select
              value={phaseFilter}
              onChange={(e) => setPhaseFilter(e.target.value)}
              className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Phases</option>
              <option value="NOT_STARTED">Not Started</option>
              <option value="SELF_EVALUATION">Self Evaluation</option>
              <option value="SUPERVISOR_EVALUATION">Supervisor Review</option>
              <option value="FINAL_MEETING">Final Meeting</option>
              <option value="COMPLETED">Completed</option>
            </select>
            
            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Departments</option>
              {getUniqueDepartments().map(dept => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>

            <label className="flex items-center space-x-2 px-4 py-2 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
              <input
                type="checkbox"
                checked={showArchived}
                onChange={(e) => setShowArchived(e.target.checked)}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <Archive className="w-4 h-4 text-gray-600" />
              <span className="text-sm text-gray-700">Archived</span>
            </label>
          </div>

          <div className="text-sm text-gray-600">
            Showing {filteredReviews.length} of {reviews.length} reviews
            {showArchived ? ' (archived)' : ' (active)'}
          </div>
        </div>

        {/* Reviews List */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-transparent">
            <h3 className="font-semibold text-gray-900">All Reviews</h3>
            <p className="text-sm text-gray-600">Click on a review to view details</p>
          </div>
          
          <div className="divide-y divide-gray-100">
            {filteredReviews.length > 0 ? (
              filteredReviews.map((review) => (
                <button
                  key={review.id}
                  onClick={() => router.push(`/review/${review.id}`)}
                  className="w-full text-left p-6 hover:bg-blue-50/50 transition-all group"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                          <User className="w-4 h-4 text-blue-600" />
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">
                            {review.employee.firstName} {review.employee.lastName}
                          </h4>
                          <p className="text-sm text-gray-600">{review.employee.department}</p>
                        </div>
                        {review.isArchived && (
                          <div className="flex items-center space-x-1 px-2 py-1 bg-purple-100 text-purple-700 rounded-lg text-xs font-medium">
                            <Archive className="w-3 h-3" />
                            <span>Archived</span>
                          </div>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-gray-500">Review Period</p>
                          <p className="font-medium text-gray-900">
                            {review.reviewPeriod.year} - {review.reviewPeriod.type === 'MID_YEAR' ? 'Mid-Year' : 'End-Year'}
                          </p>
                        </div>
                        
                        <div>
                          <p className="text-gray-500">Supervisor</p>
                          <p className="font-medium text-gray-900">
                            {review.supervisor.firstName} {review.supervisor.lastName}
                          </p>
                        </div>
                        
                        <div>
                          <p className="text-gray-500">Status</p>
                          <span className={`inline-flex items-center space-x-1 px-2 py-1 text-xs font-medium rounded-lg border ${getPhaseColor(review.phase)}`}>
                            {getPhaseIcon(review.phase)}
                            <span>{getPhaseLabel(review.phase)}</span>
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600 transition-colors ml-4" />
                  </div>
                </button>
              ))
            ) : (
              <div className="py-12 text-center">
                <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No reviews found</p>
                <p className="text-sm text-gray-400 mt-1">Try adjusting your search criteria</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
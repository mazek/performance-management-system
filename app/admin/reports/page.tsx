"use client"

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useLanguage } from '@/contexts/LanguageContext'
import { LanguageSwitcher } from '@/components/LanguageSwitcher'
import { 
  ArrowLeft,
  Download,
  Calendar,
  Users,
  BarChart3,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  FileText,
  Filter,
  LogOut
} from 'lucide-react'

interface ReportData {
  totalEmployees: number
  totalReviews: number
  completedReviews: number
  pendingReviews: number
  averageScore: number
  departmentStats: {
    department: string
    totalEmployees: number
    completedReviews: number
    averageScore: number
  }[]
  reviewPeriodStats: {
    id: string
    year: number
    type: string
    status: string
    totalReviews: number
    completedReviews: number
    completionRate: number
  }[]
  phaseDistribution: {
    phase: string
    count: number
  }[]
  topPerformers: {
    id: string
    firstName: string
    lastName: string
    department: string
    averageScore: number
  }[]
  reviewTrends: {
    month: string
    completed: number
    total: number
  }[]
}

export default function ReportsPage() {
  const router = useRouter()
  const { t } = useLanguage()
  const [loading, setLoading] = useState(true)
  const [reportData, setReportData] = useState<ReportData | null>(null)
  const [selectedPeriod, setSelectedPeriod] = useState<string>('all')
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all')
  const [availablePeriods, setAvailablePeriods] = useState<{id: string, label: string}[]>([])
  const [availableDepartments, setAvailableDepartments] = useState<string[]>([])

  useEffect(() => {
    fetchReportData()
    fetchFilterOptions()
  }, [fetchReportData, fetchFilterOptions])

  const fetchReportData = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        period: selectedPeriod,
        department: selectedDepartment
      })
      
      const response = await fetch(`/api/admin/reports?${params}`)
      if (response.ok) {
        const data = await response.json()
        setReportData(data.reports)
      }
    } catch (error) {
      console.error('Error fetching report data:', error)
    } finally {
      setLoading(false)
    }
  }, [selectedPeriod, selectedDepartment])

  const fetchFilterOptions = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/reports/filters')
      if (response.ok) {
        const data = await response.json()
        setAvailablePeriods(data.periods)
        setAvailableDepartments(data.departments)
      }
    } catch (error) {
      console.error('Error fetching filter options:', error)
    }
  }, [])

  const exportReport = async (format: 'csv' | 'pdf') => {
    try {
      const params = new URLSearchParams({
        period: selectedPeriod,
        department: selectedDepartment,
        format
      })
      
      const response = await fetch(`/api/admin/reports/export?${params}`)
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `performance-report-${new Date().toISOString().split('T')[0]}.${format}`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        window.URL.revokeObjectURL(url)
      }
    } catch (error) {
      console.error('Error exporting report:', error)
    }
  }

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
  }

  if (loading || !reportData) {
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
                <h1 className="text-xl font-bold text-gray-900">Reports & Analytics</h1>
                <p className="text-sm text-gray-600">Performance insights and analytics</p>
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
        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
              <Filter className="w-5 h-5" />
              <span>Report Filters</span>
            </h3>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => exportReport('csv')}
                className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Download className="w-4 h-4" />
                <span>Export CSV</span>
              </button>
              <button
                onClick={() => exportReport('pdf')}
                className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                <FileText className="w-4 h-4" />
                <span>Export PDF</span>
              </button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Review Period</label>
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Periods</option>
                {availablePeriods.map(period => (
                  <option key={period.id} value={period.id}>{period.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
              <select
                value={selectedDepartment}
                onChange={(e) => setSelectedDepartment(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Departments</option>
                {availableDepartments.map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Employees</p>
                <p className="text-2xl font-bold text-gray-900">{reportData.totalEmployees || 0}</p>
              </div>
              <Users className="w-10 h-10 text-blue-600" />
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Reviews</p>
                <p className="text-2xl font-bold text-gray-900">{reportData.totalReviews || 0}</p>
              </div>
              <FileText className="w-10 h-10 text-green-600" />
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Completed Reviews</p>
                <p className="text-2xl font-bold text-gray-900">{reportData.completedReviews || 0}</p>
                <p className="text-xs text-green-600">
                  {reportData.totalReviews > 0 
                    ? Math.round(((reportData.completedReviews || 0) / reportData.totalReviews) * 100)
                    : 0}% completion rate
                </p>
              </div>
              <CheckCircle className="w-10 h-10 text-emerald-600" />
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Average Score</p>
                <p className="text-2xl font-bold text-gray-900">{reportData.averageScore?.toFixed(1) || '0.0'}</p>
                <p className="text-xs text-gray-600">Out of 5.0</p>
              </div>
              <TrendingUp className="w-10 h-10 text-purple-600" />
            </div>
          </div>
        </div>

        {/* Department Performance */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Department Performance</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left p-3 font-medium text-gray-900">Department</th>
                  <th className="text-left p-3 font-medium text-gray-900">Employees</th>
                  <th className="text-left p-3 font-medium text-gray-900">Completed Reviews</th>
                  <th className="text-left p-3 font-medium text-gray-900">Completion Rate</th>
                  <th className="text-left p-3 font-medium text-gray-900">Average Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {(reportData.departmentStats || []).map((dept, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="p-3 font-medium text-gray-900">{dept.department || 'Not Assigned'}</td>
                    <td className="p-3 text-gray-600">{dept.totalEmployees}</td>
                    <td className="p-3 text-gray-600">{dept.completedReviews}</td>
                    <td className="p-3">
                      <div className="flex items-center space-x-2">
                        <div className="w-16 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full" 
                            style={{ width: `${(dept.completedReviews / dept.totalEmployees) * 100}%` }}
                          ></div>
                        </div>
                        <span className="text-sm text-gray-600">
                          {Math.round((dept.completedReviews / dept.totalEmployees) * 100)}%
                        </span>
                      </div>
                    </td>
                    <td className="p-3 text-gray-600">{dept.averageScore?.toFixed(1) || '0.0'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Review Period Stats */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Review Period Statistics</h3>
          <div className="space-y-4">
            {(reportData.reviewPeriodStats || []).map((period) => (
              <div key={period.id} className="border border-gray-200 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-gray-900">
                    {period.year} - {period.type === 'MID_YEAR' ? 'Mid-Year' : 'End-Year'} Review
                  </h4>
                  <span className={`px-2 py-1 text-xs font-medium rounded-lg ${
                    period.status === 'OPEN' ? 'bg-green-100 text-green-700' : 
                    period.status === 'CLOSED' ? 'bg-blue-100 text-blue-700' :
                    period.status === 'ARCHIVED' ? 'bg-purple-100 text-purple-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {period.status}
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                  <div>
                    <p>Total Reviews: {period.totalReviews}</p>
                  </div>
                  <div>
                    <p>Completed: {period.completedReviews}</p>
                  </div>
                  <div>
                    <p>Completion Rate: {period.completionRate}%</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Phase Distribution */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Review Phase Distribution</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {(reportData.phaseDistribution || []).map((phase) => (
              <div key={phase.phase} className="text-center p-4 border border-gray-200 rounded-xl">
                <p className="text-2xl font-bold text-gray-900 mb-1">{phase.count}</p>
                <p className="text-sm text-gray-600 capitalize">{phase.phase.replace('_', ' ')}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Top Performers */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Performers</h3>
          <div className="space-y-3">
            {(reportData.topPerformers || []).map((performer, index) => (
              <div key={performer.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-xl">
                <div className="flex items-center space-x-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white ${
                    index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : index === 2 ? 'bg-orange-600' : 'bg-blue-600'
                  }`}>
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">
                      {performer.firstName} {performer.lastName}
                    </p>
                    <p className="text-sm text-gray-600">{performer.department}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-gray-900">{performer.averageScore?.toFixed(1) || '0.0'}</p>
                  <p className="text-xs text-gray-600">Average Score</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}
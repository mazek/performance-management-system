"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useLanguage } from '@/contexts/LanguageContext'
import { LanguageSwitcher } from '@/components/LanguageSwitcher'
import { 
  ArrowLeft,
  User,
  Mail,
  Building,
  Briefcase,
  Calendar,
  Award,
  Edit,
  Save,
  X,
  LogOut
} from 'lucide-react'

interface UserProfile {
  id: string
  email: string
  firstName: string
  lastName: string
  role: string
  department?: string
  position?: string
  joinDate?: string
  supervisor?: {
    firstName: string
    lastName: string
    email: string
  }
  subordinates?: Array<{
    id: string
    firstName: string
    lastName: string
    email: string
  }>
}

export default function ProfilePage() {
  const router = useRouter()
  const { t } = useLanguage()
  const [user, setUser] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    department: '',
    position: ''
  })

  useEffect(() => {
    fetchUserData()
  }, [])

  const fetchUserData = async () => {
    try {
      const response = await fetch('/api/auth/me')
      if (!response.ok) {
        throw new Error('Not authenticated')
      }
      const data = await response.json()
      setUser(data.user)
      setFormData({
        firstName: data.user.firstName,
        lastName: data.user.lastName,
        department: data.user.department || '',
        position: data.user.position || ''
      })
    } catch (error) {
      router.push('/login')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    // In a real app, this would update the user profile via API
    setUser(user ? { ...user, ...formData } : null)
    setEditing(false)
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

  const getRoleBadgeColor = (role: string) => {
    const colors: Record<string, string> = {
      'ADMIN': 'bg-purple-100 text-purple-700 border-purple-200',
      'HR': 'bg-green-100 text-green-700 border-green-200',
      'SUPERVISOR': 'bg-blue-100 text-blue-700 border-blue-200',
      'EMPLOYEE': 'bg-gray-100 text-gray-700 border-gray-200'
    }
    return colors[role] || 'bg-gray-100 text-gray-700 border-gray-200'
  }

  const getRoleLabel = (role: string) => {
    const labels: Record<string, string> = {
      'ADMIN': 'Administrator',
      'HR': 'HR Manager',
      'SUPERVISOR': 'Supervisor',
      'EMPLOYEE': 'Employee'
    }
    return labels[role] || role
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm shadow-sm border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/dashboard')}
                className="flex items-center space-x-2 px-3 py-1.5 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Powrót</span>
              </button>
              
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                  <User className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">Mój profil</h1>
                  <p className="text-sm text-gray-600">Zarządzaj swoimi danymi</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <LanguageSwitcher />
              {!editing ? (
                <button
                  onClick={() => setEditing(true)}
                  className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Edit className="w-4 h-4" />
                  <span className="hidden sm:inline">Edytuj</span>
                </button>
              ) : (
                <>
                  <button
                    onClick={() => setEditing(false)}
                    className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <X className="w-4 h-4" />
                    <span className="hidden sm:inline">Anuluj</span>
                  </button>
                  <button
                    onClick={handleSave}
                    className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <Save className="w-4 h-4" />
                    <span className="hidden sm:inline">Zapisz</span>
                  </button>
                </>
              )}
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Card */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <div className="flex flex-col items-center">
                <div className="w-24 h-24 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center mb-4">
                  <span className="text-3xl font-bold text-white">
                    {user.firstName[0]}{user.lastName[0]}
                  </span>
                </div>
                <h2 className="text-xl font-bold text-gray-900">
                  {user.firstName} {user.lastName}
                </h2>
                <span className={`mt-2 px-3 py-1 text-xs font-medium rounded-lg border ${getRoleBadgeColor(user.role)}`}>
                  {getRoleLabel(user.role)}
                </span>
              </div>

              <div className="mt-6 space-y-3">
                <div className="flex items-center space-x-3 text-gray-600">
                  <Mail className="w-5 h-5 text-gray-400" />
                  <span className="text-sm">{user.email}</span>
                </div>
                {user.department && (
                  <div className="flex items-center space-x-3 text-gray-600">
                    <Building className="w-5 h-5 text-gray-400" />
                    <span className="text-sm">{user.department}</span>
                  </div>
                )}
                {user.position && (
                  <div className="flex items-center space-x-3 text-gray-600">
                    <Briefcase className="w-5 h-5 text-gray-400" />
                    <span className="text-sm">{user.position}</span>
                  </div>
                )}
                <div className="flex items-center space-x-3 text-gray-600">
                  <Calendar className="w-5 h-5 text-gray-400" />
                  <span className="text-sm">Dołączył: {user.joinDate || 'Styczeń 2024'}</span>
                </div>
              </div>
            </div>

            {/* Supervisor Info */}
            {user.supervisor && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mt-6">
                <h3 className="font-semibold text-gray-900 mb-4">Przełożony</h3>
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <User className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">
                      {user.supervisor.firstName} {user.supervisor.lastName}
                    </p>
                    <p className="text-sm text-gray-600">{user.supervisor.email}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Details Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Informacje osobiste</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Imię
                  </label>
                  <input
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    disabled={!editing}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nazwisko
                  </label>
                  <input
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    disabled={!editing}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={user.email}
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg disabled:bg-gray-50 disabled:text-gray-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Rola
                  </label>
                  <input
                    type="text"
                    value={getRoleLabel(user.role)}
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg disabled:bg-gray-50 disabled:text-gray-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Dział
                  </label>
                  <input
                    type="text"
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    disabled={!editing}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Stanowisko
                  </label>
                  <input
                    type="text"
                    value={formData.position}
                    onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                    disabled={!editing}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
                  />
                </div>
              </div>
            </div>

            {/* Team Members (for Supervisors) */}
            {user.subordinates && user.subordinates.length > 0 && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">Zespół</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {user.subordinates.map((member) => (
                    <div key={member.id} className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg">
                      <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                        <User className="w-5 h-5 text-gray-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 text-sm">
                          {member.firstName} {member.lastName}
                        </p>
                        <p className="text-xs text-gray-600">{member.email}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Performance Summary */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Podsumowanie wydajności</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-xl">
                  <Award className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-gray-900">4.2</p>
                  <p className="text-sm text-gray-600">Średnia ocena</p>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-xl">
                  <Calendar className="w-8 h-8 text-green-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-gray-900">3</p>
                  <p className="text-sm text-gray-600">Ukończone oceny</p>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-xl">
                  <Award className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-gray-900">85%</p>
                  <p className="text-sm text-gray-600">Realizacja celów</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
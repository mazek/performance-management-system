"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useLanguage } from '@/contexts/LanguageContext'
import { AdminLayout } from '@/components/AdminLayout'
import { 
  Shield, 
  User, 
  Users, 
  Settings, 
  ChevronRight,
  Edit,
  Save,
  X,
  AlertCircle,
  CheckCircle,
  Clock,
  Key,
  UserCog
} from 'lucide-react'
import { Permission, RolePermissions, hasPermission } from '@/lib/permissions'

interface UserWithRole {
  id: string
  email: string
  firstName: string
  lastName: string
  employeeId: string
  department: string
  position: string
  role: string
  authProvider: string
  roleAssignedBy?: string
  roleAssignedAt?: string
  lastLogin?: string
  isActive: boolean
}

export default function RolesPage() {
  const router = useRouter()
  const { t } = useLanguage()
  const [users, setUsers] = useState<UserWithRole[]>([])
  const [loading, setLoading] = useState(true)
  const [editingUser, setEditingUser] = useState<string | null>(null)
  const [newRole, setNewRole] = useState<string>('')
  const [saving, setSaving] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [filterRole, setFilterRole] = useState<string>('all')
  const [filterDepartment, setFilterDepartment] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/admin/users')
      if (response.ok) {
        const data = await response.json()
        setUsers(data.users)
      } else if (response.status === 403) {
        router.push('/dashboard')
      }
    } catch (error) {
      console.error('Error fetching users:', error)
      setErrorMessage('Failed to load users')
    } finally {
      setLoading(false)
    }
  }

  const handleRoleChange = async (userId: string, newRole: string) => {
    setSaving(true)
    setErrorMessage('')
    setSuccessMessage('')

    try {
      const response = await fetch(`/api/admin/users/${userId}/role`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      })

      if (response.ok) {
        const data = await response.json()
        setUsers(users.map(u => u.id === userId ? { ...u, ...data.user } : u))
        setEditingUser(null)
        setSuccessMessage('Role updated successfully')
        setTimeout(() => setSuccessMessage(''), 3000)
      } else {
        const error = await response.json()
        setErrorMessage(error.message || 'Failed to update role')
      }
    } catch (error) {
      setErrorMessage('Network error occurred')
    } finally {
      setSaving(false)
    }
  }

  const getRoleColor = (role: string) => {
    const colors: Record<string, string> = {
      ADMIN: 'bg-purple-100 text-purple-700 border-purple-300',
      HR: 'bg-green-100 text-green-700 border-green-300',
      SUPERVISOR: 'bg-blue-100 text-blue-700 border-blue-300',
      EMPLOYEE: 'bg-gray-100 text-gray-700 border-gray-300',
    }
    return colors[role] || 'bg-gray-100 text-gray-700'
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return <Shield className="w-4 h-4" />
      case 'HR':
        return <UserCog className="w-4 h-4" />
      case 'SUPERVISOR':
        return <Users className="w-4 h-4" />
      default:
        return <User className="w-4 h-4" />
    }
  }

  const getAuthProviderLabel = (provider: string) => {
    const labels: Record<string, string> = {
      LOCAL: 'Local',
      ACTIVE_DIRECTORY: 'Active Directory',
      SAML: 'SAML SSO',
      OAUTH: 'OAuth',
    }
    return labels[provider] || provider
  }

  const filteredUsers = users.filter(user => {
    const matchesRole = filterRole === 'all' || user.role === filterRole
    const matchesDepartment = filterDepartment === 'all' || user.department === filterDepartment
    const matchesSearch = searchTerm === '' || 
      user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.employeeId.toLowerCase().includes(searchTerm.toLowerCase())
    
    return matchesRole && matchesDepartment && matchesSearch
  })

  const departments = [...new Set(users.map(u => u.department).filter(Boolean))]

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Role Management</h1>
                <p className="text-gray-600">Assign and manage user roles and permissions</p>
              </div>
            </div>
          </div>

          {/* Messages */}
          {successMessage && (
            <div className="mb-4 p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg flex items-center">
              <CheckCircle className="w-5 h-5 mr-2" />
              {successMessage}
            </div>
          )}
          
          {errorMessage && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-center">
              <AlertCircle className="w-5 h-5 mr-2" />
              {errorMessage}
            </div>
          )}

          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search Users
              </label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Name, email, or ID..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filter by Role
              </label>
              <select
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Roles</option>
                <option value="ADMIN">Admin</option>
                <option value="HR">HR</option>
                <option value="SUPERVISOR">Supervisor</option>
                <option value="EMPLOYEE">Employee</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filter by Department
              </label>
              <select
                value={filterDepartment}
                onChange={(e) => setFilterDepartment(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Departments</option>
                {departments.map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            <div className="bg-purple-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <Shield className="w-8 h-8 text-purple-600" />
                <span className="text-2xl font-bold text-purple-900">
                  {users.filter(u => u.role === 'ADMIN').length}
                </span>
              </div>
              <p className="text-sm text-purple-700 mt-2">Administrators</p>
            </div>
            
            <div className="bg-green-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <UserCog className="w-8 h-8 text-green-600" />
                <span className="text-2xl font-bold text-green-900">
                  {users.filter(u => u.role === 'HR').length}
                </span>
              </div>
              <p className="text-sm text-green-700 mt-2">HR Managers</p>
            </div>
            
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <Users className="w-8 h-8 text-blue-600" />
                <span className="text-2xl font-bold text-blue-900">
                  {users.filter(u => u.role === 'SUPERVISOR').length}
                </span>
              </div>
              <p className="text-sm text-blue-700 mt-2">Supervisors</p>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <User className="w-8 h-8 text-gray-600" />
                <span className="text-2xl font-bold text-gray-900">
                  {users.filter(u => u.role === 'EMPLOYEE').length}
                </span>
              </div>
              <p className="text-sm text-gray-700 mt-2">Employees</p>
            </div>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Department
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Current Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Auth Provider
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Login
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {user.firstName} {user.lastName}
                        </div>
                        <div className="text-sm text-gray-500">{user.email}</div>
                        <div className="text-xs text-gray-400">ID: {user.employeeId}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{user.department}</div>
                      <div className="text-xs text-gray-500">{user.position}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {editingUser === user.id ? (
                        <select
                          value={newRole}
                          onChange={(e) => setNewRole(e.target.value)}
                          className="px-3 py-1 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="EMPLOYEE">Employee</option>
                          <option value="SUPERVISOR">Supervisor</option>
                          <option value="HR">HR</option>
                          <option value="ADMIN">Admin</option>
                        </select>
                      ) : (
                        <span className={`inline-flex items-center space-x-1 px-3 py-1 text-xs font-medium rounded-lg border ${getRoleColor(user.role)}`}>
                          {getRoleIcon(user.role)}
                          <span>{user.role}</span>
                        </span>
                      )}
                      {user.roleAssignedBy && (
                        <div className="text-xs text-gray-500 mt-1">
                          Assigned {user.roleAssignedAt ? new Date(user.roleAssignedAt).toLocaleDateString() : ''}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">
                        {getAuthProviderLabel(user.authProvider)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {user.lastLogin ? (
                        <div className="text-sm text-gray-900">
                          {new Date(user.lastLogin).toLocaleDateString()}
                          <div className="text-xs text-gray-500">
                            {new Date(user.lastLogin).toLocaleTimeString()}
                          </div>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-500">Never</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        user.isActive 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {user.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {editingUser === user.id ? (
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleRoleChange(user.id, newRole)}
                            disabled={saving}
                            className="text-green-600 hover:text-green-700"
                          >
                            <Save className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              setEditingUser(null)
                              setNewRole('')
                            }}
                            disabled={saving}
                            className="text-gray-600 hover:text-gray-700"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            setEditingUser(user.id)
                            setNewRole(user.role)
                          }}
                          className="text-blue-600 hover:text-blue-700"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Role Permissions Reference */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Role Permissions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Object.entries(RolePermissions).map(([role, permissions]) => (
              <div key={role} className="border border-gray-200 rounded-lg p-4">
                <div className={`inline-flex items-center space-x-1 px-3 py-1 text-xs font-medium rounded-lg border mb-3 ${getRoleColor(role)}`}>
                  {getRoleIcon(role)}
                  <span>{role}</span>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-medium text-gray-700">Key Permissions:</p>
                  <ul className="text-xs text-gray-600 space-y-1">
                    {permissions.slice(0, 5).map((perm, idx) => (
                      <li key={idx} className="flex items-center">
                        <Key className="w-3 h-3 mr-1 text-gray-400" />
                        {perm.replace(/_/g, ' ').toLowerCase()}
                      </li>
                    ))}
                    {permissions.length > 5 && (
                      <li className="text-gray-500">+{permissions.length - 5} more</li>
                    )}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
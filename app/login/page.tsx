"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useLanguage } from '@/contexts/LanguageContext'
import { LanguageSwitcher } from '@/components/LanguageSwitcher'
import { User, Lock, AlertCircle, CheckCircle } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const { t, language } = useLanguage()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [selectedAccount, setSelectedAccount] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })

  // Only show test accounts in development mode
  const isDevelopment = process.env.NODE_ENV === 'development'
  const testAccounts = isDevelopment ? [
    { role: 'Admin', email: 'admin@company.com', password: 'admin123', color: 'bg-purple-500' },
    { role: 'HR', email: 'hr@company.com', password: 'hr123', color: 'bg-green-500' },
    { role: 'Supervisor', email: 'jan.nowak@company.com', password: 'supervisor123', color: 'bg-blue-500' },
    { role: 'Employee', email: 'piotr.kowalczyk@company.com', password: 'employee123', color: 'bg-orange-500' },
  ] : []

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          language: language
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Login failed')
      }

      router.push('/dashboard')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const selectTestAccount = (account: typeof testAccounts[0]) => {
    setFormData({
      email: account.email,
      password: account.password
    })
    setSelectedAccount(account.email)
    setError('')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="absolute top-4 right-4 z-10">
        <LanguageSwitcher />
      </div>
      <div className="w-full max-w-5xl grid lg:grid-cols-2 gap-8">
        {/* Left Side - Login Form */}
        <div className="bg-white rounded-2xl shadow-xl p-8 lg:p-10">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {t.auth.loginTitle}
            </h1>
            <p className="text-gray-600">
              {t.auth.loginSubtitle}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="label">
                {t.auth.email}
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  id="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="input pl-10"
                  placeholder="nazwa@firma.com"
                />
              </div>
            </div>
            
            <div>
              <label htmlFor="password" className="label">
                {t.auth.password}
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  id="password"
                  type="password"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="input pl-10"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-start">
                <AlertCircle className="w-5 h-5 mt-0.5 mr-2 flex-shrink-0" />
                <span className="text-sm">{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary py-3 text-base"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {t.common.loading}
                </span>
              ) : (
                t.auth.login
              )}
            </button>
          </form>
        </div>

        {/* Right Side - Test Accounts (Development Only) */}
        {isDevelopment && (
        <div className="bg-white rounded-2xl shadow-xl p-8 lg:p-10">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {t.auth.testAccounts}
            </h2>
            <p className="text-gray-600 text-sm">
              {t.auth.testAccountsSubtitle}
            </p>
          </div>

          <div className="space-y-3">
            {testAccounts.map((account) => (
              <button
                key={account.email}
                onClick={() => selectTestAccount(account)}
                className={`w-full text-left p-4 rounded-xl border-2 transition-all duration-200 ${
                  selectedAccount === account.email
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`w-10 h-10 ${account.color} rounded-lg flex items-center justify-center text-white font-bold`}>
                      {account.role[0]}
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">{account.role}</div>
                      <div className="text-sm text-gray-600">{account.email}</div>
                    </div>
                  </div>
                  {selectedAccount === account.email && (
                    <CheckCircle className="w-5 h-5 text-blue-500" />
                  )}
                </div>
              </button>
            ))}
          </div>

          <div className="mt-8 p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex items-start">
              <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 mr-2 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-amber-800">{t.auth.testEnvironment}</p>
                <p className="text-xs text-amber-700 mt-1">
                  {t.auth.testEnvironmentDesc}
                </p>
              </div>
            </div>
          </div>
        </div>
        )}
      </div>
    </div>
  )
}
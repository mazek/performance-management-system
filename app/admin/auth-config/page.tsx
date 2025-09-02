"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useLanguage } from '@/contexts/LanguageContext'
import { AdminLayout } from '@/components/AdminLayout'
import {
  Shield,
  Server,
  Cloud,
  Key,
  Settings,
  Save,
  AlertCircle,
  CheckCircle,
  Eye,
  EyeOff,
  Globe,
  Building,
  Users,
  TestTube,
  Lock
} from 'lucide-react'

interface AuthConfig {
  local: {
    enabled: boolean
    allowRegistration: boolean
    requireEmailVerification: boolean
    passwordPolicy: {
      minLength: number
      requireUppercase: boolean
      requireLowercase: boolean
      requireNumbers: boolean
      requireSpecialChars: boolean
      maxAge: number
    }
  }
  activeDirectory: {
    enabled: boolean
    domain: string
    url: string
    baseDN: string
    username: string
    password: string
    searchFilter: string
    tlsEnabled: boolean
  }
  saml: {
    enabled: boolean
    entryPoint: string
    issuer: string
    cert: string
    callbackUrl: string
    signatureAlgorithm: string
  }
  oauth: {
    google: {
      enabled: boolean
      clientId: string
      clientSecret: string
    }
    microsoft: {
      enabled: boolean
      clientId: string
      clientSecret: string
      tenantId: string
    }
  }
}

export default function AuthConfigPage() {
  const router = useRouter()
  const { t } = useLanguage()
  const [config, setConfig] = useState<AuthConfig>({
    local: {
      enabled: true,
      allowRegistration: false,
      requireEmailVerification: false,
      passwordPolicy: {
        minLength: 8,
        requireUppercase: true,
        requireLowercase: true,
        requireNumbers: true,
        requireSpecialChars: false,
        maxAge: 90,
      },
    },
    activeDirectory: {
      enabled: false,
      domain: '',
      url: '',
      baseDN: '',
      username: '',
      password: '',
      searchFilter: '(&(objectClass=user)(sAMAccountName={{username}}))',
      tlsEnabled: true,
    },
    saml: {
      enabled: false,
      entryPoint: '',
      issuer: '',
      cert: '',
      callbackUrl: '',
      signatureAlgorithm: 'sha256',
    },
    oauth: {
      google: {
        enabled: false,
        clientId: '',
        clientSecret: '',
      },
      microsoft: {
        enabled: false,
        clientId: '',
        clientSecret: '',
        tenantId: '',
      },
    },
  })

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [testingConnection, setTestingConnection] = useState<string | null>(null)
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({})
  const [successMessage, setSuccessMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [activeTab, setActiveTab] = useState<'local' | 'ad' | 'saml' | 'oauth'>('local')

  useEffect(() => {
    fetchConfig()
  }, [])

  const fetchConfig = async () => {
    try {
      const response = await fetch('/api/admin/auth-config')
      if (response.ok) {
        const data = await response.json()
        setConfig(data.config)
      }
    } catch (error) {
      console.error('Error fetching auth config:', error)
    } finally {
      setLoading(false)
    }
  }

  const saveConfig = async () => {
    setSaving(true)
    setErrorMessage('')
    setSuccessMessage('')

    try {
      const response = await fetch('/api/admin/auth-config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      })

      if (response.ok) {
        setSuccessMessage('Configuration saved successfully')
        setTimeout(() => setSuccessMessage(''), 3000)
      } else {
        const error = await response.json()
        setErrorMessage(error.message || 'Failed to save configuration')
      }
    } catch (error) {
      setErrorMessage('Network error occurred')
    } finally {
      setSaving(false)
    }
  }

  const testConnection = async (provider: string) => {
    setTestingConnection(provider)
    setErrorMessage('')
    setSuccessMessage('')

    try {
      const response = await fetch('/api/admin/auth-config/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider, config: config }),
      })

      const result = await response.json()
      if (result.success) {
        setSuccessMessage(`${provider} connection test successful!`)
      } else {
        setErrorMessage(`${provider} test failed: ${result.error}`)
      }
    } catch (error) {
      setErrorMessage('Connection test failed')
    } finally {
      setTestingConnection(null)
      setTimeout(() => {
        setSuccessMessage('')
        setErrorMessage('')
      }, 5000)
    }
  }

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
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Authentication Configuration</h1>
                <p className="text-gray-600">Configure authentication providers and security settings</p>
              </div>
            </div>
            <button
              onClick={saveConfig}
              disabled={saving}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Saving...' : 'Save Configuration'}</span>
            </button>
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

          {/* Tabs */}
          <div className="flex space-x-1 border-b border-gray-200">
            <button
              onClick={() => setActiveTab('local')}
              className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
                activeTab === 'local'
                  ? 'text-blue-600 border-blue-600'
                  : 'text-gray-500 border-transparent hover:text-gray-700'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Lock className="w-4 h-4" />
                <span>Local Authentication</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('ad')}
              className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
                activeTab === 'ad'
                  ? 'text-blue-600 border-blue-600'
                  : 'text-gray-500 border-transparent hover:text-gray-700'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Building className="w-4 h-4" />
                <span>Active Directory</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('saml')}
              className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
                activeTab === 'saml'
                  ? 'text-blue-600 border-blue-600'
                  : 'text-gray-500 border-transparent hover:text-gray-700'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Cloud className="w-4 h-4" />
                <span>SAML SSO</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('oauth')}
              className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
                activeTab === 'oauth'
                  ? 'text-blue-600 border-blue-600'
                  : 'text-gray-500 border-transparent hover:text-gray-700'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Globe className="w-4 h-4" />
                <span>OAuth Providers</span>
              </div>
            </button>
          </div>
        </div>

        {/* Configuration Content */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          {/* Local Authentication */}
          {activeTab === 'local' && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-gray-900">Local Authentication Settings</h2>
              
              <div className="space-y-4">
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={config.local.enabled}
                    onChange={(e) => setConfig({
                      ...config,
                      local: { ...config.local, enabled: e.target.checked }
                    })}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700">Enable local authentication</span>
                </label>

                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={config.local.allowRegistration}
                    onChange={(e) => setConfig({
                      ...config,
                      local: { ...config.local, allowRegistration: e.target.checked }
                    })}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700">Allow self-registration</span>
                </label>

                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={config.local.requireEmailVerification}
                    onChange={(e) => setConfig({
                      ...config,
                      local: { ...config.local, requireEmailVerification: e.target.checked }
                    })}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700">Require email verification</span>
                </label>
              </div>

              <div className="border-t pt-6">
                <h3 className="text-md font-medium text-gray-900 mb-4">Password Policy</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Minimum Length
                    </label>
                    <input
                      type="number"
                      value={config.local.passwordPolicy.minLength}
                      onChange={(e) => setConfig({
                        ...config,
                        local: {
                          ...config.local,
                          passwordPolicy: {
                            ...config.local.passwordPolicy,
                            minLength: parseInt(e.target.value),
                          },
                        },
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Password Max Age (days)
                    </label>
                    <input
                      type="number"
                      value={config.local.passwordPolicy.maxAge}
                      onChange={(e) => setConfig({
                        ...config,
                        local: {
                          ...config.local,
                          passwordPolicy: {
                            ...config.local.passwordPolicy,
                            maxAge: parseInt(e.target.value),
                          },
                        },
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="mt-4 space-y-2">
                  <label className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={config.local.passwordPolicy.requireUppercase}
                      onChange={(e) => setConfig({
                        ...config,
                        local: {
                          ...config.local,
                          passwordPolicy: {
                            ...config.local.passwordPolicy,
                            requireUppercase: e.target.checked,
                          },
                        },
                      })}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">Require uppercase letters</span>
                  </label>

                  <label className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={config.local.passwordPolicy.requireLowercase}
                      onChange={(e) => setConfig({
                        ...config,
                        local: {
                          ...config.local,
                          passwordPolicy: {
                            ...config.local.passwordPolicy,
                            requireLowercase: e.target.checked,
                          },
                        },
                      })}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">Require lowercase letters</span>
                  </label>

                  <label className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={config.local.passwordPolicy.requireNumbers}
                      onChange={(e) => setConfig({
                        ...config,
                        local: {
                          ...config.local,
                          passwordPolicy: {
                            ...config.local.passwordPolicy,
                            requireNumbers: e.target.checked,
                          },
                        },
                      })}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">Require numbers</span>
                  </label>

                  <label className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={config.local.passwordPolicy.requireSpecialChars}
                      onChange={(e) => setConfig({
                        ...config,
                        local: {
                          ...config.local,
                          passwordPolicy: {
                            ...config.local.passwordPolicy,
                            requireSpecialChars: e.target.checked,
                          },
                        },
                      })}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">Require special characters</span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Active Directory */}
          {activeTab === 'ad' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Active Directory Configuration</h2>
                <button
                  onClick={() => testConnection('ad')}
                  disabled={testingConnection === 'ad'}
                  className="flex items-center space-x-2 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                >
                  <TestTube className="w-4 h-4" />
                  <span>{testingConnection === 'ad' ? 'Testing...' : 'Test Connection'}</span>
                </button>
              </div>

              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={config.activeDirectory.enabled}
                  onChange={(e) => setConfig({
                    ...config,
                    activeDirectory: { ...config.activeDirectory, enabled: e.target.checked }
                  })}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-700">Enable Active Directory authentication</span>
              </label>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Domain
                  </label>
                  <input
                    type="text"
                    value={config.activeDirectory.domain}
                    onChange={(e) => setConfig({
                      ...config,
                      activeDirectory: { ...config.activeDirectory, domain: e.target.value }
                    })}
                    placeholder="company.local"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    LDAP URL
                  </label>
                  <input
                    type="text"
                    value={config.activeDirectory.url}
                    onChange={(e) => setConfig({
                      ...config,
                      activeDirectory: { ...config.activeDirectory, url: e.target.value }
                    })}
                    placeholder="ldaps://dc.company.local:636"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Base DN
                  </label>
                  <input
                    type="text"
                    value={config.activeDirectory.baseDN}
                    onChange={(e) => setConfig({
                      ...config,
                      activeDirectory: { ...config.activeDirectory, baseDN: e.target.value }
                    })}
                    placeholder="DC=company,DC=local"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Search Filter
                  </label>
                  <input
                    type="text"
                    value={config.activeDirectory.searchFilter}
                    onChange={(e) => setConfig({
                      ...config,
                      activeDirectory: { ...config.activeDirectory, searchFilter: e.target.value }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Bind Username
                  </label>
                  <input
                    type="text"
                    value={config.activeDirectory.username}
                    onChange={(e) => setConfig({
                      ...config,
                      activeDirectory: { ...config.activeDirectory, username: e.target.value }
                    })}
                    placeholder="CN=Service Account,OU=Service Accounts,DC=company,DC=local"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Bind Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPasswords.ad ? 'text' : 'password'}
                      value={config.activeDirectory.password}
                      onChange={(e) => setConfig({
                        ...config,
                        activeDirectory: { ...config.activeDirectory, password: e.target.value }
                      })}
                      className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords({ ...showPasswords, ad: !showPasswords.ad })}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                      {showPasswords.ad ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={config.activeDirectory.tlsEnabled}
                  onChange={(e) => setConfig({
                    ...config,
                    activeDirectory: { ...config.activeDirectory, tlsEnabled: e.target.checked }
                  })}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-700">Enable TLS/SSL</span>
              </label>
            </div>
          )}

          {/* SAML SSO */}
          {activeTab === 'saml' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">SAML SSO Configuration</h2>
                <button
                  onClick={() => testConnection('saml')}
                  disabled={testingConnection === 'saml'}
                  className="flex items-center space-x-2 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                >
                  <TestTube className="w-4 h-4" />
                  <span>{testingConnection === 'saml' ? 'Testing...' : 'Test Metadata'}</span>
                </button>
              </div>

              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={config.saml.enabled}
                  onChange={(e) => setConfig({
                    ...config,
                    saml: { ...config.saml, enabled: e.target.checked }
                  })}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-700">Enable SAML SSO</span>
              </label>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Identity Provider Entry Point URL
                  </label>
                  <input
                    type="text"
                    value={config.saml.entryPoint}
                    onChange={(e) => setConfig({
                      ...config,
                      saml: { ...config.saml, entryPoint: e.target.value }
                    })}
                    placeholder="https://idp.example.com/sso/saml"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Service Provider Entity ID / Issuer
                  </label>
                  <input
                    type="text"
                    value={config.saml.issuer}
                    onChange={(e) => setConfig({
                      ...config,
                      saml: { ...config.saml, issuer: e.target.value }
                    })}
                    placeholder="https://yourapp.com"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Callback URL (ACS URL)
                  </label>
                  <input
                    type="text"
                    value={config.saml.callbackUrl}
                    onChange={(e) => setConfig({
                      ...config,
                      saml: { ...config.saml, callbackUrl: e.target.value }
                    })}
                    placeholder="https://yourapp.com/api/auth/saml/callback"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Identity Provider Certificate (X.509)
                  </label>
                  <textarea
                    value={config.saml.cert}
                    onChange={(e) => setConfig({
                      ...config,
                      saml: { ...config.saml, cert: e.target.value }
                    })}
                    placeholder="-----BEGIN CERTIFICATE-----&#10;...&#10;-----END CERTIFICATE-----"
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-xs"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Signature Algorithm
                  </label>
                  <select
                    value={config.saml.signatureAlgorithm}
                    onChange={(e) => setConfig({
                      ...config,
                      saml: { ...config.saml, signatureAlgorithm: e.target.value }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="sha1">SHA-1</option>
                    <option value="sha256">SHA-256</option>
                    <option value="sha512">SHA-512</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* OAuth Providers */}
          {activeTab === 'oauth' && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-gray-900">OAuth Providers</h2>

              {/* Google OAuth */}
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-md font-medium text-gray-900">Google OAuth</h3>
                  <button
                    onClick={() => testConnection('google')}
                    disabled={testingConnection === 'google'}
                    className="flex items-center space-x-2 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm"
                  >
                    <TestTube className="w-3 h-3" />
                    <span>{testingConnection === 'google' ? 'Testing...' : 'Test'}</span>
                  </button>
                </div>

                <label className="flex items-center space-x-3 mb-4">
                  <input
                    type="checkbox"
                    checked={config.oauth.google.enabled}
                    onChange={(e) => setConfig({
                      ...config,
                      oauth: {
                        ...config.oauth,
                        google: { ...config.oauth.google, enabled: e.target.checked }
                      }
                    })}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700">Enable Google OAuth</span>
                </label>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Client ID
                    </label>
                    <input
                      type="text"
                      value={config.oauth.google.clientId}
                      onChange={(e) => setConfig({
                        ...config,
                        oauth: {
                          ...config.oauth,
                          google: { ...config.oauth.google, clientId: e.target.value }
                        }
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Client Secret
                    </label>
                    <div className="relative">
                      <input
                        type={showPasswords.google ? 'text' : 'password'}
                        value={config.oauth.google.clientSecret}
                        onChange={(e) => setConfig({
                          ...config,
                          oauth: {
                            ...config.oauth,
                            google: { ...config.oauth.google, clientSecret: e.target.value }
                          }
                        })}
                        className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPasswords({ ...showPasswords, google: !showPasswords.google })}
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                      >
                        {showPasswords.google ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Microsoft OAuth */}
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-md font-medium text-gray-900">Microsoft Azure AD</h3>
                  <button
                    onClick={() => testConnection('microsoft')}
                    disabled={testingConnection === 'microsoft'}
                    className="flex items-center space-x-2 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm"
                  >
                    <TestTube className="w-3 h-3" />
                    <span>{testingConnection === 'microsoft' ? 'Testing...' : 'Test'}</span>
                  </button>
                </div>

                <label className="flex items-center space-x-3 mb-4">
                  <input
                    type="checkbox"
                    checked={config.oauth.microsoft.enabled}
                    onChange={(e) => setConfig({
                      ...config,
                      oauth: {
                        ...config.oauth,
                        microsoft: { ...config.oauth.microsoft, enabled: e.target.checked }
                      }
                    })}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700">Enable Microsoft Azure AD</span>
                </label>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Application (Client) ID
                    </label>
                    <input
                      type="text"
                      value={config.oauth.microsoft.clientId}
                      onChange={(e) => setConfig({
                        ...config,
                        oauth: {
                          ...config.oauth,
                          microsoft: { ...config.oauth.microsoft, clientId: e.target.value }
                        }
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Client Secret
                    </label>
                    <div className="relative">
                      <input
                        type={showPasswords.microsoft ? 'text' : 'password'}
                        value={config.oauth.microsoft.clientSecret}
                        onChange={(e) => setConfig({
                          ...config,
                          oauth: {
                            ...config.oauth,
                            microsoft: { ...config.oauth.microsoft, clientSecret: e.target.value }
                          }
                        })}
                        className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPasswords({ ...showPasswords, microsoft: !showPasswords.microsoft })}
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                      >
                        {showPasswords.microsoft ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Directory (Tenant) ID
                    </label>
                    <input
                      type="text"
                      value={config.oauth.microsoft.tenantId}
                      onChange={(e) => setConfig({
                        ...config,
                        oauth: {
                          ...config.oauth,
                          microsoft: { ...config.oauth.microsoft, tenantId: e.target.value }
                        }
                      })}
                      placeholder="common, organizations, consumers, or tenant ID"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  )
}
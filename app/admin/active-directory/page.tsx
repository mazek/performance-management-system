'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useLanguage } from '@/contexts/LanguageContext'
import { Shield, Users, RefreshCw, Server, AlertCircle, CheckCircle, Settings, Activity } from 'lucide-react'

interface ADStatus {
  configured: boolean
  enabled: boolean
  domain?: string
  url?: string
  baseDN?: string
  totalUsers?: number
  activeUsers?: number
  lastSync?: string
}

interface SyncResult {
  success: boolean
  created?: number
  updated?: number
  deactivated?: number
  errors?: string[]
  message?: string
}

export default function ActiveDirectoryPage() {
  const router = useRouter()
  const { } = useLanguage()
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [adStatus, setADStatus] = useState<ADStatus | null>(null)
  const [syncResult, setSyncResult] = useState<SyncResult | null>(null)
  const [showConfig, setShowConfig] = useState(false)
  const [config, setConfig] = useState({
    domain: '',
    url: '',
    baseDN: '',
    username: '',
    password: '',
    searchFilter: '',
  })

  useEffect(() => {
    fetchADStatus()
  }, [])

  const fetchADStatus = async () => {
    try {
      const response = await fetch('/api/admin/sync-ad')
      if (response.ok) {
        const data = await response.json()
        setADStatus(data)
        
        if (data.configured) {
          setConfig({
            domain: data.domain || '',
            url: data.url || '',
            baseDN: data.baseDN || '',
            username: '',
            password: '',
            searchFilter: '',
          })
        }
      }
    } catch (error) {
      console.error('Error fetching AD status:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSync = async () => {
    setSyncing(true)
    setSyncResult(null)
    
    try {
      const response = await fetch('/api/admin/sync-ad', {
        method: 'POST',
      })
      
      const data = await response.json()
      setSyncResult(data)
      
      if (data.success) {
        await fetchADStatus() // Refresh status
      }
    } catch {
      setSyncResult({
        success: false,
        message: 'Failed to sync with Active Directory'
      })
    } finally {
      setSyncing(false)
    }
  }

  const saveConfig = async () => {
    try {
      const response = await fetch('/api/admin/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key: 'AD_CONFIG',
          value: {
            enabled: true,
            ...config
          }
        })
      })
      
      if (response.ok) {
        setShowConfig(false)
        await fetchADStatus()
      }
    } catch (error) {
      console.error('Error saving config:', error)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Shield className="w-8 h-8 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Active Directory Integration</h1>
                <p className="text-gray-600">Sync users and organizational structure from AD</p>
              </div>
            </div>
            <button
              onClick={() => router.push('/admin')}
              className="btn-secondary"
            >
              Back to Admin
            </button>
          </div>
        </div>

        {/* Status Card */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Connection Status</h2>
            <div className={`px-3 py-1 rounded-full text-sm font-medium ${
              adStatus?.configured && adStatus?.enabled
                ? 'bg-green-100 text-green-800'
                : 'bg-yellow-100 text-yellow-800'
            }`}>
              {adStatus?.configured && adStatus?.enabled ? 'Connected' : 'Not Configured'}
            </div>
          </div>

          {adStatus?.configured ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center space-x-2 text-gray-600 mb-1">
                  <Server className="w-4 h-4" />
                  <span className="text-sm">Domain</span>
                </div>
                <p className="font-semibold text-gray-900">{adStatus.domain}</p>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center space-x-2 text-gray-600 mb-1">
                  <Users className="w-4 h-4" />
                  <span className="text-sm">Total Users</span>
                </div>
                <p className="font-semibold text-gray-900">{adStatus.totalUsers || 0}</p>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center space-x-2 text-gray-600 mb-1">
                  <Activity className="w-4 h-4" />
                  <span className="text-sm">Active Users</span>
                </div>
                <p className="font-semibold text-gray-900">{adStatus.activeUsers || 0}</p>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center space-x-2 text-gray-600 mb-1">
                  <RefreshCw className="w-4 h-4" />
                  <span className="text-sm">Last Sync</span>
                </div>
                <p className="font-semibold text-gray-900">
                  {adStatus.lastSync 
                    ? new Date(adStatus.lastSync).toLocaleString()
                    : 'Never'
                  }
                </p>
              </div>
            </div>
          ) : (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <div className="flex items-start">
                <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 mr-2" />
                <div>
                  <p className="text-sm font-medium text-amber-800">Configuration Required</p>
                  <p className="text-sm text-amber-700 mt-1">
                    Active Directory integration needs to be configured before syncing users.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Configuration Section */}
        {(!adStatus?.configured || showConfig) && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">AD Configuration</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label">Domain</label>
                <input
                  type="text"
                  className="input"
                  placeholder="company.local"
                  value={config.domain}
                  onChange={(e) => setConfig({ ...config, domain: e.target.value })}
                />
              </div>
              
              <div>
                <label className="label">LDAP URL</label>
                <input
                  type="text"
                  className="input"
                  placeholder="ldap://dc.company.local:389"
                  value={config.url}
                  onChange={(e) => setConfig({ ...config, url: e.target.value })}
                />
              </div>
              
              <div>
                <label className="label">Base DN</label>
                <input
                  type="text"
                  className="input"
                  placeholder="DC=company,DC=local"
                  value={config.baseDN}
                  onChange={(e) => setConfig({ ...config, baseDN: e.target.value })}
                />
              </div>
              
              <div>
                <label className="label">Search Filter (Optional)</label>
                <input
                  type="text"
                  className="input"
                  placeholder="(&(objectClass=user)(objectCategory=person))"
                  value={config.searchFilter}
                  onChange={(e) => setConfig({ ...config, searchFilter: e.target.value })}
                />
              </div>
              
              <div>
                <label className="label">Bind Username</label>
                <input
                  type="text"
                  className="input"
                  placeholder="admin"
                  value={config.username}
                  onChange={(e) => setConfig({ ...config, username: e.target.value })}
                />
              </div>
              
              <div>
                <label className="label">Bind Password</label>
                <input
                  type="password"
                  className="input"
                  placeholder="••••••••"
                  value={config.password}
                  onChange={(e) => setConfig({ ...config, password: e.target.value })}
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              {adStatus?.configured && (
                <button
                  onClick={() => setShowConfig(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
              )}
              <button
                onClick={saveConfig}
                className="btn-primary"
                disabled={!config.domain || !config.url || !config.baseDN}
              >
                Save Configuration
              </button>
            </div>
          </div>
        )}

        {/* Actions */}
        {adStatus?.configured && !showConfig && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Actions</h2>
            
            <div className="flex space-x-3">
              <button
                onClick={handleSync}
                disabled={syncing}
                className="btn-primary flex items-center space-x-2"
              >
                <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
                <span>{syncing ? 'Syncing...' : 'Sync Users Now'}</span>
              </button>
              
              <button
                onClick={() => setShowConfig(true)}
                className="btn-secondary flex items-center space-x-2"
              >
                <Settings className="w-4 h-4" />
                <span>Edit Configuration</span>
              </button>
            </div>
          </div>
        )}

        {/* Sync Results */}
        {syncResult && (
          <div className={`rounded-lg shadow-sm p-6 ${
            syncResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
          }`}>
            <div className="flex items-start">
              {syncResult.success ? (
                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 mr-2" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 mr-2" />
              )}
              <div className="flex-1">
                <p className={`text-sm font-medium ${
                  syncResult.success ? 'text-green-800' : 'text-red-800'
                }`}>
                  {syncResult.message || 'Sync completed'}
                </p>
                
                {syncResult.success && (
                  <div className="mt-2 space-y-1">
                    <p className="text-sm text-green-700">
                      • Created: {syncResult.created || 0} users
                    </p>
                    <p className="text-sm text-green-700">
                      • Updated: {syncResult.updated || 0} users
                    </p>
                    <p className="text-sm text-green-700">
                      • Deactivated: {syncResult.deactivated || 0} users
                    </p>
                  </div>
                )}
                
                {syncResult.errors && syncResult.errors.length > 0 && (
                  <div className="mt-2">
                    <p className="text-sm font-medium text-red-800">Errors:</p>
                    <ul className="mt-1 space-y-1">
                      {syncResult.errors.map((error, index) => (
                        <li key={index} className="text-sm text-red-700">
                          • {error}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Information Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mt-6">
          <h3 className="text-sm font-semibold text-blue-900 mb-2">How AD Sync Works</h3>
          <ul className="space-y-1 text-sm text-blue-800">
            <li>• Connects to your Active Directory using LDAP protocol</li>
            <li>• Imports user information including names, emails, departments, and reporting structure</li>
            <li>• Automatically determines roles based on AD group membership</li>
            <li>• Preserves manager-subordinate relationships from AD</li>
            <li>• Deactivates users who are disabled in AD</li>
            <li>• Users can log in using their AD credentials</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
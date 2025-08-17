import { useState, useEffect } from 'react'
import { useAuthStore } from '../stores/authStore'
import { getSupabase } from '../lib/supabase'
import type { LogBookEntry } from '../lib/supabase'
import { ClockIcon, InformationCircleIcon, ExclamationTriangleIcon, CheckCircleIcon } from '@heroicons/react/24/outline'
import { format } from 'date-fns'

const LogBook = () => {
  const { user } = useAuthStore()
  const [logs, setLogs] = useState<LogBookEntry[]>([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState<string>('all')

  useEffect(() => {
    fetchLogs()
  }, [])

  const fetchLogs = async () => {
    try {
      setLoading(true)
      const { data, error } = await getSupabase()
        .from('log_book')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setLogs(data || [])
    } catch (error) {
      console.error('Error fetching logs:', error)
    } finally {
      setLoading(false)
    }
  }

  const getEventIcon = (eventType: string) => {
    switch (eventType.toLowerCase()) {
      case 'user_joined':
      case 'user_left':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />
      case 'message_posted':
      case 'notice_created':
        return <InformationCircleIcon className="h-5 w-5 text-blue-500" />
      case 'error':
      case 'warning':
        return <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500" />
      default:
        return <ClockIcon className="h-5 w-5 text-gray-500" />
    }
  }

  const getEventColor = (eventType: string) => {
    switch (eventType.toLowerCase()) {
      case 'user_joined':
      case 'user_left':
        return 'bg-green-50 border-green-200'
      case 'message_posted':
      case 'notice_created':
        return 'bg-blue-50 border-blue-200'
      case 'error':
        return 'bg-red-50 border-red-200'
      case 'warning':
        return 'bg-yellow-50 border-yellow-200'
      default:
        return 'bg-gray-50 border-gray-200'
    }
  }

  const filteredLogs = logs.filter(log => {
    const matchesSearch = log.event_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         log.details.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesFilter = filterType === 'all' || log.event_type.toLowerCase().includes(filterType.toLowerCase())
    return matchesSearch && matchesFilter
  })

  const eventTypes = ['all', 'user_joined', 'user_left', 'message_posted', 'notice_created', 'error', 'warning']

  if (user?.role !== 'core_member') {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="text-gray-400 mb-4">
            <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Access Restricted</h3>
          <p className="text-gray-600">Only core members can access the log book.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Log Book</h1>
        <p className="text-gray-600">System-generated activity logs and events</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
                  <input
          type="text"
          placeholder="Search logs..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
        />
        </div>
        
        <div className="flex-shrink-0">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="block px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
          >
            {eventTypes.map(type => (
              <option key={type} value={type}>
                {type === 'all' ? 'All Events' : type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-md p-6 text-center">
          <div className="text-2xl font-bold text-blue-600">{logs.length}</div>
          <div className="text-sm text-gray-600">Total Events</div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6 text-center">
          <div className="text-2xl font-bold text-green-600">
            {logs.filter(log => log.event_type.toLowerCase().includes('user')).length}
          </div>
          <div className="text-sm text-gray-600">User Events</div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6 text-center">
          <div className="text-2xl font-bold text-yellow-600">
            {logs.filter(log => log.event_type.toLowerCase().includes('message') || log.event_type.toLowerCase().includes('notice')).length}
          </div>
          <div className="text-sm text-gray-600">Communication Events</div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6 text-center">
          <div className="text-2xl font-bold text-red-600">
            {logs.filter(log => log.event_type.toLowerCase().includes('error') || log.event_type.toLowerCase().includes('warning')).length}
          </div>
          <div className="text-sm text-gray-600">System Events</div>
        </div>
      </div>

      {/* Logs */}
      {loading ? (
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : filteredLogs.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No logs found</h3>
          <p className="text-gray-600">
            {searchTerm || filterType !== 'all' ? 'No logs match your current filters.' : 'System logs will appear here as events occur.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredLogs.map((log) => (
            <div
              key={log.id}
              className={`bg-white rounded-lg shadow-md p-6 border-l-4 border-l-blue-500 ${getEventColor(log.event_type)}`}
            >
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 mt-1">
                  {getEventIcon(log.event_type)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="text-sm font-medium text-gray-900 capitalize">
                      {log.event_type.replace('_', ' ')}
                    </span>
                    <span className="text-xs text-gray-500">
                      {format(new Date(log.created_at), 'MMM d, yyyy h:mm a')}
                    </span>
                  </div>
                  
                  <p className="text-sm text-gray-700">{log.details}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <InformationCircleIcon className="h-5 w-5 text-blue-400" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">About Log Book</h3>
            <div className="mt-2 text-sm text-blue-700">
              <p>The log book automatically records system events including:</p>
              <ul className="list-disc list-inside mt-1 space-y-1">
                <li>User registration and login activities</li>
                <li>Message posting and communication events</li>
                <li>Notice creation and updates</li>
                <li>System errors and warnings</li>
                <li>Other important business activities</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LogBook

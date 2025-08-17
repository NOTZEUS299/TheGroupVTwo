import { useAuthStore } from '../stores/authStore'
import { Link } from 'react-router-dom'
import PermissionGate from '../components/PermissionGate'
import RoleBasedNavigation from '../components/RoleBasedNavigation'
import { hasPermission } from '../utils/rbac'
import type { PermissionName } from '../utils/rbac'
import {
  ChatBubbleLeftRightIcon,
  BookOpenIcon,
  ClipboardDocumentListIcon,
  CalculatorIcon,
  BellIcon,
  UserGroupIcon,
  DocumentTextIcon,
  ClockIcon,
  UserCircleIcon,
} from '@heroicons/react/24/outline'

const Dashboard = () => {
  const { user, loading, initialized } = useAuthStore()

  // Show loading state while auth is initializing
  if (!initialized || loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  // Show error state if user is not available after initialization
  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="text-red-500 mb-4">
            <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Authentication Error</h3>
          <p className="text-gray-600">Unable to load user data. Please try refreshing the page.</p>
        </div>
      </div>
    )
  }

  const quickActions = [
    {
      name: 'Group Chat',
      href: '/group-chat',
      icon: ChatBubbleLeftRightIcon,
      description: 'Communicate with all core members',
      color: 'bg-blue-500',
      permission: 'VIEW_GROUP_CHAT' as PermissionName,
    },
    {
      name: 'Agency Chat',
      href: '/agency-chat',
      icon: ChatBubbleLeftRightIcon,
      description: 'Chat with your agency team',
      color: 'bg-green-500',
      permission: 'VIEW_AGENCY_CHAT' as PermissionName,
    },
    {
      name: 'Journal',
      href: '/journal',
      icon: BookOpenIcon,
      description: 'Create and view journal entries',
      color: 'bg-yellow-500',
      permission: 'VIEW_JOURNAL' as PermissionName,
    },
    {
      name: 'Log Book',
      href: '/log-book',
      icon: ClipboardDocumentListIcon,
      description: 'View system activity logs',
      color: 'bg-purple-500',
      permission: 'VIEW_LOG_BOOK' as PermissionName,
    },
    {
      name: 'Group Accounting',
      href: '/group-accounting',
      icon: CalculatorIcon,
      description: 'Manage group finances',
      color: 'bg-red-500',
      permission: 'VIEW_GROUP_ACCOUNTING' as PermissionName,
    },
    {
      name: 'Agency Accounting',
      href: '/agency-accounting',
      icon: CalculatorIcon,
      description: 'Track agency finances',
      color: 'bg-indigo-500',
      permission: 'VIEW_AGENCY_ACCOUNTING' as PermissionName,
    },
    {
      name: 'Notices',
      href: '/notices',
      icon: BellIcon,
      description: 'View announcements',
      color: 'bg-pink-500',
      permission: 'VIEW_NOTICES' as PermissionName,
    },
    {
      name: 'To-Dos',
      href: '/todos',
      icon: ClipboardDocumentListIcon,
      description: 'Manage tasks and projects',
      color: 'bg-teal-500',
      permission: 'VIEW_TODOS' as PermissionName,
    },
  ]

  // Safely filter actions only when user is available
  const filteredQuickActions = user ? quickActions.filter(action => 
    hasPermission(user, action.permission)
  ) : []

  const stats = [
    { name: 'Total Members', value: '24', icon: UserGroupIcon, color: 'text-blue-600' },
    { name: 'Active Projects', value: '12', icon: DocumentTextIcon, color: 'text-green-600' },
    { name: 'Pending Tasks', value: '8', icon: ClockIcon, color: 'text-yellow-600' },
    { name: 'Total Revenue', value: '$45,230', icon: CalculatorIcon, color: 'text-red-600' },
  ]

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="glass-card rounded-lg shadow-lg p-6 text-white" id='glass-card-blue'>
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
            <img src='https://i.ibb.co/B2h7g9Fb/Chat-GPT-Image-Aug-17-2025-01-06-00-PM.png' className="rounded-full" />
          </div>
          <div>
            <h1 className="text-3xl font-bold mb-2">
              Welcome back, {user?.name}! 👋
            </h1>
            <p className="text-blue-100 text-lg">
              Here's what's happening in your business group today.
            </p>
            <div className="mt-2">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-white bg-opacity-20 text-blue-800">
                {user?.role === 'core_member' ? 'Core Member' : 'Agency Member'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Role-based Navigation */}
      <RoleBasedNavigation />

      {/* Quick Actions */}
      <div>
        <h2 className="text-xl font-semibold text-white/90 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {filteredQuickActions.map((action) => (
            <Link
              key={action.name}
              to={action.href}
              className="group block p-6 glass-card rounded-lg shadow-md hover:shadow-lg transition-all duration-200 transform hover:-translate-y-1"
            >
              <div className="flex items-center space-x-3">
                <div className={`p-3 rounded-lg ${action.color} text-white`}>
                  <action.icon className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white/90 group-hover:text-blue-600 transition-colors">
                    {action.name}
                  </h3>
                  <p className="text-sm text-white/60">{action.description}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Statistics */}
      <div>
        <h2 className="text-xl font-semibold text-white/90 mb-4">Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat) => (
            <div key={stat.name} className="glass-card rounded-lg shadow-md p-6 text-center">
              <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
              <div className="text-sm text-white/60">{stat.name}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Role-based Information */}
      <PermissionGate permission="VIEW_JOURNAL">
        <div className="glass-card rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-white/90 mb-4">Recent Journal Entries</h2>
          <p className="text-white/60">As a core member, you have access to the journal feature.</p>
          <Link
            to="/journal"
            className="inline-flex items-center mt-3 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            View Journal
          </Link>
        </div>
      </PermissionGate>

      <PermissionGate permission="VIEW_LOG_BOOK">
        <div className="glass-card rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-white/90 mb-4">System Activity</h2>
          <p className="text-white/60">Monitor system logs and activity as a core member.</p>
          <Link
            to="/log-book"
            className="inline-flex items-center mt-3 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            View Log Book
          </Link>
        </div>
      </PermissionGate>

      <PermissionGate permission="VIEW_GROUP_ACCOUNTING">
        <div className="glass-card rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-white/90 mb-4">Financial Overview</h2>
          <p className="text-white/60">Manage group finances and track expenses.</p>
          <Link
            to="/group-accounting"
            className="inline-flex items-center mt-3 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            View Accounting
          </Link>
        </div>
      </PermissionGate>
    </div>
  )
}

export default Dashboard

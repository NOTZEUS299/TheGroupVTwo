import { useAuthStore } from '../stores/authStore'
import { Link } from 'react-router-dom'
import { PermissionGate } from '../components/PermissionGate'
import { RoleBasedNavigation } from '../components/RoleBasedNavigation'
import { hasPermission } from '../utils/rbac'
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
  const { user } = useAuthStore()

  const quickActions = [
    {
      name: 'Group Chat',
      href: '/group-chat',
      icon: ChatBubbleLeftRightIcon,
      description: 'Communicate with all core members',
      color: 'bg-blue-500',
      permission: 'VIEW_GROUP_CHAT' as const,
    },
    {
      name: 'Agency Chat',
      href: '/agency-chat',
      icon: ChatBubbleLeftRightIcon,
      description: 'Chat with your agency team',
      color: 'bg-green-500',
      permission: 'VIEW_AGENCY_CHAT' as const,
    },
    {
      name: 'Journal',
      href: '/journal',
      icon: BookOpenIcon,
      description: 'Create and view journal entries',
      color: 'bg-yellow-500',
      permission: 'VIEW_JOURNAL' as const,
    },
    {
      name: 'Log Book',
      href: '/log-book',
      icon: ClipboardDocumentListIcon,
      description: 'View system activity logs',
      color: 'bg-purple-500',
      permission: 'VIEW_LOG_BOOK' as const,
    },
    {
      name: 'Group Accounting',
      href: '/group-accounting',
      icon: CalculatorIcon,
      description: 'Manage group finances',
      color: 'bg-red-500',
      permission: 'VIEW_GROUP_ACCOUNTING' as const,
    },
    {
      name: 'Agency Accounting',
      href: '/agency-accounting',
      icon: CalculatorIcon,
      description: 'Track agency finances',
      color: 'bg-indigo-500',
      permission: 'VIEW_AGENCY_ACCOUNTING' as const,
    },
    {
      name: 'Notices',
      href: '/notices',
      icon: BellIcon,
      description: 'View announcements',
      color: 'bg-pink-500',
      permission: 'VIEW_NOTICES' as const,
    },
    {
      name: 'To-Dos',
      href: '/todos',
      icon: ClipboardDocumentListIcon,
      description: 'Manage tasks and projects',
      color: 'bg-teal-500',
      permission: 'VIEW_TODOS' as const,
    },
  ]

  const filteredQuickActions = quickActions.filter(action => 
    hasPermission(user, action.permission)
  )

  const stats = [
    { name: 'Total Members', value: '24', icon: UserGroupIcon, color: 'text-blue-600' },
    { name: 'Active Projects', value: '12', icon: DocumentTextIcon, color: 'text-green-600' },
    { name: 'Pending Tasks', value: '8', icon: ClockIcon, color: 'text-yellow-600' },
    { name: 'Total Revenue', value: '$45,230', icon: CalculatorIcon, color: 'text-red-600' },
  ]

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg shadow-lg p-6 text-white">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
            <UserCircleIcon className="h-8 w-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold mb-2">
              Welcome back, {user?.name}! 👋
            </h1>
            <p className="text-blue-100 text-lg">
              Here's what's happening in your business group today.
            </p>
            <div className="mt-2">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-white bg-opacity-20 text-white">
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
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {filteredQuickActions.map((action) => (
            <Link
              key={action.name}
              to={action.href}
              className="group block p-6 bg-white rounded-lg shadow-md hover:shadow-lg transition-all duration-200 transform hover:-translate-y-1"
            >
              <div className="flex items-center space-x-3">
                <div className={`p-3 rounded-lg ${action.color} text-white`}>
                  <action.icon className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                    {action.name}
                  </h3>
                  <p className="text-sm text-gray-600">{action.description}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Statistics */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat) => (
            <div key={stat.name} className="bg-white rounded-lg shadow-md p-6 text-center">
              <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
              <div className="text-sm text-gray-600">{stat.name}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Role-based Information */}
      <PermissionGate permission="VIEW_JOURNAL">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Journal Entries</h2>
          <p className="text-gray-600">As a core member, you have access to the journal feature.</p>
          <Link
            to="/journal"
            className="inline-flex items-center mt-3 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            View Journal
          </Link>
        </div>
      </PermissionGate>

      <PermissionGate permission="VIEW_LOG_BOOK">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">System Activity</h2>
          <p className="text-gray-600">Monitor system logs and activity as a core member.</p>
          <Link
            to="/log-book"
            className="inline-flex items-center mt-3 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            View Log Book
          </Link>
        </div>
      </PermissionGate>

      <PermissionGate permission="VIEW_GROUP_ACCOUNTING">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Financial Overview</h2>
          <p className="text-gray-600">Manage group finances and track expenses.</p>
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

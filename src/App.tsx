import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useEffect } from 'react'
import { useAuthStore } from './stores/authStore'
import Layout from './components/Layout'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import GroupChat from './pages/GroupChat'
import AgencyChat from './pages/AgencyChat'
import Journal from './pages/Journal'
import LogBook from './pages/LogBook'
import GroupAccounting from './pages/GroupAccounting'
import AgencyAccounting from './pages/AgencyAccounting'
import Notices from './pages/Notices'
import Todos from './pages/Todos'
import Settings from './pages/Settings'
import Profile from './pages/Profile'

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

// Protected Route Component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading, initialized } = useAuthStore()
  
  console.log('ProtectedRoute render:', { user: !!user, loading, initialized })
  
  if (!initialized || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }
  
  if (!user) {
    console.log('No user found, redirecting to login')
    return <Navigate to="/login" replace />
  }
  
  return <>{children}</>
}

function App() {
  const { getCurrentUser } = useAuthStore()

  useEffect(() => {
    console.log('App mounted, initializing auth...')
    getCurrentUser()
  }, [getCurrentUser])

  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            
            {/* Protected routes with Layout */}
            <Route path="/" element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }>
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="profile" element={<Profile />} />
              <Route path="group-chat" element={<GroupChat />} />
              <Route path="agency-chat" element={<AgencyChat />} />
              <Route path="journal" element={<Journal />} />
              <Route path="log-book" element={<LogBook />} />
              <Route path="group-accounting" element={<GroupAccounting />} />
              <Route path="agency-accounting" element={<AgencyAccounting />} />
              <Route path="notices" element={<Notices />} />
              <Route path="todos" element={<Todos />} />
              <Route path="settings" element={<Settings />} />
            </Route>
            
            {/* Catch all route */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </div>
      </Router>
    </QueryClientProvider>
  )
}

export default App

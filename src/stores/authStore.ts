import { create } from 'zustand'
import { supabase } from '../lib/supabase'
import type { User } from '../lib/supabase'

interface AuthState {
  user: User | null
  loading: boolean
  error: string | null
  initialized: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, name: string, role: 'core_member' | 'agency_member', agency_id?: string) => Promise<void>
  signOut: () => Promise<void>
  getCurrentUser: () => Promise<void>
  clearError: () => void
  updateProfile: (updates: Partial<User>) => Promise<void>
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  loading: false,
  error: null,
  initialized: false,

  signIn: async (email: string, password: string) => {
    set({ loading: true, error: null })
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error

      if (data.user) {
        try {
          // Fetch user profile from our users table
          const { data: profile, error: profileError } = await supabase
            .from('users')
            .select('*')
            .eq('id', data.user.id)
            .maybeSingle()

          if (profileError) {
            console.warn('Profile fetch error:', profileError)
            // If profile fetch fails, create a basic user object from auth data
            const basicUser: User = {
              id: data.user.id,
              name: data.user.user_metadata?.name || 'User',
              email: data.user.email || email,
              role: 'core_member',
              created_at: data.user.created_at || new Date().toISOString()
            }
            set({ user: basicUser, loading: false, initialized: true })
          } else if (profile) {
            set({ user: profile, loading: false, initialized: true })
          } else {
            // No profile found, create basic user object
            const basicUser: User = {
              id: data.user.id,
              name: data.user.user_metadata?.name || 'User',
              email: data.user.email || email,
              role: 'core_member',
              created_at: data.user.created_at || new Date().toISOString()
            }
            set({ user: basicUser, loading: false, initialized: true })
          }
        } catch (profileError: any) {
          console.warn('Profile handling error:', profileError)
          // Fallback to basic user object
          const basicUser: User = {
            id: data.user.id,
            name: data.user.user_metadata?.name || 'User',
            email: data.user.email || email,
            role: 'core_member',
            created_at: data.user.created_at || new Date().toISOString()
          }
          set({ user: basicUser, loading: false, initialized: true })
        }
      }
    } catch (error: any) {
      set({ error: error.message, loading: false, initialized: true })
    }
  },

  signUp: async (email: string, password: string, name: string, role: 'core_member' | 'agency_member', agency_id?: string) => {
    set({ loading: true, error: null })
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: name,
            role: role,
            agency_id: agency_id
          }
        }
      })

      if (error) throw error

      if (data.user) {
        try {
          // Try to create user profile in our users table
          const { error: profileError } = await supabase
            .from('users')
            .insert([
              {
                id: data.user.id,
                name,
                email,
                role,
                agency_id,
              },
            ])

          if (profileError) {
            console.warn('Profile creation error:', profileError)
            // Profile creation failed, but auth succeeded
            // User can still sign in, profile will be created later
          }
        } catch (profileError: any) {
          console.warn('Profile creation error:', profileError)
          // Continue with signup even if profile creation fails
        }

        // Sign in the user after successful signup
        await get().signIn(email, password)
      }
    } catch (error: any) {
      set({ error: error.message, loading: false, initialized: true })
    }
  },

  signOut: async () => {
    set({ loading: true })
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      set({ user: null, loading: false, initialized: true })
    } catch (error: any) {
      set({ error: error.message, loading: false, initialized: true })
    }
  },

  getCurrentUser: async () => {
    const state = get()
    // Only fetch if not already initialized or currently loading
    if (state.initialized || state.loading) return
    
    set({ loading: true, error: null })
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        try {
          const { data: profile, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', user.id)
            .maybeSingle()

          if (error) {
            console.warn('Profile fetch error during getCurrentUser:', error)
            // Use basic user info from auth
            const basicUser: User = {
              id: user.id,
              name: user.user_metadata?.name || 'User',
              email: user.email || '',
              role: user.user_metadata?.role || 'core_member',
              created_at: user.created_at || new Date().toISOString()
            }
            set({ user: basicUser, loading: false, initialized: true })
          } else if (profile) {
            set({ user: profile, loading: false, initialized: true })
          } else {
            // No profile found, use basic user info
            const basicUser: User = {
              id: user.id,
              name: user.user_metadata?.name || 'User',
              email: user.email || '',
              role: user.user_metadata?.role || 'core_member',
              created_at: user.created_at || new Date().toISOString()
            }
            set({ user: basicUser, loading: false, initialized: true })
          }
        } catch (profileError: any) {
          console.warn('Profile handling error during getCurrentUser:', profileError)
          // Fallback to basic user object
          const basicUser: User = {
            id: user.id,
            name: user.user_metadata?.name || 'User',
            email: user.email || '',
            role: user.user_metadata?.role || 'core_member',
            created_at: user.created_at || new Date().toISOString()
          }
          set({ user: basicUser, loading: false, initialized: true })
        }
      } else {
        set({ user: null, loading: false, initialized: true })
      }
    } catch (error: any) {
      console.error('Error in getCurrentUser:', error)
      set({ error: error.message, loading: false, initialized: true })
    }
  },

  updateProfile: async (updates: Partial<User>) => {
    const { user } = get()
    if (!user) return

    set({ loading: true })
    try {
      const { error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', user.id)

      if (error) throw error

      // Update local state
      set({ user: { ...user, ...updates }, loading: false })
    } catch (error: any) {
      set({ error: error.message, loading: false })
    }
  },

  clearError: () => set({ error: null }),
}))

// Initialize auth state on app load - prevent duplicate listeners
let authListenerInitialized = false

supabase.auth.onAuthStateChange(async (event, session) => {
  console.log('Auth state change:', event, session?.user?.id)
  
  if (event === 'SIGNED_IN' && session?.user) {
    try {
      const { data: profile } = await supabase
        .from('users')
        .select('*')
        .eq('id', session.user.id)
        .maybeSingle()
      
      if (profile) {
        useAuthStore.setState({ user: profile, initialized: true })
      } else {
        // No profile found, create basic user object
        const basicUser: User = {
          id: session.user.id,
          name: session.user.user_metadata?.name || 'User',
          email: session.user.email || '',
          role: session.user.user_metadata?.role || 'core_member',
          created_at: session.user.created_at || new Date().toISOString()
        }
        useAuthStore.setState({ user: basicUser, initialized: true })
      }
    } catch (error: any) {
      console.warn('Auth state change profile error:', error)
      // Fallback to basic user object
      const basicUser: User = {
        id: session.user.id,
        name: session.user.user_metadata?.name || 'User',
        email: session.user.email || '',
        role: session.user.user_metadata?.role || 'core_member',
        created_at: session.user.created_at || new Date().toISOString()
      }
      useAuthStore.setState({ user: basicUser, initialized: true })
    }
  } else if (event === 'SIGNED_OUT') {
    useAuthStore.setState({ user: null, initialized: true })
  } else if (event === 'TOKEN_REFRESHED') {
    console.log('Token refreshed successfully')
  }
})

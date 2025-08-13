import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Validate environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables!')
  console.error('Please create a .env.local file with:')
  console.error('VITE_SUPABASE_URL=your_supabase_url')
  console.error('VITE_SUPABASE_ANON_KEY=your_supabase_anon_key')
  
  // Provide fallback for development (will show errors in console)
  if (import.meta.env.DEV) {
    console.warn('⚠️ Using fallback values - API calls will fail!')
  }
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key'
)

// Database types
export interface User {
  id: string
  name: string
  email: string
  role: 'core_member' | 'agency_member'
  agency_id?: string
  created_at: string
}

export interface Message {
  id: string
  channel_id: string
  sender_id: string
  content: string
  attachment_url?: string
  created_at: string
  sender?: User
}

export interface Channel {
  id: string
  name: string
  type: 'group' | 'agency'
  agency_id?: string
  created_at: string
}

export interface JournalEntry {
  id: string
  title: string
  content: string
  author_id: string
  created_at: string
  author?: User
}

export interface LogBookEntry {
  id: string
  event_type: string
  details: string
  created_at: string
}

export interface GroupAccountingEntry {
  id: string
  description: string
  amount: number
  type: 'income' | 'expense'
  date: string
  added_by: string
  added_by_user?: User
}

export interface AgencyAccountingEntry {
  id: string
  agency_id: string
  description: string
  amount: number
  type: 'income' | 'expense'
  date: string
  added_by: string
  added_by_user?: User
}

export interface Notice {
  id: string
  title: string
  content: string
  posted_by: string
  created_at: string
  posted_by_user?: User
}

export interface Todo {
  id: string
  title: string
  description: string
  assigned_to: string
  agency_id?: string
  due_date: string
  status: 'pending' | 'completed'
  created_at: string
  assigned_user?: User
}

export interface Agency {
  id: string
  name: string
  description?: string
  created_at: string
}

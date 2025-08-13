-- Business Teamspace Database Setup Script
-- Run this in your Supabase SQL Editor to create all necessary tables

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('core_member', 'agency_member')),
  agency_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create agencies table
CREATE TABLE IF NOT EXISTS public.agencies (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create channels table
CREATE TABLE IF NOT EXISTS public.channels (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('group', 'agency')),
  agency_id UUID REFERENCES public.agencies(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create messages table
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  channel_id UUID REFERENCES public.channels(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  attachment_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create journal_entries table
CREATE TABLE IF NOT EXISTS public.journal_entries (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  author_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create log_book_entries table
CREATE TABLE IF NOT EXISTS public.log_book_entries (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  event_type TEXT NOT NULL,
  details TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create group_accounting_entries table
CREATE TABLE IF NOT EXISTS public.group_accounting_entries (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  description TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  date DATE NOT NULL,
  added_by UUID REFERENCES public.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create agency_accounting_entries table
CREATE TABLE IF NOT EXISTS public.agency_accounting_entries (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  agency_id UUID REFERENCES public.agencies(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  date DATE NOT NULL,
  added_by UUID REFERENCES public.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create notices table
CREATE TABLE IF NOT EXISTS public.notices (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  posted_by UUID REFERENCES public.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create todos table
CREATE TABLE IF NOT EXISTS public.todos (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  assigned_to UUID REFERENCES public.users(id) ON DELETE CASCADE,
  agency_id UUID REFERENCES public.agencies(id) ON DELETE CASCADE,
  due_date DATE NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'completed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_messages_channel_id ON public.messages(channel_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON public.messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at);

CREATE INDEX IF NOT EXISTS idx_journal_entries_author_id ON public.journal_entries(author_id);
CREATE INDEX IF NOT EXISTS idx_journal_entries_created_at ON public.journal_entries(created_at);

CREATE INDEX IF NOT EXISTS idx_todos_assigned_to ON public.todos(assigned_to);
CREATE INDEX IF NOT EXISTS idx_todos_agency_id ON public.todos(agency_id);
CREATE INDEX IF NOT EXISTS idx_todos_status ON public.todos(status);
CREATE INDEX IF NOT EXISTS idx_todos_due_date ON public.todos(due_date);

CREATE INDEX IF NOT EXISTS idx_accounting_entries_added_by ON public.group_accounting_entries(added_by);
CREATE INDEX IF NOT EXISTS idx_agency_accounting_entries_agency_id ON public.agency_accounting_entries(agency_id);

-- Enable Row Level Security (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.log_book_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_accounting_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agency_accounting_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.todos ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for users table
CREATE POLICY "Users can view their own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON public.users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Create RLS policies for agencies table
CREATE POLICY "Authenticated users can view agencies" ON public.agencies
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Core members can manage agencies" ON public.agencies
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE users.id = auth.uid() 
      AND users.role = 'core_member'
    )
  );

-- Create RLS policies for channels table
CREATE POLICY "Authenticated users can view channels" ON public.channels
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Core members can manage channels" ON public.channels
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE users.id = auth.uid() 
      AND users.role = 'core_member'
    )
  );

-- Create RLS policies for messages table
CREATE POLICY "Authenticated users can view messages" ON public.messages
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert messages" ON public.messages
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Create RLS policies for journal entries table
CREATE POLICY "Authenticated users can view journal entries" ON public.journal_entries
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can insert their own journal entries" ON public.journal_entries
  FOR INSERT WITH CHECK (author_id = auth.uid());

CREATE POLICY "Users can update their own journal entries" ON public.journal_entries
  FOR UPDATE USING (author_id = auth.uid());

CREATE POLICY "Users can delete their own journal entries" ON public.journal_entries
  FOR DELETE USING (author_id = auth.uid());

-- Create RLS policies for log book entries table
CREATE POLICY "Core members can view log book entries" ON public.log_book_entries
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE users.id = auth.uid() 
      AND users.role = 'core_member'
    )
  );

CREATE POLICY "Core members can manage log book entries" ON public.log_book_entries
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE users.id = auth.uid() 
      AND users.role = 'core_member'
    )
  );

-- Create RLS policies for accounting entries table
CREATE POLICY "Authenticated users can view group accounting" ON public.group_accounting_entries
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Core members can manage group accounting" ON public.group_accounting_entries
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE users.id = auth.uid() 
      AND users.role = 'core_member'
    )
  );

CREATE POLICY "Authenticated users can view agency accounting" ON public.agency_accounting_entries
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Agency members can manage their agency accounting" ON public.agency_accounting_entries
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE users.id = auth.uid() 
      AND users.role = 'agency_member'
      AND users.agency_id = agency_id
    )
  );

-- Create RLS policies for notices table
CREATE POLICY "Authenticated users can view notices" ON public.notices
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Core members can manage notices" ON public.notices
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE users.id = auth.uid() 
      AND users.role = 'core_member'
    )
  );

-- Create RLS policies for todos table
CREATE POLICY "Authenticated users can view todos" ON public.todos
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can insert todos" ON public.todos
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update their assigned todos" ON public.todos
  FOR UPDATE USING (assigned_to = auth.uid());

CREATE POLICY "Core members can manage all todos" ON public.todos
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE users.id = auth.uid() 
      AND users.role = 'core_member'
    )
  );

-- Insert default data
INSERT INTO public.agencies (id, name, description) VALUES 
  (uuid_generate_v4(), 'Default Agency', 'Default agency for testing purposes')
ON CONFLICT DO NOTHING;

-- Insert default group channel
INSERT INTO public.channels (id, name, type) VALUES 
  (uuid_generate_v4(), 'Group Chat', 'group')
ON CONFLICT DO NOTHING;

-- Create storage buckets for file uploads
-- Note: You'll need to create these manually in the Supabase dashboard
-- Storage > Create bucket: 'chat-attachments' (public)

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;

-- Success message
SELECT 'Database setup completed successfully! 🎉' as status;

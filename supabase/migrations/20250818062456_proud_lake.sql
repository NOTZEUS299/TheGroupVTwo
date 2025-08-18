/*
  # Fix Group Chat RLS Policies

  1. Security Updates
    - Fix RLS policies for messages table
    - Ensure only authenticated users can access group chat
    - Prevent unauthorized access to messages

  2. Policy Changes
    - Update message insert policy to use correct user ID field
    - Add proper authentication checks
    - Ensure core members can access group chat
*/

-- Drop existing policies to recreate them properly
DROP POLICY IF EXISTS "Authenticated users can view messages" ON public.messages;
DROP POLICY IF EXISTS "Authenticated users can insert messages" ON public.messages;

-- Create proper RLS policies for messages table
CREATE POLICY "Authenticated users can view messages" ON public.messages
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert messages" ON public.messages
  FOR INSERT WITH CHECK (auth.uid() = sender_id);

-- Ensure RLS is enabled
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Create policy for channels table if not exists
CREATE POLICY IF NOT EXISTS "Authenticated users can view channels" ON public.channels
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY IF NOT EXISTS "Authenticated users can insert channels" ON public.channels
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Success message
SELECT 'Group chat RLS policies updated successfully! 🎉' as status;
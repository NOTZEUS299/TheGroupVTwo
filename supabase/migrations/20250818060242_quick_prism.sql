@@ .. @@
-- Create RLS policies for messages table
CREATE POLICY "Authenticated users can view messages" ON public.messages
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert messages" ON public.messages
-  FOR INSERT WITH CHECK (auth.uid() = id);
+  FOR INSERT WITH CHECK (auth.uid() = sender_id);
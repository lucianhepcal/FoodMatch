import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://nkzvwpzqrtypmaxorxid.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5renZ3cHpxcnR5cG1heG9yeGlkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE1ODA1NDUsImV4cCI6MjA3NzE1NjU0NX0.1pqpqLWQ4YBK1gQIaC473lHbZgrQW1L26PXGisQeBTw';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

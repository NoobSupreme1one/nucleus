import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://tofpmqtbziszajcskaav.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRvZnBtcXRiemlzemFqY3NrYWF2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQwMTYxMzYsImV4cCI6MjA2OTU5MjEzNn0.eAaPLkEwgLn2CCAAjMaDsG7A6uzB8BgaF6CR0vZZ1Ls';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});
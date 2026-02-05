import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ysnwurduyfgymxtcfnhp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlzbnd1cmR1eWZneW14dGNmbmhwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAzMTI4MTQsImV4cCI6MjA4NTg4ODgxNH0.WEJ5M1hZ4kGKnfmWo4NXImYVhHIynmmnrkbwxz0sBdQ';

export const supabase = createClient(supabaseUrl, supabaseKey);
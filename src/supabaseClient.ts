import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://tvuj-id.supabase.co';
const supabaseKey = 'tvuj-anon-key';

export const supabase = createClient(supabaseUrl, supabaseKey);
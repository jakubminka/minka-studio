import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ysnwurduyfgymxtcfnhp.supabase.co';
const supabaseKey = 'ysnwurduyfgymxtcfnhp';

export const supabase = createClient(supabaseUrl, supabaseKey);
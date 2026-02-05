import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ysnwurduyfgymxtcfnhp.supabase.co';
const supabaseKey = 'sb_publishable_Gfkjx3M6WQxLaEwk0ZE85w_yCpeRttj';

export const supabase = createClient(supabaseUrl, supabaseKey);

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zlbdwafdxqlmmamgrxzs.supabase.co'; 
const supabaseAnonKey = 'sb_publishable_8IFk0uZPKU3kM3XopzFRXQ_UN2Czbxx';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

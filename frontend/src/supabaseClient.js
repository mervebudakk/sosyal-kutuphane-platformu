
import { createClient } from '@supabase/supabase-js';

// ORTAM DEĞİŞKENLERİ SORUNUNU AŞMAK İÇİN DEĞERLER DOĞRUDAN KODA YAZILIYOR
const supabaseUrl = 'https://zlbdwafdxqlmmamgrxzs.supabase.co'; 
const supabaseAnonKey = 'sb_publishable_8IFk0uZPKU3kM3XopzFRXQ_UN2Czbxx';

// Supabase client'ı başlat
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// NOT: Artık .env.local dosyasının içeriği bu kod tarafından kullanılmayacaktır.
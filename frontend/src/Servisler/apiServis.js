import { supabase } from './supabaseServis';

// Ortam Değişkenleri
const TMDB_KEY = process.env.REACT_APP_TMDB_API_KEY;
const GOOGLE_BOOKS_KEY = process.env.REACT_APP_GOOGLE_BOOKS_API_KEY;
const TMDB_URL = "https://api.themoviedb.org/3";
const GOOGLE_BOOKS_URL = "https://www.googleapis.com/books/v1";

/**
 * Harici API'lerden gelen veriyi projenizin "Icerikler" tablosu formatına dönüştürür.
 */
const veriyiStandartFormataDonustur = (item, tur) => {
    if (tur === 'film') {
        return {
            icerik_turu: 'film',
            harici_kaynak: 'tmdb',
            harici_id: item.id.toString(),
            baslik: item.title,
            ozet: item.overview,
            yayin_yili: item.release_date ? item.release_date.substring(0, 4) : 'Bilinmiyor',
            kapak_url: item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : null,
        };
    } 
    // GÜNCELLENEN: Kitap entegrasyonu aktif edildi
    else if (tur === 'kitap') {
        const info = item.volumeInfo;
        return {
            icerik_turu: 'kitap',
            harici_kaynak: 'google_books',
            harici_id: item.id, // Google Books ID'si string gelir (örn: "zyTCAlFPjgYC")
            baslik: info.title,
            ozet: info.description || "Açıklama bulunmuyor.",
            yayin_yili: info.publishedDate ? info.publishedDate.substring(0, 4) : 'Bilinmiyor',
            // Google Books görselleri bazen http gelir, https yapmak güvenlidir
            kapak_url: info.imageLinks?.thumbnail?.replace('http:', 'https:') || null,
        };
    }
    return null;
};

export const hariciFilmleriAra = async (sorgu) => {

    if (!sorgu || !TMDB_KEY) {
       throw new Error("Arama sorgusu veya TMDb API Anahtarı eksik.");
    }
    const url = `${TMDB_URL}/search/movie?api_key=${TMDB_KEY}&query=${encodeURIComponent(sorgu)}&language=tr-TR`; 
    try {
        const response = await fetch(url); 
        if (!response.ok) throw new Error(`API isteği başarısız oldu: ${response.status}`);
        const data = await response.json();
        return data.results
            .filter(item => item.media_type !== 'person')
            .map(item => veriyiStandartFormataDonustur(item, 'film'));
    } catch (error) {
        console.error("TMDb Arama Hatası:", error);
        throw error;
    }
};

export const icerigiKaydetVeDetaylariCek = async (tmdbId) => {
    // ... (Senin mevcut film kaydetme kodun burda kalsın) ...
    // Burası da aynen kalsın.
    if (!tmdbId || !TMDB_KEY) throw new Error("TMDb ID veya API Anahtarı eksik.");
    const url = `${TMDB_URL}/movie/${tmdbId}?api_key=${TMDB_KEY}&language=tr-TR&append_to_response=credits`;

    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Detay çekme başarısız oldu: ${response.status}`);
        const data = await response.json();
        
        const detayliIcerik = {
            icerik_turu: 'film',
            harici_kaynak: 'tmdb',
            harici_id: tmdbId.toString(), // ID'yi stringe çevirmek güvenlidir
            baslik: data.title,
            ozet: data.overview,
            yayin_yili: data.release_date ? data.release_date.substring(0, 4) : null,
            sure_sayfa_sayisi: data.runtime, 
            kapak_url: data.poster_path ? `https://image.tmdb.org/t/p/w500${data.poster_path}` : null,
            yazar_yonetmen: data.credits.crew.filter(crew => crew.job === 'Director').map(d => d.name).join(', '),
            turler: data.genres.map(genre => genre.name).join(', ')
        };

        const { data: kaydedilenIcerik, error: dbError } = await supabase
            .from('Icerikler')
            .upsert(detayliIcerik, { onConflict: 'harici_kaynak,harici_id', ignoreDuplicates: true }) // Conflict ayarı önemli
            .select('*')
            .single();

        if (dbError) throw new Error(`Veritabanına kaydetme hatası: ${dbError.message}`);
        return kaydedilenIcerik;
    } catch (error) {
        console.error("Film Detayı Entegrasyon Hatası:", error);
        throw error;
    }
};

/**
 * Google Books API'den kitap başlığına göre arama yapar.
 */
export const hariciKitaplariAra = async (sorgu) => {
    if (!sorgu || !GOOGLE_BOOKS_KEY) {
        throw new Error("Kitap sorgusu veya Google Books API Anahtarı eksik.");
    }

    // Google Books API URL'si
    const url = `${GOOGLE_BOOKS_URL}/volumes?q=${encodeURIComponent(sorgu)}&key=${GOOGLE_BOOKS_KEY}&maxResults=20&langRestrict=tr`;

    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Google Books API hatası: ${response.status}`);
        }

        const data = await response.json();

        // Google Books bazen sonuç bulamazsa "items" dizisini hiç göndermez
        if (!data.items) return [];

        return data.items.map(item => veriyiStandartFormataDonustur(item, 'kitap'));

    } catch (error) {
        console.error("Google Books Arama Hatası:", error);
        return []; // Hata durumunda boş dizi dönmek UI'ı kırmaz
    }
};

/**
 * Belirli bir kitabın detaylarını çeker ve Supabase'e kaydeder.
 * @param {string} googleBookId - Kitabın Google ID'si (örn: "zyTCAlFPjgYC")
 */
export const kitapKaydetVeDetaylariCek = async (googleBookId) => {
    if (!googleBookId || !GOOGLE_BOOKS_KEY) {
        throw new Error("Google Book ID veya API Anahtarı eksik.");
    }

    const url = `${GOOGLE_BOOKS_URL}/volumes/${googleBookId}?key=${GOOGLE_BOOKS_KEY}`;

    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Kitap detay çekme başarısız: ${response.status}`);
        }
        
        const data = await response.json();
        const info = data.volumeInfo;

        // Supabase Icerikler tablosu formatına tam dönüşüm
        const detayliKitap = {
            icerik_turu: 'kitap',
            harici_kaynak: 'google_books',
            harici_id: data.id,
            baslik: info.title,
            ozet: info.description ? info.description.substring(0, 1000) : "Açıklama yok.", // Çok uzun özetleri kırpabiliriz
            yayin_yili: info.publishedDate ? info.publishedDate.substring(0, 4) : null,
            sure_sayfa_sayisi: info.pageCount || 0, // Kitapta sayfa sayısı
            kapak_url: info.imageLinks?.thumbnail?.replace('http:', 'https:') || null,
            
            // Yazarları virgülle ayırıp string yapıyoruz
            yazar_yonetmen: info.authors ? info.authors.join(', ') : 'Bilinmiyor',
            
            // Kategorileri (Türleri) virgülle ayırıyoruz
            turler: info.categories ? info.categories.join(', ') : 'Genel'
        };

        // Supabase'e Kaydet (Upsert: Varsa güncelle, yoksa ekle)
        const { data: kaydedilenIcerik, error: dbError } = await supabase
            .from('Icerikler')
            .upsert(detayliKitap, { 
                onConflict: 'harici_kaynak,harici_id', // Bu ikili unique olmalı
                ignoreDuplicates: false // Detayları güncel tutmak için false yapabiliriz
            })
            .select('*')
            .single();

        if (dbError) {
            throw new Error(`Veritabanına kitap kaydetme hatası: ${dbError.message}`);
        }

        return kaydedilenIcerik;

    } catch (error) {
        console.error("Kitap Detayı Entegrasyon Hatası:", error);
        throw error;
    }
};
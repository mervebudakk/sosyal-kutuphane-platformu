import { supabase } from './supabaseServis';
// Ortam Değişkenleri: Artık V3 Anahtarını kullanıyoruz (Daha basit entegrasyon için)
const TMDB_KEY = process.env.REACT_APP_TMDB_API_KEY; 
const TMDB_URL = "https://api.themoviedb.org/3";
const GOOGLE_BOOKS_URL = "https://www.googleapis.com/books/v1";

/**
 * Harici API'lerden gelen veriyi projenizin "Icerikler" tablosu formatına dönüştürür.
 * Bu, arama sonuçlarını standartlaştırmak için önemlidir.
 * @param {object} item - TMDb veya Google Books'tan gelen ham veri nesnesi.
 * @param {string} tur - 'film' veya 'kitap'.
 * @returns {object} Proje Icerikler tablosu formatında nesne.
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
    // Dilay'ın Kitap entegrasyonu için:
    /* else if (tur === 'kitap') {
        const info = item.volumeInfo;
        return {
            icerik_turu: 'kitap',
            harici_kaynak: 'google_books',
            harici_id: item.id,
            baslik: info.title,
            ozet: info.description,
            yayin_yili: info.publishedDate ? info.publishedDate.substring(0, 4) : 'Bilinmiyor',
            kapak_url: info.imageLinks ? info.imageLinks.thumbnail : null,
        };
    } */
    return null;
};


/**
 * TMDb API'den film başlığına göre arama yapar (V3 API Key kullanır).
 * @param {string} sorgu - Aranacak film başlığı.
 * @returns {Promise<Array>} Standart formatta film listesi.
 */
export const hariciFilmleriAra = async (sorgu) => {
    // V3 Anahtarı kontrolü
    if (!sorgu || !TMDB_KEY) {
        throw new Error("Arama sorgusu veya TMDb API Anahtarı eksik. Lütfen .env.local dosyanızı kontrol edin.");
    }
    
    // V3 API Key'i direkt URL içinde gönderiyoruz
    const url = `${TMDB_URL}/search/movie?api_key=${TMDB_KEY}&query=${encodeURIComponent(sorgu)}&language=tr-TR`; 

    try {
        // V3 Key URL'de olduğu için header'a gerek yoktur.
        const response = await fetch(url); 

        if (!response.ok) {
            // TMDb'den gelen yetkilendirme (401) dahil hataları yakalar
            throw new Error(`API isteği başarısız oldu: ${response.status} (${response.statusText})`);
        }
        
        const data = await response.json();
        
        // Gelen ham veriyi projemizin formatına dönüştürerek döndürün.
        return data.results
            .filter(item => item.media_type !== 'person') // Kişileri (People) hariç tut
            .map(item => veriyiStandartFormataDonustur(item, 'film'));

    } catch (error) {
        console.error("TMDb Arama Hatası:", error);
        throw error;
    }
};

/**
 * Belirli bir filmin detaylarını çeker, işler ve Supabase'deki Icerikler tablosuna kaydeder.
 * @param {string} tmdbId - TMDb'deki filmin harici ID'si.
 * @returns {Promise<object>} Kaydedilen Icerik nesnesi.
 */
export const icerigiKaydetVeDetaylariCek = async (tmdbId) => {
    if (!tmdbId || !TMDB_KEY) {
        throw new Error("TMDb ID veya API Anahtarı eksik.");
    }
    
    // 1. Detayları ve Oyuncu/Yönetmen (Credits) verilerini tek istekte çekin
    const url = `${TMDB_URL}/movie/${tmdbId}?api_key=${TMDB_KEY}&language=tr-TR&append_to_response=credits`;

    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Detay çekme başarısız oldu: ${response.status}`);
        }
        const data = await response.json();
        
        // Veriyi Icerikler tablosu formatına dönüştürün
        const detayliIcerik = {
            icerik_turu: 'film',
            harici_kaynak: 'tmdb',
            harici_id: tmdbId,
            baslik: data.title,
            ozet: data.overview,
            yayin_yili: data.release_date ? data.release_date.substring(0, 4) : null,
            sure_sayfa_sayisi: data.runtime, // Film süresi (dakika)
            kapak_url: data.poster_path ? `https://image.tmdb.org/t/p/w500${data.poster_path}` : null,
            
            // Oyuncu/Yönetmen ve Tür Listelerini Projenizin Formatına Hazırlayın
            yazar_yonetmen: data.credits.crew
                .filter(crew => crew.job === 'Director')
                .map(director => director.name)
                .join(', '), // Yönetmenleri virgülle ayır
            
            turler: data.genres.map(genre => genre.name).join(', ')
        };

        // 2. Icerikler tablosuna kaydetme veya güncelleme
        const { data: kaydedilenIcerik, error: dbError } = await supabase
            .from('Icerikler')
            .upsert(detayliIcerik, { 
                onConflict: 'harici_kaynak,harici_id', // Çakışma olursa güncelleme yapar
                ignoreDuplicates: true 
            })
            .select('*')
            .single();

        if (dbError) {
            throw new Error(`Veritabanına kaydetme hatası: ${dbError.message}`);
        }

        return kaydedilenIcerik;

    } catch (error) {
        console.error("Film Detayı Entegrasyon Hatası:", error);
        throw error;
    }
};

/**
 * Google Books API'den kitap başlığına göre arama yapar (Dilay'ın modülü)
 * Şimdilik boş bırakılmıştır.
 */
export const hariciKitaplariAra = async (sorgu) => {
    console.warn("Kitap arama modülü henüz tamamlanmamıştır. Sorgu:", sorgu);
    // Dilay'ın entegrasyonu buraya gelecek.
    return [];
};
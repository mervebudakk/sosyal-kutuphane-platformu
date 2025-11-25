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
 * Google Books API'den kitap başlığına göre arama yapar (Dilay'ın modülü)
 * Şimdilik boş bırakılmıştır.
 */
export const hariciKitaplariAra = async (sorgu) => {
    // Dilay, bu fonksiyonu Google Books API entegrasyonu ile tamamlayacaktır.
    console.warn("Kitap arama modülü henüz tamamlanmamıştır.");
    return [];
};
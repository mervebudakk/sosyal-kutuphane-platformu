import { supabase } from "./supabaseServis";

const TMDB_KEY = process.env.REACT_APP_TMDB_API_KEY;
const GOOGLE_BOOKS_KEY = process.env.REACT_APP_GOOGLE_BOOKS_API_KEY;
const TMDB_URL = "https://api.themoviedb.org/3";
const GOOGLE_BOOKS_URL = "https://www.googleapis.com/books/v1";

const veriyiStandartFormataDonustur = (item, tur) => {
  if (tur === "film") {
    return {
      icerik_turu: "film",
      harici_kaynak: "tmdb",
      harici_id: item.id.toString(),
      baslik: item.title,
      ozet: item.overview,
      yayin_yili: item.release_date
        ? item.release_date.substring(0, 4)
        : "Bilinmiyor",
      kapak_url: item.poster_path
        ? `https://image.tmdb.org/t/p/w500${item.poster_path}`
        : null,
    };
  } else if (tur === "kitap") {
    const info = item.volumeInfo;
    return {
      icerik_turu: "kitap",
      harici_kaynak: "google_books",
      harici_id: item.id,
      baslik: info.title,
      ozet: info.description || "Açıklama bulunmuyor.",
      yayin_yili: info.publishedDate
        ? info.publishedDate.substring(0, 4)
        : "Bilinmiyor",
      kapak_url: info.imageLinks?.thumbnail?.replace("http:", "https:") || null,
    };
  }
  return null;
};

export const hariciFilmleriAra = async (sorgu, page = 1) => {
  if (!TMDB_KEY) throw new Error("TMDb API anahtarı eksik.");

  const url =
    `${TMDB_URL}/search/movie?` +
    `api_key=${TMDB_KEY}` +
    `&language=tr-TR` +
    `&include_adult=false` +
    `&query=${encodeURIComponent(sorgu)}` +
    `&page=${page}`;

  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`TMDb Hatası: ${response.status}`);

    const data = await response.json();

    return data.results.map((item) =>
      veriyiStandartFormataDonustur(item, "film")
    );
  } catch (error) {
    console.error("TMDb Arama Hatası:", error);
    throw error;
  }
};

export const hariciKitaplariAra = async (sorgu, page = 1) => {
  if (!GOOGLE_BOOKS_KEY) throw new Error("Google Books API anahtarı eksik.");

  const maxResults = 20;
  const startIndex = (page - 1) * maxResults;

  const url =
    `${GOOGLE_BOOKS_URL}/volumes?` +
    `q=${encodeURIComponent(sorgu)}` +
    `&printType=books` +
    `&langRestrict=tr` +
    `&maxResults=${maxResults}` +
    `&startIndex=${startIndex}` +
    `&key=${GOOGLE_BOOKS_KEY}`;

  try {
    const response = await fetch(url);
    if (!response.ok)
      throw new Error(`Google Books Hatası: ${response.status}`);

    const data = await response.json();
    const items = data.items || [];

    return items.map((item) => veriyiStandartFormataDonustur(item, "kitap"));
  } catch (error) {
    console.error("Google Books Arama Hatası:", error);
    throw error;
  }
};

export const filmleriFiltreyeGoreGetir = async (
  baslangicYil,
  sortOption = "popularity_desc",
  genreId = null,
  page = 1
) => {
  if (!TMDB_KEY) throw new Error("TMDb API anahtarı eksik.");

  const bitisYil = baslangicYil + 9;

  const sortMap = {
    popularity_desc: "popularity.desc",
    rating_desc: "vote_average.desc",
    year_desc: "primary_release_date.desc",
  };

  const sortBy = sortMap[sortOption] || "popularity.desc";

  let url =
    `${TMDB_URL}/discover/movie?` +
    `api_key=${TMDB_KEY}` +
    `&language=tr-TR` +
    `&include_adult=false` +
    `&sort_by=${sortBy}` +
    `&primary_release_date.gte=${baslangicYil}-01-01` +
    `&primary_release_date.lte=${bitisYil}-12-31` +
    `&page=${page}`;

  if (genreId) {
    url += `&with_genres=${genreId}`;
  }

  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`TMDb Hatası: ${response.status}`);

    const data = await response.json();

    return data.results.map((item) =>
      veriyiStandartFormataDonustur(item, "film")
    );
  } catch (error) {
    console.error("TMDb Discover Hatası:", error);
    throw error;
  }
};

export const kitaplariFiltreyeGoreGetir = async (
  decadeStart,
  subject, // Örn: "fantasy", "history" vs.
  sortOption = "relevance",
  page = 1
) => {
  if (!GOOGLE_BOOKS_KEY) throw new Error("Google Books API anahtarı eksik.");

  const maxResults = 20;
  const startIndex = (page - 1) * maxResults;

  // Google Books gelişmiş arama sorgusu
  const qParts = [];
  if (subject) qParts.push(`subject:${subject}`);
  // Hiç tür seçilmediyse çok genel bir sorgu olsun:
  if (qParts.length === 0) qParts.push("book");

  const q = qParts.join("+");

  const orderBy = sortOption === "year_desc" ? "newest" : "relevance";

  const url =
    `${GOOGLE_BOOKS_URL}/volumes?` +
    `q=${encodeURIComponent(q)}` +
    `&printType=books` +
    `&langRestrict=tr` +
    `&maxResults=${maxResults}` +
    `&startIndex=${startIndex}` +
    `&orderBy=${orderBy}` +
    `&key=${GOOGLE_BOOKS_KEY}`;

  try {
    const response = await fetch(url);
    if (!response.ok)
      throw new Error(`Google Books Hatası: ${response.status}`);

    const data = await response.json();
    const items = data.items || [];

    const mapped = items.map((item) =>
      veriyiStandartFormataDonustur(item, "kitap")
    );

    // On yıla göre filtreleme (2010-2019 gibi)
    if (!decadeStart) {
      return mapped;
    }

    const endYear = decadeStart + 9;

    const filtered = mapped.filter((kitap) => {
      const yil = parseInt(kitap.yayin_yili, 10);
      if (isNaN(yil)) return false;
      return yil >= decadeStart && yil <= endYear;
    });

    return filtered;
  } catch (error) {
    console.error("Google Books Filtreli Arama Hatası:", error);
    throw error;
  }
};

// GÜNCELLEME: .single() hatasını önleyen versiyon
export const icerigiKaydetVeDetaylariCek = async (tmdbId) => {
  if (!tmdbId || !TMDB_KEY) throw new Error("Eksik bilgi.");
  const url = `${TMDB_URL}/movie/${tmdbId}?api_key=${TMDB_KEY}&language=tr-TR&append_to_response=credits`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    const detayliIcerik = {
      icerik_turu: "film",
      harici_kaynak: "tmdb",
      harici_id: tmdbId.toString(),
      baslik: data.title,
      ozet: data.overview,
      yayin_yili: data.release_date ? data.release_date.substring(0, 4) : null,
      sure_sayfa_sayisi: data.runtime,
      kapak_url: data.poster_path
        ? `https://image.tmdb.org/t/p/w500${data.poster_path}`
        : null,
      yazar_yonetmen: data.credits.crew
        .filter((c) => c.job === "Director")
        .map((d) => d.name)
        .join(", "),
      turler: data.genres.map((g) => g.name).join(", "),
    };

    const { data: dbData, error } = await supabase
      .from("Icerikler")
      .upsert(detayliIcerik, { onConflict: "harici_kaynak,harici_id" })
      .select("*");

    if (error) throw error;
    return Array.isArray(dbData) ? dbData[0] : dbData;
  } catch (error) {
    throw error;
  }
};

// GÜNCELLEME: .single() hatasını önleyen versiyon
export const kitapKaydetVeDetaylariCek = async (googleBookId) => {
  if (!googleBookId || !GOOGLE_BOOKS_KEY) throw new Error("Eksik bilgi.");
  const url = `${GOOGLE_BOOKS_URL}/volumes/${googleBookId}?key=${GOOGLE_BOOKS_KEY}`;

  try {
    const response = await fetch(url);
    const data = await response.json();
    const info = data.volumeInfo;

    const detayliKitap = {
      icerik_turu: "kitap",
      harici_kaynak: "google_books",
      harici_id: data.id,
      baslik: info.title ? info.title.substring(0, 255) : "Başlıksız",
      ozet: info.description
        ? info.description.substring(0, 1000)
        : "Açıklama yok.",
      yayin_yili: info.publishedDate
        ? info.publishedDate.substring(0, 4)
        : null,
      sure_sayfa_sayisi: info.pageCount || 0,
      kapak_url: info.imageLinks?.thumbnail?.replace("http:", "https:") || null,
      yazar_yonetmen: info.authors ? info.authors.join(", ") : "Bilinmiyor",
      turler: info.categories ? info.categories.join(", ") : "Genel",
    };

    const { data: dbData, error } = await supabase
      .from("Icerikler")
      .upsert(detayliKitap, { onConflict: "harici_kaynak,harici_id" })
      .select("*");

    if (error) throw error;
    return Array.isArray(dbData) ? dbData[0] : dbData;
  } catch (error) {
    throw error;
  }
};

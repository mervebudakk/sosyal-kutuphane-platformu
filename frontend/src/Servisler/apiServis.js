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

export const hariciFilmleriAra = async (sorgu) => {
  if (!sorgu || !TMDB_KEY) throw new Error("API Anahtarı eksik.");
  const url = `${TMDB_URL}/search/movie?api_key=${TMDB_KEY}&query=${encodeURIComponent(
    sorgu
  )}&language=tr-TR`;
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`API Hatası: ${response.status}`);
    const data = await response.json();
    return data.results
      .filter((i) => i.media_type !== "person")
      .map((i) => veriyiStandartFormataDonustur(i, "film"));
  } catch (error) {
    console.error("TMDb Hatası:", error);
    throw error;
  }
};

export const hariciKitaplariAra = async (sorgu) => {
  if (!sorgu || !GOOGLE_BOOKS_KEY) throw new Error("API Anahtarı eksik.");
  const url = `${GOOGLE_BOOKS_URL}/volumes?q=${encodeURIComponent(
    sorgu
  )}&key=${GOOGLE_BOOKS_KEY}&maxResults=20&langRestrict=tr`;
  try {
    const response = await fetch(url);
    if (!response.ok)
      throw new Error(`Google Books Hatası: ${response.status}`);
    const data = await response.json();
    if (!data.items) return [];
    return data.items.map((i) => veriyiStandartFormataDonustur(i, "kitap"));
  } catch (error) {
    console.error("Google Books Hatası:", error);
    return [];
  }
};

export const filmleriOnyilaGoreGetir = async (
  baslangicYil,
  sortOption = "popularity_desc",
  genreId = null
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
    `${TMDB_URL}/discover/movie?api_key=${TMDB_KEY}` +
    `&language=tr-TR&include_adult=false` +
    `&sort_by=${sortBy}` +
    `&primary_release_date.gte=${baslangicYil}-01-01` +
    `&primary_release_date.lte=${bitisYil}-12-31`;

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

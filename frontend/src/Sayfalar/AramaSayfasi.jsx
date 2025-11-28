import React, { useState } from "react";
import {
  Search,
  Film,
  BookOpen,
  Loader,
  ChevronRight,
  AlertCircle,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  hariciFilmleriAra,
  hariciKitaplariAra,
  icerigiKaydetVeDetaylariCek,
  kitapKaydetVeDetaylariCek,
  filmleriFiltreyeGoreGetir,
  kitaplariFiltreyeGoreGetir,
} from "../Servisler/apiServis";

// TMDb genre id eşleştirmesi (Türkçe etiket → TMDb ID)
const tmdbGenreMap = {
  Aksiyon: 28,
  Dram: 18,
  Bilimkurgu: 878,
  Komedi: 35,
  Korku: 27,
  Animasyon: 16,
};

const kitapGenreMap = {
  Roman: "fiction",
  Fantastik: "fantasy",
  Bilimkurgu: "science fiction",
  "Kişisel Gelişim": "self-help",
  Tarih: "history",
  Biyografi: "biography",
};

const AramaSayfasi = () => {
  const navigate = useNavigate();

  const [aktifKategori, setAktifKategori] = useState("film");
  const [aramaTerimi, setAramaTerimi] = useState("");
  const [sonuclar, setSonuclar] = useState([]);
  const [yukleniyor, setYukleniyor] = useState(false);
  const [hata, setHata] = useState(null);
  const [kayitDurumu, setKayitDurumu] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [aramaModu, setAramaModu] = useState(null);

  // Filtre state'leri
  const [selectedGenre, setSelectedGenre] = useState("");
  const [selectedDecade, setSelectedDecade] = useState(""); // "2020", "2010" vb.
  const [sortOption, setSortOption] = useState("popularity_desc");

  const filmTurleri = [
    "Aksiyon",
    "Dram",
    "Bilimkurgu",
    "Komedi",
    "Korku",
    "Animasyon",
  ];

  const kitapTurleri = [
    "Roman",
    "Fantastik",
    "Bilimkurgu",
    "Kişisel Gelişim",
    "Tarih",
    "Biyografi",
  ];

  const aktifTurListesi = aktifKategori === "film" ? filmTurleri : kitapTurleri;

  const decadeOptions = [
    { label: "Yıl", value: "" },
    { label: "2020'ler", value: "2020" },
    { label: "2010'lar", value: "2010" },
    { label: "2000'ler", value: "2000" },
    { label: "1990'lar", value: "1990" },
    { label: "1980'ler", value: "1980" },
  ];

  const aramaYap = async (e) => {
    if (e) e.preventDefault();

    const query = aramaTerimi.trim();

    // İlk aramada her zaman 1. sayfadan başla
    setCurrentPage(1);
    setHasMore(true);
    setYukleniyor(true);
    setHata(null);
    setSonuclar([]);
    setKayitDurumu({});

    try {
      let gelenSonuclar = [];

      // 1) ARAMA MODU: kullanıcı bir şey yazdıysa → sadece başlığa göre arama
      if (query.length > 0) {
        setAramaModu("search");

        if (aktifKategori === "film") {
          gelenSonuclar = await hariciFilmleriAra(query, 1);
        } else {
          gelenSonuclar = await hariciKitaplariAra(query, 1);
        }
      }
      // 2) FİLTRE MODU: arama terimi BOŞ ise → filtrelere göre listeleme
      else {
        setAramaModu("filter");
        if (aktifKategori === "film") {
          const decadeStart = selectedDecade
            ? parseInt(selectedDecade, 10)
            : null;

          const genreId =
            selectedGenre && tmdbGenreMap[selectedGenre]
              ? tmdbGenreMap[selectedGenre]
              : null;

          if (!decadeStart && !genreId) {
            setHata(
              "Filtreleme yapmak için en az bir filtre seçin (yıl veya tür)."
            );
            setYukleniyor(false);
            return;
          }

          const discoverStart = decadeStart || 1980;

          gelenSonuclar = await filmleriFiltreyeGoreGetir(
            discoverStart,
            sortOption,
            genreId
          );
        } else {
          // ✅ Kitaplar için de filtre modu (Google Books)
          const decadeStart = selectedDecade
            ? parseInt(selectedDecade, 10)
            : null;

          const subject =
            selectedGenre && kitapGenreMap[selectedGenre]
              ? kitapGenreMap[selectedGenre]
              : null;

          if (!decadeStart && !subject) {
            setHata(
              "Filtreleme yapmak için en az bir filtre seçin (yıl veya tür)."
            );
            setYukleniyor(false);
            return;
          }

          gelenSonuclar = await kitaplariFiltreyeGoreGetir(
            decadeStart,
            subject,
            sortOption,
            1
          );
        }
      }

      setSonuclar(gelenSonuclar);
      setHasMore(gelenSonuclar.length > 0);
    } catch (err) {
      setHata(err.message);
      setHasMore(false);
    } finally {
      setYukleniyor(false);
    }
  };

  const dahaFazlaYukle = async () => {
    if (yukleniyor) return; // Çifte tıklamayı engelle

    const query = aramaTerimi.trim();

    // Hiç arama yapılmadıysa veya mod belli değilse çalışmasın
    if (!aramaModu) return;

    const nextPage = currentPage + 1;

    setYukleniyor(true);
    setHata(null);

    try {
      let yeniSonuclar = [];

      if (aramaModu === "search") {
        // ARAMA MODU (arama kutusuna yazılmış hali)
        if (query.length === 0) {
          setYukleniyor(false);
          return;
        }

        if (aktifKategori === "film") {
          yeniSonuclar = await hariciFilmleriAra(query, nextPage);
        } else {
          yeniSonuclar = await hariciKitaplariAra(query, nextPage);
        }
      } else if (aramaModu === "filter") {
        // FİLTRE MODU

        if (aktifKategori === "film") {
          const decadeStart = selectedDecade
            ? parseInt(selectedDecade, 10)
            : null;

          const genreId =
            selectedGenre && tmdbGenreMap[selectedGenre]
              ? tmdbGenreMap[selectedGenre]
              : null;

          const discoverStart = decadeStart || 1980;

          yeniSonuclar = await filmleriFiltreyeGoreGetir(
            discoverStart,
            sortOption,
            genreId,
            nextPage
          );
        } else if (aktifKategori === "kitap") {
          const decadeStart = selectedDecade
            ? parseInt(selectedDecade, 10)
            : null;

          const subject =
            selectedGenre && kitapGenreMap[selectedGenre]
              ? kitapGenreMap[selectedGenre]
              : null;

          yeniSonuclar = await kitaplariFiltreyeGoreGetir(
            decadeStart,
            subject,
            sortOption,
            nextPage
          );
        }
      }

      // Yeni sayfada sonuç yoksa butonu gizle
      if (!yeniSonuclar || yeniSonuclar.length === 0) {
        setHasMore(false);
      } else {
        setSonuclar((prev) => [...prev, ...yeniSonuclar]);
        setCurrentPage(nextPage);
      }
    } catch (err) {
      setHata(err.message);
      setHasMore(false);
    } finally {
      setYukleniyor(false);
    }
  };

  const detaySayfasinaGit = async (hariciId) => {
    setKayitDurumu((prev) => ({ ...prev, [hariciId]: "yukleniyor" }));

    try {
      let kaydedilenIcerik;

      if (aktifKategori === "film") {
        kaydedilenIcerik = await icerigiKaydetVeDetaylariCek(hariciId);
      } else {
        kaydedilenIcerik = await kitapKaydetVeDetaylariCek(hariciId);
      }

      setKayitDurumu((prev) => ({ ...prev, [hariciId]: "basarili" }));

      setTimeout(() => {
        navigate(`/icerik/${kaydedilenIcerik.icerik_id}`);
      }, 500);
    } catch (err) {
      console.error(err);
      setKayitDurumu((prev) => ({ ...prev, [hariciId]: "hata" }));
      alert("Hata: " + err.message);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#121212",
        padding: "40px 20px",
        fontFamily: "'Roboto', sans-serif",
        color: "#ffffff",
      }}
    >
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        {/* Başlık */}
        <div style={{ textAlign: "center", marginBottom: "40px" }}>
          <h1
            style={{
              color: "#F5C518",
              fontSize: "3rem",
              fontWeight: "900",
              marginBottom: "10px",
              textTransform: "uppercase",
              letterSpacing: "1px",
            }}
          >
            Keşfet & Ara
          </h1>
          <p style={{ color: "#CCCCCC", fontSize: "1.1rem" }}>
            Favori içeriklerini bul ve koleksiyonuna ekle.
          </p>
        </div>

        {/* Kategori Seçimi */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: "20px",
            marginBottom: "30px",
          }}
        >
          {[
            { id: "film", icon: Film, label: "Filmler" },
            { id: "kitap", icon: BookOpen, label: "Kitaplar" },
          ].map((kategori) => {
            const Icon = kategori.icon;
            const aktif = aktifKategori === kategori.id;
            return (
              <button
                key={kategori.id}
                onClick={() => {
                  setAktifKategori(kategori.id);
                  setSonuclar([]);
                  setAramaTerimi("");
                  setHata(null);
                  setSelectedGenre("");
                  setSelectedDecade("");
                  setSortOption("popularity_desc");
                }}
                style={{
                  background: aktif ? "#F5C518" : "#1F1F1F",
                  color: aktif ? "black" : "white",
                  border: aktif ? "none" : "1px solid #333",
                  padding: "10px 25px",
                  borderRadius: "25px",
                  cursor: "pointer",
                  fontSize: "1rem",
                  fontWeight: "bold",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <Icon size={20} />
                {kategori.label}
              </button>
            );
          })}
        </div>

        {/* FİLTRE VE ARAMA KONTROL PANELİ */}
                <div style={{ 
                    background: "#1F1F1F", 
                    borderRadius: "8px", 
                    padding: "15px 20px", // Yüksekliği azaltmak için dikey padding azaldı
                    border: "1px solid #333",
                    maxWidth: "800px", 
                    margin: "0 auto", 
                    marginBottom: "40px" 
                }}>

                    {/* 1. SATIR: FİLTRELEME ÇUBUĞU (Üstte yer almalı) */}
                    <div style={{ display: 'flex', gap: '15px', alignItems: 'center', flexWrap: 'wrap', marginBottom: '20px', borderBottom: '1px solid #333', paddingBottom: '15px' }}>
                        
                        <span style={{ color: '#F5C518', fontWeight: 'bold', fontSize: '0.9rem' }}>Filtrele:</span>

                        {/* Tür seçimi */}
                        <select
                            value={selectedGenre}
                            onChange={(e) => setSelectedGenre(e.target.value)}
                            style={{ padding: "6px 10px", background: "#111111", color: "white", borderRadius: "4px", border: "1px solid #444", fontSize: "0.9rem" }}
                        >
                            <option value="">Tür Seç</option>
                            {aktifTurListesi.map((tur) => (<option key={tur} value={tur}>{tur}</option>))}
                        </select>

                        {/* YIL (Onyıl) seçimi */}
                        <select
                            value={selectedDecade}
                            onChange={(e) => setSelectedDecade(e.target.value)}
                            style={{ padding: "6px 10px", background: "#111111", color: "white", borderRadius: "4px", border: "1px solid #444", fontSize: "0.9rem" }}
                        >
                            {decadeOptions.map((d) => (<option key={d.value || "hepsi"} value={d.value}>{d.label}</option>))}
                        </select>
                        
                        {/* Sıralama - En sağa itiyoruz */}
                        <select
                            value={sortOption}
                            onChange={(e) => setSortOption(e.target.value)}
                            style={{ padding: "6px 10px", background: "#111111", color: "white", borderRadius: "4px", border: "1px solid #444", fontSize: "0.9rem", marginLeft: "auto" }}
                        >
                            <option value="popularity_desc">Popülerlik</option>
                            <option value="rating_desc">Puan (yüksek → düşük)</option>
                            <option value="year_desc">Yıl (yeni → eski)</option>
                        </select>
                    </div>

                    {/* 2. SATIR: ARAMA KUTUSU VE BUTON */}
                    <div 
                        style={{ 
                            display: "flex", 
                            alignItems: "center", 
                            background: "#111111", 
                            borderRadius: "4px", 
                            border: "1px solid #333",
                            height: '50px' // Kutu yüksekliğini sabitledik
                        }}
                    >
                        <Search size={24} color="#F5C518" style={{ marginLeft: "15px", marginRight: "10px", flexShrink: 0 }} />
                        <input
                            type="text"
                            value={aramaTerimi}
                            onChange={(e) => setAramaTerimi(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && aramaYap()}
                            placeholder={aktifKategori === "film" ? "Matrix, Interstellar..." : "Harry Potter, 1984..."}
                            style={{ flex: 1, border: "none", outline: "none", fontSize: "1.1rem", padding: "10px 0", background: "transparent", color: "white" }}
                        />
                        <button
                            onClick={aramaYap}
                            disabled={yukleniyor}
                            style={{
                                background: "#F5C518", color: "black", border: "none", 
                                borderRadius: "0 4px 4px 0",
                                padding: "0 30px", // Dikey padding'i kaldırdık
                                fontSize: "1rem", fontWeight: "bold", cursor: yukleniyor ? "not-allowed" : "pointer",
                                opacity: yukleniyor ? 0.7 : 1, height: '100%',
                            }}
                        >
                            {yukleniyor ? <Loader size={20} /> : "Ara"}
                        </button>
                    </div>

                </div>

        {/* Hata Mesajı */}
        {hata && (
          <div
            style={{
              background: "rgba(239, 68, 68, 0.1)",
              border: "1px solid #ef4444",
              color: "#ef4444",
              padding: "15px",
              borderRadius: "4px",
              marginBottom: "20px",
              maxWidth: "700px",
              margin: "0 auto 20px",
              display: "flex",
              alignItems: "center",
              gap: "10px",
            }}
          >
            <AlertCircle size={20} />
            <span>{hata}</span>
          </div>
        )}

        {/* Sonuçlar */}
        {sonuclar.length > 0 && (
          <div>
            <h3
              style={{
                color: "#F5C518",
                fontSize: "1.5rem",
                marginBottom: "20px",
                fontWeight: "700",
              }}
            >
              Sonuçlar ({sonuclar.length})
            </h3>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
                gap: "20px",
              }}
            >
              {sonuclar.map((icerik, index) => {
                const durum = kayitDurumu[icerik.harici_id];
                return (
                  <div
                    key={index}
                    onClick={() => detaySayfasinaGit(icerik.harici_id)}
                    style={{
                      background: "#1A1A1A",
                      borderRadius: "4px",
                      overflow: "hidden",
                      cursor: "pointer",
                      position: "relative",
                      border:
                        durum === "yukleniyor"
                          ? "2px solid #F5C518"
                          : "1px solid #333",
                    }}
                  >
                    {durum && (
                      <div
                        style={{
                          position: "absolute",
                          top: 0,
                          right: 0,
                          background:
                            durum === "yukleniyor" ? "#F5C518" : "#5799ef",
                          color: durum === "yukleniyor" ? "black" : "white",
                          padding: "4px 10px",
                          borderBottomLeftRadius: "8px",
                          fontSize: "0.75rem",
                          fontWeight: "bold",
                          display: "flex",
                          alignItems: "center",
                          gap: "4px",
                        }}
                      >
                        {durum === "yukleniyor" ? (
                          <>
                            <Loader size={12} /> Hazırlanıyor
                          </>
                        ) : (
                          <>
                            <ChevronRight size={14} /> Açılıyor
                          </>
                        )}
                      </div>
                    )}

                    <div
                      style={{
                        width: "100%",
                        paddingTop: "150%",
                        position: "relative",
                        background: "#222",
                      }}
                    >
                      <img
                        src={
                          icerik.kapak_url ||
                          "https://via.placeholder.com/300x450?text=Resim+Yok"
                        }
                        alt={icerik.baslik}
                        style={{
                          position: "absolute",
                          top: 0,
                          left: 0,
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                        }}
                      />
                    </div>

                    <div style={{ padding: "12px" }}>
                      <h4
                        style={{
                          margin: "0 0 5px 0",
                          fontSize: "0.95rem",
                          fontWeight: "bold",
                          color: "#FFFFFF",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {icerik.baslik}
                      </h4>
                      <span
                        style={{
                          color: "#AAAAAA",
                          fontSize: "0.85rem",
                        }}
                      >
                        {icerik.yayin_yili}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
            {/* Daha Fazla Göster */}
            {hasMore && (
              <div
                style={{
                  marginTop: "24px",
                  display: "flex",
                  justifyContent: "center",
                }}
              >
                <button
                  onClick={dahaFazlaYukle}
                  disabled={yukleniyor}
                  style={{
                    padding: "10px 24px",
                    borderRadius: "20px",
                    border: "1px solid #F5C518",
                    background: "#1F1F1F",
                    color: "#F5C518",
                    fontWeight: "bold",
                    cursor: yukleniyor ? "not-allowed" : "pointer",
                    opacity: yukleniyor ? 0.7 : 1,
                  }}
                >
                  {yukleniyor ? "Yükleniyor..." : "Daha Fazla Göster"}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AramaSayfasi;

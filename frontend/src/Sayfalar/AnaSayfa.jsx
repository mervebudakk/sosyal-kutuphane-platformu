// src/Sayfalar/AnaSayfa.jsx
import React, { useEffect, useState } from "react";
import { supabase } from "../Servisler/supabaseServis";
import {
  User,
  Heart,
  MessageCircle,
  Clock,
  Star,
  Film,
  BookOpen,
  Loader,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const SAYFA_BOYUTU = 10;

// Basit relatif zaman helper'ı
const formatRelativeTime = (tarihStr) => {
  const tarih = new Date(tarihStr);
  const simdi = new Date();
  const farkMs = simdi - tarih;

  const dakika = Math.floor(farkMs / 1000 / 60);
  if (dakika < 1) return "az önce";
  if (dakika < 60) return `${dakika} dk önce`;

  const saat = Math.floor(dakika / 60);
  if (saat < 24) return `${saat} sa önce`;

  const gun = Math.floor(saat / 24);
  if (gun < 7) return `${gun} gün önce`;

  return tarih.toLocaleDateString("tr-TR");
};

// Aktivite türüne göre kart başlığı
const aktiviteMetniOlustur = (aktivite, kullaniciAdi) => {
  const tur = aktivite.aktivite_turu; // 'puanlama' | 'yorum' | 'listeye_ekleme'

  if (tur === "puanlama") {
    return `${kullaniciAdi} bir içeriğe puan verdi`;
  }
  if (tur === "yorum") {
    return `${kullaniciAdi} bir içerik hakkında yorum yaptı`;
  }
  if (tur === "listeye_ekleme") {
    return `${kullaniciAdi} kütüphanesini güncelledi`;
  }
  return `${kullaniciAdi} bir aktivite gerçekleştirdi`;
};

// Tek bir aktivite kartı
const AktiviteKarti = ({
  aktivite,
  currentUserId,
  onLikeToggle,
  onCommentSend,
  onCommentUpdate,
  onCommentDelete,
  navigate,
}) => {
  const kullanici = aktivite.Kullanicilar;
  const icerik = aktivite.Icerikler;

  const [yorumAcik, setYorumAcik] = useState(false);
  const [yorumMetin, setYorumMetin] = useState("");
  const [yorumGonderiliyor, setYorumGonderiliyor] = useState(false);

  const [duzenlenenYorumId, setDuzenlenenYorumId] = useState(null);
  const [duzenlemeMetni, setDuzenlemeMetni] = useState("");
  const [duzenlemeYukleniyor, setDuzenlemeYukleniyor] = useState(false);

  const yorumlar = aktivite.AktiviteYorumlari || [];

  const begenenler = aktivite.AktiviteBegenileri || [];
  const begeniSayisi = begenenler.length;
  const benBegendim = begenenler.some((b) => b.kullanici_id === currentUserId);

  const handleComment = async () => {
    const trimmed = yorumMetin.trim();
    if (!trimmed) return;
    setYorumGonderiliyor(true);
    await onCommentSend(aktivite, trimmed);
    setYorumMetin("");
    setYorumGonderiliyor(false);
  };

  return (
    <div
      style={{
        background: "#1F1F1F",
        borderRadius: "8px",
        padding: "16px 18px",
        border: "1px solid #333",
        display: "flex",
        gap: "16px",
      }}
    >
      {/* Poster */}
      <div
        style={{
          width: "90px",
          flexShrink: 0,
          borderRadius: "4px",
          overflow: "hidden",
          background: "#333",
        }}
      >
        <img
          src={
            icerik?.kapak_url ||
            "https://via.placeholder.com/90x130?text=Kapak+Yok"
          }
          alt={icerik?.baslik}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      </div>

      {/* Sağ taraf */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        {/* Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: "8px",
          }}
        >
          <div
            style={{
              display: "flex",
              gap: "10px",
              alignItems: "center",
              cursor: "pointer",
            }}
            onClick={() => navigate(`/kullanici/${kullanici?.kullanici_id}`)}
          >
            {/* Avatar */}
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "999px",
                background: "#333",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#F5C518",
                fontWeight: "bold",
                flexShrink: 0,
              }}
            >
              {kullanici?.kullanici_adi
                ? kullanici.kullanici_adi.charAt(0).toUpperCase()
                : "U"}
            </div>
            <div>
              <div
                style={{
                  color: "white",
                  fontWeight: "bold",
                  fontSize: "0.95rem",
                }}
              >
                {kullanici?.kullanici_adi || "Kullanıcı"}
              </div>
              <div
                style={{ color: "#AAAAAA", fontSize: "0.8rem", marginTop: 2 }}
              >
                {aktiviteMetniOlustur(
                  aktivite,
                  kullanici?.kullanici_adi || "Kullanıcı"
                )}
              </div>
            </div>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              color: "#888",
              fontSize: "0.8rem",
              gap: 4,
            }}
          >
            <Clock size={14} />
            {formatRelativeTime(aktivite.olusturulma_tarihi)}
          </div>
        </div>

        {/* İçerik başlığı + tür ikonu */}
        {icerik && (
          <div style={{ marginBottom: "8px", display: "flex", gap: 8 }}>
            {icerik.icerik_turu === "film" ? (
              <Film size={18} color="#F5C518" />
            ) : (
              <BookOpen size={18} color="#F5C518" />
            )}
            <div
              style={{
                color: "white",
                fontWeight: "600",
                fontSize: "1rem",
                cursor: "pointer",
              }}
              onClick={() =>
                (window.location.href = `/icerik/${icerik.icerik_id}`)
              }
            >
              {icerik.baslik}
            </div>
          </div>
        )}

        {/* Özet / kısa metin (isteğe bağlı) */}
        {aktivite.ozet_metni && (
          <div
            style={{
              color: "#CCCCCC",
              fontSize: "0.9rem",
              marginBottom: "10px",
            }}
          >
            {aktivite.ozet_metni}
          </div>
        )}

        {/* Alt bar: beğeni + yorum */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            marginTop: "auto",
          }}
        >
          <button
            onClick={() => onLikeToggle(aktivite, benBegendim)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              borderRadius: "999px",
              padding: "6px 12px",
              border: "1px solid #333",
              background: benBegendim ? "rgba(239,68,68,0.12)" : "#151515",
              color: benBegendim ? "#ef4444" : "#CCCCCC",
              cursor: "pointer",
              fontSize: "0.8rem",
            }}
          >
            <Heart
              size={16}
              fill={benBegendim ? "#ef4444" : "none"}
              color={benBegendim ? "#ef4444" : "#CCCCCC"}
            />
            <span>{begeniSayisi || 0}</span>
          </button>

          <button
            onClick={() => setYorumAcik((a) => !a)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              borderRadius: "999px",
              padding: "6px 12px",
              border: "1px solid #333",
              background: "#151515",
              color: "#CCCCCC",
              cursor: "pointer",
              fontSize: "0.8rem",
            }}
          >
            <MessageCircle size={16} />
            <span>Yorum Yap</span>
          </button>

          {aktivite.puan_degeri && (
            <div
              style={{
                marginLeft: "auto",
                display: "flex",
                alignItems: "center",
                gap: 4,
                color: "#F5C518",
                fontSize: "0.85rem",
                fontWeight: "bold",
              }}
            >
              <Star size={16} fill="#F5C518" color="#F5C518" />
              {aktivite.puan_degeri}/10
            </div>
          )}
        </div>

        {/* Yorum inputu */}
        {yorumAcik && (
          <div style={{ marginTop: "10px" }}>
            <textarea
              value={yorumMetin}
              onChange={(e) => setYorumMetin(e.target.value)}
              placeholder="Bu aktivite hakkında ne düşünüyorsun?"
              style={{
                width: "100%",
                minHeight: "60px",
                background: "#111",
                borderRadius: "6px",
                border: "1px solid #333",
                padding: "8px 10px",
                color: "white",
                fontSize: "0.85rem",
                resize: "vertical",
                marginBottom: "6px",
                outline: "none",
              }}
            />
            <button
              onClick={handleComment}
              disabled={yorumGonderiliyor}
              style={{
                padding: "6px 14px",
                borderRadius: "999px",
                border: "none",
                background: "#F5C518",
                color: "black",
                fontSize: "0.8rem",
                fontWeight: "bold",
                cursor: yorumGonderiliyor ? "wait" : "pointer",
              }}
            >
              {yorumGonderiliyor ? "Gönderiliyor..." : "Yorumu Gönder"}
            </button>
          </div>
        )}
        {/* Mevcut yorumlar */}
        {yorumlar.length > 0 && (
  <div
    style={{
      marginTop: "10px",
      paddingTop: "8px",
      borderTop: "1px solid #333",
      display: "flex",
      flexDirection: "column",
      gap: 6,
    }}
  >
    {yorumlar.slice(0, 3).map((y) => {
      const benimYorumum =
        y.Kullanicilar?.kullanici_id === currentUserId;

      const kaydet = async () => {
        if (!duzenlemeMetni.trim()) return;
        setDuzenlemeYukleniyor(true);
        await onCommentUpdate(
          aktivite.aktivite_id,
          y.aktivite_yorum_id,
          duzenlemeMetni.trim()
        );
        setDuzenlemeYukleniyor(false);
        setDuzenlenenYorumId(null);
        setDuzenlemeMetni("");
      };

      return (
        <div
          key={y.aktivite_yorum_id}
          style={{
            background: "#111",
            borderRadius: "6px",
            padding: "6px 8px",
            fontSize: "0.8rem",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: 2,
            }}
          >
            <span style={{ color: "#F5C518", fontWeight: 600 }}>
              {y.Kullanicilar?.kullanici_adi || "Kullanıcı"}
            </span>

            <div
              style={{
                display: "flex",
                gap: 8,
                alignItems: "center",
              }}
            >
              <span style={{ color: "#777", fontSize: "0.7rem" }}>
                {formatRelativeTime(y.olusturulma_tarihi)}
              </span>

              {benimYorumum && (
                <>
                  <button
                    onClick={() => {
                      setDuzenlenenYorumId(y.aktivite_yorum_id);
                      setDuzenlemeMetni(y.yorum_metin);
                    }}
                    style={{
                      border: "none",
                      background: "transparent",
                      color: "#F5C518",
                      fontSize: "0.7rem",
                      cursor: "pointer",
                    }}
                  >
                    Düzenle
                  </button>

                  <button
                    onClick={() =>
                      onCommentDelete(
                        aktivite.aktivite_id,
                        y.aktivite_yorum_id
                      )
                    }
                    style={{
                      border: "none",
                      background: "transparent",
                      color: "#f87171",
                      fontSize: "0.7rem",
                      cursor: "pointer",
                    }}
                  >
                    Sil
                  </button>
                </>
              )}
            </div>
          </div>

          {duzenlenenYorumId === y.aktivite_yorum_id ? (
            <div>
              <textarea
                value={duzenlemeMetni}
                onChange={(e) => setDuzenlemeMetni(e.target.value)}
                style={{
                  width: "100%",
                  minHeight: "50px",
                  background: "#000",
                  borderRadius: "4px",
                  border: "1px solid #444",
                  color: "white",
                  fontSize: "0.8rem",
                  padding: "6px 8px",
                  resize: "vertical",
                }}
              />
              <div
                style={{
                  marginTop: 4,
                  display: "flex",
                  gap: 8,
                }}
              >
                <button
                  onClick={kaydet}
                  disabled={duzenlemeYukleniyor}
                  style={{
                    padding: "4px 10px",
                    borderRadius: "999px",
                    border: "none",
                    background: "#F5C518",
                    color: "#000",
                    fontSize: "0.75rem",
                    cursor: "pointer",
                    fontWeight: "bold",
                  }}
                >
                  {duzenlemeYukleniyor ? "Kaydediliyor..." : "Kaydet"}
                </button>
                <button
                  onClick={() => {
                    setDuzenlenenYorumId(null);
                    setDuzenlemeMetni("");
                  }}
                  style={{
                    padding: "4px 10px",
                    borderRadius: "999px",
                    border: "1px solid #444",
                    background: "transparent",
                    color: "#ccc",
                    fontSize: "0.75rem",
                    cursor: "pointer",
                  }}
                >
                  Vazgeç
                </button>
              </div>
            </div>
          ) : (
            <div style={{ color: "#DDDDDD" }}>{y.yorum_metin}</div>
          )}
        </div>
      );
    })}

    {yorumlar.length > 3 && (
      <div style={{ color: "#888", fontSize: "0.75rem" }}>
        +{yorumlar.length - 3} yorum daha...
      </div>
    )}
  </div>
)}

      </div>
    </div>
  );
};

const AnaSayfa = () => {
  const [currentUserId, setCurrentUserId] = useState(null);
  const [currentUserName, setCurrentUserName] = useState("");
  const [aktiviteler, setAktiviteler] = useState([]);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [hata, setHata] = useState(null);
  const [sayfa, setSayfa] = useState(1);
  const [dahaVarMi, setDahaVarMi] = useState(true);
  const [ilkYuklemeTamam, setIlkYuklemeTamam] = useState(false);
  const navigate = useNavigate();

  // 1) Giriş yapan kullanıcının Kullanicilar kaydını bul
  useEffect(() => {
    const init = async () => {
      setYukleniyor(true);
      setHata(null);
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
          setHata("Önce giriş yapmalısınız.");
          setYukleniyor(false);
          return;
        }

        const { data: dbUser, error: dbErr } = await supabase
          .from("Kullanicilar")
          .select("kullanici_id, kullanici_adi, eposta")
          .eq("eposta", user.email)
          .single();

        if (dbErr || !dbUser) {
          setHata("Kullanıcı kaydı bulunamadı.");
          setYukleniyor(false);
          return;
        }

        setCurrentUserId(dbUser.kullanici_id);
        setCurrentUserName(
          dbUser.kullanici_adi || dbUser.eposta?.split("@")[0] || ""
        );

        // İlk sayfa aktiviteleri
        await aktiviteleriGetir(dbUser.kullanici_id, 1, true);
        setSayfa(1);
        setIlkYuklemeTamam(true);
      } catch (err) {
        console.error(err);
        setHata("Akış yüklenirken bir hata oluştu.");
      } finally {
        setYukleniyor(false);
      }
    };

    init();
  }, []);

  // 2) Belirli sayfa için aktiviteleri getir
  const aktiviteleriGetir = async (kullaniciId, sayfaNo, replace) => {
    const offset = (sayfaNo - 1) * SAYFA_BOYUTU;
    const limit = SAYFA_BOYUTU;

    // Takip edilen kullanıcıları bul
    const { data: takipData, error: takipErr } = await supabase
      .from("TakipEtmeler")
      .select("takip_edilen_id")
      .eq("takip_eden_id", kullaniciId);

    if (takipErr) throw takipErr;

    const takipEdilenIds = takipData?.map((t) => t.takip_edilen_id) || [];
    const idListesi = [kullaniciId, ...takipEdilenIds];

    // AnaSayfa.jsx içinde aktiviteleriGetir fonksiyonu
    const { data: aktiviteData, error: aktErr } = await supabase
      .from("Aktiviteler")
      .select(
        `
    aktivite_id,
    kullanici_id,
    icerik_id,
    aktivite_turu,
    olusturulma_tarihi,
    Kullanicilar ( kullanici_id, kullanici_adi ),
    Icerikler ( icerik_id, baslik, kapak_url, icerik_turu ),
    AktiviteBegenileri ( kullanici_id ),
    AktiviteYorumlari (
      aktivite_yorum_id,
      yorum_metin,
      olusturulma_tarihi,
      Kullanicilar ( kullanici_id, kullanici_adi )
    )
  `
      )
      .in("kullanici_id", idListesi)
      .order("olusturulma_tarihi", { ascending: false })
      .range(offset, offset + limit - 1);

    if (aktErr) throw aktErr;

    if (!aktiviteData || aktiviteData.length < limit) {
      setDahaVarMi(false);
    } else {
      setDahaVarMi(true);
    }

    setAktiviteler((prev) =>
      replace ? aktiviteData : [...prev, ...aktiviteData]
    );
  };

  // 3) Beğeni toggle
  const handleLikeToggle = async (aktivite, isLiked) => {
    if (!currentUserId) return;
    try {
      if (isLiked) {
        // Beğeniyi sil
        const { error } = await supabase
          .from("AktiviteBegenileri")
          .delete()
          .eq("aktivite_id", aktivite.aktivite_id)
          .eq("kullanici_id", currentUserId);
        if (error) throw error;
      } else {
        // Yeni beğeni ekle
        const { error } = await supabase.from("AktiviteBegenileri").insert([
          {
            aktivite_id: aktivite.aktivite_id,
            kullanici_id: currentUserId,
          },
        ]);
        if (error) throw error;
      }

      // Local state'i güncelle
      setAktiviteler((prev) =>
        prev.map((a) => {
          if (a.aktivite_id !== aktivite.aktivite_id) return a;
          const mevcut = a.AktiviteBegenileri || [];
          if (isLiked) {
            return {
              ...a,
              AktiviteBegenileri: mevcut.filter(
                (b) => b.kullanici_id !== currentUserId
              ),
            };
          } else {
            return {
              ...a,
              AktiviteBegenileri: [...mevcut, { kullanici_id: currentUserId }],
            };
          }
        })
      );
    } catch (err) {
      console.error(err);
      alert("Beğeni güncellenirken hata oluştu.");
    }
  };

  // 4) Aktiviteye yorum ekleme
  const handleCommentSend = async (aktivite, yorumMetni) => {
    if (!currentUserId) return;

    try {
      const { data, error } = await supabase
        .from("AktiviteYorumlari")
        .insert([
          {
            aktivite_id: aktivite.aktivite_id,
            kullanici_id: currentUserId,
            yorum_metin: yorumMetni,
          },
        ])
        .select(
          `
        aktivite_yorum_id,
        yorum_metin,
        olusturulma_tarihi,
        Kullanicilar ( kullanici_id, kullanici_adi )
      `
        )
        .single();

      if (error) throw error;

      // Local state’i güncelle (akışta anında görünsün)
      setAktiviteler((prev) =>
        prev.map((a) => {
          if (a.aktivite_id !== aktivite.aktivite_id) return a;

          const mevcutYorumlar = a.AktiviteYorumlari || [];

          // Eğer select’ten data gelmezse yedek olarak kendimiz obje kur
          const yeniYorum = data || {
            aktivite_yorum_id: Date.now(),
            yorum_metin: yorumMetni,
            olusturulma_tarihi: new Date().toISOString(),
            Kullanicilar: {
              kullanici_id: currentUserId,
              kullanici_adi: currentUserName || "Sen",
            },
          };

          return {
            ...a,
            AktiviteYorumlari: [yeniYorum, ...mevcutYorumlar],
          };
        })
      );
    } catch (err) {
      console.error(err);
      alert("Yorum gönderilirken hata oluştu.");
    }
  };

  const handleCommentUpdate = async (aktiviteId, yorumId, yeniMetin) => {
    if (!currentUserId) return;

    try {
      const { error } = await supabase
        .from("AktiviteYorumlari")
        .update({ yorum_metin: yeniMetin })
        .eq("aktivite_yorum_id", yorumId)
        .eq("kullanici_id", currentUserId); // sadece kendi yorumunu güncellesin

      if (error) throw error;

      // Local state'i güncelle
      setAktiviteler((prev) =>
        prev.map((a) => {
          if (a.aktivite_id !== aktiviteId) return a;
          return {
            ...a,
            AktiviteYorumlari: (a.AktiviteYorumlari || []).map((y) =>
              y.aktivite_yorum_id === yorumId
                ? { ...y, yorum_metin: yeniMetin }
                : y
            ),
          };
        })
      );
    } catch (err) {
      console.error(err);
      alert("Yorum güncellenirken bir hata oluştu.");
    }
  };

  const handleCommentDelete = async (aktiviteId, yorumId) => {
    if (!currentUserId) return;

    const onay = window.confirm("Yorumu silmek istediğine emin misin?");
    if (!onay) return;

    try {
      const { error } = await supabase
        .from("AktiviteYorumlari")
        .delete()
        .eq("aktivite_yorum_id", yorumId)
        .eq("kullanici_id", currentUserId); // güvenlik için

      if (error) throw error;

      setAktiviteler((prev) =>
        prev.map((a) => {
          if (a.aktivite_id !== aktiviteId) return a;
          return {
            ...a,
            AktiviteYorumlari: (a.AktiviteYorumlari || []).filter(
              (y) => y.aktivite_yorum_id !== yorumId
            ),
          };
        })
      );
    } catch (err) {
      console.error(err);
      alert("Yorum silinirken bir hata oluştu.");
    }
  };

  const dahaFazlaYukle = async () => {
    if (!currentUserId || yukleniyor || !dahaVarMi) return;
    setYukleniyor(true);
    setHata(null);
    try {
      const yeniSayfa = sayfa + 1;
      await aktiviteleriGetir(currentUserId, yeniSayfa, false);
      setSayfa(yeniSayfa);
    } catch (err) {
      console.error(err);
      setHata("Daha fazla aktivite yüklenirken hata oluştu.");
    } finally {
      setYukleniyor(false);
    }
  };

  // ---- RENDER ----

  if (!ilkYuklemeTamam && yukleniyor) {
    return (
      <div
        style={{
          minHeight: "60vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#CCCCCC",
        }}
      >
        <Loader className="spin" size={28} />
        <span style={{ marginLeft: 10 }}>Akış yükleniyor...</span>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        padding: "30px 20px 60px",
        color: "#CCCCCC",
      }}
    >
      <div style={{ maxWidth: "900px", margin: "0 auto" }}>
        {/* Başlık */}
        <div style={{ marginBottom: "24px" }}>
          <h2
            style={{
              color: "white",
              fontSize: "2rem",
              marginBottom: "6px",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <User size={26} color="#F5C518" />
            Sosyal Akış
          </h2>
          <p style={{ color: "#AAAAAA", fontSize: "0.95rem" }}>
            Sen ve takip ettiğin kullanıcıların son puanlamaları, yorumları ve
            aktiviteleri.
          </p>
        </div>

        {hata && (
          <div
            style={{
              background: "rgba(239,68,68,0.08)",
              border: "1px solid #ef4444",
              color: "#ef4444",
              padding: "10px 12px",
              borderRadius: "6px",
              marginBottom: "16px",
              fontSize: "0.9rem",
            }}
          >
            {hata}
          </div>
        )}

        {/* Akış listesi */}
        {aktiviteler.length === 0 ? (
          <div
            style={{
              borderRadius: "8px",
              border: "1px dashed #333",
              padding: "30px",
              textAlign: "center",
              color: "#777",
            }}
          >
            Henüz akışta gösterilecek bir aktivite yok. <br />
            Film/kitaplara puan vererek ve yorum yaparak akışını doldurmaya
            başlayabilirsin.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {aktiviteler.map((aktivite) => (
              <AktiviteKarti
                key={aktivite.aktivite_id}
                aktivite={aktivite}
                currentUserId={currentUserId} 
                onLikeToggle={handleLikeToggle}
                onCommentSend={handleCommentSend}
                onCommentUpdate={handleCommentUpdate} 
                onCommentDelete={handleCommentDelete} 
                navigate={navigate}
              />
            ))}
          </div>
        )}

        {/* Daha Fazla Yükle */}
        {aktiviteler.length > 0 && dahaVarMi && (
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
                padding: "8px 20px",
                borderRadius: "999px",
                border: "1px solid #F5C518",
                background: "#1F1F1F",
                color: "#F5C518",
                fontWeight: "bold",
                cursor: yukleniyor ? "not-allowed" : "pointer",
                fontSize: "0.9rem",
                opacity: yukleniyor ? 0.7 : 1,
              }}
            >
              {yukleniyor ? "Yükleniyor..." : "Daha Fazla Yükle"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AnaSayfa;

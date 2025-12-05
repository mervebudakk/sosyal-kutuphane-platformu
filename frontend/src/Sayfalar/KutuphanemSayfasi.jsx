// src/Sayfalar/KutuphanemSayfasi.jsx
import React, { useEffect, useState } from "react";
import { Film, BookOpen, Clock, CheckCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../Servisler/supabaseServis";

const KutuphanemSayfasi = () => {
  const navigate = useNavigate();

  const [aktifSekme, setAktifSekme] = useState("film");

  const [aktifKullaniciId, setAktifKullaniciId] = useState(null);

  const [listeler, setListeler] = useState({
    izlediklerim: [],
    izlenecekler: [],
    okuduklarim: [],
    okunacaklar: [],
  });

  const [ozelListeler, setOzelListeler] = useState([]);
  const [yukleniyor, setYukleniyor] = useState(true);

  // SADECE KENDİ KÜTÜPHANEMİ GETİR
  useEffect(() => {
    const veriGetir = async () => {
      setYukleniyor(true);

      // 1) Auth kullanıcısını al
      const { data: authData, error: authErr } = await supabase.auth.getUser();
      if (authErr || !authData?.user) {
        navigate("/");
        return;
      }

      // 2) Auth kullanıcısının Kullanicilar kaydı
      const { data: dbCurrentUser, error: dbErr } = await supabase
        .from("Kullanicilar")
        .select("kullanici_id")
        .eq("kullanici_id", authData.user.id)
        .single();

      if (dbErr || !dbCurrentUser) {
        navigate("/");
        return;
      }

      const kullaniciId = dbCurrentUser.kullanici_id;
      setAktifKullaniciId(kullaniciId);

      // 3) Kütüphane verileri
      const { data: durumlar, error: durumErr } = await supabase
        .from("KullaniciIcerikDurumlari")
        .select("durum, Icerikler(*)")
        .eq("kullanici_id", kullaniciId);

      if (!durumErr && durumlar) {
        const filmKayitlari = durumlar.filter(
          (d) => d.Icerikler && d.Icerikler.icerik_turu === "film"
        );
        const kitapKayitlari = durumlar.filter(
          (d) => d.Icerikler && d.Icerikler.icerik_turu === "kitap"
        );

        const izlediklerim = filmKayitlari
          .filter((d) => d.durum === "izledim")
          .map((d) => d.Icerikler);
        const izlenecekler = filmKayitlari
          .filter((d) => ["izlenecek", "izlenecekler"].includes(d.durum))
          .map((d) => d.Icerikler);
        const okuduklarim = kitapKayitlari
          .filter((d) => d.durum === "okudum")
          .map((d) => d.Icerikler);
        const okunacaklar = kitapKayitlari
          .filter((d) => d.durum === "okunacak")
          .map((d) => d.Icerikler);

        setListeler({
          izlediklerim,
          izlenecekler,
          okuduklarim,
          okunacaklar,
        });
      }

      // 4) Özel listeler
      const { data: ozelListeData, error: ozelErr } = await supabase
        .from("OzelListeler")
        .select(`
          liste_id,
          liste_adi,
          aciklama,
          OzelListeIcerikleri (
            Icerikler (
              icerik_id,
              baslik,
              kapak_url,
              icerik_turu,
              yayin_yili
            )
          )
        `)
        .eq("kullanici_id", kullaniciId)
        .order("olusturulma_tarihi", { ascending: false });

      if (!ozelErr && ozelListeData) {
        setOzelListeler(
          ozelListeData.map((l) => ({
            liste_id: l.liste_id,
            liste_adi: l.liste_adi,
            aciklama: l.aciklama,
            icerikler: (l.OzelListeIcerikleri || [])
              .map((oli) => oli.Icerikler)
              .filter(Boolean),
          }))
        );
      }

      setYukleniyor(false);
    };

    veriGetir();
  }, [navigate]);

  // Yardımcı bileşenler (aynen bırakıyoruz)
  const IcerikKarti = ({ icerik }) => (
    <div
      onClick={() => navigate(`/icerik/${icerik.icerik_id}`)}
      style={{
        background: "#1F1F1F",
        borderRadius: "4px",
        overflow: "hidden",
        cursor: "pointer",
        transition: "all 0.2s ease",
        border: "1px solid #333",
        position: "relative",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = "#F5C518";
        e.currentTarget.style.transform = "scale(1.02)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "#333";
        e.currentTarget.style.transform = "scale(1)";
      }}
    >
      <div
        style={{
          width: "100%",
          paddingTop: "150%",
          position: "relative",
          background: "#333",
        }}
      >
        <img
          src={icerik.kapak_url}
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
            color: "white",
            margin: "0 0 5px 0",
            fontSize: "0.9rem",
            fontWeight: "bold",
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
            fontSize: "0.8rem",
            fontWeight: "500",
          }}
        >
          {icerik.yayin_yili}
        </span>
      </div>
    </div>
  );

  const ListeBasligi = ({ icon: Icon, renk, baslik, adet }) => (
    <div
      style={{
        background: "#1F1F1F",
        borderLeft: `4px solid ${renk}`,
        borderRadius: "4px",
        padding: "15px 20px",
        marginBottom: "20px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        boxShadow: "0 2px 5px rgba(0,0,0,0.2)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
        <Icon size={24} color={renk} />
        <div>
          <h3
            style={{
              color: "white",
              margin: 0,
              fontSize: "1.2rem",
              fontWeight: "bold",
            }}
          >
            {baslik}
          </h3>
        </div>
      </div>
      <div
        style={{
          background: "#333",
          padding: "4px 10px",
          borderRadius: "4px",
          color: "white",
          fontSize: "0.9rem",
          fontWeight: "bold",
        }}
      >
        {adet}
      </div>
    </div>
  );

  const OzelListeKarti = ({ liste }) => {
    const icerikler = liste.icerikler || [];

    return (
      <div
        onClick={() => navigate(`/ozel-liste/${liste.liste_id}`)}
        style={{
          background: "#1F1F1F",
          borderRadius: "6px",
          border: "1px solid #333",
          padding: "14px 16px",
          display: "flex",
          flexDirection: "column",
          gap: 6,
          cursor: "pointer",
        }}
      >
        <div
          style={{
            fontWeight: "bold",
            color: "white",
            fontSize: "0.95rem",
          }}
        >
          {liste.liste_adi}
        </div>

        {liste.aciklama && (
          <div
            style={{
              fontSize: "0.8rem",
              color: "#AAAAAA",
            }}
          >
            {liste.aciklama}
          </div>
        )}

        {icerikler.length > 0 && (
          <div
            style={{
              display: "flex",
              gap: 8,
              marginTop: 8,
            }}
          >
            {icerikler.slice(0, 3).map((icerik) => (
              <div
                key={icerik.icerik_id}
                style={{
                  width: 40,
                  height: 60,
                  borderRadius: 4,
                  overflow: "hidden",
                  background: "#333",
                  flexShrink: 0,
                }}
              >
                <img
                  src={
                    icerik.kapak_url ||
                    "https://via.placeholder.com/40x60?text=Kapak"
                  }
                  alt={icerik.baslik}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                  }}
                />
              </div>
            ))}
          </div>
        )}

        <div
          style={{
            fontSize: "0.8rem",
            color: "#F5C518",
            marginTop: 8,
          }}
        >
          {icerikler.length} içerik
        </div>
      </div>
    );
  };

  const aktifTur = aktifSekme === "kitap" ? "kitap" : "film";

  const filtrelenmisOzelListeler = ozelListeler
    .map((l) => ({
      ...l,
      icerikler: (l.icerikler || []).filter(
        (ic) => ic.icerik_turu === aktifTur
      ),
    }))
    .filter((l) => l.icerikler.length > 0);

  if (yukleniyor) {
    return (
      <div
        style={{
          background: "#121212",
          minHeight: "100vh",
          color: "white",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        Yükleniyor...
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#121212",
        padding: "40px 20px 80px",
        fontFamily: "'Roboto', sans-serif",
        color: "#FFFFFF",
      }}
    >
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        <h1
          style={{
            fontSize: "2rem",
            fontWeight: "bold",
            marginBottom: "10px",
          }}
        >
          Kütüphanem
        </h1>
        <p
          style={{
            color: "#AAAAAA",
            marginBottom: "30px",
            fontSize: "0.95rem",
          }}
        >
          İzlediklerin, okuyacakların ve özel listelerin burada.
        </p>

        {/* KATEGORİ SEKMELERİ */}
        <div
          style={{
            display: "flex",
            gap: "15px",
            marginBottom: "40px",
            borderBottom: "1px solid #333",
            paddingBottom: "15px",
          }}
        >
          {[
            { id: "film", icon: Film, label: "Filmlerim" },
            { id: "kitap", icon: BookOpen, label: "Kitaplarım" },
          ].map((k) => {
            const aktif = aktifSekme === k.id;
            return (
              <button
                key={k.id}
                onClick={() => setAktifSekme(k.id)}
                style={{
                  background: aktif ? "#F5C518" : "transparent",
                  color: aktif ? "black" : "#AAAAAA",
                  border: "none",
                  padding: "10px 20px",
                  borderRadius: "4px",
                  cursor: "pointer",
                  fontSize: "1rem",
                  fontWeight: "bold",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  transition: "all 0.2s ease",
                }}
              >
                <k.icon size={20} /> {k.label}
              </button>
            );
          })}
        </div>

        {/* LİSTELER GRID */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "30px",
          }}
        >
          {/* Sol kolon */}
          <div>
            <ListeBasligi
              icon={CheckCircle}
              renk="#10b981"
              baslik={
                aktifSekme === "kitap" ? "Okuduklarım" : "İzlediklerim"
              }
              adet={
                aktifSekme === "kitap"
                  ? listeler.okuduklarim.length
                  : listeler.izlediklerim.length
              }
            />

            {(aktifSekme === "kitap"
              ? listeler.okuduklarim
              : listeler.izlediklerim
            ).length > 0 ? (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "repeat(auto-fill, minmax(140px, 1fr))",
                  gap: "15px",
                }}
              >
                {(aktifSekme === "kitap"
                  ? listeler.okuduklarim
                  : listeler.izlediklerim
                ).map((i) => (
                  <IcerikKarti key={i.icerik_id} icerik={i} />
                ))}
              </div>
            ) : (
              <div
                style={{
                  textAlign: "center",
                  padding: "30px",
                  color: "#555",
                  border: "1px dashed #333",
                  borderRadius: "4px",
                }}
              >
                Henüz içerik yok.
              </div>
            )}
          </div>

          {/* Sağ kolon */}
          <div>
            <ListeBasligi
              icon={Clock}
              renk="#F5C518"
              baslik={
                aktifSekme === "kitap" ? "Okunacaklar" : "İzlenecekler"
              }
              adet={
                aktifSekme === "kitap"
                  ? listeler.okunacaklar.length
                  : listeler.izlenecekler.length
              }
            />

            {(aktifSekme === "kitap"
              ? listeler.okunacaklar
              : listeler.izlenecekler
            ).length > 0 ? (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "repeat(auto-fill, minmax(140px, 1fr))",
                  gap: "15px",
                }}
              >
                {(aktifSekme === "kitap"
                  ? listeler.okunacaklar
                  : listeler.izlenecekler
                ).map((i) => (
                  <IcerikKarti key={i.icerik_id} icerik={i} />
                ))}
              </div>
            ) : (
              <div
                style={{
                  textAlign: "center",
                  padding: "30px",
                  color: "#555",
                  border: "1px dashed #333",
                  borderRadius: "4px",
                }}
              >
                Henüz içerik yok.
              </div>
            )}
          </div>
        </div>

        {/* ÖZEL LİSTELER */}
        <div style={{ marginTop: "50px" }}>
          <h2
            style={{
              color: "white",
              fontSize: "1.4rem",
              marginBottom: "10px",
              fontWeight: "bold",
            }}
          >
            Özel Listeler
          </h2>

          {filtrelenmisOzelListeler.length === 0 ? (
            <div
              style={{
                borderRadius: "6px",
                border: "1px dashed #333",
                padding: "18px",
                color: "#777",
                fontSize: "0.9rem",
              }}
            >
              Henüz bu sekmeye uygun özel liste yok.
            </div>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(auto-fill, minmax(220px, 1fr))",
                gap: "16px",
                marginTop: "12px",
              }}
            >
              {filtrelenmisOzelListeler.map((liste) => (
                <OzelListeKarti key={liste.liste_id} liste={liste} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default KutuphanemSayfasi;

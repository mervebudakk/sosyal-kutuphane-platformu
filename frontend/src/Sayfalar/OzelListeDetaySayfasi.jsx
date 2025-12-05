import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../Servisler/supabaseServis";
import { ArrowLeft, Film, BookOpen } from "lucide-react";

const OzelListeDetaySayfasi = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [liste, setListe] = useState(null);
  const [yukleniyor, setYukleniyor] = useState(true);

  useEffect(() => {
    const getir = async () => {
      setYukleniyor(true);
      const { data, error } = await supabase
        .from("OzelListeler")
        .select(`
          liste_id,
          liste_adi,
          aciklama,
          Kullanicilar ( kullanici_adi ),
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
        .eq("liste_id", id)
        .single();

      if (error) {
        console.error(error);
        setYukleniyor(false);
        return;
      }

      const icerikler =
        (data.OzelListeIcerikleri || [])
          .map((x) => x.Icerikler)
          .filter(Boolean) || [];

      setListe({
        liste_id: data.liste_id,
        liste_adi: data.liste_adi,
        aciklama: data.aciklama,
        sahibi: data.Kullanicilar?.kullanici_adi || "",
        icerikler,
      });
      setYukleniyor(false);
    };

    getir();
  }, [id]);

  if (yukleniyor) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "#121212",
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

  if (!liste) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "#121212",
          color: "white",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        Liste bulunamadı.
      </div>
    );
  }

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
      <div style={{ padding: "10px" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            marginBottom: 4,
          }}
        >
          {icerik.icerik_turu === "film" ? (
            <Film size={16} color="#F5C518" />
          ) : (
            <BookOpen size={16} color="#F5C518" />
          )}
          <span
            style={{
              color: "white",
              fontSize: "0.9rem",
              fontWeight: "bold",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {icerik.baslik}
          </span>
        </div>
        <div
          style={{
            color: "#AAAAAA",
            fontSize: "0.8rem",
          }}
        >
          {icerik.yayin_yili}
        </div>
      </div>
    </div>
  );

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#121212",
        padding: "40px 20px 80px",
        color: "white",
        fontFamily: "'Roboto', sans-serif",
      }}
    >
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        {/* Geri butonu */}
        <button
          onClick={() => navigate(-1)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            background: "transparent",
            border: "none",
            color: "#AAAAAA",
            cursor: "pointer",
            marginBottom: "16px",
          }}
        >
          <ArrowLeft size={18} />
          Geri
        </button>

        {/* Başlık */}
        <div
          style={{
            marginBottom: "24px",
          }}
        >
          <h1
            style={{
              fontSize: "2rem",
              margin: 0,
              fontWeight: "bold",
            }}
          >
            {liste.liste_adi}
          </h1>
          {liste.aciklama && (
            <p
              style={{
                marginTop: "8px",
                color: "#CCCCCC",
              }}
            >
              {liste.aciklama}
            </p>
          )}
          {liste.sahibi && (
            <div
              style={{
                marginTop: "4px",
                fontSize: "0.9rem",
                color: "#888",
              }}
            >
              Liste sahibi: {liste.sahibi}
            </div>
          )}
        </div>

        {/* İçerikler grid */}
        {liste.icerikler.length === 0 ? (
          <div
            style={{
              borderRadius: "6px",
              border: "1px dashed #333",
              padding: "20px",
              color: "#777",
              fontSize: "0.9rem",
            }}
          >
            Bu listede henüz içerik yok.
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))",
              gap: "18px",
            }}
          >
            {liste.icerikler.map((icerik) => (
              <IcerikKarti key={icerik.icerik_id} icerik={icerik} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default OzelListeDetaySayfasi;

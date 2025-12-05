import React, { useEffect, useState } from "react";
import { UserPlus, UserCheck } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "../Servisler/supabaseServis";

const ProfilSayfasi = () => {
  const navigate = useNavigate();
  const { id: profilIdParam } = useParams(); // /kullanici/:id için

  const [kullanici, setKullanici] = useState(null);        // Görüntülenen profil
  const [aktifKullaniciId, setAktifKullaniciId] = useState(null); // Giriş yapan
  const [benimProfilimMi, setBenimProfilimMi] = useState(true);
  const [takipEdiliyor, setTakipEdiliyor] = useState(false);
  const [takipYukleniyor, setTakipYukleniyor] = useState(false);
  const [yukleniyor, setYukleniyor] = useState(true);

  useEffect(() => {
    const veriGetir = async () => {
      setYukleniyor(true);

      // 1) Auth user
      const { data: authData, error: authErr } = await supabase.auth.getUser();
      if (authErr || !authData?.user) {
        navigate("/");
        return;
      }

      // 2) Giriş yapan kullanıcının Kullanicilar kaydı
      const { data: dbCurrentUser, error: dbErr } = await supabase
        .from("Kullanicilar")
        .select("*")
        .eq("kullanici_id", authData.user.id)
        .single();

      if (dbErr || !dbCurrentUser) {
        navigate("/");
        return;
      }

      setAktifKullaniciId(dbCurrentUser.kullanici_id);

      // 3) Hangi profil görüntüleniyor?
      const hedefKullaniciId = profilIdParam || dbCurrentUser.kullanici_id;
      const kendiProfiliMi = hedefKullaniciId === dbCurrentUser.kullanici_id;
      setBenimProfilimMi(kendiProfiliMi);

      // 4) Profil sahibini getir
      const { data: profilUser, error: profilErr } = await supabase
        .from("Kullanicilar")
        .select("*")
        .eq("kullanici_id", hedefKullaniciId)
        .single();

      if (profilErr || !profilUser) {
        alert("Kullanıcı bulunamadı.");
        navigate("/");
        return;
      }

      setKullanici({
        ...profilUser,
        email: profilUser.eposta,
      });

      // 5) Takip durumu (başkasının profili ise)
      if (!kendiProfiliMi) {
        const { data: takipData, error: takipErr } = await supabase
          .from("TakipEtmeler")
          .select("takip_id")
          .eq("takip_eden_id", dbCurrentUser.kullanici_id)
          .eq("takip_edilen_id", hedefKullaniciId);

        if (!takipErr && takipData && takipData.length > 0) {
          setTakipEdiliyor(true);
        } else {
          setTakipEdiliyor(false);
        }
      } else {
        setTakipEdiliyor(false);
      }

      setYukleniyor(false);
    };

    veriGetir();
  }, [navigate, profilIdParam]);

  const handleTakipToggle = async () => {
    if (benimProfilimMi || !kullanici || !aktifKullaniciId) return;

    setTakipYukleniyor(true);
    try {
      if (takipEdiliyor) {
        await supabase
          .from("TakipEtmeler")
          .delete()
          .eq("takip_eden_id", aktifKullaniciId)
          .eq("takip_edilen_id", kullanici.kullanici_id);

        setTakipEdiliyor(false);
      } else {
        const { error } = await supabase.from("TakipEtmeler").insert([
          {
            takip_eden_id: aktifKullaniciId,
            takip_edilen_id: kullanici.kullanici_id,
          },
        ]);
        if (!error) setTakipEdiliyor(true);
      }
    } catch (e) {
      console.error(e);
      alert("Takip işlemi sırasında bir hata oluştu.");
    } finally {
      setTakipYukleniyor(false);
    }
  };

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

  if (!kullanici) {
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
        Kullanıcı bulunamadı.
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
        {/* PROFİL HEADER */}
        <div
          style={{
            background: "#1F1F1F",
            borderRadius: "8px",
            padding: "40px",
            marginBottom: "40px",
            border: "1px solid #333",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "30px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "30px" }}>
            <div
              style={{
                width: "100px",
                height: "100px",
                borderRadius: "50%",
                background: "#F5C518",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "3rem",
                color: "black",
                fontWeight: "bold",
                flexShrink: 0,
              }}
            >
              {kullanici?.kullanici_adi?.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1
                style={{
                  color: "white",
                  fontSize: "2.5rem",
                  fontWeight: "bold",
                  margin: "0 0 5px 0",
                }}
              >
                {kullanici?.kullanici_adi}
              </h1>
              <p
                style={{
                  color: "#AAAAAA",
                  fontSize: "1rem",
                  margin: "0 0 15px 0",
                }}
              >
                {kullanici?.email}
              </p>
              <p
                style={{
                  color: "#DDDDDD",
                  fontSize: "1rem",
                  fontStyle: "italic",
                }}
              >
                {kullanici?.biyografi || "Henüz biyografi eklenmemiş."}
              </p>
            </div>
          </div>

          <div>
            {benimProfilimMi ? (
              <button
                onClick={() =>
                  alert("Profili düzenleme özelliği daha sonra eklenecek.")
                }
                style={{
                  background: "#F5C518",
                  color: "#000",
                  border: "none",
                  padding: "10px 20px",
                  borderRadius: "4px",
                  cursor: "pointer",
                  fontWeight: "bold",
                  fontSize: "0.95rem",
                }}
              >
                Profili Düzenle
              </button>
            ) : (
              <button
                onClick={handleTakipToggle}
                disabled={takipYukleniyor}
                style={{
                  background: takipEdiliyor ? "transparent" : "#F5C518",
                  color: takipEdiliyor ? "#F5C518" : "#000",
                  border: `1px solid #F5C518`,
                  padding: "10px 20px",
                  borderRadius: "4px",
                  cursor: "pointer",
                  fontWeight: "bold",
                  fontSize: "0.95rem",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  opacity: takipYukleniyor ? 0.7 : 1,
                }}
              >
                {takipYukleniyor ? (
                  "İşleniyor..."
                ) : takipEdiliyor ? (
                  <>
                    <UserCheck size={18} /> Takipten Çık
                  </>
                ) : (
                  <>
                    <UserPlus size={18} /> Takip Et
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* İleride: Son aktiviteler, istatistikler vs. buraya eklenebilir */}
      </div>
    </div>
  );
};

export default ProfilSayfasi;

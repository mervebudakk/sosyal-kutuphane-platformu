import React, { useEffect, useState } from "react";
import { UserPlus, UserCheck, X } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "../Servisler/supabaseServis";

const formatRelativeTime = (tarihStr) => {
  if (!tarihStr) return "";
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

const aktiviteAciklama = (aktiviteTuru) => {
  switch (aktiviteTuru) {
    case "yorum":
      return "yorum yaptı";
    case "puanlama":
      return "puan verdi";
    case "durum":
      return "durum güncelledi";
    case "liste":
    case "ozel_liste":
      return "listeye ekledi";
    default:
      return "aktivite yaptı";
  }
};

const ProfilSayfasi = () => {
  const navigate = useNavigate();
  const { id: profilIdParam } = useParams(); 

  const [kullanici, setKullanici] = useState(null); 
  const [aktifKullaniciId, setAktifKullaniciId] = useState(null); 
  const [benimProfilimMi, setBenimProfilimMi] = useState(true);
  const [takipEdiliyor, setTakipEdiliyor] = useState(false);
  const [takipYukleniyor, setTakipYukleniyor] = useState(false);
  const [yukleniyor, setYukleniyor] = useState(true);

  const [takipciSayisi, setTakipciSayisi] = useState(0);
  const [takipEdilenSayisi, setTakipEdilenSayisi] = useState(0);

  const [listeModalAcik, setListeModalAcik] = useState(false);
  const [listeModalTip, setListeModalTip] = useState(null); 
  const [listeModalYukleniyor, setListeModalYukleniyor] = useState(false);
  const [listeModalKullanicilar, setListeModalKullanicilar] = useState([]);


  const [aktifAltSekme, setAktifAltSekme] = useState(null); 

  const [yorumlarim, setYorumlarim] = useState([]);
  const [yorumlarYukleniyor, setYorumlarYukleniyor] = useState(false);

  const [begenilerim, setBegenilerim] = useState([]);
  const [begenilerYukleniyor, setBegenilerYukleniyor] = useState(false);

  const [puanlarim, setPuanlarim] = useState([]);
  const [puanlarYukleniyor, setPuanlarYukleniyor] = useState(false);


  const [sonAktiviteler, setSonAktiviteler] = useState([]);
  const [sonAktivitelerYukleniyor, setSonAktivitelerYukleniyor] =
    useState(false);

  const [duzenlenenYorumId, setDuzenlenenYorumId] = useState(null);
  const [duzenlemeMetni, setDuzenlemeMetni] = useState("");
  const [duzenlemeYukleniyor, setDuzenlemeYukleniyor] = useState(false);

  const [puanDuzenlemeYukleniyorId, setPuanDuzenlemeYukleniyorId] =
    useState(null);

  const yorumlariGetir = async (hedefKullaniciId) => {
    setYorumlarYukleniyor(true);
    try {
      const { data, error } = await supabase
        .from("KullaniciYorumlari")
        .select(
          `
          yorum_id,
          yorum_metin,
          olusturulma_tarihi,
          Icerikler (
            icerik_id,
            baslik,
            kapak_url,
            icerik_turu,
            yayin_yili
          )
        `
        )
        .eq("kullanici_id", hedefKullaniciId)
        .order("olusturulma_tarihi", { ascending: false });

      if (error) throw error;
      setYorumlarim(data || []);
    } catch (e) {
      console.error(e);
      setYorumlarim([]);
    } finally {
      setYorumlarYukleniyor(false);
    }
  };

  const begenileriGetir = async (hedefKullaniciId) => {
    setBegenilerYukleniyor(true);
    try {
      const { data, error } = await supabase
        .from("AktiviteBegenileri")
        .select(
          `
          aktivite_id,
          Aktiviteler (
            aktivite_id,
            aktivite_turu,
            olusturulma_tarihi,
            Icerikler (
              icerik_id,
              baslik,
              kapak_url,
              icerik_turu,
              yayin_yili
            ),
            Kullanicilar (
              kullanici_id,
              kullanici_adi
            )
          )
        `
        )
        .eq("kullanici_id", hedefKullaniciId);

      if (error) throw error;
      setBegenilerim(data || []);
    } catch (e) {
      console.error(e);
      setBegenilerim([]);
    } finally {
      setBegenilerYukleniyor(false);
    }
  };

  const puanlariGetir = async (hedefKullaniciId) => {
    setPuanlarYukleniyor(true);
    try {
      const { data, error } = await supabase
        .from("KullaniciPuanlari")
        .select(
          `
          puan_degeri,
          olusturulma_tarihi,
          Icerikler (
            icerik_id,
            baslik,
            kapak_url,
            icerik_turu,
            yayin_yili
          )
        `
        )
        .eq("kullanici_id", hedefKullaniciId)
        .order("olusturulma_tarihi", { ascending: false });

      if (error) throw error;
      setPuanlarim(data || []);
    } catch (e) {
      console.error(e);
      setPuanlarim([]);
    } finally {
      setPuanlarYukleniyor(false);
    }
  };

  const sonAktiviteleriGetir = async (hedefKullaniciId) => {
    setSonAktivitelerYukleniyor(true);
    try {
      const { data, error } = await supabase
        .from("Aktiviteler")
        .select(
          `
          aktivite_id,
          kullanici_id,
          icerik_id,
          aktivite_turu,
          olusturulma_tarihi,
          Kullanicilar ( kullanici_id, kullanici_adi ),
          Icerikler ( icerik_id, baslik, kapak_url, icerik_turu, yayin_yili )
        `
        )
        .eq("kullanici_id", hedefKullaniciId)
        .order("olusturulma_tarihi", { ascending: false })
        .limit(10);

      if (error) throw error;
      setSonAktiviteler(data || []);
    } catch (e) {
      console.error(e);
      setSonAktiviteler([]);
    } finally {
      setSonAktivitelerYukleniyor(false);
    }
  };

  useEffect(() => {
    const veriGetir = async () => {
      setYukleniyor(true);

      const { data: authData, error: authErr } = await supabase.auth.getUser();
      if (authErr || !authData?.user) {
        navigate("/");
        return;
      }

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

      const hedefKullaniciId = profilIdParam || dbCurrentUser.kullanici_id;
      const kendiProfiliMi = hedefKullaniciId === dbCurrentUser.kullanici_id;
      setBenimProfilimMi(kendiProfiliMi);

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

      const { data: takipciler, error: takipciErr } = await supabase
        .from("TakipEtmeler")
        .select("takip_eden_id, takip_edilen_id")
        .eq("takip_edilen_id", hedefKullaniciId);

      if (!takipciErr && takipciler) {
        setTakipciSayisi(takipciler.length);
      } else {
        setTakipciSayisi(0);
      }

      const { data: takipEdilenler, error: takipEdilenErr } = await supabase
        .from("TakipEtmeler")
        .select("takip_eden_id, takip_edilen_id")
        .eq("takip_eden_id", hedefKullaniciId);

      if (!takipEdilenErr && takipEdilenler) {
        setTakipEdilenSayisi(takipEdilenler.length);
      } else {
        setTakipEdilenSayisi(0);
      }

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

      await yorumlariGetir(hedefKullaniciId);
      if (kendiProfiliMi) {
        await begenileriGetir(hedefKullaniciId);
        await puanlariGetir(hedefKullaniciId);
      }

      await sonAktiviteleriGetir(hedefKullaniciId);

      setYukleniyor(false);
    };

    veriGetir();
  }, [navigate, profilIdParam]);

  const takipListesiniAc = async (tip) => {
    if (!kullanici) return;

    setListeModalTip(tip);
    setListeModalAcik(true);
    setListeModalYukleniyor(true);
    setListeModalKullanicilar([]);

    try {
      const hedefId = kullanici.kullanici_id;

      let takipSorgu;
      if (tip === "takipci") {
        takipSorgu = await supabase
          .from("TakipEtmeler")
          .select("takip_eden_id")
          .eq("takip_edilen_id", hedefId);
      } else {

        takipSorgu = await supabase
          .from("TakipEtmeler")
          .select("takip_edilen_id")
          .eq("takip_eden_id", hedefId);
      }

      if (takipSorgu.error) throw takipSorgu.error;

      const rows = takipSorgu.data || [];
      const ids =
        tip === "takipci"
          ? rows.map((r) => r.takip_eden_id)
          : rows.map((r) => r.takip_edilen_id);

      if (ids.length === 0) {
        setListeModalKullanicilar([]);
        setListeModalYukleniyor(false);
        return;
      }

      const { data: userRows, error: userErr } = await supabase
        .from("Kullanicilar")
        .select("kullanici_id, kullanici_adi, eposta")
        .in("kullanici_id", ids);

      if (userErr) throw userErr;

      setListeModalKullanicilar(userRows || []);
    } catch (e) {
      console.error(e);
      alert("Takip listesi yüklenirken bir hata oluştu.");
    } finally {
      setListeModalYukleniyor(false);
    }
  };

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
        setTakipciSayisi((onceki) => Math.max(0, onceki - 1));
      } else {
        const { error } = await supabase.from("TakipEtmeler").insert([
          {
            takip_eden_id: aktifKullaniciId,
            takip_edilen_id: kullanici.kullanici_id,
          },
        ]);
        if (!error) {
          setTakipEdiliyor(true);
          setTakipciSayisi((onceki) => onceki + 1);
        }
      }
    } catch (e) {
      console.error(e);
      alert("Takip işlemi sırasında bir hata oluştu.");
    } finally {
      setTakipYukleniyor(false);
    }
  };

  const yorumGuncelle = async (yorumId, yeniMetin) => {
    if (!aktifKullaniciId || !benimProfilimMi) return;
    if (!yeniMetin.trim()) return;

    setDuzenlemeYukleniyor(true);
    try {
      const { error } = await supabase
        .from("KullaniciYorumlari")
        .update({ yorum_metin: yeniMetin.trim() })
        .eq("yorum_id", yorumId)
        .eq("kullanici_id", aktifKullaniciId);

      if (error) throw error;

      setYorumlarim((prev) =>
        prev.map((y) =>
          y.yorum_id === yorumId
            ? { ...y, yorum_metin: yeniMetin.trim() }
            : y
        )
      );
      setDuzenlenenYorumId(null);
      setDuzenlemeMetni("");
    } catch (e) {
      console.error(e);
      alert("Yorum güncellenirken bir hata oluştu.");
    } finally {
      setDuzenlemeYukleniyor(false);
    }
  };

  const yorumSil = async (yorumId) => {
    if (!aktifKullaniciId || !benimProfilimMi) return;

    const onay = window.confirm("Yorumu silmek istediğine emin misin?");
    if (!onay) return;

    try {
      const { error } = await supabase
        .from("KullaniciYorumlari")
        .delete()
        .eq("yorum_id", yorumId)
        .eq("kullanici_id", aktifKullaniciId);

      if (error) throw error;

      setYorumlarim((prev) => prev.filter((y) => y.yorum_id !== yorumId));
    } catch (e) {
      console.error(e);
      alert("Yorum silinirken bir hata oluştu.");
    }
  };

  const begeniyiKaldir = async (aktiviteId) => {
    if (!aktifKullaniciId || !benimProfilimMi) return;

    try {
      const { error } = await supabase
        .from("AktiviteBegenileri")
        .delete()
        .eq("aktivite_id", aktiviteId)
        .eq("kullanici_id", aktifKullaniciId);

      if (error) throw error;

      setBegenilerim((prev) =>
        prev.filter((b) => b.aktivite_id !== aktiviteId)
      );
    } catch (e) {
      console.error(e);
      alert("Beğeni kaldırılırken bir hata oluştu.");
    }
  };

  const puanGuncelle = async (icerikId, yeniPuanStr) => {
    if (!aktifKullaniciId || !benimProfilimMi) return;
    const yeniPuan = Number(yeniPuanStr);
    if (!yeniPuan || yeniPuan < 1 || yeniPuan > 10) return;

    setPuanDuzenlemeYukleniyorId(icerikId);
    try {
      const { error } = await supabase
        .from("KullaniciPuanlari")
        .update({ puan_degeri: yeniPuan })
        .eq("kullanici_id", aktifKullaniciId)
        .eq("icerik_id", icerikId);

      if (error) throw error;

      setPuanlarim((prev) =>
        prev.map((p) =>
          p.Icerikler?.icerik_id === icerikId
            ? { ...p, puan_degeri: yeniPuan }
            : p
        )
      );
    } catch (e) {
      console.error(e);
      alert("Puan güncellenirken bir hata oluştu.");
    } finally {
      setPuanDuzenlemeYukleniyorId(null);
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
            marginBottom: "30px",
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

              {/* Biyografi: boşsa hiç göstermiyoruz */}
              {kullanici?.biyografi && (
                <p
                  style={{
                    color: "#DDDDDD",
                    fontSize: "1rem",
                    fontStyle: "italic",
                    marginBottom: "12px",
                  }}
                >
                  {kullanici.biyografi}
                </p>
              )}

              {/* Takipçi / Takip edilen satırı */}
              <div
                style={{
                  display: "flex",
                  gap: "20px",
                  marginTop: "4px",
                  fontSize: "0.95rem",
                }}
              >
                <div
                  onClick={() => takipListesiniAc("takipci")}
                  style={{
                    cursor: "pointer",
                  }}
                >
                  <span
                    style={{
                      fontWeight: "bold",
                      color: "#FFFFFF",
                    }}
                  >
                    {takipciSayisi}
                  </span>{" "}
                  <span style={{ color: "#AAAAAA" }}>Takipçi</span>
                </div>
                <div
                  onClick={() => takipListesiniAc("takipEdilen")}
                  style={{
                    cursor: "pointer",
                  }}
                >
                  <span
                    style={{
                      fontWeight: "bold",
                      color: "#FFFFFF",
                    }}
                  >
                    {takipEdilenSayisi}
                  </span>{" "}
                  <span style={{ color: "#AAAAAA" }}>Takip Edilen</span>
                </div>
              </div>
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

        {/* Alt sekmeler: Yorumlarım / Beğenilerim / Puanlarım (sadece kendi profilinde) */}
        {benimProfilimMi && (
          <div
            style={{
              display: "flex",
              gap: "12px",
              marginBottom: "20px",
              borderBottom: "1px solid #333",
              paddingBottom: "8px",
            }}
          >
            <button
              onClick={() =>
                setAktifAltSekme(
                  aktifAltSekme === "yorumlar" ? null : "yorumlar"
                )
              }
              style={{
                padding: "8px 16px",
                borderRadius: "999px",
                border: "none",
                cursor: "pointer",
                fontSize: "0.95rem",
                fontWeight: "bold",
                background:
                  aktifAltSekme === "yorumlar" ? "#F5C518" : "transparent",
                color: aktifAltSekme === "yorumlar" ? "#000" : "#AAAAAA",
              }}
            >
              Yorumlarım
            </button>
            <button
              onClick={() =>
                setAktifAltSekme(
                  aktifAltSekme === "begeniler" ? null : "begeniler"
                )
              }
              style={{
                padding: "8px 16px",
                borderRadius: "999px",
                border: "none",
                cursor: "pointer",
                fontSize: "0.95rem",
                fontWeight: "bold",
                background:
                  aktifAltSekme === "begeniler" ? "#F5C518" : "transparent",
                color: aktifAltSekme === "begeniler" ? "#000" : "#AAAAAA",
              }}
            >
              Beğenilerim
            </button>
            <button
              onClick={() =>
                setAktifAltSekme(
                  aktifAltSekme === "puanlar" ? null : "puanlar"
                )
              }
              style={{
                padding: "8px 16px",
                borderRadius: "999px",
                border: "none",
                cursor: "pointer",
                fontSize: "0.95rem",
                fontWeight: "bold",
                background:
                  aktifAltSekme === "puanlar" ? "#F5C518" : "transparent",
                color: aktifAltSekme === "puanlar" ? "#000" : "#AAAAAA",
              }}
            >
              Puanlarım
            </button>
          </div>
        )}

        {/* Yorumlarım sekmesi */}
        {aktifAltSekme === "yorumlar" && (
          <div
            style={{
              background: "#1F1F1F",
              borderRadius: "8px",
              border: "1px solid #333",
              padding: "18px 20px",
            }}
          >
            <h3
              style={{
                marginTop: 0,
                marginBottom: "12px",
                color: "white",
                fontSize: "1.1rem",
              }}
            >
              {benimProfilimMi ? "Yorumlarım" : "Kullanıcının Yorumları"}
            </h3>

            {yorumlarYukleniyor ? (
              <div style={{ color: "#AAAAAA" }}>Yorumlar yükleniyor...</div>
            ) : yorumlarim.length === 0 ? (
              <div style={{ color: "#777", fontSize: "0.9rem" }}>
                Henüz yorum yok.
              </div>
            ) : (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 10,
                }}
              >
                {yorumlarim.map((y) => {
                  const icerik = y.Icerikler;
                  const filmMi = icerik?.icerik_turu === "film";

                  const duzenlemeAktif = duzenlenenYorumId === y.yorum_id;

                  return (
                    <div
                      key={y.yorum_id}
                      style={{
                        display: "flex",
                        gap: 12,
                        background: "#151515",
                        borderRadius: "6px",
                        padding: "10px 12px",
                        border: "1px solid #333",
                      }}
                    >
                      {/* Kapak */}
                      <div
                        style={{
                          width: 60,
                          height: 90,
                          borderRadius: 4,
                          overflow: "hidden",
                          background: "#333",
                          flexShrink: 0,
                          cursor: "pointer",
                        }}
                        onClick={() =>
                          icerik && navigate(`/icerik/${icerik.icerik_id}`)
                        }
                      >
                        {icerik?.kapak_url && (
                          <img
                            src={icerik.kapak_url}
                            alt={icerik.baslik}
                            style={{
                              width: "100%",
                              height: "100%",
                              objectFit: "cover",
                            }}
                          />
                        )}
                      </div>

                      {/* Sağ taraf */}
                      <div
                        style={{
                          flex: 1,
                          display: "flex",
                          flexDirection: "column",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            marginBottom: 4,
                          }}
                        >
                          <div>
                            <div
                              style={{
                                color: "white",
                                fontSize: "0.95rem",
                                fontWeight: "bold",
                                cursor: "pointer",
                              }}
                              onClick={() =>
                                icerik &&
                                navigate(`/icerik/${icerik.icerik_id}`)
                              }
                            >
                              {icerik?.baslik || "İçerik"}
                            </div>
                            <div
                              style={{
                                color: "#AAAAAA",
                                fontSize: "0.8rem",
                              }}
                            >
                              {filmMi ? "Film" : "Kitap"}{" "}
                              {icerik?.yayin_yili && `• ${icerik.yayin_yili}`}
                            </div>
                          </div>
                          <div
                            style={{
                              color: "#777",
                              fontSize: "0.75rem",
                            }}
                          >
                            {formatRelativeTime(y.olusturulma_tarihi)}
                          </div>
                        </div>

                        {/* Yorum metni veya düzenleme alanı */}
                        {duzenlemeAktif && benimProfilimMi ? (
                          <>
                            <textarea
                              value={duzenlemeMetni}
                              onChange={(e) =>
                                setDuzenlemeMetni(e.target.value)
                              }
                              style={{
                                width: "100%",
                                minHeight: 60,
                                background: "#000",
                                borderRadius: 4,
                                border: "1px solid #444",
                                color: "white",
                                fontSize: "0.85rem",
                                padding: "6px 8px",
                                resize: "vertical",
                              }}
                            />
                            <div
                              style={{
                                display: "flex",
                                gap: 8,
                                marginTop: 6,
                              }}
                            >
                              <button
                                onClick={() =>
                                  yorumGuncelle(y.yorum_id, duzenlemeMetni)
                                }
                                disabled={duzenlemeYukleniyor}
                                style={{
                                  padding: "4px 10px",
                                  borderRadius: "999px",
                                  border: "none",
                                  background: "#F5C518",
                                  color: "#000",
                                  fontSize: "0.8rem",
                                  fontWeight: "bold",
                                  cursor: "pointer",
                                }}
                              >
                                {duzenlemeYukleniyor
                                  ? "Kaydediliyor..."
                                  : "Kaydet"}
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
                                  fontSize: "0.8rem",
                                  cursor: "pointer",
                                }}
                              >
                                Vazgeç
                              </button>
                            </div>
                          </>
                        ) : (
                          <div
                            style={{
                              color: "#DDDDDD",
                              fontSize: "0.9rem",
                              marginTop: 4,
                              whiteSpace: "pre-wrap",
                            }}
                          >
                            {y.yorum_metin}
                          </div>
                        )}

                        {/* Düzenle / Sil butonları */}
                        {benimProfilimMi && !duzenlemeAktif && (
                          <div
                            style={{
                              marginTop: 6,
                              display: "flex",
                              gap: 12,
                              fontSize: "0.8rem",
                            }}
                          >
                            <button
                              onClick={() => {
                                setDuzenlenenYorumId(y.yorum_id);
                                setDuzenlemeMetni(y.yorum_metin || "");
                              }}
                              style={{
                                border: "none",
                                background: "transparent",
                                color: "#F5C518",
                                cursor: "pointer",
                              }}
                            >
                              Düzenle
                            </button>
                            <button
                              onClick={() => yorumSil(y.yorum_id)}
                              style={{
                                border: "none",
                                background: "transparent",
                                color: "#f87171",
                                cursor: "pointer",
                              }}
                            >
                              Sil
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Beğenilerim sekmesi (sadece kendi profilinde) */}
        {benimProfilimMi && aktifAltSekme === "begeniler" && (
          <div
            style={{
              marginTop: "16px",
              background: "#1F1F1F",
              borderRadius: "8px",
              border: "1px solid #333",
              padding: "18px 20px",
            }}
          >
            <h3
              style={{
                marginTop: 0,
                marginBottom: "12px",
                color: "white",
                fontSize: "1.1rem",
              }}
            >
              Beğendiğim Aktiviteler
            </h3>

            {begenilerYukleniyor ? (
              <div style={{ color: "#AAAAAA" }}>Beğeniler yükleniyor...</div>
            ) : begenilerim.length === 0 ? (
              <div style={{ color: "#777", fontSize: "0.9rem" }}>
                Henüz beğendiğin bir aktivite yok.
              </div>
            ) : (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 10,
                }}
              >
                {begenilerim.map((b) => {
                  const akt = b.Aktiviteler;
                  const icerik = akt?.Icerikler;
                  const sahibi = akt?.Kullanicilar;

                  return (
                    <div
                      key={b.aktivite_id}
                      style={{
                        display: "flex",
                        gap: 12,
                        background: "#151515",
                        borderRadius: "6px",
                        padding: "10px 12px",
                        border: "1px solid #333",
                      }}
                    >
                      <div
                        style={{
                          width: 60,
                          height: 90,
                          borderRadius: 4,
                          overflow: "hidden",
                          background: "#333",
                          flexShrink: 0,
                          cursor: "pointer",
                        }}
                        onClick={() =>
                          icerik && navigate(`/icerik/${icerik.icerik_id}`)
                        }
                      >
                        {icerik?.kapak_url && (
                          <img
                            src={icerik.kapak_url}
                            alt={icerik.baslik}
                            style={{
                              width: "100%",
                              height: "100%",
                              objectFit: "cover",
                            }}
                          />
                        )}
                      </div>

                      <div
                        style={{
                          flex: 1,
                          display: "flex",
                          flexDirection: "column",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            marginBottom: 4,
                          }}
                        >
                          <div>
                            <div
                              style={{
                                color: "white",
                                fontSize: "0.95rem",
                                fontWeight: "bold",
                                cursor: "pointer",
                              }}
                              onClick={() =>
                                icerik &&
                                navigate(`/icerik/${icerik.icerik_id}`)
                              }
                            >
                              {icerik?.baslik || "İçerik"}
                            </div>
                            <div
                              style={{
                                color: "#AAAAAA",
                                fontSize: "0.8rem",
                              }}
                            >
                              {sahibi?.kullanici_adi || "Kullanıcı"} •{" "}
                              {akt?.aktivite_turu === "yorum"
                                ? "yorum yaptı"
                                : akt?.aktivite_turu === "puanlama"
                                ? "puan verdi"
                                : "aktivite"}
                            </div>
                          </div>
                          <div
                            style={{
                              color: "#777",
                              fontSize: "0.75rem",
                            }}
                          >
                            {formatRelativeTime(akt?.olusturulma_tarihi)}
                          </div>
                        </div>

                        <div
                          style={{
                            marginTop: "auto",
                            display: "flex",
                            justifyContent: "flex-end",
                          }}
                        >
                          <button
                            onClick={() => begeniyiKaldir(akt.aktivite_id)}
                            style={{
                              padding: "4px 10px",
                              borderRadius: "999px",
                              border: "1px solid #f87171",
                              background: "transparent",
                              color: "#f87171",
                              fontSize: "0.8rem",
                              cursor: "pointer",
                            }}
                          >
                            Beğeniyi Kaldır
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Puanlarım sekmesi (sadece kendi profilinde) */}
        {benimProfilimMi && aktifAltSekme === "puanlar" && (
          <div
            style={{
              marginTop: "16px",
              background: "#1F1F1F",
              borderRadius: "8px",
              border: "1px solid #333",
              padding: "18px 20px",
            }}
          >
            <h3
              style={{
                marginTop: 0,
                marginBottom: "12px",
                color: "white",
                fontSize: "1.1rem",
              }}
            >
              Verdiğim Puanlar
            </h3>

            {puanlarYukleniyor ? (
              <div style={{ color: "#AAAAAA" }}>Puanlar yükleniyor...</div>
            ) : puanlarim.length === 0 ? (
              <div style={{ color: "#777", fontSize: "0.9rem" }}>
                Henüz puan verdiğin bir içerik yok.
              </div>
            ) : (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 10,
                }}
              >
                {puanlarim.map((p, index) => {
                  const icerik = p.Icerikler;
                  const filmMi = icerik?.icerik_turu === "film";
                  const icerikId = icerik?.icerik_id;

                  return (
                    <div
                      key={index}
                      style={{
                        display: "flex",
                        gap: 12,
                        background: "#151515",
                        borderRadius: "6px",
                        padding: "10px 12px",
                        border: "1px solid #333",
                      }}
                    >
                      {/* Kapak */}
                      <div
                        style={{
                          width: 60,
                          height: 90,
                          borderRadius: 4,
                          overflow: "hidden",
                          background: "#333",
                          flexShrink: 0,
                          cursor: "pointer",
                        }}
                        onClick={() =>
                          icerik && navigate(`/icerik/${icerik.icerik_id}`)
                        }
                      >
                        {icerik?.kapak_url && (
                          <img
                            src={icerik.kapak_url}
                            alt={icerik.baslik}
                            style={{
                              width: "100%",
                              height: "100%",
                              objectFit: "cover",
                            }}
                          />
                        )}
                      </div>

                      {/* Sağ taraf */}
                      <div
                        style={{
                          flex: 1,
                          display: "flex",
                          flexDirection: "column",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            marginBottom: 4,
                          }}
                        >
                          <div>
                            <div
                              style={{
                                color: "white",
                                fontSize: "0.95rem",
                                fontWeight: "bold",
                                cursor: "pointer",
                              }}
                              onClick={() =>
                                icerik &&
                                navigate(`/icerik/${icerik.icerik_id}`)
                              }
                            >
                              {icerik?.baslik || "İçerik"}
                            </div>
                            <div
                              style={{
                                color: "#AAAAAA",
                                fontSize: "0.8rem",
                              }}
                            >
                              {filmMi ? "Film" : "Kitap"}{" "}
                              {icerik?.yayin_yili && `• ${icerik.yayin_yili}`}
                            </div>
                          </div>
                          <div
                            style={{
                              color: "#777",
                              fontSize: "0.75rem",
                            }}
                          >
                            {formatRelativeTime(p.olusturulma_tarihi)}
                          </div>
                        </div>

                        {/* Puan ve dropdown */}
                        <div
                          style={{
                            marginTop: 6,
                            display: "flex",
                            alignItems: "center",
                            gap: 10,
                            flexWrap: "wrap",
                          }}
                        >
                          <div
                            style={{
                              color: "#F5C518",
                              fontSize: "0.95rem",
                              fontWeight: "bold",
                            }}
                          >
                          </div>

                          {icerikId && (
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 6,
                              }}
                            >
                              <select
                                value={p.puan_degeri}
                                disabled={
                                  puanDuzenlemeYukleniyorId === icerikId
                                }
                                onChange={(e) =>
                                  puanGuncelle(icerikId, e.target.value)
                                }
                                style={{
                                  padding: "4px 8px",
                                  borderRadius: 4,
                                  border: "1px solid #555",
                                  background: "#000",
                                  color: "white",
                                  fontSize: "0.85rem",
                                }}
                              >
                                {[...Array(10)].map((_, i) => {
                                  const v = i + 1;
                                  return (
                                    <option key={v} value={v}>
                                      {v} / 10
                                    </option>
                                  );
                                })}
                              </select>
                              {puanDuzenlemeYukleniyorId === icerikId && (
                                <span
                                  style={{
                                    fontSize: "0.8rem",
                                    color: "#AAAAAA",
                                  }}
                                >
                                  Kaydediliyor...
                                </span>
                              )}
                            </div>
                          )}
                        </div>

                        <div
                          style={{
                            marginTop: "auto",
                            display: "flex",
                            justifyContent: "flex-end",
                          }}
                        >
                          <button
                            onClick={() =>
                              icerik && navigate(`/icerik/${icerik.icerik_id}`)
                            }
                            style={{
                              padding: "4px 10px",
                              borderRadius: "999px",
                              border: "1px solid #F5C518",
                              background: "transparent",
                              color: "#F5C518",
                              fontSize: "0.8rem",
                              cursor: "pointer",
                            }}
                          >
                            Detay Sayfasına Git
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Son Aktiviteler (başkasında her zaman, kendi profilinde sadece sekme seçili DEĞİLSE) */}
        {(!benimProfilimMi || !aktifAltSekme) && (
          <div
            style={{
              marginTop: "24px",
              background: "#1F1F1F",
              borderRadius: "8px",
              border: "1px solid #333",
              padding: "18px 20px",
            }}
          >
            <h3
              style={{
                marginTop: 0,
                marginBottom: "12px",
                color: "white",
                fontSize: "1.1rem",
              }}
            >
              Son Aktiviteler
            </h3>

            {sonAktivitelerYukleniyor ? (
              <div style={{ color: "#AAAAAA" }}>Aktiviteler yükleniyor...</div>
            ) : sonAktiviteler.length === 0 ? (
              <div style={{ color: "#777", fontSize: "0.9rem" }}>
                Henüz aktivite yok.
              </div>
            ) : (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 10,
                }}
              >
                {sonAktiviteler.map((akt) => {
                  const icerik = akt.Icerikler;
                  const filmMi = icerik?.icerik_turu === "film";

                  return (
                    <div
                      key={akt.aktivite_id}
                      style={{
                        display: "flex",
                        gap: 12,
                        background: "#151515",
                        borderRadius: "6px",
                        padding: "10px 12px",
                        border: "1px solid #333",
                      }}
                    >
                      {/* Kapak */}
                      <div
                        style={{
                          width: 60,
                          height: 90,
                          borderRadius: 4,
                          overflow: "hidden",
                          background: "#333",
                          flexShrink: 0,
                          cursor: "pointer",
                        }}
                        onClick={() =>
                          icerik && navigate(`/icerik/${icerik.icerik_id}`)
                        }
                      >
                        {icerik?.kapak_url && (
                          <img
                            src={icerik.kapak_url}
                            alt={icerik.baslik}
                            style={{
                              width: "100%",
                              height: "100%",
                              objectFit: "cover",
                            }}
                          />
                        )}
                      </div>

                      {/* Sağ taraf */}
                      <div
                        style={{
                          flex: 1,
                          display: "flex",
                          flexDirection: "column",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            marginBottom: 4,
                          }}
                        >
                          <div>
                            <div
                              style={{
                                color: "white",
                                fontSize: "0.95rem",
                                fontWeight: "bold",
                                cursor: "pointer",
                              }}
                              onClick={() =>
                                icerik &&
                                navigate(`/icerik/${icerik.icerik_id}`)
                              }
                            >
                              {icerik?.baslik || "İçerik"}
                            </div>
                            <div
                              style={{
                                color: "#AAAAAA",
                                fontSize: "0.8rem",
                              }}
                            >
                              {filmMi ? "Film" : "Kitap"}{" "}
                              {icerik?.yayin_yili && `• ${icerik.yayin_yili}`} •{" "}
                              {aktiviteAciklama(akt.aktivite_turu)}
                            </div>
                          </div>
                          <div
                            style={{
                              color: "#777",
                              fontSize: "0.75rem",
                            }}
                          >
                            {formatRelativeTime(akt.olusturulma_tarihi)}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Takipçi / Takip edilen MODALI */}
      {listeModalAcik && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 50,
          }}
          onClick={() => setListeModalAcik(false)}
        >
          <div
            style={{
              width: "100%",
              maxWidth: "420px",
              maxHeight: "70vh",
              background: "#1F1F1F",
              borderRadius: "8px",
              border: "1px solid #333",
              padding: "18px 18px 14px",
              display: "flex",
              flexDirection: "column",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal header */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "10px",
              }}
            >
              <h3
                style={{
                  margin: 0,
                  color: "white",
                  fontSize: "1.05rem",
                  fontWeight: "bold",
                }}
              >
                {listeModalTip === "takipci"
                  ? "Takipçiler"
                  : "Takip Edilenler"}
              </h3>
              <button
                onClick={() => setListeModalAcik(false)}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "#AAAAAA",
                  cursor: "pointer",
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* İçerik */}
            {listeModalYukleniyor ? (
              <div style={{ color: "#AAAAAA", padding: "10px 0" }}>
                Liste yükleniyor...
              </div>
            ) : listeModalKullanicilar.length === 0 ? (
              <div
                style={{
                  color: "#777",
                  fontSize: "0.9rem",
                  padding: "12px 0",
                }}
              >
                {listeModalTip === "takipci"
                  ? "Henüz takipçi yok."
                  : "Henüz kimseyi takip etmiyor."}
              </div>
            ) : (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                  overflowY: "auto",
                  paddingRight: 4,
                }}
              >
                {listeModalKullanicilar.map((u) => (
                  <button
                    key={u.kullanici_id}
                    onClick={() => {
                      setListeModalAcik(false);
                      navigate(`/kullanici/${u.kullanici_id}`);
                    }}
                    style={{
                      width: "100%",
                      textAlign: "left",
                      background: "#151515",
                      borderRadius: "6px",
                      border: "1px solid #333",
                      padding: "8px 10px",
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      cursor: "pointer",
                    }}
                  >
                    <div
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: "50%",
                        background: "#333",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#F5C518",
                        fontWeight: "bold",
                        fontSize: "0.9rem",
                        flexShrink: 0,
                      }}
                    >
                      {u.kullanici_adi
                        ? u.kullanici_adi.charAt(0).toUpperCase()
                        : "U"}
                    </div>
                    <div style={{ display: "flex", flexDirection: "column" }}>
                      <span
                        style={{
                          color: "white",
                          fontSize: "0.9rem",
                          fontWeight: "bold",
                        }}
                      >
                        {u.kullanici_adi || "Kullanıcı"}
                      </span>
                      <span
                        style={{
                          color: "#AAAAAA",
                          fontSize: "0.8rem",
                        }}
                      >
                        {u.eposta}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfilSayfasi;

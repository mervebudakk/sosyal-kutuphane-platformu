import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../Servisler/supabaseServis';
import { Star, Clock, Calendar, Film, BookOpen, ArrowLeft, MessageCircle, Check, Plus, Heart, Share2, Send, User, ListPlus, X  } from 'lucide-react';

const IcerikDetaySayfasi = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    
    // İçerik State'leri
    const [icerik, setIcerik] = useState(null);
    const [yukleniyor, setYukleniyor] = useState(true);
    
    // Kullanıcı Etkileşim State'leri
    const [mevcutDurum, setMevcutDurum] = useState(null); 
    const [kullaniciPuani, setKullaniciPuani] = useState(0); 
    const [hoverPuan, setHoverPuan] = useState(0); 
    const [begenildi, setBegenildi] = useState(false); // Sadece UI efekti

    const [ozelListeModalAcik, setOzelListeModalAcik] = useState(false);
  const [ozelListeler, setOzelListeler] = useState([]);         // {liste_id, liste_adi}
  const [seciliListeler, setSeciliListeler] = useState([]);     // bu içeriği içeren listelerin id'leri
  const [ozelListeYukleniyor, setOzelListeYukleniyor] = useState(false);
  const [yeniListeAdi, setYeniListeAdi] = useState("");
    
    // Yorum State'leri
    const [yorumlar, setYorumlar] = useState([]);
    const [yeniYorum, setYeniYorum] = useState('');
    const [yorumYukleniyor, setYorumYukleniyor] = useState(false);

    // --- FONKSİYONLAR ---
    
    // Yardımcı: Gerçek Kullanıcı ID'sini bul
    const getDbUserId = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { alert("Puanlama/Yorum için giriş yapmalısınız!"); return null; }
        // E-posta üzerinden custom Kullanicilar tablosundaki ID'yi bul
        const { data: dbUser } = await supabase.from('Kullanicilar').select('kullanici_id').eq('eposta', user.email).single();
        return dbUser ? dbUser.kullanici_id : null;
    };

      // Kullanıcının özel listelerini ve bu içeriğin hangi listelerde olduğunu hazırla
  const ozelListeleriHazirla = async () => {
    const userId = await getDbUserId();
    if (!userId || !icerik) return;

    setOzelListeYukleniyor(true);
    try {
      // 1) Kullanıcının tüm özel listeleri
      const { data: listData, error: listErr } = await supabase
        .from("OzelListeler")
        .select("liste_id, liste_adi")
        .eq("kullanici_id", userId)
        .order("olusturulma_tarihi", { ascending: true });

      if (listErr) throw listErr;
      setOzelListeler(listData || []);

      // 2) Bu içerik hangi listelerde var?
      const { data: bagData, error: bagErr } = await supabase
        .from("OzelListeIcerikleri")
        .select("liste_id")
        .eq("icerik_id", icerik.icerik_id);

      if (bagErr) throw bagErr;

      const secili = (bagData || []).map((b) => b.liste_id);
      setSeciliListeler(secili);

      setOzelListeModalAcik(true);
    } catch (e) {
      console.error(e);
      alert("Özel listeler yüklenirken bir hata oluştu.");
    } finally {
      setOzelListeYukleniyor(false);
    }
  };

  // İçeriği listeye ekle / listeden çıkar
  const handleListeToggle = async (listeId) => {
    const userId = await getDbUserId();
    if (!userId || !icerik) return;

    const already = seciliListeler.includes(listeId);

    try {
      if (already) {
        // Listeden çıkar
        const { error } = await supabase
          .from("OzelListeIcerikleri")
          .delete()
          .eq("liste_id", listeId)
          .eq("icerik_id", icerik.icerik_id);

        if (error) throw error;
        setSeciliListeler((prev) => prev.filter((id) => id !== listeId));
      } else {
        // Listeye ekle
        const { error } = await supabase.from("OzelListeIcerikleri").insert([
          {
            liste_id: listeId,
            icerik_id: icerik.icerik_id,
          },
        ]);
        if (error) throw error;
        setSeciliListeler((prev) => [...prev, listeId]);
      }
    } catch (e) {
      console.error(e);
      alert("Liste güncellenirken bir hata oluştu.");
    }
  };

  // Modal içinden yeni özel liste oluşturma
  const handleYeniListeOlustur = async () => {
    const ad = yeniListeAdi.trim();
    if (!ad) return;

    const userId = await getDbUserId();
    if (!userId) return;

    try {
      const { data, error } = await supabase
        .from("OzelListeler")
        .insert([{ kullanici_id: userId, liste_adi: ad }])
        .select("liste_id, liste_adi")
        .single();

      if (error) throw error;

      // Yeni listeyi liste dizisine ekle
      setOzelListeler((prev) => [...prev, data]);
      setYeniListeAdi("");
    } catch (e) {
      console.error(e);
      alert("Yeni liste oluşturulurken bir hata oluştu.");
    }
  };


    // 1. Durum Güncelleme (Okudum/İzledim)
    const durumGuncelle = async (yeniDurum) => {
        const userId = await getDbUserId();
        if (!userId) return;

        const { error } = await supabase.from('KullaniciIcerikDurumlari').upsert({
            kullanici_id: userId,
            icerik_id: icerik.icerik_id,
            durum: yeniDurum
        }, { onConflict: 'kullanici_id, icerik_id' });

        if (!error) {
            setMevcutDurum(yeniDurum);
            alert(`✅ "${icerik.baslik}" listenize (${yeniDurum}) eklendi!`);
        }
    };

    // 2. Puan Verme
    const puanVer = async (puan) => {
        const userId = await getDbUserId();
        if (!userId) return;

        const { error } = await supabase.from('KullaniciPuanlari').upsert({
            kullanici_id: userId,
            icerik_id: icerik.icerik_id,
            puan_degeri: puan
        }, { onConflict: 'kullanici_id, icerik_id' });

        if (!error) {
            setKullaniciPuani(puan);
            alert(`⭐ Puanınız (${puan}/10) başarıyla kaydedildi!`);
        }
    };

    // 3. Yorum Gönderme
    const yorumGonder = async () => {
        if (!yeniYorum.trim()) return;
        setYorumYukleniyor(true);

        const userId = await getDbUserId();
        if (!userId) { setYorumYukleniyor(false); return; }

        const { error } = await supabase.from('KullaniciYorumlari').insert([{
            kullanici_id: userId,
            icerik_id: icerik.icerik_id,
            yorum_metin: yeniYorum.trim()
        }]);

        if (!error) {
            const { data: { user } } = await supabase.auth.getUser();
            const tempUsername = user.email.split('@')[0]; 
            
            // Yorumu listeye anında ekle (Anlık güncellik)
            setYorumlar([{
                yorum_metin: yeniYorum.trim(),
                olusturulma_tarihi: new Date().toISOString(),
                Kullanicilar: { kullanici_adi: tempUsername } 
            }, ...yorumlar]);
            
            setYeniYorum('');
        } else {
            alert("Yorum gönderilemedi.");
        }
        setYorumYukleniyor(false);
    };
    
    // 4. VERİ ÇEKME (useEffect)
    useEffect(() => {
        const veriGetir = async () => {
            const { data: icerikData, error } = await supabase
                .from('Icerikler')
                .select(`*, IcerikIstatistikleri (ortalama_puan, toplam_oy_sayisi)`)
                .eq('icerik_id', id)
                .single();

            if (!error && icerikData) {
                setIcerik(icerikData);
                const userDbId = await getDbUserId();
if (userDbId) {
  const { data: durumData } = await supabase
    .from("KullaniciIcerikDurumlari")
    .select("durum")
    .eq("kullanici_id", userDbId)
    .eq("icerik_id", id)
    .single();

  if (durumData) setMevcutDurum(durumData.durum);

  const { data: puanData } = await supabase
    .from("KullaniciPuanlari")
    .select("puan_degeri")
    .eq("kullanici_id", userDbId)
    .eq("icerik_id", id)
    .single();

  if (puanData) setKullaniciPuani(puanData.puan_degeri);
}

            }
            const { data: yorumData } = await supabase
                .from('KullaniciYorumlari')
                .select(`yorum_metin, olusturulma_tarihi, Kullanicilar (kullanici_adi)`)
                .eq('icerik_id', id)
                .order('olusturulma_tarihi', { ascending: false });
            
            if (yorumData) setYorumlar(yorumData);
            setYukleniyor(false);
        };
        if (id) veriGetir();
    }, [id]);

    if (yukleniyor) return <div style={{color:'white', textAlign:'center', paddingTop:'100px'}}>Yükleniyor...</div>;
    if (!icerik) return <div style={{color:'white', textAlign:'center', paddingTop:'100px'}}>İçerik bulunamadı.</div>;

    const istatistik = Array.isArray(icerik.IcerikIstatistikleri) ? icerik.IcerikIstatistikleri[0] : icerik.IcerikIstatistikleri;
    const genelPuan = istatistik?.ortalama_puan || 0;
    const oySayisi = istatistik?.toplam_oy_sayisi || 0;
    const okudumAktif = mevcutDurum === 'okudum' || mevcutDurum === 'izledim';
    const okunacakAktif = mevcutDurum === 'okunacak' || mevcutDurum === 'izlenecek';

    return (
        <div style={{ minHeight: '100vh', background: '#121212', fontFamily: "'Roboto', sans-serif", color: '#FFFFFF', paddingBottom: '50px' }}>
            {/* Hero Banner (Arka Plan) */}
            <div style={{ position: 'relative', height: '400px', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(${icerik.kapak_url})`, backgroundSize: 'cover', backgroundPosition: 'center', filter: 'blur(25px) brightness(0.3)', transform: 'scale(1.1)' }} />
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent 0%, #121212 100%)' }} />
                <button onClick={() => navigate(-1)} style={{ position: 'absolute', top: '30px', left: '30px', background: 'rgba(255,255,255,0.1)', color: 'white', padding: '12px 20px', borderRadius: '50px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', border: '1px solid rgba(255,255,255,0.2)', zIndex:20 }}>
                    <ArrowLeft size={20} /> Geri
                </button>
            </div>

            {/* ANA İÇERİK ALANI */}
            <div style={{ maxWidth: '1200px', margin: '-250px auto 0', padding: '0 20px', position: 'relative', zIndex: 10 }}>
                <div style={{ display: 'flex', gap: '50px', alignItems: 'flex-start' }}>
                    
                    {/* SOL POSTER & BUTONLAR */}
                    <div style={{ flexShrink: 0, width: '320px' }}>
                        <div style={{ borderRadius: '8px', overflow: 'hidden', boxShadow: '0 10px 40px rgba(0,0,0,0.5)', border: '4px solid rgba(255, 255, 255, 0.1)' }}>
                            <img src={icerik.kapak_url || 'https://via.placeholder.com/300x450'} alt={icerik.baslik} style={{ width: '100%', display: 'block' }} />
                        </div>
                        
                        {/* AKSİYON BUTONLARI (Listeye Ekle / Okudum) */}
                        <div style={{ marginTop: '25px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <button onClick={() => durumGuncelle(icerik.icerik_turu === 'film' ? 'izledim' : 'okudum')} style={{ background: okudumAktif ? '#10b981' : 'rgba(255,255,255,0.1)', color: 'white', padding: '16px', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', border: okudumAktif ? 'none' : '2px solid rgba(255, 255, 255, 0.2)' }}>
                                <Check size={20} /> {icerik.icerik_turu === 'film' ? 'İzledim' : 'Okudum'}
                            </button>
                            <button onClick={() => durumGuncelle(icerik.icerik_turu === 'film' ? 'izlenecek' : 'okunacak')} style={{ background: okunacakAktif ? '#f59e0b' : 'rgba(255,255,255,0.1)', color: 'white', padding: '16px', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', border: okunacakAktif ? 'none' : '2px solid rgba(255, 255, 255, 0.2)' }}>
                                <Plus size={20} /> Listeye Ekle
                            </button>
                                                    <button
                            onClick={ozelListeleriHazirla}
                            style={{
                                background: "rgba(255,255,255,0.05)",
                                color: "white",
                                padding: "14px",
                                borderRadius: "4px",
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                gap: "10px",
                                border: "2px dashed rgba(245, 197, 24, 0.6)",
                            }}
                        >
                            <ListPlus size={20} />
                            Özel Listeye Ekle
                        </button>

                            <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                                <button onClick={() => setBegenildi(!begenildi)} style={{ flex: 1, background: begenildi ? 'rgba(239, 68, 68, 0.2)' : 'rgba(255, 255, 255, 0.1)', border: `2px solid ${begenildi ? 'rgba(239, 68, 68, 0.5)' : 'rgba(255, 255, 255, 0.2)'}`, color: 'white', padding: '12px', borderRadius: '4px', cursor: 'pointer', display: 'flex', justifyContent: 'center' }}>
                                    <Heart size={20} fill={begenildi ? '#ef4444' : 'none'} />
                                </button>
                                <button style={{ flex: 1, background: 'rgba(255, 255, 255, 0.1)', border: '2px solid rgba(255, 255, 255, 0.2)', color: 'white', padding: '12px', borderRadius: '4px', cursor: 'pointer', display: 'flex', justifyContent: 'center' }}><Share2 size={20} /></button>
                            </div>
                        </div>
                    </div>

                    {/* SAĞ DETAYLAR */}
                    <div style={{ flex: 1, paddingTop: '20px' }}>
                        <h1 style={{ color: 'white', fontSize: '3.5rem', fontWeight: '900', marginBottom: '15px', lineHeight: '1.1', textShadow: '0 4px 8px rgba(0,0,0,0.3)' }}>{icerik.baslik}</h1>
                        
                        {/* Meta Bilgiler */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '30px', flexWrap: 'wrap', color: 'rgba(255, 255, 255, 0.8)' }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Calendar size={16} color="#F5C518" /> {icerik.yayin_yili}</span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Clock size={16} color="#F5C518" /> {icerik.sure_sayfa_sayisi} {icerik.icerik_turu === 'film' ? 'dk' : 'sayfa'}</span>
                            {icerik.icerik_turu === 'film' ? <Film size={20} color="#F5C518" /> : <BookOpen size={20} color="#F5C518" />}
                        </div>

                        {/* Puan Kartı ve Puanlama */}
                        <div style={{ background: 'rgba(245, 197, 24, 0.1)', border: '1px solid rgba(245, 197, 24, 0.3)', borderRadius: '15px', padding: '20px', marginBottom: '30px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            {/* Genel Puan */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                <Star size={40} fill="#F5C518" color="#F5C518" />
                                <div>
                                    <div style={{ color: 'white', fontSize: '2.5rem', fontWeight: 'bold' }}>{Number(genelPuan).toFixed(1)}</div>
                                    <div style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.8rem' }}>{oySayisi} oy / Genel Puan</div>
                                </div>
                            </div>
                            
                            {/* KULLANICI PUANLAMA KISMI */}
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                <span style={{ color: '#F5C518', fontWeight: 'bold', marginBottom: '5px', fontSize: '0.9rem' }}>SENİN PUANIN</span>
                                <div style={{ display: 'flex', gap: '5px', background: 'rgba(0,0,0,0.3)', padding: '8px 15px', borderRadius: '50px' }} onMouseLeave={() => setHoverPuan(0)}>
                                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((p) => (
                                        <Star 
                                            key={p} 
                                            size={22} 
                                            cursor="pointer"
                                            fill={p <= (hoverPuan || kullaniciPuani) ? '#F5C518' : 'none'} 
                                            color={p <= (hoverPuan || kullaniciPuani) ? '#F5C518' : '#666'}
                                            onMouseEnter={() => setHoverPuan(p)}
                                            onClick={() => puanVer(p)}
                                        />
                                    ))}
                                </div>
                                <span style={{ color: 'white', marginTop: '5px', fontSize: '1.2rem', fontWeight: 'bold' }}>{hoverPuan || kullaniciPuani || '-'} / 10</span>
                            </div>
                        </div>

                        {/* Konu */}
                        <div style={{ marginBottom: '40px' }}>
                            <h3 style={{ borderLeft: '4px solid #F5C518', paddingLeft: '10px', color: 'white', marginBottom: '15px' }}>Konu</h3>
                            <div style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '1.1rem', lineHeight: '1.8' }} dangerouslySetInnerHTML={{ __html: icerik.ozet }} />
                        </div>

                        {/* Yorumlar */}
                        <div>
                            <h3 style={{ borderLeft: '4px solid #F5C518', paddingLeft: '10px', color: 'white', marginBottom: '20px' }}>Yorumlar ({yorumlar.length})</h3>
                            
                            {/* Yorum Yazma Alanı */}
                            <div style={{ background: 'rgba(255, 255, 255, 0.05)', borderRadius: '15px', padding: '20px', marginBottom: '30px', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
                                <textarea value={yeniYorum} onChange={(e) => setYeniYorum(e.target.value)} placeholder="Bu içerik hakkında ne düşünüyorsun?" style={{ width: '100%', minHeight: '100px', background: 'rgba(0, 0, 0, 0.3)', border: '1px solid #333', borderRadius: '8px', padding: '15px', color: 'white', fontSize: '1rem', fontFamily: 'inherit', resize: 'vertical', marginBottom: '15px', outline: 'none' }} />
                                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                                    <button onClick={yorumGonder} disabled={yorumYukleniyor} style={{ background: '#F5C518', color: 'black', border: 'none', padding: '10px 30px', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', opacity: yorumYukleniyor ? 0.7 : 1 }}>
                                        {yorumYukleniyor ? 'Gönderiliyor...' : <><Send size={18} /> Gönder</>}
                                    </button>
                                </div>
                            </div>

                            {/* Yorum Listesi */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                {yorumlar.length > 0 ? yorumlar.map((yorum, i) => (
                                    <div key={i} style={{ background: '#1F1F1F', padding: '20px', borderRadius: '8px', border: '1px solid #333' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                                            <div style={{ width: '40px', height: '40px', background: '#333', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#F5C518' }}><User size={20} /></div>
                                            <div>
                                                <div style={{ color: '#F5C518', fontWeight: 'bold' }}>{yorum.Kullanicilar?.kullanici_adi || 'Anonim'}</div>
                                                <div style={{ color: '#999', fontSize: '0.8rem' }}>{new Date(yorum.olusturulma_tarihi).toLocaleDateString('tr-TR')}</div>
                                            </div>
                                        </div>
                                        <p style={{ color: '#ddd', margin: 0, lineHeight: '1.6' }}>{yorum.yorum_metin}</p>
                                    </div>
                                )) : (
                                    <div style={{ textAlign: 'center', padding: '40px', color: '#666', border: '1px dashed #333', borderRadius: '15px' }}>Henüz yorum yapılmamış. İlk yorumu sen yap!</div>
                                )}
                            </div>
                        </div>
                              {ozelListeModalAcik && (
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
        >
          <div
            style={{
              width: "100%",
              maxWidth: "420px",
              background: "#1F1F1F",
              borderRadius: "8px",
              border: "1px solid #333",
              padding: "20px",
            }}
          >
            {/* Modal header */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "14px",
              }}
            >
              <h3
                style={{
                  margin: 0,
                  color: "white",
                  fontSize: "1.1rem",
                  fontWeight: "bold",
                }}
              >
                Özel Listelere Ekle
              </h3>
              <button
                onClick={() => setOzelListeModalAcik(false)}
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

            {ozelListeYukleniyor ? (
              <div style={{ color: "#AAAAAA", padding: "12px 0" }}>
                Listeler yükleniyor...
              </div>
            ) : (
              <>
                {/* Var olan listeler */}
                {ozelListeler.length === 0 ? (
                  <div
                    style={{
                      color: "#AAAAAA",
                      fontSize: "0.9rem",
                      marginBottom: "12px",
                    }}
                  >
                    Henüz hiç özel listen yok. Aşağıdan yeni bir liste
                    oluşturabilirsin.
                  </div>
                ) : (
                  <div
                    style={{
                      maxHeight: "220px",
                      overflowY: "auto",
                      marginBottom: "12px",
                      display: "flex",
                      flexDirection: "column",
                      gap: 8,
                    }}
                  >
                    {ozelListeler.map((liste) => {
                      const secili = seciliListeler.includes(liste.liste_id);
                      return (
                        <button
                          key={liste.liste_id}
                          onClick={() => handleListeToggle(liste.liste_id)}
                          style={{
                            width: "100%",
                            textAlign: "left",
                            padding: "8px 10px",
                            borderRadius: "6px",
                            border: secili
                              ? "1px solid #F5C518"
                              : "1px solid #333",
                            background: secili ? "#332b05" : "#151515",
                            color: "white",
                            fontSize: "0.9rem",
                            cursor: "pointer",
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                          }}
                        >
                          <span>{liste.liste_adi}</span>
                          {secili && (
                            <span
                              style={{
                                fontSize: "0.75rem",
                                color: "#F5C518",
                                fontWeight: "bold",
                              }}
                            >
                              Bu listede
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Yeni liste oluşturma alanı */}
                <div
                  style={{
                    borderTop: "1px solid #333",
                    paddingTop: "10px",
                    marginTop: "4px",
                  }}
                >
                  <div
                    style={{
                      fontSize: "0.85rem",
                      color: "#AAAAAA",
                      marginBottom: "6px",
                    }}
                  >
                    Yeni liste oluştur
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <input
                      value={yeniListeAdi}
                      onChange={(e) => setYeniListeAdi(e.target.value)}
                      placeholder="Liste adı..."
                      style={{
                        flex: 1,
                        background: "#111",
                        borderRadius: "6px",
                        border: "1px solid #333",
                        padding: "8px 10px",
                        color: "white",
                        fontSize: "0.9rem",
                        outline: "none",
                      }}
                    />
                    <button
                      onClick={handleYeniListeOlustur}
                      style={{
                        background: "#F5C518",
                        border: "none",
                        borderRadius: "6px",
                        padding: "0 14px",
                        fontWeight: "bold",
                        fontSize: "0.85rem",
                        cursor: "pointer",
                        color: "black",
                      }}
                    >
                      Ekle
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

                    </div>
                </div>
            </div>
        </div>
    );
};

export default IcerikDetaySayfasi;
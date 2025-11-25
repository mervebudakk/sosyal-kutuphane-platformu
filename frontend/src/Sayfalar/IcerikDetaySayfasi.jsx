import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../Servisler/supabaseServis';
import { Star, Clock, Calendar, Film, BookOpen, ArrowLeft, MessageCircle, Check, Plus, Heart, Share2, Send, User } from 'lucide-react';

const IcerikDetaySayfasi = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    
    // İçerik State'leri
    const [icerik, setIcerik] = useState(null);
    const [yukleniyor, setYukleniyor] = useState(true);
    
    // Kullanıcı Etkileşim State'leri
    const [mevcutDurum, setMevcutDurum] = useState(null); 
    const [kullaniciPuani, setKullaniciPuani] = useState(0); // Kullanıcının verdiği puan
    const [hoverPuan, setHoverPuan] = useState(0); // Yıldızların üzerine gelinceki görsel efekt
    
    // Yorum State'leri
    const [yorumlar, setYorumlar] = useState([]);
    const [yeniYorum, setYeniYorum] = useState('');
    const [yorumYukleniyor, setYorumYukleniyor] = useState(false);

    // 1. VERİ ÇEKME (Sayfa Yüklendiğinde)
    useEffect(() => {
        const veriGetir = async () => {
            // A) İçeriği Çek
            const { data: icerikData, error } = await supabase
                .from('Icerikler')
                .select(`*, IcerikIstatistikleri (ortalama_puan, toplam_oy_sayisi)`)
                .eq('icerik_id', id)
                .single();

            if (error || !icerikData) {
                setYukleniyor(false);
                return;
            }
            setIcerik(icerikData);

            // B) Kullanıcıya Özel Verileri Çek (Durum, Puan, vb.)
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data: dbUser } = await supabase.from('Kullanicilar').select('kullanici_id').eq('eposta', user.email).single();
                
                if (dbUser) {
                    // 1. Listeye ekleme durumu
                    const { data: durumData } = await supabase.from('KullaniciIcerikDurumlari')
                        .select('durum').eq('kullanici_id', dbUser.kullanici_id).eq('icerik_id', id).single();
                    if (durumData) setMevcutDurum(durumData.durum);

                    // 2. Verdiği Puan
                    const { data: puanData } = await supabase.from('KullaniciPuanlari')
                        .select('puan_degeri').eq('kullanici_id', dbUser.kullanici_id).eq('icerik_id', id).single();
                    if (puanData) setKullaniciPuani(puanData.puan_degeri);
                }
            }

            // C) Yorumları Çek (Tüm kullanıcıların yorumları)
            // Yorum yapan kişinin adını almak için Kullanicilar tablosuyla ilişki kuruyoruz
            const { data: yorumData } = await supabase
                .from('KullaniciYorumlari')
                .select(`
                    yorum_metin, 
                    olusturulma_tarihi, 
                    Kullanicilar (kullanici_adi)
                `)
                .eq('icerik_id', id)
                .order('olusturulma_tarihi', { ascending: false });
            
            if (yorumData) setYorumlar(yorumData);

            setYukleniyor(false);
        };
        
        if (id) veriGetir();
    }, [id]);

    // --- FONKSİYONLAR ---

    // Yardımcı: Gerçek Kullanıcı ID'sini bul
    const getDbUserId = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { alert("Giriş yapmalısınız!"); return null; }
        const { data: dbUser } = await supabase.from('Kullanicilar').select('kullanici_id').eq('eposta', user.email).single();
        return dbUser ? dbUser.kullanici_id : null;
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
            // Not: Veritabanındaki trigger ortalamayı otomatik günceller, sayfayı yenileyince görünür.
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
            yorum_metin: yeniYorum
        }]);

        if (!error) {
            // Yorumu listeye hemen ekleyelim (kullanıcı deneyimi için)
            const { data: { user } } = await supabase.auth.getUser();
            // Kullanıcı adını veritabanından çekmeye gerek kalmadan geçici olarak e-posta başını gösterelim
            const tempUsername = user.email.split('@')[0]; 
            
            setYorumlar([{
                yorum_metin: yeniYorum,
                olusturulma_tarihi: new Date().toISOString(),
                Kullanicilar: { kullanici_adi: tempUsername } // Geçici gösterim
            }, ...yorumlar]);
            
            setYeniYorum('');
        } else {
            alert("Yorum gönderilemedi.");
        }
        setYorumYukleniyor(false);
    };


    if (yukleniyor) return <div style={{color:'white', textAlign:'center', paddingTop:'100px'}}>Yükleniyor...</div>;
    if (!icerik) return <div style={{color:'white', textAlign:'center', paddingTop:'100px'}}>İçerik bulunamadı.</div>;

    const istatistik = Array.isArray(icerik.IcerikIstatistikleri) ? icerik.IcerikIstatistikleri[0] : icerik.IcerikIstatistikleri;
    const genelPuan = istatistik?.ortalama_puan || 0;
    const oySayisi = istatistik?.toplam_oy_sayisi || 0;
    const okudumAktif = mevcutDurum === 'okudum' || mevcutDurum === 'izledim';
    const okunacakAktif = mevcutDurum === 'okunacak' || mevcutDurum === 'izlenecek';

    return (
        <div style={{ minHeight: '100vh', background: 'linear-gradient(to bottom, #0f172a 0%, #1e293b 100%)', fontFamily: "'Inter', sans-serif" }}>
            {/* Hero */}
            <div style={{ position: 'relative', height: '500px', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(${icerik.kapak_url})`, backgroundSize: 'cover', backgroundPosition: 'center', filter: 'blur(20px) brightness(0.4)', transform: 'scale(1.1)' }} />
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(15, 23, 42, 0.3) 0%, rgba(15, 23, 42, 1) 100%)' }} />
                <button onClick={() => navigate(-1)} style={{ position: 'absolute', top: '30px', left: '30px', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: 'white', padding: '12px 20px', borderRadius: '50px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '600', zIndex:20 }}>
                    <ArrowLeft size={20} /> Geri
                </button>
            </div>

            {/* İçerik */}
            <div style={{ maxWidth: '1400px', margin: '-180px auto 0', padding: '0 40px 80px', position: 'relative', zIndex: 10 }}>
                <div style={{ display: 'flex', gap: '50px', alignItems: 'flex-start' }}>
                    
                    {/* Sol Poster & Butonlar */}
                    <div style={{ flexShrink: 0, width: '320px' }}>
                        <div style={{ borderRadius: '20px', overflow: 'hidden', boxShadow: '0 30px 80px rgba(0,0,0,0.6)', border: '4px solid rgba(255, 255, 255, 0.1)' }}>
                            <img src={icerik.kapak_url || 'https://via.placeholder.com/300x450'} alt={icerik.baslik} style={{ width: '100%', display: 'block' }} />
                        </div>
                        <div style={{ marginTop: '25px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <button onClick={() => durumGuncelle(icerik.icerik_turu === 'film' ? 'izledim' : 'okudum')} style={{ background: okudumAktif ? '#10b981' : 'rgba(255,255,255,0.1)', color: 'white', padding: '16px', borderRadius: '15px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', border: okudumAktif ? 'none' : '2px solid rgba(255, 255, 255, 0.2)' }}>
                                <Check size={20} /> {icerik.icerik_turu === 'film' ? 'İzledim' : 'Okudum'}
                            </button>
                            <button onClick={() => durumGuncelle(icerik.icerik_turu === 'film' ? 'izlenecek' : 'okunacak')} style={{ background: okunacakAktif ? '#f59e0b' : 'rgba(255,255,255,0.1)', color: 'white', padding: '16px', borderRadius: '15px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', border: okunacakAktif ? 'none' : '2px solid rgba(255, 255, 255, 0.2)' }}>
                                <Plus size={20} /> Listeye Ekle
                            </button>
                        </div>
                    </div>

                    {/* Sağ Detaylar */}
                    <div style={{ flex: 1, paddingTop: '20px' }}>
                        <h1 style={{ color: 'white', fontSize: '3.5rem', fontWeight: '800', marginBottom: '15px', lineHeight: '1.1', textShadow: '0 4px 8px rgba(0,0,0,0.3)' }}>{icerik.baslik}</h1>
                        
                        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '30px', flexWrap: 'wrap' }}>
                            <span style={{ background: 'rgba(255, 255, 255, 0.1)', backdropFilter: 'blur(10px)', padding: '8px 16px', borderRadius: '20px', color: 'white', fontSize: '0.95rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px' }}><Calendar size={16} /> {icerik.yayin_yili}</span>
                            <span style={{ background: 'rgba(255, 255, 255, 0.1)', backdropFilter: 'blur(10px)', padding: '8px 16px', borderRadius: '20px', color: 'white', fontSize: '0.95rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px' }}><Clock size={16} /> {icerik.sure_sayfa_sayisi} {icerik.icerik_turu === 'film' ? 'dk' : 'sayfa'}</span>
                            {icerik.icerik_turu === 'film' ? <Film size={20} color="white" /> : <BookOpen size={20} color="white" />}
                        </div>

                        {/* Puan Kartı */}
                        <div style={{ background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.15) 0%, rgba(245, 158, 11, 0.1) 100%)', backdropFilter: 'blur(10px)', border: '1px solid rgba(251, 191, 36, 0.3)', borderRadius: '20px', padding: '25px', marginBottom: '30px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <Star size={40} fill="#fbbf24" color="#fbbf24" />
                                    <div>
                                        <div style={{ color: 'white', fontSize: '2.5rem', fontWeight: '800', lineHeight: '1' }}>{Number(genelPuan).toFixed(1)}</div>
                                        <div style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.8rem' }}>Platform Puanı</div>
                                    </div>
                                </div>
                                <div style={{ borderLeft: '1px solid rgba(255, 255, 255, 0.2)', paddingLeft: '20px', color: 'rgba(255, 255, 255, 0.9)' }}>
                                    <div style={{ fontSize: '1.2rem', fontWeight: '700' }}>{oySayisi}</div>
                                    <div style={{ fontSize: '0.8rem', opacity: 0.8 }}>oy</div>
                                </div>
                            </div>

                            {/* ⭐ KULLANICI PUANLAMA KISMI */}
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                <span style={{ color: '#F5C518', fontWeight: 'bold', marginBottom: '5px', fontSize: '0.9rem' }}>SENİN PUANIN</span>
                                <div style={{ display: 'flex', gap: '5px', background: 'rgba(0,0,0,0.3)', padding: '8px 15px', borderRadius: '50px' }} onMouseLeave={() => setHoverPuan(0)}>
                                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((p) => (
                                        <Star 
                                            key={p} 
                                            size={20} 
                                            cursor="pointer"
                                            fill={p <= (hoverPuan || kullaniciPuani) ? '#F5C518' : 'none'} 
                                            color={p <= (hoverPuan || kullaniciPuani) ? '#F5C518' : '#666'}
                                            onMouseEnter={() => setHoverPuan(p)}
                                            onClick={() => puanVer(p)}
                                        />
                                    ))}
                                </div>
                                <span style={{ color: 'white', marginTop: '5px', fontSize: '1.2rem', fontWeight: 'bold' }}>{hoverPuan || kullaniciPuani || '-'}</span>
                            </div>
                        </div>

                        {/* Konu */}
                        <div style={{ marginBottom: '40px' }}>
                            <h3 style={{ color: 'white', fontSize: '1.8rem', fontWeight: '700', marginBottom: '15px' }}>Konu</h3>
                            <div style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '1.1rem', lineHeight: '1.8' }} dangerouslySetInnerHTML={{ __html: icerik.ozet }} />
                        </div>

                        {/* Yorumlar */}
                        <div>
                            <h3 style={{ color: 'white', fontSize: '1.8rem', fontWeight: '700', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}><MessageCircle size={28} /> Yorumlar ({yorumlar.length})</h3>
                            
                            {/* Yorum Yazma Alanı */}
                            <div style={{ background: 'rgba(255, 255, 255, 0.05)', backdropFilter: 'blur(10px)', borderRadius: '20px', padding: '25px', marginBottom: '30px', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
                                <textarea value={yeniYorum} onChange={(e) => setYeniYorum(e.target.value)} placeholder="Düşüncelerinizi paylaşın..." style={{ width: '100%', minHeight: '100px', background: 'rgba(0, 0, 0, 0.2)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '12px', padding: '15px', color: 'white', fontSize: '1rem', fontFamily: 'inherit', resize: 'vertical', marginBottom: '15px', outline: 'none' }} />
                                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                                    <button onClick={yorumGonder} disabled={yorumYukleniyor} style={{ background: '#F5C518', color: 'black', border: 'none', padding: '10px 30px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', opacity: yorumYukleniyor ? 0.7 : 1 }}>
                                        {yorumYukleniyor ? 'Gönderiliyor...' : <><Send size={18} /> Gönder</>}
                                    </button>
                                </div>
                            </div>

                            {/* Yorum Listesi */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                {yorumlar.length > 0 ? yorumlar.map((yorum, i) => (
                                    <div key={i} style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '20px', borderRadius: '15px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                                            <div style={{ width: '40px', height: '40px', background: '#333', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                <User size={20} color="#888" />
                                            </div>
                                            <div>
                                                <div style={{ color: '#F5C518', fontWeight: 'bold' }}>{yorum.Kullanicilar?.kullanici_adi || 'Anonim'}</div>
                                                <div style={{ color: '#666', fontSize: '0.8rem' }}>{new Date(yorum.olusturulma_tarihi).toLocaleDateString('tr-TR')}</div>
                                            </div>
                                        </div>
                                        <p style={{ color: '#ddd', margin: 0, lineHeight: '1.6' }}>{yorum.yorum_metin}</p>
                                    </div>
                                )) : (
                                    <div style={{ textAlign: 'center', padding: '40px', color: '#666', border: '1px dashed #333', borderRadius: '15px' }}>Henüz yorum yapılmamış. İlk yorumu sen yap!</div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default IcerikDetaySayfasi;
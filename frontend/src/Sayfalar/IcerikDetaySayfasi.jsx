import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../Servisler/supabaseServis';
import { Star, Clock, Calendar, Film, BookOpen, ArrowLeft, Check, Plus, Heart, Share2 } from 'lucide-react';

const IcerikDetaySayfasi = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [icerik, setIcerik] = useState(null);
    const [yukleniyor, setYukleniyor] = useState(true);
    const [begenildi, setBegenildi] = useState(false);
    const [yeniYorum, setYeniYorum] = useState('');
    const [mevcutDurum, setMevcutDurum] = useState(null); 

    // --- MANTIK KISMI (AYNEN KORUNDU) ---
    useEffect(() => {
        const veriGetir = async () => {
            const { data: icerikData, error } = await supabase
                .from('Icerikler')
                .select(`*, IcerikIstatistikleri (ortalama_puan, toplam_oy_sayisi)`)
                .eq('icerik_id', id)
                .single();

            if (!error && icerikData) {
                setIcerik(icerikData);
                const { data: { user } } = await supabase.auth.getUser();
                if (user) {
                    const { data: dbUser } = await supabase.from('Kullanicilar').select('kullanici_id').eq('eposta', user.email).single();
                    if (dbUser) {
                        const { data: durumData } = await supabase.from('KullaniciIcerikDurumlari').select('durum').eq('kullanici_id', dbUser.kullanici_id).eq('icerik_id', id).single();
                        if (durumData) setMevcutDurum(durumData.durum);
                    }
                }
            }
            setYukleniyor(false);
        };
        if (id) veriGetir();
    }, [id]);

    const durumGuncelle = async (yeniDurum) => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) { alert("Giriş yapmalısınız!"); return; }
            const { data: dbUser } = await supabase.from('Kullanicilar').select('kullanici_id').eq('eposta', user.email).single();
            
            if (dbUser) {
                const { error } = await supabase.from('KullaniciIcerikDurumlari').upsert({
                    kullanici_id: dbUser.kullanici_id,
                    icerik_id: icerik.icerik_id,
                    durum: yeniDurum
                }, { onConflict: 'kullanici_id, icerik_id' });

                if (!error) {
                    let mesaj = yeniDurum === 'izledim' || yeniDurum === 'okudum' 
                        ? `Tebrikler! "${yeniDurum}" olarak işaretlendi.` 
                        : `Başarıyla "${yeniDurum === 'izlenecek' ? 'izlenecekler' : 'okunacaklar'}" listesine eklendi!`;
                    alert(mesaj);
                    setMevcutDurum(yeniDurum);
                }
            }
        } catch (err) { console.error(err); }
    };
    // -------------------------------------

    if (yukleniyor) return <div style={{ background: '#121212', minHeight: '100vh', color:'white', display:'flex', alignItems:'center', justifyContent:'center' }}>Yükleniyor...</div>;
    if (!icerik) return <div style={{ background: '#121212', minHeight: '100vh', color:'white', display:'flex', alignItems:'center', justifyContent:'center' }}>İçerik bulunamadı.</div>;

    const istatistik = Array.isArray(icerik.IcerikIstatistikleri) ? icerik.IcerikIstatistikleri[0] : icerik.IcerikIstatistikleri;
    const puan = istatistik?.ortalama_puan || 0;
    const oySayisi = istatistik?.toplam_oy_sayisi || 0;
    
    // Buton Durumları
    const okudumAktif = mevcutDurum === 'okudum' || mevcutDurum === 'izledim';
    const okunacakAktif = mevcutDurum === 'okunacak' || mevcutDurum === 'izlenecek' || mevcutDurum === 'izlenecekler';

    return (
        <div style={{ 
            minHeight: '100vh', 
            background: '#121212', // IMDb Siyahı
            fontFamily: "'Roboto', sans-serif", 
            color: '#FFFFFF',
            paddingBottom: '50px'
        }}>
            
            {/* ÜST BANNER (Bulanık Arka Plan) */}
            <div style={{ position: 'relative', height: '400px', overflow: 'hidden' }}>
                {/* Arka Plan Resmi */}
                <div style={{ 
                    position: 'absolute', inset: 0, 
                    backgroundImage: `url(${icerik.kapak_url})`, 
                    backgroundSize: 'cover', 
                    backgroundPosition: 'center', 
                    filter: 'blur(25px) brightness(0.3)', // IMDb tarzı karanlık blur
                    transform: 'scale(1.1)' 
                }} />
                
                {/* Gradient Geçiş */}
                <div style={{ 
                    position: 'absolute', inset: 0, 
                    background: 'linear-gradient(to bottom, transparent 0%, #121212 100%)' 
                }} />

                {/* Geri Butonu */}
                <div style={{ position: 'absolute', top: '20px', left: '20px', zIndex: 20 }}>
                    <button onClick={() => navigate(-1)} style={{ 
                        background: 'rgba(255,255,255,0.1)', 
                        color: 'white', 
                        border: 'none', 
                        padding: '10px 20px', 
                        borderRadius: '4px', 
                        cursor: 'pointer', 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '8px', 
                        fontWeight: 'bold',
                        backdropFilter: 'blur(5px)'
                    }}>
                        <ArrowLeft size={20} /> Geri Dön
                    </button>
                </div>
            </div>

            {/* ANA İÇERİK ALANI */}
            <div style={{ maxWidth: '1200px', margin: '-250px auto 0', padding: '0 20px', position: 'relative', zIndex: 10 }}>
                
                {/* Başlık Bloğu */}
                <div style={{ marginBottom: '30px' }}>
                    <h1 style={{ fontSize: '3.5rem', fontWeight: '900', margin: '0 0 10px 0', textShadow: '2px 2px 10px rgba(0,0,0,0.8)' }}>
                        {icerik.baslik}
                    </h1>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px', color: '#AAAAAA', fontSize: '1rem', fontWeight: '500' }}>
                        <span style={{ textTransform: 'uppercase', border: '1px solid #AAAAAA', padding: '2px 6px', borderRadius: '4px', fontSize: '0.8rem' }}>
                            {icerik.icerik_turu}
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Calendar size={16} color="#F5C518" /> {icerik.yayin_yili}
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Clock size={16} color="#F5C518" /> {icerik.sure_sayfa_sayisi} {icerik.icerik_turu === 'film' ? 'dk' : 'sayfa'}
                        </span>
                    </div>
                </div>

                {/* Grid Yapısı: Poster ve Detaylar */}
                <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '40px' }}>
                    
                    {/* SOL: POSTER */}
                    <div>
                        <img 
                            src={icerik.kapak_url || 'https://via.placeholder.com/300x450'} 
                            alt={icerik.baslik} 
                            style={{ 
                                width: '100%', 
                                borderRadius: '8px', 
                                boxShadow: '0 10px 40px rgba(0,0,0,0.5)', 
                                border: '1px solid rgba(255,255,255,0.1)' 
                            }} 
                        />
                        
                        {/* KÜÇÜK BUTONLAR (Beğen / Paylaş) */}
                        <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
                            <button onClick={() => setBegenildi(!begenildi)} style={{ 
                                flex: 1, background: '#1F1F1F', border: 'none', 
                                padding: '10px', borderRadius: '4px', cursor: 'pointer', 
                                color: begenildi ? '#ef4444' : 'white',
                                display: 'flex', justifyContent: 'center', alignItems: 'center'
                            }}>
                                <Heart size={24} fill={begenildi ? '#ef4444' : 'none'} />
                            </button>
                            <button style={{ 
                                flex: 1, background: '#1F1F1F', border: 'none', 
                                padding: '10px', borderRadius: '4px', cursor: 'pointer', color: 'white',
                                display: 'flex', justifyContent: 'center', alignItems: 'center'
                            }}>
                                <Share2 size={24} />
                            </button>
                        </div>
                    </div>

                    {/* SAĞ: DETAYLAR VE BUTONLAR */}
                    <div>
                        {/* Kategori Tagleri */}
                        <div style={{ display: 'flex', gap: '10px', marginBottom: '25px', flexWrap: 'wrap' }}>
                            {icerik.turler ? icerik.turler.split(', ').map((tur, i) => (
                                <span key={i} style={{ 
                                    background: '#1F1F1F', 
                                    border: '1px solid #333', 
                                    padding: '6px 16px', 
                                    borderRadius: '20px', 
                                    fontSize: '0.9rem', 
                                    color: '#F5C518', // Sarı yazı
                                    fontWeight: '600'
                                }}>
                                    {tur}
                                </span>
                            )) : null}
                        </div>

                        {/* Açıklama */}
                        <p style={{ fontSize: '1.1rem', lineHeight: '1.6', color: '#DDDDDD', marginBottom: '30px' }} dangerouslySetInnerHTML={{ __html: icerik.ozet }} />

                        {/* Yönetmen/Yazar */}
                        <div style={{ borderTop: '1px solid #333', borderBottom: '1px solid #333', padding: '15px 0', marginBottom: '30px', display: 'flex', gap: '15px', alignItems: 'center' }}>
                            <span style={{ fontWeight: 'bold', color: 'white' }}>{icerik.icerik_turu === 'film' ? 'Yönetmen' : 'Yazar'}</span>
                            <span style={{ color: '#5799ef', cursor: 'pointer' }}>{icerik.yazar_yonetmen || 'Bilinmiyor'}</span>
                        </div>

                        {/* AKSİYON ALANI (IMDb Stili) */}
                        <div style={{ display: 'flex', gap: '20px', alignItems: 'center', flexWrap: 'wrap' }}>
                            
                            {/* PUAN KARTI */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <Star size={40} fill="#F5C518" color="#F5C518" />
                                <div>
                                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'white' }}>
                                        {Number(puan).toFixed(1)}<span style={{ fontSize: '1rem', color: '#777' }}>/10</span>
                                    </div>
                                    <div style={{ fontSize: '0.8rem', color: '#777' }}>{oySayisi} oy</div>
                                </div>
                            </div>

                            {/* DİKEY AYIRAÇ */}
                            <div style={{ width: '1px', height: '50px', background: '#333' }}></div>

                            {/* LİSTEYE EKLE (Sarı Buton - Ana Aksiyon) */}
                            <button 
                                onClick={() => durumGuncelle(icerik.icerik_turu === 'film' ? 'izlenecek' : 'okunacak')}
                                style={{ 
                                    background: okunacakAktif ? '#E2B616' : '#F5C518', 
                                    color: 'black', 
                                    border: 'none', 
                                    padding: '12px 24px', 
                                    borderRadius: '4px', // IMDb köşeli buton
                                    fontSize: '1rem', 
                                    fontWeight: 'bold', 
                                    cursor: 'pointer', 
                                    display: 'flex', alignItems: 'center', gap: '8px',
                                    transition: 'background 0.2s'
                                }}
                            >
                                {okunacakAktif ? <Check size={20} /> : <Plus size={20} />}
                                {okunacakAktif ? 'Listemde' : 'Listeye Ekle'}
                            </button>

                            {/* OKUDUM/İZLEDİM (İkincil Buton - Transparent) */}
                            <button 
                                onClick={() => durumGuncelle(icerik.icerik_turu === 'film' ? 'izledim' : 'okudum')}
                                style={{ 
                                    background: 'transparent', 
                                    color: okudumAktif ? '#10b981' : '#5799ef', // Aktifse Yeşil, Değilse Mavi
                                    border: `2px solid ${okudumAktif ? '#10b981' : '#333'}`, 
                                    padding: '10px 20px', 
                                    borderRadius: '4px', 
                                    fontSize: '1rem', 
                                    fontWeight: 'bold', 
                                    cursor: 'pointer', 
                                    display: 'flex', alignItems: 'center', gap: '8px',
                                    transition: 'all 0.2s'
                                }}
                            >
                                <Check size={18} />
                                {icerik.icerik_turu === 'film' ? 'İzledim' : 'Okudum'}
                            </button>

                        </div>

                        {/* Yorum Alanı */}
                        <div style={{ marginTop: '50px' }}>
                            <h3 style={{ borderLeft: '4px solid #F5C518', paddingLeft: '10px', color: 'white' }}>Yorum Yap</h3>
                            <div style={{ marginTop: '20px', background: '#1F1F1F', padding: '20px', borderRadius: '8px' }}>
                                <textarea 
                                    value={yeniYorum} 
                                    onChange={(e) => setYeniYorum(e.target.value)} 
                                    placeholder="Bu içerik hakkında ne düşünüyorsun?" 
                                    style={{ width: '100%', minHeight: '80px', background: 'transparent', border: 'none', color: 'white', fontSize: '1rem', outline: 'none', resize: 'vertical' }} 
                                />
                                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
                                    <button style={{ background: '#5799ef', color: 'white', border: 'none', padding: '8px 20px', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer' }}>Gönder</button>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
};

export default IcerikDetaySayfasi;
import React, { useState, useEffect } from 'react';
import { Film, BookOpen, Clock, CheckCircle } from 'lucide-react';
import { supabase } from '../Servisler/supabaseServis';
import { useNavigate } from 'react-router-dom';

const ProfilSayfasi = () => {
    const navigate = useNavigate();
    const [aktifSekme, setAktifSekme] = useState('kitap');
    const [kullanici, setKullanici] = useState(null);
    const [listeler, setListeler] = useState({ okuduklarim: [], okunacaklar: [], izlediklerim: [], izlenecekler: [] });
    const [yukleniyor, setYukleniyor] = useState(true);

    // --- MANTIK KISMI (AYNEN KORUNDU) ---
    useEffect(() => {
        const veriGetir = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) { navigate('/'); return; }

            const { data: dbUser } = await supabase.from('Kullanicilar').select('*').eq('eposta', user.email).single();
            
            if (dbUser) {
                setKullanici({ ...dbUser, email: user.email });
                const { data: items } = await supabase.from('KullaniciIcerikDurumlari').select('durum, Icerikler(*)').eq('kullanici_id', dbUser.kullanici_id);
                
                if (items) {
                    setListeler({
                        okuduklarim: items.filter(i => i.durum === 'okudum').map(i => i.Icerikler),
                        okunacaklar: items.filter(i => i.durum === 'okunacak').map(i => i.Icerikler),
                        izlediklerim: items.filter(i => i.durum === 'izledim').map(i => i.Icerikler),
                        izlenecekler: items.filter(i => ['izlenecek', 'izlenecekler'].includes(i.durum)).map(i => i.Icerikler),
                    });
                }
            }
            setYukleniyor(false);
        };
        veriGetir();
    }, [navigate]);
    // -------------------------------------

    if (yukleniyor) return <div style={{ background: '#121212', minHeight: '100vh', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Yükleniyor...</div>;

    const IcerikKarti = ({ icerik }) => (
        <div 
            onClick={() => navigate(`/icerik/${icerik.icerik_id}`)}
            style={{
                background: '#1F1F1F', 
                borderRadius: '4px', 
                overflow: 'hidden', 
                cursor: 'pointer', 
                transition: 'all 0.2s ease', 
                border: '1px solid #333', 
                position: 'relative'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#F5C518'; e.currentTarget.style.transform = 'scale(1.02)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#333'; e.currentTarget.style.transform = 'scale(1)'; }}
        >
            <div style={{ width: '100%', paddingTop: '150%', position: 'relative', background: '#333' }}>
                <img src={icerik.kapak_url} alt={icerik.baslik} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
            <div style={{ padding: '12px' }}>
                <h4 style={{ color: 'white', margin: '0 0 5px 0', fontSize: '0.9rem', fontWeight: 'bold', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{icerik.baslik}</h4>
                <span style={{ color: '#AAAAAA', fontSize: '0.8rem', fontWeight: '500' }}>{icerik.yayin_yili}</span>
            </div>
        </div>
    );

    const ListeBasligi = ({ icon: Icon, renk, baslik, adet }) => (
        <div style={{ 
            background: '#1F1F1F', 
            borderLeft: `4px solid ${renk}`, 
            borderRadius: '4px', 
            padding: '15px 20px', 
            marginBottom: '20px', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            boxShadow: '0 2px 5px rgba(0,0,0,0.2)'
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                <Icon size={24} color={renk} />
                <div>
                    <h3 style={{ color: 'white', margin: 0, fontSize: '1.2rem', fontWeight: 'bold' }}>{baslik}</h3>
                </div>
            </div>
            <div style={{ 
                background: '#333', 
                padding: '4px 10px', 
                borderRadius: '4px', 
                color: 'white', 
                fontSize: '0.9rem', 
                fontWeight: 'bold' 
            }}>
                {adet}
            </div>
        </div>
    );

    return (
        <div style={{ minHeight: '100vh', background: '#121212', padding: '40px 20px 80px', fontFamily: "'Roboto', sans-serif", color: '#FFFFFF' }}>
            <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                
                {/* Profil Header */}
                <div style={{ 
                    background: '#1F1F1F', 
                    borderRadius: '8px', 
                    padding: '40px', 
                    marginBottom: '40px', 
                    border: '1px solid #333', 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '30px' 
                }}>
                    <div style={{ 
                        width: '100px', height: '100px', 
                        borderRadius: '50%', 
                        background: '#F5C518', 
                        display: 'flex', alignItems: 'center', justifyContent: 'center', 
                        fontSize: '3rem', color: 'black', fontWeight: 'bold',
                        flexShrink: 0
                    }}>
                        {kullanici?.kullanici_adi?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <h1 style={{ color: 'white', fontSize: '2.5rem', fontWeight: 'bold', margin: '0 0 5px 0' }}>{kullanici?.kullanici_adi}</h1>
                        <p style={{ color: '#AAAAAA', fontSize: '1rem', margin: '0 0 15px 0' }}>{kullanici?.email}</p>
                        <p style={{ color: '#DDDDDD', fontSize: '1rem', fontStyle: 'italic' }}>{kullanici?.biyografi || 'Henüz biyografi eklenmemiş.'}</p>
                    </div>
                </div>

                {/* Kategori Sekmeleri */}
                <div style={{ display: 'flex', gap: '15px', marginBottom: '40px', borderBottom: '1px solid #333', paddingBottom: '15px' }}>
                    {[{ id: 'kitap', icon: BookOpen, label: 'Kitaplarım' }, { id: 'film', icon: Film, label: 'Filmlerim' }].map(k => {
                        const aktif = aktifSekme === k.id;
                        return (
                            <button 
                                key={k.id} 
                                onClick={() => setAktifSekme(k.id)} 
                                style={{ 
                                    background: aktif ? '#F5C518' : 'transparent', 
                                    color: aktif ? 'black' : '#AAAAAA', 
                                    border: 'none', 
                                    padding: '10px 20px', 
                                    borderRadius: '4px', 
                                    cursor: 'pointer', 
                                    fontSize: '1rem', 
                                    fontWeight: 'bold', 
                                    display: 'flex', alignItems: 'center', gap: '8px',
                                    transition: 'all 0.2s ease'
                                }}
                            >
                                <k.icon size={20} /> {k.label}
                            </button>
                        )
                    })}
                </div>

                {/* Listeler Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
                    
                    {/* Sol Sütun (Tamamlananlar) */}
                    <div>
                        <ListeBasligi 
                            icon={CheckCircle} 
                            renk="#10b981" // Yeşil (IMDb tarzında tamamlanan işler için yeşil uygundur)
                            baslik={aktifSekme === 'kitap' ? 'Okuduklarım' : 'İzlediklerim'} 
                            adet={aktifSekme === 'kitap' ? listeler.okuduklarim.length : listeler.izlediklerim.length} 
                        />
                        { (aktifSekme === 'kitap' ? listeler.okuduklarim : listeler.izlediklerim).length > 0 ? (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '15px' }}>
                                {(aktifSekme === 'kitap' ? listeler.okuduklarim : listeler.izlediklerim).map(i => <IcerikKarti key={i.icerik_id} icerik={i} />)}
                            </div>
                        ) : (
                            <div style={{ textAlign: 'center', padding: '30px', color: '#555', border: '1px dashed #333', borderRadius: '4px' }}>Henüz içerik yok.</div>
                        )}
                    </div>

                    {/* Sağ Sütun (Yapılacaklar) */}
                    <div>
                        <ListeBasligi 
                            icon={Clock} 
                            renk="#F5C518" // Sarı (Watchlist rengi)
                            baslik={aktifSekme === 'kitap' ? 'Okunacaklar' : 'İzlenecekler'} 
                            adet={aktifSekme === 'kitap' ? listeler.okunacaklar.length : listeler.izlenecekler.length} 
                        />
                        { (aktifSekme === 'kitap' ? listeler.okunacaklar : listeler.izlenecekler).length > 0 ? (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '15px' }}>
                                {(aktifSekme === 'kitap' ? listeler.okunacaklar : listeler.izlenecekler).map(i => <IcerikKarti key={i.icerik_id} icerik={i} />)}
                            </div>
                        ) : (
                            <div style={{ textAlign: 'center', padding: '30px', color: '#555', border: '1px dashed #333', borderRadius: '4px' }}>Henüz içerik yok.</div>
                        )}
                    </div>

                </div>
            </div>
        </div>
    );
};

export default ProfilSayfasi;
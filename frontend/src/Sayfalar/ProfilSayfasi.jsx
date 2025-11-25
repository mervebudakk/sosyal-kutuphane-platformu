import React, { useEffect, useState } from 'react';
import { supabase } from '../Servisler/supabaseServis';
import { useNavigate } from 'react-router-dom';

const ProfilSayfasi = () => {
    const navigate = useNavigate();
    const [yukleniyor, setYukleniyor] = useState(true);
    const [kullanici, setKullanici] = useState(null);
    
    // Listeleri tutacak state'ler
    const [okuduklarim, setOkuduklarim] = useState([]);
    const [okunacaklar, setOkunacaklar] = useState([]);
    const [izlediklerim, setIzlediklerim] = useState([]);
    const [izlenecekler, setIzlenecekler] = useState([]);

    const [aktifSekme, setAktifSekme] = useState('kitap'); // 'kitap' veya 'film'

    useEffect(() => {
        const veriGetir = async () => {
            // 1. Giriş yapmış kullanıcıyı al
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                navigate('/'); // Giriş yoksa ana sayfaya at
                return;
            }
            
            // Kullanıcı bilgilerini (Auth'dan değil veritabanından) çekebiliriz
            // Şimdilik e-postasını göstermek için user nesnesini sete ediyoruz
            setKullanici(user);

            // 2. Kullanıcının ID'sini 'Kullanicilar' tablosundan bul
            const { data: dbUser, error: userError } = await supabase
                .from('Kullanicilar')
                .select('kullanici_id')
                .eq('eposta', user.email)
                .single();

            if (userError || !dbUser) {
                console.error("Kullanıcı bulunamadı", userError);
                setYukleniyor(false);
                return;
            }

            // 3. Kullanıcının listelerini ve ilgili içerik detaylarını çek (JOIN işlemi)
            const { data, error } = await supabase
                .from('KullaniciIcerikDurumlari')
                .select(`
                    durum,
                    Icerikler (
                        *
                    )
                `)
                .eq('kullanici_id', dbUser.kullanici_id);

            if (error) {
                console.error("Liste çekme hatası:", error);
            } else if (data) {
                // 4. Gelen veriyi kategorilere ayır
                setOkuduklarim(data.filter(x => x.durum === 'okudum').map(x => x.Icerikler));
                setOkunacaklar(data.filter(x => x.durum === 'okunacak').map(x => x.Icerikler));
                setIzlediklerim(data.filter(x => x.durum === 'izledim').map(x => x.Icerikler));
                setIzlenecekler(data.filter(x => x.durum === 'izlenecek').map(x => x.Icerikler));
            }
            
            setYukleniyor(false);
        };

        veriGetir();
    }, [navigate]);

    if (yukleniyor) return <div style={{textAlign:'center', marginTop:'50px'}}>Yükleniyor...</div>;

    return (
        <div style={{ maxWidth: '1000px', margin: '30px auto', padding: '20px', fontFamily: 'Arial, sans-serif' }}>
            {/* Üst Profil Kartı */}
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '30px', padding: '20px', backgroundColor: '#f9f9f9', borderRadius: '12px', border: '1px solid #eee' }}>
                <div style={{ width: '80px', height: '80px', borderRadius: '50%', backgroundColor: '#333', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '30px', marginRight: '20px' }}>
                    {kullanici?.email?.charAt(0).toUpperCase()}
                </div>
                <div>
                    <h2 style={{ margin: 0 }}>{kullanici?.email}</h2>
                    <p style={{ margin: '5px 0 0 0', color: '#666' }}>Kütüphane Yöneticisi</p>
                </div>
            </div>

            {/* Sekmeler */}
            <div style={{ marginBottom: '20px', borderBottom: '2px solid #eee' }}>
                <button 
                    onClick={() => setAktifSekme('kitap')}
                    style={{ padding: '10px 20px', marginRight: '10px', border: 'none', background: 'none', borderBottom: aktifSekme === 'kitap' ? '3px solid #e67e22' : 'none', fontWeight: 'bold', cursor: 'pointer', fontSize: '16px' }}
                >
                    📚 Kitaplarım
                </button>
                <button 
                    onClick={() => setAktifSekme('film')}
                    style={{ padding: '10px 20px', border: 'none', background: 'none', borderBottom: aktifSekme === 'film' ? '3px solid #3498db' : 'none', fontWeight: 'bold', cursor: 'pointer', fontSize: '16px' }}
                >
                    🎥 Filmlerim
                </button>
            </div>

            {/* LİSTE GÖSTERİMİ */}
            <div style={{ display: 'flex', gap: '40px' }}>
                
                {/* SOL SÜTUN: Bitirilenler */}
                <div style={{ flex: 1 }}>
                    <h3 style={{ color: '#27ae60' }}>
                        {aktifSekme === 'kitap' ? '📖 Okuduklarım' : '👁️ İzlediklerim'} 
                        <span style={{ fontSize: '0.8em', color: '#999', marginLeft: '10px' }}>
                            ({aktifSekme === 'kitap' ? okuduklarim.length : izlediklerim.length})
                        </span>
                    </h3>
                    <ListeBileseni liste={aktifSekme === 'kitap' ? okuduklarim : izlediklerim} navigate={navigate} />
                </div>

                {/* SAĞ SÜTUN: Yapılacaklar */}
                <div style={{ flex: 1 }}>
                    <h3 style={{ color: '#f39c12' }}>
                        {aktifSekme === 'kitap' ? '⏳ Okunacaklar' : '🍿 İzlenecekler'}
                        <span style={{ fontSize: '0.8em', color: '#999', marginLeft: '10px' }}>
                            ({aktifSekme === 'kitap' ? okunacaklar.length : izlenecekler.length})
                        </span>
                    </h3>
                    <ListeBileseni liste={aktifSekme === 'kitap' ? okunacaklar : izlenecekler} navigate={navigate} />
                </div>
            </div>
        </div>
    );
};

// Listeyi ekrana basan küçük yardımcı bileşen
const ListeBileseni = ({ liste, navigate }) => {
    if (liste.length === 0) return <p style={{ color: '#999', fontStyle: 'italic' }}>Listeniz boş.</p>;

    return (
        <div style={{ display: 'grid', gap: '15px' }}>
            {liste.map((icerik) => (
                <div 
                    key={icerik.icerik_id} 
                    onClick={() => navigate(`/icerik/${icerik.icerik_id}`)}
                    style={{ display: 'flex', gap: '15px', padding: '10px', border: '1px solid #eee', borderRadius: '8px', cursor: 'pointer', backgroundColor: 'white', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}
                >
                    <img src={icerik.kapak_url} alt={icerik.baslik} style={{ width: '50px', height: '75px', objectFit: 'cover', borderRadius: '4px' }} />
                    <div>
                        <h4 style={{ margin: '0 0 5px 0', fontSize: '14px' }}>{icerik.baslik}</h4>
                        <span style={{ fontSize: '12px', color: '#7f8c8d' }}>{icerik.yayin_yili}</span>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default ProfilSayfasi;
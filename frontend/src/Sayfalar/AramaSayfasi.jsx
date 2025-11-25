// frontend/src/Sayfalar/AramaSayfasi.jsx

import React, { useState } from 'react';
// DİKKAT: apiServis dosyasından yeni eklediğimiz kitap fonksiyonunu da import ediyoruz
import { 
    hariciFilmleriAra, 
    hariciKitaplariAra, 
    icerigiKaydetVeDetaylariCek, // Bu film için (Merve'nin yazdığı)
    kitapKaydetVeDetaylariCek   // Bu kitap için (Senin yazdığın)
} from '../Servisler/apiServis'; 
import { useNavigate } from 'react-router-dom'; // <-- Bunu ekle

// --- Sekme Stili (Görsel değişiklik yok) ---
const SekmeStili = (aktif) => ({
    padding: '10px 20px',
    cursor: 'pointer',
    borderBottom: aktif ? '3px solid #333' : '1px solid #ccc',
    fontWeight: aktif ? 'bold' : 'normal',
    marginRight: '10px',
    display: 'inline-block'
});

const AramaSayfasi = () => { 
    const navigate = useNavigate();
    // State'ler
    const [aktifKategori, setAktifKategori] = useState('film'); // 'film' veya 'kitap'
    const [aramaTerimi, setAramaTerimi] = useState('');
    const [sonuclar, setSonuclar] = useState([]); 
    const [yukleniyor, setYukleniyor] = useState(false); 
    const [hata, setHata] = useState(null); 
    const [kayitDurumu, setKayitDurumu] = useState({}); // { 'id123': 'yukleniyor' | 'basarili' }

    // --- ARAMA FONKSİYONU ---
    const aramaYap = async (e) => { 
        e.preventDefault();
        if (!aramaTerimi.trim()) return;

        setYukleniyor(true);
        setHata(null);
        setSonuclar([]);
        setKayitDurumu({});

        try {
            let gelenSonuclar = [];
            
            if (aktifKategori === 'film') {
                // TMDb API'den film ara
                gelenSonuclar = await hariciFilmleriAra(aramaTerimi);
            } else {
                // Google Books API'den kitap ara (Dilay'ın Modülü)
                gelenSonuclar = await hariciKitaplariAra(aramaTerimi);
            }

            setSonuclar(gelenSonuclar);
        } catch (err) {
            setHata(err.message);
        } finally {
            setYukleniyor(false);
        }
    };

    // --- DETAY VE KAYDETME FONKSİYONU ---
    const detaySayfasinaGit = async (hariciId) => {
        // Kullanıcıya geri bildirim vermek için durumu güncelle
        setKayitDurumu(prev => ({ ...prev, [hariciId]: 'yukleniyor' }));
        setHata(null);

        try {
            let kaydedilenIcerik;

            // Kategoriye göre doğru kaydetme fonksiyonunu seçiyoruz (KRİTİK NOKTA)
            if (aktifKategori === 'film') {
                console.log("Film detayları çekiliyor ve kaydediliyor...");
                kaydedilenIcerik = await icerigiKaydetVeDetaylariCek(hariciId);
            } else {
                console.log("Kitap detayları çekiliyor ve kaydediliyor...");
                kaydedilenIcerik = await kitapKaydetVeDetaylariCek(hariciId);
            }
            
            setKayitDurumu(prev => ({ ...prev, [hariciId]: 'basarili' }));

            // Yönlendirme Simülasyonu
            // Gerçek projede: navigate(`/icerik/${kaydedilenIcerik.id}`);
            console.log(`✅ İŞLEM BAŞARILI! Veritabanı ID: ${kaydedilenIcerik.id}`);
            navigate(`/icerik/${kaydedilenIcerik.icerik_id}`);

        } catch (err) {
            console.error("Detay hatası:", err);
            setKayitDurumu(prev => ({ ...prev, [hariciId]: 'hata' }));
            setHata(`Detay çekme hatası: ${err.message}`);
            alert("Bir hata oluştu: " + err.message);
        }
    };

    return (
        <div style={{ maxWidth: '900px', margin: '50px auto', padding: '20px', fontFamily: 'Arial, sans-serif' }}>
            
            {/* Kategori Sekmeleri */}
            <div style={{ marginBottom: '20px', borderBottom: '1px solid #ccc' }}>
                <div 
                    style={SekmeStili(aktifKategori === 'film')}
                    onClick={() => { setAktifKategori('film'); setSonuclar([]); setAramaTerimi(''); setHata(null); }}
                >
                    🎥 Filmler
                </div>
                <div 
                    style={SekmeStili(aktifKategori === 'kitap')}
                    onClick={() => { setAktifKategori('kitap'); setSonuclar([]); setAramaTerimi(''); setHata(null); }}
                >
                    📚 Kitaplar
                </div>
            </div>

            <h2>{aktifKategori === 'film' ? 'Film' : 'Kitap'} Arama</h2>
            
            {/* Arama Formu */}
            <form onSubmit={aramaYap} style={{ marginBottom: '30px' }}>
                <input
                    type="text"
                    value={aramaTerimi}
                    onChange={(e) => setAramaTerimi(e.target.value)}
                    placeholder={`${aktifKategori === 'film' ? 'Matrix, Interstellar...' : 'Harry Potter, 1984...'} `}
                    style={{ padding: '12px', width: '70%', marginRight: '10px', fontSize: '16px', borderRadius: '4px', border: '1px solid #ddd' }}
                />
                <button 
                    type="submit" 
                    disabled={yukleniyor} 
                    style={{ 
                        padding: '12px 24px', 
                        cursor: yukleniyor ? 'not-allowed' : 'pointer',
                        backgroundColor: '#333',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        fontSize: '16px'
                    }}>
                    {yukleniyor ? 'Aranıyor...' : 'Ara'}
                </button>
            </form>

            {hata && <div style={{ padding: '10px', backgroundColor: '#ffebee', color: '#c62828', marginBottom: '20px', borderRadius: '4px' }}>Hata: {hata}</div>}

            {/* Sonuç Listeleme */}
            {sonuclar.length > 0 && (
                <div>
                    <h3 style={{ borderBottom: '1px solid #eee', paddingBottom: '10px' }}>Bulunan {sonuclar.length} Sonuç:</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '20px' }}>
                        {sonuclar.map((icerik, index) => {
                            const durum = kayitDurumu[icerik.harici_id];
                            
                            // Duruma göre kenarlık rengi
                            let borderStyle = '1px solid #eee';
                            if (durum === 'yukleniyor') borderStyle = '2px solid orange';
                            if (durum === 'basarili') borderStyle = '2px solid green';
                            if (durum === 'hata') borderStyle = '2px solid red';

                            return (
                                <div 
                                    key={index} 
                                    style={{ 
                                        border: borderStyle, 
                                        padding: '10px', 
                                        cursor: 'pointer',
                                        borderRadius: '8px',
                                        boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
                                        transition: 'transform 0.2s',
                                        backgroundColor: durum === 'yukleniyor' ? '#fff8e1' : 'white'
                                    }}
                                    onClick={() => detaySayfasinaGit(icerik.harici_id)}
                                >
                                    <div style={{ position: 'relative', width: '100%', paddingTop: '150%', marginBottom: '10px', backgroundColor: '#f0f0f0' }}>
                                        <img 
                                            src={icerik.kapak_url || 'https://via.placeholder.com/150x225?text=Resim+Yok'} 
                                            alt={icerik.baslik} 
                                            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', borderRadius: '4px' }} 
                                        />
                                    </div>
                                    <p style={{ margin: '0 0 5px 0', fontWeight: 'bold', fontSize: '14px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                        {icerik.baslik}
                                    </p>
                                    <p style={{ margin: 0, fontSize: '12px', color: '#666' }}>{icerik.yayin_yili}</p>
                                    
                                    {/* Durum Mesajı */}
                                    {durum === 'yukleniyor' && <p style={{ fontSize: '11px', color: 'orange', fontWeight: 'bold' }}>⏳ İşleniyor...</p>}
                                    {durum === 'basarili' && <p style={{ fontSize: '11px', color: 'green', fontWeight: 'bold' }}>✅ Eklendi</p>}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
            
            {!yukleniyor && sonuclar.length === 0 && !hata && aramaTerimi && (
                <p style={{ textAlign: 'center', color: '#888', marginTop: '30px' }}>Sonuç bulunamadı.</p>
            )}
        </div>
    );
};

export default AramaSayfasi;
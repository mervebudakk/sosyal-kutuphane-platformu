// frontend/src/Sayfalar/AramaSayfasi.jsx (GÜNCELLENMİŞ VERSİYON)

import React, { useState } from 'react';
import { hariciFilmleriAra, hariciKitaplariAra, icerigiKaydetVeDetaylariCek } from '../Servisler/apiServis'; 

// --- Sekmeli Yapı Bileşenleri ---
const SekmeStili = (aktif) => ({
    padding: '10px 20px',
    cursor: 'pointer',
    borderBottom: aktif ? '3px solid #333' : '1px solid #ccc',
    fontWeight: aktif ? 'bold' : 'normal',
    marginRight: '10px',
    display: 'inline-block'
});

const AramaSayfasi = () => { 
    // State'ler
    const [aktifKategori, setAktifKategori] = useState('film'); // Başlangıçta film
    const [aramaTerimi, setAramaTerimi] = useState('inception');
    const [sonuclar, setSonuclar] = useState([]); 
    const [yukleniyor, setYukleniyor] = useState(false); 
    const [hata, setHata] = useState(null); 
    const [kayitDurumu, setKayitDurumu] = useState({}); 

    // Arama Fonksiyonu
    const aramaYap = async (e) => { 
        e.preventDefault();
        setYukleniyor(true);
        setHata(null);
        setSonuclar([]);
        setKayitDurumu({});

        try {
            let filmlerVeyaKitaplar;
            
            if (aktifKategori === 'film') {
                filmlerVeyaKitaplar = await hariciFilmleriAra(aramaTerimi);
            } else {
                // Kitap arama fonksiyonunu kullan (Dilay'ın entegrasyonu)
                filmlerVeyaKitaplar = await hariciKitaplariAra(aramaTerimi);
            }

            setSonuclar(filmlerVeyaKitaplar);
        } catch (err) {
            setHata(err.message);
        } finally {
            setYukleniyor(false);
        }
    };

    // Filmi API'den çekip veritabanına kaydeden işlev (Kaydetme mantığı aynı kalır)
    const icerikKaydet = async (hariciId) => {
        setKayitDurumu(prev => ({ ...prev, [hariciId]: 'kaydediliyor' }));
        setHata(null);
        try {
            const kaydedilen = await icerigiKaydetVeDetaylariCek(hariciId);
            setKayitDurumu(prev => ({ ...prev, [hariciId]: 'başarılı' }));
            console.log("Veritabanına Kaydedilen İçerik:", kaydedilen); 
        } catch (err) {
            setKayitDurumu(prev => ({ ...prev, [hariciId]: 'hata' }));
            setHata(err.message);
        }
    };

    // Detay sayfasına yönlendirme işlevi
    const detaySayfasinaGit = async (hariciId) => {
        // Filmi kaydetme işlemini başlat (Veritabanında kaydın kalıcı olmasını sağlar)
        try {
            const kaydedilenIcerik = await icerigiKaydetVeDetaylariCek(hariciId);
            
            // Yönlendirme simülasyonu:
            console.log(`✅ Başarıyla kaydedildi. Şimdi İçerik Detay sayfasına yönlendiriliyor: /icerik/${kaydedilenIcerik.icerik_id}`);
            // Normalde burada navigate('/icerik/' + kaydedilenIcerik.icerik_id); komutu yer alır.

        } catch (err) {
            setHata(`Detay çekme ve kaydetme hatası: ${err.message}`);
        }
    };

    return (
        <div style={{ maxWidth: '900px', margin: '50px auto', padding: '20px' }}>
            
            {/* Kategori Sekmeleri */}
            <div style={{ marginBottom: '20px', borderBottom: '1px solid #ccc' }}>
                <div 
                    style={SekmeStili(aktifKategori === 'film')}
                    onClick={() => { setAktifKategori('film'); setSonuclar([]); setAramaTerimi(''); }}
                >
                    🎥 Filmler
                </div>
                <div 
                    style={SekmeStili(aktifKategori === 'kitap')}
                    onClick={() => { setAktifKategori('kitap'); setSonuclar([]); setAramaTerimi(''); }}
                >
                    📚 Kitaplar
                </div>
            </div>

            <h2>{aktifKategori === 'film' ? 'Film' : 'Kitap'} Arama</h2>
            
            {/* Arama Formu */}
            <form onSubmit={aramaYap} style={{ marginBottom: '20px' }}>
                <input
                    type="text"
                    value={aramaTerimi}
                    onChange={(e) => setAramaTerimi(e.target.value)}
                    placeholder={`${aktifKategori === 'film' ? 'Film' : 'Kitap'} Başlığı Girin...`}
                    style={{ padding: '10px', width: '70%', marginRight: '10px' }}
                />
                <button type="submit" disabled={yukleniyor} style={{ padding: '10px 20px', cursor: yukleniyor ? 'not-allowed' : 'pointer' }}>
                    {yukleniyor ? 'Aranıyor...' : 'Ara'}
                </button>
            </form>

            {hata && <p style={{ color: 'red' }}>Hata: {hata}</p>}

            {/* Sonuç Listeleme */}
            {sonuclar.length > 0 && (
                <div>
                    <h3>Bulunan {sonuclar.length} {aktifKategori === 'film' ? 'Film' : 'Kitap'}:</h3>
                    <div style={{ textAlign: 'left', display: 'flex', flexWrap: 'wrap', gap: '20px', justifyContent: 'center' }}>
                        {sonuclar.map((icerik, index) => {
                            const durum = kayitDurumu[icerik.harici_id];
                            return (
                                <div 
                                    key={index} 
                                    style={{ 
                                        width: '180px', 
                                        border: durum === 'başarılı' ? '2px solid green' : '1px solid #eee', 
                                        padding: '10px', 
                                        cursor: 'pointer' // Tıklanabilir yapın
                                    }}
                                    onClick={() => detaySayfasinaGit(icerik.harici_id)} // Detay sayfasına yönlendir
                                >
                                    <img src={icerik.kapak_url || 'https://via.placeholder.com/180x270'} alt={icerik.baslik} style={{ width: '100%', height: 'auto' }} />
                                    <p><strong>{icerik.baslik}</strong> ({icerik.yayin_yili})</p>
                                    <p style={{ fontSize: '12px', color: '#666' }}>ID: {icerik.harici_id}</p>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
            
            {!yukleniyor && sonuclar.length === 0 && !hata && aramaTerimi && (
                <p>Arama sonuçlanmadı veya sonuç bulunamadı.</p>
            )}
        </div>
    );
};

export default AramaSayfasi;
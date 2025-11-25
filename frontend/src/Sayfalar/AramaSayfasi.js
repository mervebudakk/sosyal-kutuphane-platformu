// frontend/src/Sayfalar/AramaSayfasi.jsx

import React, { useState } from 'react';
// Yeni konumdan Türkçe fonksiyonumuzu import ediyoruz
import { hariciFilmleriAra } from '../Servisler/apiServis'; 

const AramaSayfasi = () => { // Bileşen Adı Düzeltildi
    const [aramaTerimi, setAramaTerimi] = useState('inception'); // Türkçe state adı
    const [sonuclar, setSonuclar] = useState([]); // Türkçe state adı
    const [yukleniyor, setYukleniyor] = useState(false); // Türkçe state adı
    const [hata, setHata] = useState(null); // Türkçe state adı

    const aramaYap = async (e) => { // Fonksiyon Adı Düzeltildi
        e.preventDefault();
        setYukleniyor(true);
        setHata(null);
        setSonuclar([]);

        try {
            // Sadece film arama fonksiyonumuzu test ediyoruz
            const filmler = await hariciFilmleriAra(aramaTerimi);
            setSonuclar(filmler);
        } catch (err) {
            setHata(err.message);
        } finally {
            setYukleniyor(false);
        }
    };

    return (
        <div style={{ maxWidth: '800px', margin: '50px auto', padding: '20px' }}>
            <h2>Film Arama ve TMDb Bağlantı Testi</h2>
            
            <form onSubmit={aramaYap} style={{ marginBottom: '20px' }}> {/* Fonksiyon Adı Kullanıldı */}
                <input
                    type="text"
                    value={aramaTerimi}
                    onChange={(e) => setAramaTerimi(e.target.value)}
                    placeholder="Film Başlığı Girin (örn: Inception)"
                    style={{ padding: '10px', width: '70%', marginRight: '10px' }}
                />
                <button type="submit" disabled={yukleniyor} style={{ padding: '10px 20px', cursor: yukleniyor ? 'not-allowed' : 'pointer' }}>
                    {yukleniyor ? 'Aranıyor...' : 'Ara'}
                </button>
            </form>

            {hata && <p style={{ color: 'red' }}>Hata: {hata}</p>} {/* Hata state'i kullanıldı */}

            {sonuclar.length > 0 && (
                <div>
                    <h3>Bulunan {sonuclar.length} Film:</h3>
                    <div style={{ textAlign: 'left', display: 'flex', flexWrap: 'wrap', gap: '20px' }}>
                        {sonuclar.map((movie, index) => (
                            <div key={index} style={{ width: '150px', border: '1px solid #eee', padding: '10px' }}>
                                <img src={movie.kapak_url || 'https://via.placeholder.com/150'} alt={movie.baslik} style={{ width: '100%', height: 'auto' }} />
                                <p><strong>{movie.baslik}</strong> ({movie.yayin_yili})</p>
                                <p style={{ fontSize: '12px', color: '#666' }}>ID: {movie.harici_id}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}
            
            {!yukleniyor && sonuclar.length === 0 && !hata && aramaTerimi && (
                <p>Arama sonuçlanmadı veya sonuç bulunamadı.</p>
            )}
        </div>
    );
};

export default AramaSayfasi; // Dışa Aktarma Adı Düzeltildi
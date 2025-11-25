import React, { useState } from 'react';
import { Search, Film, BookOpen, Loader, ChevronRight, CheckCircle, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { 
    hariciFilmleriAra, 
    hariciKitaplariAra, 
    icerigiKaydetVeDetaylariCek, 
    kitapKaydetVeDetaylariCek 
} from '../Servisler/apiServis';

const AramaSayfasi = () => { 
    const navigate = useNavigate();
    const [aktifKategori, setAktifKategori] = useState('film');
    const [aramaTerimi, setAramaTerimi] = useState('');
    const [sonuclar, setSonuclar] = useState([]);
    const [yukleniyor, setYukleniyor] = useState(false);
    const [hata, setHata] = useState(null);
    const [kayitDurumu, setKayitDurumu] = useState({}); 

    // --- MANTIK KISMI (AYNEN KORUNDU) ---
    const aramaYap = async (e) => { 
        if (e) e.preventDefault();
        if (!aramaTerimi.trim()) return;
        setYukleniyor(true); setHata(null); setSonuclar([]); setKayitDurumu({});
        try {
            let gelenSonuclar = [];
            if (aktifKategori === 'film') gelenSonuclar = await hariciFilmleriAra(aramaTerimi);
            else gelenSonuclar = await hariciKitaplariAra(aramaTerimi);
            setSonuclar(gelenSonuclar);
        } catch (err) { setHata(err.message); } finally { setYukleniyor(false); }
    };

    const detaySayfasinaGit = async (hariciId) => {
        setKayitDurumu(prev => ({ ...prev, [hariciId]: 'yukleniyor' }));
        try {
            let kaydedilenIcerik;
            if (aktifKategori === 'film') kaydedilenIcerik = await icerigiKaydetVeDetaylariCek(hariciId);
            else kaydedilenIcerik = await kitapKaydetVeDetaylariCek(hariciId);
            setKayitDurumu(prev => ({ ...prev, [hariciId]: 'basarili' }));
            setTimeout(() => { navigate(`/icerik/${kaydedilenIcerik.icerik_id}`); }, 500);
        } catch (err) {
            console.error(err);
            setKayitDurumu(prev => ({ ...prev, [hariciId]: 'hata' }));
            alert("Hata: " + err.message);
        }
    };
    // ------------------------------------

    return (
        <div style={{
            minHeight: '100vh',
            background: '#121212', // IMDb Main Background
            padding: '40px 20px',
            fontFamily: "'Roboto', sans-serif",
            color: '#ffffff'
        }}>
            <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                
                {/* Header */}
                <div style={{ textAlign: 'center', marginBottom: '40px' }}>
                    <h1 style={{ 
                        color: '#F5C518', // IMDb Sarısı
                        fontSize: '3rem', 
                        fontWeight: '900', 
                        marginBottom: '10px', 
                        textTransform: 'uppercase',
                        letterSpacing: '1px'
                    }}>
                        Keşfet & Ara
                    </h1>
                    <p style={{ color: '#CCCCCC', fontSize: '1.1rem' }}>
                        Favori içeriklerini bul ve koleksiyonuna ekle.
                    </p>
                </div>

                {/* Kategori Seçimi */}
                <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginBottom: '40px' }}>
                    {[
                        { id: 'film', icon: Film, label: 'Filmler' },
                        { id: 'kitap', icon: BookOpen, label: 'Kitaplar' }
                    ].map(kategori => {
                        const Icon = kategori.icon;
                        const aktif = aktifKategori === kategori.id;
                        return (
                            <button
                                key={kategori.id}
                                onClick={() => { setAktifKategori(kategori.id); setSonuclar([]); setAramaTerimi(''); setHata(null); }}
                                style={{
                                    background: aktif ? '#F5C518' : '#1F1F1F',
                                    color: aktif ? 'black' : 'white',
                                    border: aktif ? 'none' : '1px solid #333',
                                    padding: '12px 30px',
                                    borderRadius: '25px',
                                    cursor: 'pointer',
                                    fontSize: '1rem',
                                    fontWeight: 'bold',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '10px',
                                    transition: 'all 0.2s ease'
                                }}
                            >
                                <Icon size={20} />
                                {kategori.label}
                            </button>
                        );
                    })}
                </div>

                {/* Arama Kutusu */}
                <div style={{ marginBottom: '50px' }}>
                    <div style={{
                        background: '#1F1F1F', 
                        padding: '8px', 
                        borderRadius: '4px', 
                        display: 'flex', 
                        alignItems: 'center', 
                        border: '1px solid #333',
                        maxWidth: '700px', 
                        margin: '0 auto'
                    }}>
                        <Search size={24} color="#F5C518" style={{ marginLeft: '15px', marginRight: '15px' }} />
                        <input
                            type="text"
                            value={aramaTerimi}
                            onChange={(e) => setAramaTerimi(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && aramaYap()}
                            placeholder={aktifKategori === 'film' ? 'Matrix, Interstellar...' : 'Harry Potter, 1984...'}
                            style={{
                                flex: 1, 
                                border: 'none', 
                                outline: 'none', 
                                fontSize: '1.1rem', 
                                padding: '10px 0', 
                                background: 'transparent', 
                                color: 'white' 
                            }}
                        />
                        <button 
                            onClick={aramaYap}
                            disabled={yukleniyor}
                            style={{
                                background: '#F5C518',
                                color: 'black', 
                                border: 'none', 
                                borderRadius: '4px', 
                                padding: '10px 30px',
                                fontSize: '1rem', 
                                fontWeight: 'bold', 
                                cursor: yukleniyor ? 'not-allowed' : 'pointer',
                                opacity: yukleniyor ? 0.7 : 1,
                                transition: 'background 0.2s'
                            }}
                        >
                            {yukleniyor ? <Loader size={20} className="animate-spin" /> : 'Ara'}
                        </button>
                    </div>
                </div>

                {/* Hata Mesajı */}
                {hata && (
                    <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid #ef4444', color: '#ef4444', padding: '15px', borderRadius: '4px', marginBottom: '30px', maxWidth: '700px', margin: '0 auto 30px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <AlertCircle size={20} /> <strong>Hata:</strong> {hata}
                    </div>
                )}

                {/* Sonuçlar */}
                {sonuclar.length > 0 && (
                    <div>
                        <h3 style={{ color: '#F5C518', fontSize: '1.5rem', marginBottom: '20px', fontWeight: '700', borderLeft: '4px solid #F5C518', paddingLeft: '10px' }}>
                            Sonuçlar ({sonuclar.length})
                        </h3>
                        
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '20px' }}>
                            {sonuclar.map((icerik, index) => {
                                const durum = kayitDurumu[icerik.harici_id];
                                return (
                                    <div 
                                        key={index}
                                        onClick={() => detaySayfasinaGit(icerik.harici_id)}
                                        style={{
                                            background: '#1A1A1A', 
                                            borderRadius: '4px', // Köşeli yapı
                                            overflow: 'hidden', 
                                            cursor: 'pointer', 
                                            transition: 'transform 0.2s ease',
                                            position: 'relative',
                                            border: durum === 'yukleniyor' ? '2px solid #F5C518' : '1px solid #333'
                                        }}
                                        onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.02)'; e.currentTarget.style.border = '1px solid #F5C518'; }}
                                        onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.border = '1px solid #333'; }}
                                    >
                                        {/* Durum Badge */}
                                        {durum && (
                                            <div style={{
                                                position: 'absolute', top: '0', right: '0',
                                                background: durum === 'yukleniyor' ? '#F5C518' : '#5799ef',
                                                color: durum === 'yukleniyor' ? 'black' : 'white',
                                                padding: '4px 10px', 
                                                borderBottomLeftRadius: '8px',
                                                fontSize: '0.75rem', fontWeight: 'bold', zIndex: 10,
                                                display: 'flex', alignItems: 'center', gap: '4px'
                                            }}>
                                                {durum === 'yukleniyor' ? <><Loader size={12} className="animate-spin" /> Hazırlanıyor</> : <><ChevronRight size={14} /> Açılıyor</>}
                                            </div>
                                        )}
                                        
                                        <div style={{ width: '100%', paddingTop: '150%', position: 'relative', background: '#222' }}>
                                            <img 
                                                src={icerik.kapak_url || 'https://via.placeholder.com/300x450?text=Resim+Yok'} 
                                                alt={icerik.baslik}
                                                style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                                            />
                                        </div>
                                        <div style={{ padding: '12px' }}>
                                            <h4 style={{ margin: '0 0 5px 0', fontSize: '0.95rem', fontWeight: 'bold', color: '#FFFFFF', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                {icerik.baslik}
                                            </h4>
                                            <span style={{ color: '#AAAAAA', fontSize: '0.85rem' }}>
                                                {icerik.yayin_yili}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } } .animate-spin { animation: spin 1s linear infinite; }`}</style>
        </div>
    );
};

export default AramaSayfasi;
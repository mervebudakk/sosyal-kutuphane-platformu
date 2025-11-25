import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../Servisler/supabaseServis';

const IcerikDetaySayfasi = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [icerik, setIcerik] = useState(null);
    const [yukleniyor, setYukleniyor] = useState(true);

    useEffect(() => {
        const icerikGetir = async () => {
            const { data, error } = await supabase
                .from('Icerikler')
                .select(`
                    *,
                    IcerikIstatistikleri (
                        ortalama_puan,
                        toplam_oy_sayisi
                    )
                `)
                .eq('icerik_id', id)
                .single();

            if (error) {
                console.error("Veri çekme hatası:", error);
            } else {
                setIcerik(data);
            }
            setYukleniyor(false);
        };

        if (id) icerikGetir();
    }, [id]);

    // 👇 Durum Güncelleme Fonksiyonu
    const durumGuncelle = async (yeniDurum) => {
        try {
            // 1. Supabase Auth'dan giriş yapmış kullanıcının bilgisini al
            const { data: { user } } = await supabase.auth.getUser();
            
            if (!user) {
                alert("İşlem yapabilmek için giriş yapmalısınız!");
                return;
            }

            // 2. KRİTİK ADIM: Auth ID'si yerine Merve'nin 'Kullanicilar' tablosundaki ID'yi bulmalıyız.
            // Bunu 'eposta' adresi üzerinden eşleştirerek yapıyoruz.
            const { data: kullaniciData, error: kullaniciError } = await supabase
                .from('Kullanicilar')
                .select('kullanici_id')
                .eq('eposta', user.email)
                .single();

            if (kullaniciError || !kullaniciData) {
                console.error("Kullanıcı Bulunamadı Hatası:", kullaniciError);
                alert("Hata: Kullanıcı profiliniz veritabanında bulunamadı. Lütfen çıkış yapıp tekrar kayıt olun.");
                return;
            }

            // 3. Artık gerçek ID'yi (kullaniciData.kullanici_id) kullanabiliriz
            const { error } = await supabase
                .from('KullaniciIcerikDurumlari')
                .upsert({
                    kullanici_id: kullaniciData.kullanici_id, // <-- DÜZELTİLEN KISIM
                    icerik_id: icerik.icerik_id, 
                    durum: yeniDurum
                }, { onConflict: 'kullanici_id, icerik_id' });

            if (error) throw error;

            // Mesajı duruma göre güzelleştiriyoruz
            let mesaj = "";
            if (yeniDurum === 'izledim' || yeniDurum === 'okudum') {
                mesaj = `Bu içerik başarıyla "${yeniDurum}" olarak işaretlendi.`;
            } else {
                mesaj = `Başarıyla "${yeniDurum === 'izlenecek' ? 'izlenecekler' : 'okunacaklar'}" listesine eklendi!`;
            }

            alert(mesaj);

        } catch (error) {
            console.error("Durum güncelleme hatası:", error);
            alert("Bir hata oluştu: " + error.message);
        }
    };

    if (yukleniyor) return <div style={{textAlign:'center', marginTop:'50px', fontSize:'18px'}}>Yükleniyor...</div>;
    
    if (!icerik) return (
        <div style={{textAlign:'center', marginTop:'50px'}}>
            <h2>İçerik Bulunamadı</h2>
            <button onClick={() => navigate(-1)} style={{cursor:'pointer', padding:'10px'}}>Geri Dön</button>
        </div>
    );

    const istatistik = Array.isArray(icerik.IcerikIstatistikleri) 
        ? icerik.IcerikIstatistikleri[0] 
        : icerik.IcerikIstatistikleri;
        
    const puan = istatistik?.ortalama_puan || 0;
    const oySayisi = istatistik?.toplam_oy_sayisi || 0;

    return (
        // 👇 Ana kapsayıcı div BURADA BAŞLIYOR (Sende eksik olan buydu)
        <div style={{ maxWidth: '1000px', margin: '30px auto', padding: '20px', display: 'flex', gap: '40px', fontFamily: 'Arial, sans-serif' }}>
            
            {/* SOL TARAF: KAPAK VE İŞLEM BUTONLARI */}
            <div style={{ width: '300px', flexShrink: 0 }}>
                <div style={{ position: 'relative', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 8px 16px rgba(0,0,0,0.2)' }}>
                    <img 
                        src={icerik.kapak_url || 'https://via.placeholder.com/300x450?text=Kapak+Yok'} 
                        alt={icerik.baslik} 
                        style={{ width: '100%', display: 'block' }}
                    />
                </div>
                
                {/* Aksiyon Butonları */}
                <div style={{ marginTop: '25px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    
                    {/* BUTON 1: OKUDUM / İZLEDİM */}
                    <button 
                        onClick={() => durumGuncelle(icerik.icerik_turu === 'film' ? 'izledim' : 'okudum')}
                        style={{ 
                            padding: '12px', 
                            backgroundColor: '#2c3e50', 
                            color: 'white', 
                            border: 'none', 
                            borderRadius: '6px', 
                            cursor: 'pointer',
                            fontSize: '16px',
                            fontWeight: 'bold',
                            transition: 'background 0.2s'
                        }}
                        onMouseOver={(e) => e.target.style.backgroundColor = '#1a252f'}
                        onMouseOut={(e) => e.target.style.backgroundColor = '#2c3e50'}
                    >
                        {icerik.icerik_turu === 'film' ? '👁️ İzledim' : '📖 Okudum'} Olarak İşaretle
                    </button>
                    
                    {/* BUTON 2: LİSTEYE EKLE (OKUNACAK / İZLENECEK) */}
                    <button 
                        onClick={() => durumGuncelle(icerik.icerik_turu === 'film' ? 'izlenecek' : 'okunacak')}
                        style={{ 
                            padding: '12px', 
                            backgroundColor: '#ecf0f1', 
                            border: '1px solid #bdc3c7', 
                            borderRadius: '6px', 
                            cursor: 'pointer',
                            fontSize: '16px',
                            color: '#2c3e50'
                        }}
                    >
                        ➕ {icerik.icerik_turu === 'film' ? 'İzlenecekler' : 'Okunacaklar'} Listesine Ekle
                    </button>
                </div>
            </div>

            {/* SAĞ TARAF: DETAYLAR */}
            <div style={{ flex: 1 }}>
                <h1 style={{ marginTop: 0, fontSize: '2.5rem', marginBottom: '10px', color: '#2c3e50' }}>
                    {icerik.baslik} 
                    {icerik.yayin_yili && <span style={{fontSize: '0.6em', color: '#7f8c8d', fontWeight: 'normal', marginLeft: '10px'}}>({icerik.yayin_yili})</span>}
                </h1>
                
                {/* Puan Bilgisi (Veritabanından) */}
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '25px', backgroundColor: '#f9f9f9', padding: '10px 15px', borderRadius: '8px', width: 'fit-content' }}>
                    <span style={{ fontSize: '28px', color: '#f1c40f', marginRight: '5px' }}>★</span>
                    <span style={{ fontSize: '24px', fontWeight: 'bold', color: '#2c3e50' }}>{Number(puan).toFixed(1)}</span>
                    <span style={{ marginLeft: '8px', color: '#7f8c8d', fontSize: '14px' }}>/ 10 ({oySayisi} oy)</span>
                </div>

                {/* Meta Veriler Tablosu */}
                <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', rowGap: '12px', marginBottom: '30px' }}>
                    
                    <strong style={{color: '#7f8c8d'}}>Tür:</strong>
                    <span style={{textTransform: 'capitalize'}}>{icerik.icerik_turu}</span>
                    
                    <strong style={{color: '#7f8c8d'}}>{icerik.icerik_turu === 'film' ? 'Yönetmen' : 'Yazar'}:</strong>
                    <span>{icerik.yazar_yonetmen || 'Bilinmiyor'}</span>
                    
                    <strong style={{color: '#7f8c8d'}}>Kategoriler:</strong>
                    <span>{icerik.turler || '-'}</span>
                    
                    {(icerik.sure_sayfa_sayisi > 0) && (
                        <>
                            <strong style={{color: '#7f8c8d'}}>{icerik.icerik_turu === 'film' ? 'Süre' : 'Sayfa'}:</strong>
                            <span>{icerik.sure_sayfa_sayisi} {icerik.icerik_turu === 'film' ? 'dakika' : 'sayfa'}</span>
                        </>
                    )}
                </div>

                <h3 style={{ borderBottom: '2px solid #ecf0f1', paddingBottom: '10px', color: '#2c3e50' }}>Özet</h3>
                {/* HTML Düzeltmesi Yapılmış Özet Kısmı */}
                <div 
                    style={{ lineHeight: '1.7', color: '#34495e', fontSize: '16px', textAlign: 'justify' }}
                    dangerouslySetInnerHTML={{ __html: icerik.ozet || "Bu içerik için henüz bir özet girilmemiş." }}
                />

                <div style={{ marginTop: '40px' }}>
                    <h3 style={{ borderBottom: '2px solid #ecf0f1', paddingBottom: '10px', color: '#2c3e50' }}>Yorumlar ve Değerlendirmeler</h3>
                    <div style={{ padding: '20px', backgroundColor: '#f9f9f9', borderRadius: '8px', textAlign: 'center', color: '#7f8c8d', border: '1px dashed #bdc3c7' }}>
                        Henüz yorum yapılmamış. İlk yorumu sen yap!
                    </div>
                </div>
            </div>
        </div>
    );
};

export default IcerikDetaySayfasi;
import React, { useState, useEffect } from 'react';
import { supabase } from './Servisler/supabaseServis';
import GirisKayit from './Sayfalar/GirisKayit.jsx'; 
import AramaSayfasi from './Sayfalar/AramaSayfasi.jsx'; 
import GezinmeCubugu from './Bilesenler/GezinmeCubugu.jsx'; // Yeni bileşenimiz

function AnaSayfaGoster() {
    // Burası Sosyal Akış (Feed) sayfası olacak. Şimdilik sadece mesaj gösteriyoruz.
    return (
        <div style={{ padding: '20px' }}>
            <h2>Sosyal Akış (Feed)</h2>
            <p>Burada takip ettiğiniz kullanıcıların son aktiviteleri (Puanlama, Yorum) listelenecektir.</p>
        </div>
    );
}

function ProfilSayfasiGoster() {
    // Burası Kütüphanem / Profil sayfası olacak.
    return (
        <div style={{ padding: '20px' }}>
            <h2>Kütüphanem / Profil</h2>
            <p>Burada İzlediklerim, Okunacaklar ve Özel Listeleriniz yer alacaktır.</p>
        </div>
    );
}


function App() {
    const [session, setSession] = useState(null);
    // Hangi sekmenin aktif olduğunu tutar. Başlangıçta Feed açılır.
    const [aktifSekme, setAktifSekme] = useState('feed'); 

    // Oturum durumunu dinleme mantığı
    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
        });

        const { data: authListener } = supabase.auth.onAuthStateChange(
            (_event, session) => {
                setSession(session);
                // Oturum değiştiğinde (örn: giriş yaptığında) ana sayfaya yönlendir
                if (session) setAktifSekme('feed'); 
            }
        );

        return () => {
            if (authListener && authListener.subscription) {
                 authListener.subscription.unsubscribe();
            }
        };
    }, []);

    const handleLogout = async () => {
        await supabase.auth.signOut();
    };

    // Aktif sekmeye göre bileşeni render eden fonksiyon
    const renderAktifSayfa = () => {
        switch (aktifSekme) {
            case 'feed':
                return <AnaSayfaGoster />;
            case 'arama':
                return <AramaSayfasi />;
            case 'profil':
                return <ProfilSayfasiGoster />;
            default:
                return <AnaSayfaGoster />;
        }
    }

    return (
        <div className="container" style={{ textAlign: 'center' }}>
            <header>
                <h1>Sosyal Kütüphane Platformu</h1>
            </header>
            
            {!session ? (
                // Oturum yoksa, Giriş/Kayıt ekranını göster
                <GirisKayit />
            ) : (
                // Oturum varsa, Ana Uygulama Layout'unu göster
                <div>
                    <div style={{ padding: '10px 0', borderBottom: '1px solid #eee' }}>
                        Hoş Geldiniz, {session.user.email}! 
                        <button onClick={handleLogout} style={{ marginLeft: '15px', padding: '5px 10px', cursor: 'pointer' }}>
                            Çıkış Yap
                        </button>
                    </div>
                    
                    <GezinmeCubugu setActiveTab={setAktifSekme} /> 
                    
                    <main>
                        {renderAktifSayfa()}
                    </main>
                </div>
            )}
        </div>
    );
}

export default App;
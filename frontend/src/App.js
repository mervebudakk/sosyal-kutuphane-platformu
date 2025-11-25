import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useNavigate } from 'react-router-dom'; // 1. Router importları
import { supabase } from './Servisler/supabaseServis';

// Sayfaları İçe Aktar
import GirisKayit from './Sayfalar/GirisKayit.jsx'; 
import AramaSayfasi from './Sayfalar/AramaSayfasi.jsx'; 
import IcerikDetaySayfasi from './Sayfalar/IcerikDetaySayfasi.jsx'; // 2. Detay sayfasını ekle
// import GezinmeCubugu from './Bilesenler/GezinmeCubugu.jsx'; // Bunu şimdilik Link ile değiştireceğiz

// --- GÜNCEL ANASAYFA VE PROFIL BİLEŞENLERİ ---
function AnaSayfaGoster() {
    return (
        <div style={{ padding: '20px' }}>
            <h2>Sosyal Akış (Feed)</h2>
            <p>Burada takip ettiğiniz kullanıcıların son aktiviteleri listelenecektir.</p>
        </div>
    );
}

function ProfilSayfasiGoster() {
    return (
        <div style={{ padding: '20px' }}>
            <h2>Kütüphanem / Profil</h2>
            <p>Burada İzlediklerim, Okunacaklar ve Özel Listeleriniz yer alacaktır.</p>
        </div>
    );
}

function App() {
    const [session, setSession] = useState(null);
    const navigate = useNavigate(); // Yönlendirme için

    useEffect(() => {
        // Oturum kontrolü
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
        });

        const { data: authListener } = supabase.auth.onAuthStateChange(
            (_event, session) => {
                setSession(session);
            }
        );

        return () => {
            if (authListener && authListener.subscription) {
                 authListener.subscription.unsubscribe();
            }
        };
    }, [navigate]);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        navigate('/'); // Çıkış yapınca başa dön
    };

    return (
        <div className="container" style={{ textAlign: 'center', fontFamily: 'Arial, sans-serif' }}>
            <header style={{ padding: '20px', backgroundColor: '#333', color: 'white' }}>
                <h1 style={{ margin: 0 }}>Sosyal Kütüphane Platformu</h1>
            </header>
            
            {!session ? (
                // Oturum Yoksa
                <GirisKayit />
            ) : (
                // Oturum Varsa
                <div>
                    <div style={{ padding: '10px', backgroundColor: '#f4f4f4', borderBottom: '1px solid #ddd', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span>Hoş Geldiniz, <strong>{session.user.email}</strong>!</span>
                        <button onClick={handleLogout} style={{ padding: '5px 15px', cursor: 'pointer', backgroundColor: '#c0392b', color: 'white', border: 'none', borderRadius: '4px' }}>
                            Çıkış Yap
                        </button>
                    </div>
                    
                    {/* 3. YENİ NAVİGASYON (Router Uyumlu) */}
                    <nav style={{ padding: '15px', borderBottom: '1px solid #eee', marginBottom: '20px' }}>
                        <Link to="/" style={{ margin: '0 15px', textDecoration: 'none', color: '#333', fontWeight: 'bold' }}>Ana Sayfa (Feed)</Link>
                        <Link to="/arama" style={{ margin: '0 15px', textDecoration: 'none', color: '#333', fontWeight: 'bold' }}>🔍 Arama & Keşfet</Link>
                        <Link to="/profil" style={{ margin: '0 15px', textDecoration: 'none', color: '#333', fontWeight: 'bold' }}>👤 Kütüphanem</Link>
                    </nav>
                    
                    {/* 4. SAYFA YÖNLENDİRİCİSİ (ROUTES) */}
                    <main>
                        <Routes>
                            <Route path="/" element={<AnaSayfaGoster />} />
                            <Route path="/arama" element={<AramaSayfasi />} />
                            <Route path="/profil" element={<ProfilSayfasiGoster />} />
                            {/* İŞTE SİHİRLİ SATIR BURASI 👇 */}
                            <Route path="/icerik/:id" element={<IcerikDetaySayfasi />} />
                        </Routes>
                    </main>
                </div>
            )}
        </div>
    );
}

export default App;
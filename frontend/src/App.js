import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import { supabase } from './Servisler/supabaseServis'; 
import { Home, Search, User, LogOut, Library } from 'lucide-react'; // Library ikonu eklendi

// Sayfalar
import GirisKayit from './Sayfalar/GirisKayit.jsx'; 
import AramaSayfasi from './Sayfalar/AramaSayfasi.jsx'; 
import IcerikDetaySayfasi from './Sayfalar/IcerikDetaySayfasi.jsx';
import ProfilSayfasi from './Sayfalar/ProfilSayfasi.jsx';
import AnaSayfa from './Sayfalar/AnaSayfa.jsx';


function App() {
    const [session, setSession] = useState(null);
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
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
    }, []);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        navigate('/');
    };

    // Kullanıcı adını (e-postadan) almak için küçük bir helper
    const kullaniciAdi = session?.user?.email?.split('@')[0] || 'Kullanıcı';

    const NavLink = ({ to, icon: Icon, label }) => {
        const isActive = location.pathname === to;
        return (
            <Link to={to} style={{ 
                display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none', 
                color: isActive ? '#F5C518' : '#FFFFFF', fontWeight: isActive ? 'bold' : 'normal',
                padding: '8px 16px', borderRadius: '20px',
                background: isActive ? 'rgba(245, 197, 24, 0.1)' : 'transparent', transition: 'all 0.3s ease'
            }}>
                <Icon size={20} /> {label}
            </Link>
        );
    };

    return (
        <div style={{ minHeight: '100vh', background: '#121212', color: 'white', fontFamily: "'Roboto', sans-serif" }}>
            {!session ? (
                <GirisKayit />
            ) : (
                <div>
                    {/* ÜST NAVİGASYON ÇUBUĞU */}
                    <nav style={{ 
                        background: '#1F1F1F', borderBottom: '1px solid #333', padding: '15px 0',
                        position: 'sticky', top: 0, zIndex: 100, boxShadow: '0 4px 20px rgba(0,0,0,0.5)'
                    }}>
                        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            
                            {/* LOGO (DÜZELTİLDİ - Artık kutu yok, temiz ikon+yazı) */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1.5rem', fontWeight: '900', letterSpacing: '1px', color: '#F5C518' }}>
                                <Library size={32} strokeWidth={2.5} /> {/* Kitaplık İkonu */}
                                <span>SOSYAL<span style={{ color: 'white' }}>KÜTÜPHANE</span></span>
                            </div>

                            {/* ORTA MENÜ */}
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <NavLink to="/" icon={Home} label="Ana Sayfa" />
                                <NavLink to="/arama" icon={Search} label="Keşfet" />
                                <NavLink to="/profil" icon={User} label="Kütüphanem" />
                            </div>

                            {/* SAĞ TARAF: HOŞGELDİN + ÇIKIŞ */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                                {/* Hoşgeldin Kısmı (GERİ GELDİ) */}
                                <div style={{ textAlign: 'right', fontSize: '0.9rem', display: 'none', md: 'block' }}>
                                    <span style={{ color: '#888' }}>Hoş geldin,</span> <br/>
                                    <span style={{ color: 'white', fontWeight: 'bold' }}>{kullaniciAdi}</span>
                                </div>

                                <button 
                                    onClick={handleLogout} 
                                    style={{ 
                                        background: 'transparent', border: '1px solid #333', color: '#ef4444', padding: '8px 16px', borderRadius: '4px', 
                                        cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 'bold', fontSize: '0.9rem', transition: 'all 0.2s'
                                    }}
                                    onMouseEnter={(e) => { e.target.style.background = 'rgba(239, 68, 68, 0.1)'; e.target.style.borderColor = '#ef4444'; }}
                                    onMouseLeave={(e) => { e.target.style.background = 'transparent'; e.target.style.borderColor = '#333'; }}
                                >
                                    <LogOut size={16} /> Çıkış
                                </button>
                            </div>
                        </div>
                    </nav>
                    
                    <main>
                        <Routes>
                            <Route path="/" element={<AnaSayfa />} />
                            <Route path="/arama" element={<AramaSayfasi />} />
                            <Route path="/profil" element={<ProfilSayfasi />} />
                            <Route path="/kullanici/:id" element={<ProfilSayfasi />} />
                            <Route path="/icerik/:id" element={<IcerikDetaySayfasi />} />
                        </Routes>
                    </main>
                </div>
            )}
        </div>
    );
}

export default App;
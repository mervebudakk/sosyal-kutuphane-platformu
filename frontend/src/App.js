// frontend/src/App.js (Son ve Temiz Düzen)

import React, { useState, useEffect } from 'react';
// Yeni konumdan servisleri ve sayfaları import edin:
import { supabase } from './Servisler/supabaseServis';
import GirisKayit from './Sayfalar/GirisKayit'; // Giriş/Kayıt
import AramaSayfasi from './Sayfalar/AramaSayfasi'; // Arama Sayfası

function App() {
    const [session, setSession] = useState(null);

    // Oturum durumunu dinleme mantığı
    useEffect(() => {
        // Oturum durumunu anında al
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
    };

    return (
        <div className="container" style={{ textAlign: 'center' }}>
            <header>
                <h1>Sosyal Kütüphane Platformu</h1>
            </header>
            
            {!session ? (
                // Oturum yoksa, Giriş/Kayıt ekranını göster
                <GirisKayit />
            ) : (
                // Oturum varsa, Hoş Geldiniz Mesajı ve Arama Sayfasını göster
                <div>
                    <h2>Hoş Geldiniz, {session.user.email}!</h2>
                    <button onClick={handleLogout} style={{ padding: '10px 20px', cursor: 'pointer', marginBottom: '20px' }}>
                        Çıkış Yap
                    </button>
                    
                    <AramaSayfasi /> 
                </div>
            )}
        </div>
    );
}

export default App;
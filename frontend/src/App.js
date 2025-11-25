// frontend/src/App.js
import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import Auth from './Auth'; // Yeni Auth bileşenimizi import ediyoruz

function App() {
    const [session, setSession] = useState(null);

    // Oturum durumunu dinleme
    useEffect(() => {
        // Oturum durumunu anında al
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
        });

        // Oturum değişikliklerini dinle
        const { data: authListener } = supabase.auth.onAuthStateChange(
            (_event, session) => {
                setSession(session);
            }
        );

        // Component temizlenirken dinleyiciyi durdur
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
                <Auth />
            ) : (
                // Oturum varsa, Ana Sayfa içeriğini göster
                <div style={{ marginTop: '50px' }}>
                    <h2>Hoş Geldiniz, {session.user.email}!</h2>
                    <p>Bu, Sosyal Akış ve Ana Sayfanızdır.</p>
                    <button onClick={handleLogout} style={{ padding: '10px 20px', cursor: 'pointer' }}>
                        Çıkış Yap
                    </button>
                    
                    {/* Devam etmeden önce Kullanicilar tablosuna kayıt yapmalıyız. */}
                    {/* Bu kısım için Use Case'e geçebiliriz. */}
                </div>
            )}
        </div>
    );
}

export default App;
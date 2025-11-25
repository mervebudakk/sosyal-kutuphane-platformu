import React, { useState } from 'react';
// Yeni konumdan Supabase bağlantımızı import ediyoruz
import { supabase } from '../Servisler/supabaseServis'; 

// Kullanıcının kayıt/giriş işlemlerini yönetecek bileşen
const GirisKayit = () => { // Bileşen Adı Düzeltildi
    const [isSignUp, setIsSignUp] = useState(false); // Kayıt mı, Giriş mi?
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [username, setUsername] = useState(''); // Kayıt için kullanıcı adı
    const [error, setError] = useState('');
    const [message, setMessage] = useState(''); // Başarı veya şifre sıfırlama mesajı

    // Temel Giriş İşlemi
    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setMessage('');

        const { error } = await supabase.auth.signInWithPassword({ email, password });

        if (error) {
            setError(error.message);
        } else {
            setMessage('Başarıyla giriş yapıldı. Ana sayfaya yönlendiriliyorsunuz...');
        }
        setLoading(false);
    };

    // Temel Kayıt İşlemi
    const handleSignUp = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setMessage('');

        // 1. Supabase Auth üzerinden kullanıcı kaydı (Authentication)
        const { data, error: authError } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    username: username // Supabase'de ekstra meta veri olarak kullanıcı adını kaydet
                }
            }
        });

        if (authError) {
            // Auth hatası varsa (örn: şifre çok kısa, e-posta formatı hatalı)
            setError(authError.message);
        } else if (data.user) {
            // 2. Auth kaydı başarılı: Şimdi Kullanicilar tablosuna manuel kayıt ekle (Database)
            // Bu, sizin daha önce trigger'ı devre dışı bırakarak çözdüğünüz manuel kayıttır.
            const { error: dbError } = await supabase
                .from('Kullanicilar')
                .insert({
                    kullanici_id: data.user.id,
                    kullanici_adi: username,
                    eposta: email,
                });

            if (dbError) {
                // Veritabanı (Kullanicilar) tablosuna kayıt hatası varsa
                setError(`Veritabanı Kayıt Hatası: ${dbError.message}. Bu kullanıcı adı veya e-posta zaten kullanımda olabilir.`);
                
                // NOT: Gerçek bir uygulamada, Auth'tan eklenen kullanıcıyı silmek için Sunucu fonksiyonu (Edge Function) gerekir.
            } else {
                // Her iki kayıt da başarılıysa
                setMessage('Kayıt başarılı! E-posta adresinizi kontrol edin ve hesabınızı onaylayın.');
            }
        }
        setLoading(false);
    };

    // Şifre Sıfırlama Akışı
    const handlePasswordReset = async () => {
        setLoading(true);
        setError('');
        setMessage('');

        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            // Şifre sıfırlama linkinin kullanıcıyı yönlendireceği adres
            redirectTo: window.location.origin 
        });

        if (error) {
            setError(error.message);
        } else {
            setMessage('Şifre sıfırlama talimatları e-posta adresinize gönderildi.');
        }
        setLoading(false);
    };

    return (
        <div style={{ maxWidth: '400px', margin: '50px auto', padding: '20px', border: '1px solid #ccc', borderRadius: '8px' }}>
            <h2>{isSignUp ? 'Kayıt Ol' : 'Giriş Yap'}</h2>
            
            {/* Hata ve Başarı Mesajları */}
            {error && <p style={{ color: 'red' }}>Hata: {error}</p>}
            {message && <p style={{ color: 'green' }}>{message}</p>}

            <form onSubmit={isSignUp ? handleSignUp : handleLogin}>
                
                {/* Kayıt Ekranına Özel Alan: Kullanıcı Adı */}
                {isSignUp && (
                    <div style={{ marginBottom: '15px' }}>
                        <label>Kullanıcı Adı</label>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                            style={{ width: '100%', padding: '10px' }}
                        />
                    </div>
                )}

                {/* Ortak Alanlar */}
                <div style={{ marginBottom: '15px' }}>
                    <label>E-posta</label>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        style={{ width: '100%', padding: '10px' }}
                    />
                </div>
                <div style={{ marginBottom: '20px' }}>
                    <label>Şifre</label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        style={{ width: '100%', padding: '10px' }}
                    />
                </div>
                
                {/* Aksiyon Butonu */}
                <button type="submit" disabled={loading} style={{ padding: '10px 15px', width: '100%', cursor: loading ? 'not-allowed' : 'pointer' }}>
                    {loading ? 'İşleniyor...' : (isSignUp ? 'Kayıt Ol' : 'Giriş Yap')}
                </button>
            </form>

            <hr style={{ margin: '20px 0' }} />

            {/* Şifre Sıfırlama ve Ekran Değiştirme Linkleri */}
            <div style={{ textAlign: 'center' }}>
                <p>
                    {isSignUp ? (
                        <>
                            Zaten hesabın var mı?{' '}
                            <a href="#" onClick={() => setIsSignUp(false)}>Giriş Yap</a>
                        </>
                    ) : (
                        <>
                            Hesabın yok mu?{' '}
                            <a href="#" onClick={() => setIsSignUp(true)}>Kayıt Ol</a>
                        </>
                    )}
                </p>
                
                {!isSignUp && (
                    <p>
                        <a href="#" onClick={handlePasswordReset}>Şifremi Unuttum</a>
                    </p>
                )}
            </div>
        </div>
    );
};

export default GirisKayit; 
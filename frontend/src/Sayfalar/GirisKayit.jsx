import React, { useState } from 'react';
import { User, Mail, Lock, Eye, EyeOff, LogIn, UserPlus, KeyRound, AlertCircle, CheckCircle } from 'lucide-react';
import { supabase } from '../Servisler/supabaseServis';

const GirisKayit = () => {
    const [isSignUp, setIsSignUp] = useState(false);
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [username, setUsername] = useState('');
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    // --- MANTIK KISMI (AYNEN KORUNDU) ---
    const handleLogin = async (e) => {
        if (e) e.preventDefault();
        setLoading(true); setError('');
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) { setError(error.message); setLoading(false); }
        else { setLoading(false); }
    };

    const handleSignUp = async (e) => {
        if (e) e.preventDefault();
        setLoading(true); setError('');
        const { data, error: authError } = await supabase.auth.signUp({ email, password });
        if (authError) { setError(authError.message); setLoading(false); return; }
        if (data.user) {
            const { error: dbError } = await supabase.from('Kullanicilar').insert([{
                kullanici_id: data.user.id,
                kullanici_adi: username,
                eposta: email,
                sifre_hash: 'managed_by_supabase'
            }]);
            if (dbError) { setError("DB Kayıt Hatası: " + dbError.message); }
            else { setMessage('✅ Kayıt başarılı! Lütfen e-postanızı onaylayın.'); setIsSignUp(false); }
        }
        setLoading(false);
    };

    const handlePasswordReset = async () => {
        if (!email) { setError('Lütfen e-posta adresinizi girin'); return; }
        setLoading(true);
        const { error } = await supabase.auth.resetPasswordForEmail(email);
        if (error) setError(error.message);
        else setMessage('📧 Şifre sıfırlama linki e-postanıza gönderildi!');
        setLoading(false);
    };
    // ------------------------------------

    // IMDb Stili Input Bileşeni
    const InputField = ({ icon: Icon, type, value, onChange, placeholder, showToggle }) => (
        <div style={{ marginBottom: '20px', position: 'relative' }}>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <Icon size={20} style={{ position: 'absolute', left: '15px', color: '#F5C518', zIndex: 1 }} />
                <input
                    type={type === 'password' && showToggle && !showPassword ? 'password' : 'text'}
                    value={value}
                    onChange={onChange}
                    placeholder={placeholder}
                    style={{
                        width: '100%',
                        padding: '14px 20px 14px 45px',
                        border: '1px solid #333',
                        borderRadius: '4px', // Daha keskin köşeler (IMDb tarzı)
                        fontSize: '1rem',
                        outline: 'none',
                        background: '#FFFFFF', // Beyaz zemin
                        color: '#121212', // Siyah yazı
                        fontWeight: '500'
                    }}
                    onFocus={(e) => { e.target.style.borderColor = '#F5C518'; e.target.style.boxShadow = '0 0 0 2px rgba(245, 197, 24, 0.2)'; }}
                    onBlur={(e) => { e.target.style.borderColor = '#333'; e.target.style.boxShadow = 'none'; }}
                />
                {showToggle && (
                    <button onClick={() => setShowPassword(!showPassword)} type="button" style={{ position: 'absolute', right: '15px', background: 'none', border: 'none', cursor: 'pointer' }}>
                        {showPassword ? <EyeOff size={20} color="#555" /> : <Eye size={20} color="#555" />}
                    </button>
                )}
            </div>
        </div>
    );

    return (
        <div style={{ 
            minHeight: '100vh', 
            background: '#121212', // IMDb Arka Planı
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            padding: '20px', 
            fontFamily: "'Roboto', sans-serif" // IMDb fontuna benzer
        }}>
            <div style={{ 
                background: '#1F1F1F', // Kart Rengi
                borderRadius: '8px', 
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.5)', 
                maxWidth: '400px', 
                width: '100%', 
                border: '1px solid #333' 
            }}>
                
                {/* Header */}
                <div style={{ padding: '40px 30px 20px', textAlign: 'center' }}>
                    <div style={{ 
                        width: '70px', height: '70px', 
                        background: '#F5C518', // IMDb Sarısı
                        borderRadius: '50%', 
                        display: 'flex', alignItems: 'center', justifyContent: 'center', 
                        margin: '0 auto 20px', 
                        color: 'black'
                    }}>
                        {isSignUp ? <UserPlus size={35} /> : <LogIn size={35} />}
                    </div>
                    <h2 style={{ color: 'white', margin: '0 0 10px 0', fontSize: '1.8rem', fontWeight: '700' }}>
                        {isSignUp ? 'Hesap Oluştur' : 'Giriş Yap'}
                    </h2>
                    <p style={{ color: '#AAAAAA', margin: 0, fontSize: '0.95rem' }}>
                        {isSignUp ? 'Platforma katılarak listelerini oluştur.' : 'Sana özgü sosyal kütüphanene eriş.'}
                    </p>
                </div>

                <div style={{ padding: '0 30px 40px' }}>
                    {/* Mesajlar */}
                    {error && <div style={{ background: 'rgba(255, 88, 88, 0.1)', border: '1px solid #ef4444', borderRadius: '4px', padding: '10px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}><AlertCircle size={18} color="#ef4444" /><span style={{ color: '#ef4444', fontSize:'0.9rem' }}>{error}</span></div>}
                    {message && <div style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid #10b981', borderRadius: '4px', padding: '10px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}><CheckCircle size={18} color="#10b981" /><span style={{ color: '#10b981', fontSize:'0.9rem' }}>{message}</span></div>}

                    <form onSubmit={isSignUp ? handleSignUp : handleLogin}>
                        {isSignUp && <InputField icon={User} type="text" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Kullanıcı Adı" />}
                        <InputField icon={Mail} type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="E-posta" />
                        <InputField icon={Lock} type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Şifre" showToggle={true} />

                        <button type="submit" disabled={loading} style={{ 
                            width: '100%', 
                            padding: '14px', 
                            background: '#F5C518', // IMDb Sarısı
                            color: '#000000', // Siyah Yazı
                            border: 'none', 
                            borderRadius: '4px', 
                            fontSize: '1rem', 
                            fontWeight: 'bold', 
                            cursor: loading ? 'not-allowed' : 'pointer', 
                            marginTop: '10px', 
                            opacity: loading ? 0.7 : 1,
                            transition: 'background 0.2s'
                        }}
                        onMouseOver={(e) => !loading && (e.target.style.background = '#E2B616')}
                        onMouseOut={(e) => !loading && (e.target.style.background = '#F5C518')}
                        >
                            {loading ? 'İşleniyor...' : (isSignUp ? 'Kayıt Ol' : 'Giriş Yap')}
                        </button>
                    </form>

                    {!isSignUp && (
                        <button onClick={handlePasswordReset} type="button" style={{ width: '100%', padding: '10px', background: 'transparent', border: 'none', color: '#5799ef', cursor: 'pointer', fontSize: '0.9rem', marginTop: '10px', fontWeight: '500' }}>
                            Şifremi Unuttum
                        </button>
                    )}

                    <div style={{ borderTop: '1px solid #333', margin: '25px 0' }}></div>

                    <div style={{ textAlign: 'center' }}>
                        <p style={{ color: '#AAAAAA', fontSize: '0.9rem', marginBottom: '10px' }}>
                            {isSignUp ? 'Zaten hesabın var mı?' : 'Hesabın yok mu?'}
                        </p>
                        <button 
                            onClick={() => { setIsSignUp(!isSignUp); setError(''); setMessage(''); }} 
                            style={{ 
                                background: 'transparent', 
                                color: '#F5C518', 
                                border: '1px solid #F5C518', 
                                padding: '10px 20px', 
                                borderRadius: '4px', 
                                fontSize: '0.9rem', 
                                fontWeight: 'bold', 
                                cursor: 'pointer',
                                width: '100%'
                            }}
                            onMouseOver={(e) => e.target.style.background = 'rgba(245, 197, 24, 0.1)'}
                            onMouseOut={(e) => e.target.style.background = 'transparent'}
                        >
                            {isSignUp ? 'Giriş Yap' : 'Yeni Hesap Oluştur'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default GirisKayit;
import React, { useState } from 'react';
import { User, Mail, Lock, Eye, EyeOff, KeyRound, AlertCircle, CheckCircle } from 'lucide-react';
import { supabase } from '../Servisler/supabaseServis';

const InputField = ({
  icon: Icon,
  type = 'text',
  value,
  onChange,
  placeholder,
  isPassword = false,
  showPassword,
  onTogglePassword,
}) => {
  const inputType = isPassword ? (showPassword ? 'text' : 'password') : type;

  return (
    <div style={{ marginBottom: '20px', position: 'relative' }}>
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        <Icon
          size={20}
          style={{
            position: 'absolute',
            left: '15px',
            color: '#F5C518',
            zIndex: 1,
          }}
        />
        <input
          type={inputType}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          style={{
            width: '100%',
            padding: '14px 20px 14px 45px',
            border: '1px solid #333', 
            borderRadius: '4px',
            fontSize: '1rem',
            outline: 'none',
            background: '#FFFFFF',
            color: '#121212',
            fontWeight: '500',
          }}
        />
        {isPassword && (
          <button
            type="button"
            onClick={onTogglePassword}
            style={{
              position: 'absolute',
              right: '15px',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            {showPassword ? <EyeOff size={20} color="#555" /> : <Eye size={20} color="#555" />}
          </button>
        )}
      </div>
    </div>
  );
};

const GirisKayit = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [username, setUsername] = useState('');

  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setError(error.message);

    setLoading(false);
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    if (!username || !email || !password || !passwordConfirm) {
      setError('Lütfen tüm alanları doldurun.');
      setLoading(false);
      return;
    }

    if (password !== passwordConfirm) {
      setError('Şifre ve şifre tekrarı aynı olmalıdır.');
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError('Şifre en az 6 karakter olmalıdır.');
      setLoading(false);
      return;
    }

    const { data, error: authError } = await supabase.auth.signUp({ email, password });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    if (data.user) {
      const { error: dbError } = await supabase.from('Kullanicilar').insert([
        {
          kullanici_id: data.user.id,
          kullanici_adi: username,
          eposta: email,
          sifre_hash: 'managed_by_supabase',
        },
      ]);

      if (dbError) {
        setError('Veritabanı kaydı sırasında hata: ' + dbError.message);
      } else {
        setMessage('Kayıt başarılı! Lütfen e-postanızı onaylayın.');
        setIsSignUp(false);
        setPassword('');
        setPasswordConfirm('');
      }
    }

    setLoading(false);
  };

  const handlePasswordReset = async () => {
    if (!email) {
      setError('Şifre sıfırlama için e-posta adresi girin.');
      return;
    }

    setLoading(true);
    setError('');
    setMessage('');

    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) setError(error.message);
    else setMessage('Şifre sıfırlama linki e-posta adresinize gönderildi.');

    setLoading(false);
  };

  const toggleMode = () => {
    setIsSignUp(!isSignUp);
    setError('');
    setMessage('');
    setPassword('');
    setPasswordConfirm('');
  };

  const handleSubmit = isSignUp ? handleSignUp : handleLogin;

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#121212',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        fontFamily: "'Roboto', sans-serif",
      }}
    >
      <div
        style={{
          background: '#1F1F1F',
          borderRadius: '8px',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.5)',
          maxWidth: '400px',
          width: '100%',
          border: '1px solid #333',
        }}
      >
        {/* Başlık */}
        <div style={{ padding: '40px 30px 20px', textAlign: 'center' }}>
          <div style={{ textAlign: 'center', marginBottom: '20px' }}>
            <img
              src="/logo.png"
              alt="Sosyal Kütüphane Logo"
              style={{
                width: '80px',
                height: 'auto',
                filter: 'drop-shadow(0 0 10px rgba(245, 197, 24, 0.3))',
              }}
            />
          </div>
          <h2
            style={{
              color: 'white',
              margin: '0 0 10px 0',
              fontSize: '1.8rem',
              fontWeight: '700',
            }}
          >
            {isSignUp ? 'Hesap Oluştur' : 'Giriş Yap'}
          </h2>
          <p style={{ color: '#AAAAAA', margin: 0, fontSize: '0.95rem' }}>
            {isSignUp
              ? 'Platforma katılarak listelerini oluştur.'
              : 'Sana özgü sosyal kütüphanene eriş.'}
          </p>
        </div>

        <div style={{ padding: '0 30px 40px' }}>
          {/* Hata / Bilgi mesajları */}
          {error && (
            <div
              style={{
                background: 'rgba(255, 88, 88, 0.1)',
                border: '1px solid #ef4444',
                borderRadius: '4px',
                padding: '10px',
                marginBottom: '20px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
              }}
            >
              <AlertCircle size={18} color="#ef4444" />
              <span style={{ color: '#ef4444', fontSize: '0.9rem' }}>{error}</span>
            </div>
          )}
          {message && (
            <div
              style={{
                background: 'rgba(16, 185, 129, 0.1)',
                border: '1px solid #10b981',
                borderRadius: '4px',
                padding: '10px',
                marginBottom: '20px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
              }}
            >
              <CheckCircle size={18} color="#10b981" />
              <span style={{ color: '#10b981', fontSize: '0.9rem' }}>{message}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit}>
            {isSignUp && (
              <InputField
                icon={User}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Kullanıcı Adı"
              />
            )}

            <InputField
              icon={Mail}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="E-posta"
            />

            <InputField
              icon={Lock}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Şifre"
              isPassword={true}
              showPassword={showPassword}
              onTogglePassword={() => setShowPassword((s) => !s)}
            />

            {isSignUp && (
              <InputField
                icon={KeyRound}
                value={passwordConfirm}
                onChange={(e) => setPasswordConfirm(e.target.value)}
                placeholder="Şifre (Tekrar)"
                isPassword={true}
                showPassword={showPassword}
                onTogglePassword={() => setShowPassword((s) => !s)}
              />
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '14px',
                background: '#F5C518',
                color: '#000000',
                border: 'none',
                borderRadius: '4px',
                fontSize: '1rem',
                fontWeight: 'bold',
                cursor: loading ? 'not-allowed' : 'pointer',
                marginTop: '10px',
                opacity: loading ? 0.7 : 1,
              }}
            >
              {loading
                ? 'İşleniyor...'
                : isSignUp
                ? 'Kayıt Ol'
                : 'Giriş Yap'}
            </button>
          </form>

          {!isSignUp && (
            <button
              type="button"
              onClick={handlePasswordReset}
              style={{
                width: '100%',
                padding: '10px',
                background: 'transparent',
                border: 'none',
                color: '#5799ef',
                cursor: 'pointer',
                fontSize: '0.9rem',
                marginTop: '10px',
                fontWeight: '500',
              }}
            >
              Şifremi Unuttum
            </button>
          )}

          <div style={{ borderTop: '1px solid #333', margin: '25px 0' }} />

          <div style={{ textAlign: 'center' }}>
            <p
              style={{
                color: '#AAAAAA',
                fontSize: '0.9rem',
                marginBottom: '10px',
              }}
            >
              {isSignUp ? 'Zaten hesabın var mı?' : 'Hesabın yok mu?'}
            </p>
            <button
              type="button"
              onClick={toggleMode}
              style={{
                background: 'transparent',
                color: '#F5C518',
                border: '1px solid #F5C518',
                padding: '10px 20px',
                borderRadius: '4px',
                fontSize: '0.9rem',
                fontWeight: 'bold',
                cursor: 'pointer',
                width: '100%',
              }}
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

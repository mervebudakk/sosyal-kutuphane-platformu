import React from 'react';

const navStili = {
    display: 'flex',
    justifyContent: 'center',
    padding: '10px 0',
    backgroundColor: '#333',
    color: 'white',
    marginBottom: '20px'
};

const linkStili = {
    color: 'white',
    textDecoration: 'none',
    margin: '0 15px',
    padding: '5px 10px',
    borderRadius: '5px',
    cursor: 'pointer'
};

const GezinmeCubugu = ({ setActiveTab }) => {
    // Projenizin temel sayfaları
    const linkler = [
        { ad: 'Ana Sayfa', sekme: 'feed' },
        { ad: 'Arama & Keşfet', sekme: 'arama' },
        { ad: 'Kütüphanem (Profil)', sekme: 'profil' },
    ];

    return (
        <nav style={navStili}>
            {linkler.map(link => (
                <div 
                    key={link.sekme}
                    style={linkStili}
                    onClick={() => setActiveTab(link.sekme)}
                >
                    {link.ad}
                </div>
            ))}
        </nav>
    );
};

export default GezinmeCubugu;
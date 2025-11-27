// src/Sayfalar/AnaSayfa.jsx
import React from 'react';
import { BookOpen } from 'lucide-react';

const AnaSayfa = () => {
    return (
        <div style={{ textAlign: 'center', padding: '100px 20px', color: '#CCCCCC' }}>
            <div style={{ 
                background: '#1F1F1F', borderRadius: '50%', width: '80px', height: '80px', 
                display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px',
                border: '2px solid #333'
            }}>
                <BookOpen size={40} color="#F5C518" />
            </div>
            <h2 style={{ color: 'white', fontSize: '2rem', marginBottom: '10px' }}>
                Sosyal Akış (Feed)
            </h2>
            <p style={{ maxWidth: '500px', margin: '0 auto', lineHeight: '1.6' }}>
                Takip ettiğin arkadaşların ne okuyor, ne izliyor? <br />
                <span style={{ color: '#F5C518' }}>
                    (Yakında burada göreceksin)
                </span>
            </p>
        </div>
    );
};

export default AnaSayfa;

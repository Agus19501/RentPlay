import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaStar, FaChevronRight, FaChevronLeft } from 'react-icons/fa';
import { apiRequest } from '../api.js';
import './Home.css';

const Home = ({ lang }) => {
  const navigate = useNavigate();
  const gamesRef = useRef(null);
  const profilesRef = useRef(null);
  const rentedRef = useRef(null);
  const [showLeft, setShowLeft] = useState({ games: false, profiles: false, rented: false });
  const [games, setGames] = useState([]);
  const [status, setStatus] = useState('loading');

  const translations = {
    ES: {
      newGames: 'NUEVOS JUEGOS',
      newGamesSub: 'Echa un vistazo a los últimos juegos añadidos',
      profiles: 'PERFILES DESTACADOS',
      profilesSub: 'Visita los perfiles mejor valorados',
      rented: 'MIS JUEGOS ALQUILADOS',
      rentedSub: 'Tu biblioteca actual',
      rentTag: 'Alquilado'
    },
    EN: {
      newGames: 'NEW GAMES',
      newGamesSub: 'Check out the latest games added',
      profiles: 'FEATURED PROFILES',
      profilesSub: 'Visit the top-rated profiles',
      rented: 'MY RENTED GAMES',
      rentedSub: 'Your current library',
      rentTag: 'Rented'
    }
  };

  const t = translations[lang] || translations.ES;

  useEffect(() => {
    let active = true;

    apiRequest('/api/games')
      .then((data) => {
        if (!active) {
          return;
        }

        setGames(data.games || []);
        setStatus('ready');
      })
      .catch(() => {
        if (!active) {
          return;
        }

        setStatus('error');
      });

    return () => {
      active = false;
    };
  }, []);

  const handleScrollDetect = (key, ref) => {
    const isScrolled = ref.current.scrollLeft > 10;
    setShowLeft((prev) => ({ ...prev, [key]: isScrolled }));
  };

  const executeScroll = (ref, direction) => {
    const offset = direction === 'left' ? -500 : 500;
    ref.current.scrollBy({ left: offset, behavior: 'smooth' });
  };

  const profiles = Array.from({ length: 15 }, (_, index) => ({
    id: index + 1,
    name: ['Juanje_dor34', 'Xx_Anton_xX', 'Davidpro21', 'Lara_Gamer', 'Alex_99', 'Marta_Play', 'Gamer_Vlc', 'Nacho_Retro', 'Sofia_Pixel', 'Rafa_Kill', 'Lucas_Indie', 'Elena_G', 'Pablo_Z', 'Celia_Dev', 'Victor_X'][index] || `Usuario_${index + 1}`,
    rating: (Math.random() * (5 - 3) + 3).toFixed(1)
  }));

  return (
    <div className="home-page">
      <section className="home-section">
        <div className="section-header">
          <div>
            <h2 className="section-title">{t.newGames}</h2>
            <p className="section-subtitle">{t.newGamesSub}</p>
          </div>
        </div>
        <div className="content-relative-wrapper">
          {showLeft.games && <button className="nav-btn left-btn game-btn-pos" onClick={() => executeScroll(gamesRef, 'left')} type="button"><FaChevronLeft /></button>}
          <div className="scroll-area" ref={gamesRef} onScroll={() => handleScrollDetect('games', gamesRef)}>
            {status === 'loading' && <p className="section-subtitle">Cargando catálogo...</p>}
            {status === 'error' && <p className="section-subtitle">No se pudo cargar el catálogo.</p>}
            {games.map((game) => (
              <div key={game.id} className="item-card" onClick={() => navigate(`/games/${game.id}`)} role="button" tabIndex={0}>
                <div className="rect-placeholder"><span>{game.platform || 'Game'}</span></div>
                <p className="item-label">{game.title}</p>
              </div>
            ))}
          </div>
          <button className="nav-btn right-btn game-btn-pos" onClick={() => executeScroll(gamesRef, 'right')} type="button"><FaChevronRight /></button>
        </div>
      </section>

      <section className="home-section">
        <div className="section-header">
          <div>
            <h2 className="section-title">{t.profiles}</h2>
            <p className="section-subtitle">{t.profilesSub}</p>
          </div>
        </div>
        <div className="content-relative-wrapper">
          {showLeft.profiles && <button className="nav-btn left-btn profile-btn-pos" onClick={() => executeScroll(profilesRef, 'left')} type="button"><FaChevronLeft /></button>}
          <div className="scroll-area" ref={profilesRef} onScroll={() => handleScrollDetect('profiles', profilesRef)}>
            {profiles.map((profile) => (
              <div key={profile.id} className="item-card" onClick={() => navigate('/comparativa')} role="button" tabIndex={0}>
                <div className="circle-placeholder" />
                <p className="item-label">{profile.name}</p>
                <div className="rating-tag"><FaStar /> {profile.rating}</div>
              </div>
            ))}
          </div>
          <button className="nav-btn right-btn profile-btn-pos" onClick={() => executeScroll(profilesRef, 'right')} type="button"><FaChevronRight /></button>
        </div>
      </section>

      <section className="home-section">
        <div className="section-header">
          <div>
            <h2 className="section-title">{t.rented}</h2>
            <p className="section-subtitle">{t.rentedSub}</p>
          </div>
        </div>
        <div className="content-relative-wrapper">
          {showLeft.rented && <button className="nav-btn left-btn game-btn-pos" onClick={() => executeScroll(rentedRef, 'left')} type="button"><FaChevronLeft /></button>}
          <div className="scroll-area" ref={rentedRef} onScroll={() => handleScrollDetect('rented', rentedRef)}>
            {games.map((game) => (
              <div key={`rented-${game.id}`} className="item-card" onClick={() => navigate('/comparativa')} role="button" tabIndex={0}>
                <div className="rect-placeholder rented-mode"><div className="rent-overlay">{t.rentTag}</div></div>
                <p className="item-label">{game.title}</p>
              </div>
            ))}
          </div>
          <button className="nav-btn right-btn game-btn-pos" onClick={() => executeScroll(rentedRef, 'right')} type="button"><FaChevronRight /></button>
        </div>
      </section>
    </div>
  );
};

export default Home;

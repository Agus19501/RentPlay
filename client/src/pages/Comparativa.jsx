import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { FaChevronRight, FaChevronLeft } from 'react-icons/fa';
import { apiRequest } from '../api.js';
import './Comparativa.css';

const Comparativa = ({ lang }) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const searchRef1 = useRef(null);
  const searchRef2 = useRef(null);
  const relatedRef = useRef(null);
  const [showLeft, setShowLeft] = useState({ search1: false, search2: false, related: false });
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);

  const translations = {
    ES: {
      searchTitle: 'COMPARATIVA',
      searchSub: 'Datos reales del catálogo para el videojuego seleccionado',
      relatedTitle: 'RELACIONADOS',
      relatedSub: 'Otros juegos reales del catálogo de RentPlay'
    },
    EN: {
      searchTitle: 'COMPARISON',
      searchSub: 'Real catalog data for the selected game',
      relatedTitle: 'RELATED',
      relatedSub: 'Other real games from the RentPlay catalog'
    }
  };

  const t = translations[lang] || translations.ES;

  useEffect(() => {
    let active = true;

    apiRequest('/api/games')
      .then((response) => {
        if (active) {
          setGames(response.games || []);
        }
      })
      .catch(() => {
        if (active) {
          setGames([]);
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
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

  const selectedGameId = Number(searchParams.get('gameId'));
  const selectedGame = useMemo(() => {
    if (!games.length) {
      return null;
    }

    return games.find((game) => game.id === selectedGameId) || games[0];
  }, [games, selectedGameId]);

  const samePlatformGames = useMemo(() => {
    if (!selectedGame) {
      return [];
    }

    const matches = games.filter((game) => game.id !== selectedGame.id && game.platform === selectedGame.platform);
    return (matches.length > 0 ? matches : games.filter((game) => game.id !== selectedGame.id)).slice(0, 15);
  }, [games, selectedGame]);

  const relatedGames = useMemo(() => {
    if (!selectedGame) {
      return [];
    }

    return games
      .filter((game) => game.id !== selectedGame.id)
      .sort((left, right) => (right.rating || 0) - (left.rating || 0))
      .slice(0, 15);
  }, [games, selectedGame]);

  return (
    <div className="comparativa-page">
      <section className="home-section">
        <div className="section-header">
          <h2 className="section-title">{loading ? t.searchTitle : (selectedGame?.title || t.searchTitle)}</h2>
          <p className="section-subtitle">{loading ? t.searchSub : selectedGame?.description || t.searchSub}</p>
        </div>

        <div className="content-relative-wrapper">
          {showLeft.search1 && <button className="nav-btn left-btn game-btn-pos" onClick={() => executeScroll(searchRef1, 'left')} type="button"><FaChevronLeft /></button>}
          <div className="scroll-area" ref={searchRef1} onScroll={() => handleScrollDetect('search1', searchRef1)}>
            {!loading && samePlatformGames.map((game) => (
              <div key={`row1-${game.id}`} className="item-card" onClick={() => navigate(`/games/${game.id}`)} role="button" tabIndex={0}>
                <div className="rect-placeholder">
                  <div className="offer-overlay">
                    <p className="offer-price">{game.price ? `${game.price.toFixed(2)} €` : '—'}</p>
                    <p className="offer-duration">{game.rentalDays ? `${game.rentalDays} días` : '—'}</p>
                  </div>
                </div>
                <p className="item-label">{game.title}</p>
              </div>
            ))}
          </div>
          <button className="nav-btn right-btn game-btn-pos" onClick={() => executeScroll(searchRef1, 'right')} type="button"><FaChevronRight /></button>
        </div>

        <div className="content-relative-wrapper" style={{ marginTop: '30px' }}>
          {showLeft.search2 && <button className="nav-btn left-btn game-btn-pos" onClick={() => executeScroll(searchRef2, 'left')} type="button"><FaChevronLeft /></button>}
          <div className="scroll-area" ref={searchRef2} onScroll={() => handleScrollDetect('search2', searchRef2)}>
            {!loading && samePlatformGames.slice().reverse().map((game) => (
              <div key={`row2-${game.id}`} className="item-card" onClick={() => navigate(`/games/${game.id}`)} role="button" tabIndex={0}>
                <div className="rect-placeholder">
                  <div className="offer-overlay">
                    <p className="offer-price">{game.rating ? `${game.rating} ★` : '—'}</p>
                    <p className="offer-duration">{game.platform || 'Atlas'}</p>
                  </div>
                </div>
                <p className="item-label">{game.title}</p>
              </div>
            ))}
          </div>
          <button className="nav-btn right-btn game-btn-pos" onClick={() => executeScroll(searchRef2, 'right')} type="button"><FaChevronRight /></button>
        </div>
      </section>

      <section className="home-section">
        <div className="section-header">
          <h2 className="section-title">{t.relatedTitle}</h2>
          <p className="section-subtitle">{t.relatedSub}</p>
        </div>
        <div className="content-relative-wrapper">
          {showLeft.related && <button className="nav-btn left-btn game-btn-pos" onClick={() => executeScroll(relatedRef, 'left')} type="button"><FaChevronLeft /></button>}
          <div className="scroll-area" ref={relatedRef} onScroll={() => handleScrollDetect('related', relatedRef)}>
            {!loading && relatedGames.map((game) => (
              <div key={`rel-${game.id}`} className="item-card" onClick={() => navigate(`/games/${game.id}`)} role="button" tabIndex={0}>
                <div className="rect-placeholder"><span>{game.platform || game.seller?.name || 'Atlas'}</span></div>
                <p className="item-label">{game.title}</p>
              </div>
            ))}
          </div>
          <button className="nav-btn right-btn game-btn-pos" onClick={() => executeScroll(relatedRef, 'right')} type="button"><FaChevronRight /></button>
        </div>
      </section>
    </div>
  );
};

export default Comparativa;

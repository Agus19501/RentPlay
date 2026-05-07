import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaChevronRight, FaChevronLeft } from 'react-icons/fa';
import { apiRequest } from '../api.js';
import './Resultados.css';

const Resultados = ({ lang }) => {
  const navigate = useNavigate();
  const searchRef1 = useRef(null);
  const searchRef2 = useRef(null);
  const relatedRef = useRef(null);
  const [showLeft, setShowLeft] = useState({ search1: false, search2: false, related: false });
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);

  const translations = {
    ES: {
      searchTitle: 'RESULTADOS DE LA BÚSQUEDA',
      searchSub: 'Explora los videojuegos reales que tenemos en Atlas',
      relatedTitle: 'RELACIONADOS',
      relatedSub: 'Echa un vistazo a otros juegos del catálogo real de RentPlay'
    },
    EN: {
      searchTitle: 'SEARCH RESULTS',
      searchSub: 'Explore the real video games we have in Atlas',
      relatedTitle: 'RELATED',
      relatedSub: 'Take a look at other real games from the RentPlay catalog'
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

  const primaryGames = games.slice(0, 12);
  const secondaryGames = games.slice().reverse().slice(0, 12);

  return (
    <div className="resultados-page">
      <section className="home-section">
        <div className="section-header">
          <h2 className="section-title">{t.searchTitle}</h2>
          <p className="section-subtitle">{t.searchSub}</p>
        </div>

        <div className="content-relative-wrapper">
          {showLeft.search1 && <button className="nav-btn left-btn game-btn-pos" onClick={() => executeScroll(searchRef1, 'left')} type="button"><FaChevronLeft /></button>}
          <div className="scroll-area" ref={searchRef1} onScroll={() => handleScrollDetect('search1', searchRef1)}>
            {loading && <p className="section-subtitle">Cargando catálogo real...</p>}
            {!loading && primaryGames.map((game) => (
              <div key={`s1-${game.id}`} className="item-card" onClick={() => navigate(`/games/${game.id}`)} role="button" tabIndex={0}>
                <div className="rect-placeholder"><span>{game.platform || 'Atlas'}</span></div>
                <p className="item-label">{game.title}</p>
              </div>
            ))}
          </div>
          <button className="nav-btn right-btn game-btn-pos" onClick={() => executeScroll(searchRef1, 'right')} type="button"><FaChevronRight /></button>
        </div>

        <div className="content-relative-wrapper" style={{ marginTop: '30px' }}>
          {showLeft.search2 && <button className="nav-btn left-btn game-btn-pos" onClick={() => executeScroll(searchRef2, 'left')} type="button"><FaChevronLeft /></button>}
          <div className="scroll-area" ref={searchRef2} onScroll={() => handleScrollDetect('search2', searchRef2)}>
            {!loading && secondaryGames.map((game) => (
              <div key={`s2-${game.id}`} className="item-card" onClick={() => navigate(`/games/${game.id}`)} role="button" tabIndex={0}>
                <div className="rect-placeholder"><span>{game.seller?.name || game.platform || 'Atlas'}</span></div>
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
            {!loading && games.slice(0, 12).map((game) => (
              <div key={`related-${game.id}`} className="item-card" onClick={() => navigate(`/games/${game.id}`)} role="button" tabIndex={0}>
                <div className="rect-placeholder"><span>{game.rating ? `${game.rating} ★` : 'Atlas'}</span></div>
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

export default Resultados;

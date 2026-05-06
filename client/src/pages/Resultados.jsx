import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { FaChevronRight, FaChevronLeft } from 'react-icons/fa';
import { apiRequest } from '../api.js';
import './Resultados.css';

const Resultados = ({ lang }) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const searchRef1 = useRef(null);
  const searchRef2 = useRef(null);
  const relatedRef = useRef(null);
  const [showLeft, setShowLeft] = useState({ search1: false, search2: false, related: false });
  const [games, setGames] = useState([]);
  const [status, setStatus] = useState('loading');

  const query = searchParams.get('q') || '';

  const translations = {
    ES: {
      searchTitle: 'RESULTADOS DE LA BÚSQUEDA',
      searchSub: 'Explora los videojuegos que concuerdan con tu búsqueda',
      relatedTitle: 'RELACIONADOS',
      relatedSub: 'Echa un vistazo a otros juegos relacionados con tu búsqueda'
    },
    EN: {
      searchTitle: 'SEARCH RESULTS',
      searchSub: 'Explore the video games that match your search',
      relatedTitle: 'RELATED',
      relatedSub: 'Take a look at other games related to your search'
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

  const filteredGames = games.filter((game) => {
    const text = `${game.title || ''} ${game.description || ''} ${game.platform || ''} ${game.seller?.name || ''}`.toLowerCase();
    return !query || text.includes(query.toLowerCase());
  });

  const searchRowGames = filteredGames.length > 0 ? filteredGames : games;

  return (
    <div className="resultados-page">
      <section className="home-section">
        <div className="section-header">
          <div>
            <h2 className="section-title">{t.searchTitle}</h2>
            <p className="section-subtitle">{query ? `${t.searchSub} · ${query}` : t.searchSub}</p>
          </div>
        </div>

        <div className="content-relative-wrapper">
          {showLeft.search1 && <button className="nav-btn left-btn game-btn-pos" onClick={() => executeScroll(searchRef1, 'left')} type="button"><FaChevronLeft /></button>}
          <div className="scroll-area" ref={searchRef1} onScroll={() => handleScrollDetect('search1', searchRef1)}>
            {status === 'loading' && <p className="section-subtitle">Cargando catálogo...</p>}
            {status === 'error' && <p className="section-subtitle">No se pudo cargar el catálogo.</p>}
            {searchRowGames.map((game) => (
              <div key={`s1-${game.id}`} className="item-card" onClick={() => navigate(`/comparativa?gameId=${game.id}`)} role="button" tabIndex={0}>
                <div className="rect-placeholder"><span>{game.platform || 'Game'}</span></div>
                <p className="item-label">{game.title}</p>
              </div>
            ))}
          </div>
          <button className="nav-btn right-btn game-btn-pos" onClick={() => executeScroll(searchRef1, 'right')} type="button"><FaChevronRight /></button>
        </div>

        <div className="content-relative-wrapper" style={{ marginTop: '30px' }}>
          {showLeft.search2 && <button className="nav-btn left-btn game-btn-pos" onClick={() => executeScroll(searchRef2, 'left')} type="button"><FaChevronLeft /></button>}
          <div className="scroll-area" ref={searchRef2} onScroll={() => handleScrollDetect('search2', searchRef2)}>
            {searchRowGames.slice().reverse().map((game) => (
              <div key={`s2-${game.id}`} className="item-card" onClick={() => navigate(`/comparativa?gameId=${game.id}`)} role="button" tabIndex={0}>
                <div className="rect-placeholder"><span>{game.platform || 'Game'}</span></div>
                <p className="item-label">{game.title}</p>
              </div>
            ))}
          </div>
          <button className="nav-btn right-btn game-btn-pos" onClick={() => executeScroll(searchRef2, 'right')} type="button"><FaChevronRight /></button>
        </div>
      </section>

      <section className="home-section">
        <div className="section-header">
          <div>
            <h2 className="section-title">{t.relatedTitle}</h2>
            <p className="section-subtitle">{t.relatedSub}</p>
          </div>
        </div>
        <div className="content-relative-wrapper">
          {showLeft.related && <button className="nav-btn left-btn game-btn-pos" onClick={() => executeScroll(relatedRef, 'left')} type="button"><FaChevronLeft /></button>}
          <div className="scroll-area" ref={relatedRef} onScroll={() => handleScrollDetect('related', relatedRef)}>
            {searchRowGames.map((game) => (
              <div key={`related-${game.id}`} className="item-card" onClick={() => navigate(`/comparativa?gameId=${game.id}`)} role="button" tabIndex={0}>
                <div className="rect-placeholder"><span>{game.platform || 'Game'}</span></div>
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

import { useEffect, useRef, useState, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { FaChevronRight, FaChevronLeft } from 'react-icons/fa';
import { apiRequest } from '../api.js';
import cover1 from '../integrations/MAIN_Iker/assets/images/cover1.svg';
import './Home.css'; // Reutilizar estilos de Home

const Resultados = ({ lang }) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const searchRef = useRef(null);
  const [showLeft, setShowLeft] = useState(false);
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);

  const query = searchParams.get('search') || '';
  const genre = searchParams.get('genre') || '';
  const developer = searchParams.get('developer') || '';
  const minYear = searchParams.get('minYear') || '';
  const maxYear = searchParams.get('maxYear') || '';

  const t = {
    ES: {
      searchTitle: 'RESULTADOS DE LA BÚSQUEDA',
      searchSub: query ? `Explora videojuegos relacionados con "${query}"` : 'Explora los videojuegos filtrados',
      empty: 'No se encontraron juegos para esta búsqueda',
      loading: 'Cargando resultados...',
      manage: 'GESTIONAR FILTROS'
    },
    EN: {
      searchTitle: 'SEARCH RESULTS',
      searchSub: query ? `Explore video games related to "${query}"` : 'Explore filtered video games',
      empty: 'No games found for this search',
      loading: 'Loading results...',
      manage: 'MANAGE FILTERS'
    }
  }[lang] || {
    searchTitle: 'RESULTADOS DE LA BÚSQUEDA',
    searchSub: query ? `Explora videojuegos relacionados con "${query}"` : 'Explora los videojuegos filtrados',
    empty: 'No se encontraron juegos para esta búsqueda',
    loading: 'Cargando resultados...',
    manage: 'GESTIONAR FILTROS'
  };

  useEffect(() => {
    let active = true;
    setLoading(true);

    const params = new URLSearchParams();
    if (query) params.append('search', query);
    if (genre) params.append('genre', genre);
    if (developer) params.append('developer', developer);
    if (minYear) params.append('minYear', minYear);
    if (maxYear) params.append('maxYear', maxYear);

    apiRequest(`/api/games?${params.toString()}`)
      .then((response) => {
        if (active) {
          setGames(response.games || []);
        }
      })
      .catch(() => {
        if (active) setGames([]);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => { active = false; };
  }, [query, genre, developer, minYear, maxYear]);

  const uniqueGames = useMemo(() => {
    const map = new Map();
    for (const game of games) {
      const titleKey = game.title.toLowerCase().trim();
      if (!map.has(titleKey)) {
        map.set(titleKey, game);
      }
    }
    return Array.from(map.values());
  }, [games]);

  const handleScrollDetect = () => {
    const isScrolled = (searchRef.current?.scrollLeft || 0) > 10;
    setShowLeft(isScrolled);
  };

  const executeScroll = (direction) => {
    searchRef.current?.scrollBy({ left: direction === 'left' ? -500 : 500, behavior: 'smooth' });
  };

  return (
    <div className="home-page" style={{ paddingBottom: '40px' }}>
      <section className="home-section">
        <div className="section-header">
          <div className="section-info">
            <h2 className="section-title">{t.searchTitle}</h2>
            <p className="section-description">{t.searchSub}</p>
          </div>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <button 
              className="btn-manage-filters"
              onClick={() => navigate(`/filtros?${searchParams.toString()}`)}
              style={{
                background: '#FF6100',
                color: 'white',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '4px',
                fontSize: '14px',
                fontWeight: 'bold',
                cursor: 'pointer',
                textTransform: 'uppercase'
              }}
            >
              {t.manage}
            </button>
            <button className="carousel-nav carousel-next" type="button" onClick={() => executeScroll('right')}>
              <FaChevronRight />
            </button>
          </div>
        </div>

        <div className="carousel-container">
          {showLeft && (
            <button className="carousel-nav" type="button" onClick={() => executeScroll('left')} style={{ position: 'absolute', left: 0, top: '50%', zIndex: 2 }}>
              <FaChevronLeft />
            </button>
          )}
          <div className="carousel-scroll" ref={searchRef} onScroll={handleScrollDetect}>
            {loading && <p className="section-description">{t.loading}</p>}
            {!loading && uniqueGames.length === 0 && <p className="section-description">{t.empty}</p>}
            {!loading && uniqueGames.map((game) => (
              <div key={game.id} className="game-item" onClick={() => navigate(`/comparativa?title=${encodeURIComponent(game.title)}`)} role="button" tabIndex={0}>
                <div className="game-image">
                  {game.image ? (
                    <img 
                      src={game.image.startsWith('data:') ? game.image : `/${game.image}`} 
                      alt={game.title} 
                      onError={(event) => { event.currentTarget.src = cover1; }} 
                    />
                  ) : (
                    <img src={cover1} alt={game.title} />
                  )}
                </div>
                <p className="game-item-label">{game.title}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Resultados;

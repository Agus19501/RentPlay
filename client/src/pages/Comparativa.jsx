import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { FaChevronRight, FaChevronLeft, FaStar, FaChevronDown } from 'react-icons/fa';
import { apiRequest } from '../api.js';
import cover1 from '../integrations/MAIN_Iker/assets/images/cover1.svg';
import './Home.css'; 
import './Filtros.css'; // Importamos estilos de filtros

const Comparativa = ({ lang }) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const searchRef = useRef(null);
  const [showLeft, setShowLeft] = useState(false);
  const [games, setGames] = useState([]);
  const [filteredGames, setFilteredGames] = useState([]);
  const [rentals, setRentals] = useState([]);
  const [loading, setLoading] = useState(true);

  // Estados para filtros
  const [precioMax, setPrecioMax] = useState(50);
  const [alquilerMax, setAlquilerMax] = useState(30);

  const titleQuery = searchParams.get('title') || '';

  const t = {
    ES: {
      searchTitle: 'COMPARATIVA DE OFERTAS',
      searchSub: `Mostrando todas las ofertas para "${titleQuery}"`,
      empty: 'No hay ofertas disponibles para este título actualmente.',
      precio: 'PRECIO MÁXIMO',
      alquiler: 'ALQUILER MÁXIMO',
      apply: 'FILTRAR',
      eur: 'EUR',
      day: 'DIA',
      days: 'DIAS'
    },
    EN: {
      searchTitle: 'OFFER COMPARISON',
      searchSub: `Showing all offers for "${titleQuery}"`,
      empty: 'No offers available for this title at the moment.',
      precio: 'MAX PRICE',
      alquiler: 'MAX RENTAL',
      apply: 'FILTER',
      eur: 'EUR',
      day: 'DAY',
      days: 'DAYS'
    }
  }[lang] || {
    ES: {
      searchTitle: 'COMPARATIVA DE OFERTAS',
      searchSub: `Mostrando todas las ofertas para "${titleQuery}"`,
      empty: 'No hay ofertas disponibles para este título actualmente.',
      precio: 'PRECIO MÁXIMO',
      alquiler: 'ALQUILER MÁXIMO',
      apply: 'FILTRAR',
      eur: 'EUR',
      day: 'DIA',
      days: 'DIAS'
    }
  };

  useEffect(() => {
    let active = true;
    setLoading(true);

    Promise.all([
      apiRequest('/api/games'),
      apiRequest('/api/rentals/mine').catch(() => ({ rentals: [] }))
    ])
      .then(([gamesRes, rentalsRes]) => {
        if (active) {
          const allGames = gamesRes.games || [];
          const myRentals = rentalsRes.rentals || [];
          setRentals(myRentals);

          const filtered = allGames.filter(g => g.title.toLowerCase().trim() === titleQuery.toLowerCase().trim());
          setGames(filtered);
          setFilteredGames(filtered);
          
          if (filtered.length > 0) {
            const prices = filtered.map(g => Number(g.price) || 0);
            const durations = filtered.map(g => Number(g.rentalDays) || 0);
            setPrecioMax(Math.ceil(Math.max(...prices)));
            setAlquilerMax(Math.ceil(Math.max(...durations)));
          }
        }
      })
      .catch(() => {
        if (active) {
          setGames([]);
          setFilteredGames([]);
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => { active = false; };
  }, [titleQuery]);

  const handleGameClick = (game) => {
    const isRentedByMe = rentals.some(r => {
      const rentalGameId = r.game?.id || r.gameId;
      return String(rentalGameId) === String(game.id) && r.status === 'active';
    });

    if (isRentedByMe) {
      navigate(`/mi-alquiler?id=${game.id}`);
    } else {
      navigate(`/ver-juego?id=${game.id}`);
    }
  };

  const handleApplyFilters = () => {
    const filtered = games.filter(game => {
      const p = Number(game.price) || 0;
      const d = Number(game.rentalDays) || 0;
      return p <= precioMax && d <= alquilerMax;
    });
    setFilteredGames(filtered);
  };

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
        <div className="section-header" style={{ alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
          <div className="section-info">
            <h2 className="section-title">{t.searchTitle}</h2>
            <p className="section-description">{t.searchSub}</p>
          </div>

          <div className="comparativa-filters" style={{ display: 'flex', gap: '20px', alignItems: 'center', flex: 1, justifyContent: 'flex-end' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
              <label style={{ fontSize: '11px', color: '#FF6100', fontWeight: 'bold' }}>{t.precio}: {precioMax}€</label>
              <input 
                type="range" min="1" max="50" 
                value={precioMax} 
                onChange={(e) => setPrecioMax(parseInt(e.target.value))} 
                style={{ width: '130px', accentColor: '#FF6100' }} 
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
              <label style={{ fontSize: '11px', color: '#FF6100', fontWeight: 'bold' }}>{t.alquiler}: {alquilerMax} d</label>
              <input 
                type="range" min="1" max="30" 
                value={alquilerMax} 
                onChange={(e) => setAlquilerMax(parseInt(e.target.value))} 
                style={{ width: '130px', accentColor: '#FF6100' }} 
              />
            </div>

            <button 
              onClick={handleApplyFilters}
              style={{
                background: '#FF6100',
                border: 'none',
                color: 'white',
                padding: '8px 16px',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: 'bold',
                fontSize: '12px',
                textTransform: 'uppercase'
              }}
            >
              {t.apply}
            </button>
          </div>

          <button className="carousel-nav carousel-next" type="button" onClick={() => executeScroll('right')}>
            <FaChevronRight />
          </button>
        </div>

        <div className="carousel-container">
          {showLeft && (
            <button className="carousel-nav" type="button" onClick={() => executeScroll('left')} style={{ position: 'absolute', left: 0, top: '50%', zIndex: 2 }}>
              <FaChevronLeft />
            </button>
          )}
          <div className="carousel-scroll" ref={searchRef} onScroll={handleScrollDetect}>
            {loading && <p className="section-description">Cargando ofertas...</p>}
            {!loading && filteredGames.length === 0 && <p className="section-description">{t.empty}</p>}
            {!loading && filteredGames.map((game) => {
              const isRentedByAnyone = game.status === 'rented';
              const isRentedByMe = rentals.some(r => {
                const rentalGameId = r.game?.id || r.gameId;
                return String(rentalGameId) === String(game.id) && r.status === 'active';
              });
              const rented = isRentedByAnyone || isRentedByMe;
              const priceStr = typeof game.price === 'number' ? game.price.toFixed(2) : parseFloat(game.price || 0).toFixed(2);
              const days = Number(game.rentalDays) || 0;
              const dayLabel = days === 1 ? t.day : t.days;
              return (
                <div key={game.id} className="game-item" onClick={() => handleGameClick(game)} role="button" tabIndex={0}>
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

                    {!rented && (
                      <div style={{ position: 'absolute', top: '8px', right: '8px', display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'flex-end' }}>
                        <span style={{
                          background: '#FF6100',
                          color: '#fff',
                          padding: '3px 8px',
                          borderRadius: '6px',
                          fontSize: '11px',
                          fontWeight: '800',
                          lineHeight: 1.2,
                          whiteSpace: 'nowrap'
                        }}>
                          {priceStr}€
                        </span>
                        <span style={{
                          background: '#FF6100',
                          color: '#fff',
                          padding: '3px 8px',
                          borderRadius: '6px',
                          fontSize: '11px',
                          fontWeight: '800',
                          lineHeight: 1.2,
                          whiteSpace: 'nowrap'
                        }}>
                          {days} {dayLabel}
                        </span>
                      </div>
                    )}

                    {rented && (
                      <div style={{
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        right: 0,
                        background: 'rgba(28, 28, 28, 0.95)',
                        color: '#FF6100',
                        textAlign: 'center',
                        padding: '8px 4px',
                        fontWeight: '900',
                        fontSize: '13px',
                        letterSpacing: '0.04em',
                        textTransform: 'uppercase'
                      }}>
                        Alquilado
                      </div>
                    )}
                  </div>
                  <div className="game-info" style={{ padding: '10px 0' }}>
                    <p className="game-item-label" style={{ marginBottom: '4px' }}>{game.title}</p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', opacity: 0.8 }}>
                      <FaStar style={{ color: '#FFD700' }} />
                      <span>{game.seller?.rating?.toFixed(1) || '0.0'}</span>
                    </div>
                    <p style={{ fontSize: '11px', marginTop: '4px', opacity: 0.6 }}>Vendedor: {game.seller?.name || 'Anon'}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Comparativa;

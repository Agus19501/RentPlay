import { useEffect, useRef, useState } from 'react';
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
  const [game, setGame] = useState(null);
  const [relatedGames, setRelatedGames] = useState([]);
  const [status, setStatus] = useState('loading');

  const gameId = searchParams.get('gameId');

  const translations = {
    ES: {
      searchTitle: 'RESULTADOS PARA UNCHARTED 4',
      searchSub: 'Explora las diferentes ofertas para el videojuego que has seleccionado',
      relatedTitle: 'RELACIONADOS',
      relatedSub: 'Echa un vistazo a otros juegos de rentplay relacionados con Uncharted 4',
      price: '0.99 EUR',
      duration: '1 día'
    },
    EN: {
      searchTitle: 'RESULTS FOR UNCHARTED 4',
      searchSub: 'Explore the different offers for the video game you have selected',
      relatedTitle: 'RELATED',
      relatedSub: 'Take a look at other rentplay games related to Uncharted 4',
      price: '0.99 EUR',
      duration: '1 day'
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

        const catalog = data.games || [];
        const selected = gameId ? catalog.find((item) => String(item.id) === String(gameId)) : catalog[0];
        const related = catalog.filter((item) => !selected || item.id !== selected.id).slice(0, 15);

        setGame(selected || null);
        setRelatedGames(related);
        setStatus(selected ? 'ready' : 'error');
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
  }, [gameId]);

  const handleScrollDetect = (key, ref) => {
    const isScrolled = ref.current.scrollLeft > 10;
    setShowLeft((prev) => ({ ...prev, [key]: isScrolled }));
  };

  const executeScroll = (ref, direction) => {
    const offset = direction === 'left' ? -500 : 500;
    ref.current.scrollBy({ left: offset, behavior: 'smooth' });
  };

  const offers = game
    ? Array.from({ length: 15 }, (_, index) => ({
        id: `${game.id}-${index}`,
        title: game.title,
        price: game.price,
        duration: `${game.rentalDays} ${lang === 'ES' ? 'días' : 'days'}`,
        platform: game.platform
      }))
    : [];

  return (
    <div className="comparativa-page">
      <section className="home-section">
        <div className="section-header">
          <div>
            <h2 className="section-title">{game ? `${lang === 'ES' ? 'RESULTADOS PARA' : 'RESULTS FOR'} ${game.title}` : t.searchTitle}</h2>
            <p className="section-subtitle">{game ? game.description : t.searchSub}</p>
          </div>
        </div>

        {status === 'loading' && <p className="section-subtitle">Cargando comparativa...</p>}
        {status === 'error' && <p className="section-subtitle">No se encontró el juego seleccionado.</p>}

        <div className="content-relative-wrapper">
          {showLeft.search1 && <button className="nav-btn left-btn game-btn-pos" onClick={() => executeScroll(searchRef1, 'left')} type="button"><FaChevronLeft /></button>}
          <div className="scroll-area" ref={searchRef1} onScroll={() => handleScrollDetect('search1', searchRef1)}>
            {offers.map((offer) => (
              <div key={`row1-${offer.id}`} className="item-card" onClick={() => navigate(`/games/${game.id}`)} role="button" tabIndex={0}>
                <div className="rect-placeholder">
                  <div className="offer-overlay">
                    <p className="offer-price">{offer.price} EUR</p>
                    <p className="offer-duration">{offer.duration}</p>
                  </div>
                </div>
                <p className="item-label">{offer.title}</p>
              </div>
            ))}
          </div>
          <button className="nav-btn right-btn game-btn-pos" onClick={() => executeScroll(searchRef1, 'right')} type="button"><FaChevronRight /></button>
        </div>

        <div className="content-relative-wrapper" style={{ marginTop: '30px' }}>
          {showLeft.search2 && <button className="nav-btn left-btn game-btn-pos" onClick={() => executeScroll(searchRef2, 'left')} type="button"><FaChevronLeft /></button>}
          <div className="scroll-area" ref={searchRef2} onScroll={() => handleScrollDetect('search2', searchRef2)}>
            {offers.map((offer) => (
              <div key={`row2-${offer.id}`} className="item-card" onClick={() => navigate(`/games/${game.id}`)} role="button" tabIndex={0}>
                <div className="rect-placeholder">
                  <div className="offer-overlay">
                    <p className="offer-price">{offer.price} EUR</p>
                    <p className="offer-duration">{offer.duration}</p>
                  </div>
                </div>
                <p className="item-label">{offer.title}</p>
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
            {relatedGames.map((game) => (
              <div key={`rel-${game.id}`} className="item-card" onClick={() => navigate(`/comparativa?gameId=${game.id}`)} role="button" tabIndex={0}>
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

export default Comparativa;

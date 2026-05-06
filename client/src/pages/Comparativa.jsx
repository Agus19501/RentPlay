import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaChevronRight, FaChevronLeft } from 'react-icons/fa';
import './Comparativa.css';

const Comparativa = ({ lang }) => {
  const navigate = useNavigate();
  const searchRef1 = useRef(null);
  const searchRef2 = useRef(null);
  const relatedRef = useRef(null);
  const [showLeft, setShowLeft] = useState({ search1: false, search2: false, related: false });

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

  const handleScrollDetect = (key, ref) => {
    const isScrolled = ref.current.scrollLeft > 10;
    setShowLeft((prev) => ({ ...prev, [key]: isScrolled }));
  };

  const executeScroll = (ref, direction) => {
    const offset = direction === 'left' ? -500 : 500;
    ref.current.scrollBy({ left: offset, behavior: 'smooth' });
  };

  const unchartedGames = Array.from({ length: 15 }, (_, index) => ({
    id: `uncharted-${index}`,
    title: 'Uncharted 4',
    price: t.price,
    duration: t.duration
  }));

  const relatedGames = Array.from({ length: 15 }, (_, index) => ({
    id: index + 1,
    title: ['The Last of Us II', 'GTA Vice City', 'DOOM', 'Dark Souls II', 'Stardew Valley', 'Terraria', 'Elden Ring', 'Halo Infinite', 'Spider-Man', 'God of War', 'Minecraft', 'Cyberpunk 2077', 'Resident Evil 4', 'Final Fantasy VII', 'Hollow Knight'][index] || `Juego ${index + 1}`,
    category: ['Acción', 'Shooter', 'RPG', 'Simulación', 'Aventura'][index % 5]
  }));

  return (
    <div className="comparativa-page">
      <section className="home-section">
        <div className="section-header">
          <h2 className="section-title">{t.searchTitle}</h2>
          <p className="section-subtitle">{t.searchSub}</p>
        </div>

        <div className="content-relative-wrapper">
          {showLeft.search1 && <button className="nav-btn left-btn game-btn-pos" onClick={() => executeScroll(searchRef1, 'left')} type="button"><FaChevronLeft /></button>}
          <div className="scroll-area" ref={searchRef1} onScroll={() => handleScrollDetect('search1', searchRef1)}>
            {unchartedGames.map((game) => (
              <div key={`row1-${game.id}`} className="item-card" onClick={() => navigate(`/games/${game.id}`)} role="button" tabIndex={0}>
                <div className="rect-placeholder">
                  <div className="offer-overlay">
                    <p className="offer-price">{game.price}</p>
                    <p className="offer-duration">{game.duration}</p>
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
            {unchartedGames.map((game) => (
              <div key={`row2-${game.id}`} className="item-card" onClick={() => navigate(`/games/${game.id}`)} role="button" tabIndex={0}>
                <div className="rect-placeholder">
                  <div className="offer-overlay">
                    <p className="offer-price">{game.price}</p>
                    <p className="offer-duration">{game.duration}</p>
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
            {relatedGames.map((game) => (
              <div key={`rel-${game.id}`} className="item-card" onClick={() => navigate('/comparativa')} role="button" tabIndex={0}>
                <div className="rect-placeholder"><span>{game.category}</span></div>
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

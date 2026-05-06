import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaChevronRight, FaChevronLeft } from 'react-icons/fa';
import './Resultados.css';

const Resultados = ({ lang }) => {
  const navigate = useNavigate();
  const searchRef1 = useRef(null);
  const searchRef2 = useRef(null);
  const relatedRef = useRef(null);
  const [showLeft, setShowLeft] = useState({ search1: false, search2: false, related: false });

  const translations = {
    ES: {
      searchTitle: 'RESULTADOS DE LA BÚSQUEDA',
      searchSub: 'Explora los videojuegos que concuerdan con tu búsqueda',
      relatedTitle: 'RELACIONADOS',
      relatedSub: 'Echa un vistazo a otros juegos de rentplay relacionados con tu búsqueda'
    },
    EN: {
      searchTitle: 'SEARCH RESULTS',
      searchSub: 'Explore the video games that match your search',
      relatedTitle: 'RELATED',
      relatedSub: 'Take a look at other rentplay games related to your search'
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

  const games = Array.from({ length: 15 }, (_, index) => ({
    id: index + 1,
    title: ['GTA Vice City', 'DOOM', 'Dark Souls II', 'Stardew Valley', 'The Last of Us II', 'Terraria', 'Uncharted 4', 'Elden Ring', 'Halo Infinite', 'Spider-Man', 'God of War', 'Minecraft', 'Cyberpunk 2077', 'Resident Evil 4', 'Final Fantasy VII'][index] || `Juego ${index + 1}`,
    category: ['Acción', 'Shooter', 'RPG', 'Simulación', 'Aventura'][index % 5]
  }));

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
            {games.map((game) => (
              <div key={`s1-${game.id}`} className="item-card" onClick={() => navigate(`/comparativa?gameId=${game.id}`)} role="button" tabIndex={0}>
                <div className="rect-placeholder"><span>{game.category}</span></div>
                <p className="item-label">{game.title}</p>
              </div>
            ))}
          </div>
          <button className="nav-btn right-btn game-btn-pos" onClick={() => executeScroll(searchRef1, 'right')} type="button"><FaChevronRight /></button>
        </div>

        <div className="content-relative-wrapper" style={{ marginTop: '30px' }}>
          {showLeft.search2 && <button className="nav-btn left-btn game-btn-pos" onClick={() => executeScroll(searchRef2, 'left')} type="button"><FaChevronLeft /></button>}
          <div className="scroll-area" ref={searchRef2} onScroll={() => handleScrollDetect('search2', searchRef2)}>
            {games.slice().reverse().map((game) => (
              <div key={`s2-${game.id}`} className="item-card" onClick={() => navigate(`/comparativa?gameId=${game.id}`)} role="button" tabIndex={0}>
                <div className="rect-placeholder"><span>{game.category}</span></div>
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
            {games.map((game) => (
              <div key={`related-${game.id}`} className="item-card" onClick={() => navigate(`/comparativa?gameId=${game.id}`)} role="button" tabIndex={0}>
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

export default Resultados;

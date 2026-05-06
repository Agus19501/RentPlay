import { useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaChevronLeft, FaChevronRight, FaImage, FaStar, FaUserCircle } from 'react-icons/fa';

const GAME_TITLES = ['GTA VI', 'DOOM Eternal', 'Dark Souls II', 'Stardew Valley', 'The Last of Us II', 'Terraria', 'Uncharted 4', 'Cyberpunk 2077'];
const PROFILE_NAMES = ['Juanje_dor34', 'Xx_Anton_xX', 'Davidpro21', 'Navarete7', 'Ratileonde', 'Alfrentio Jr', 'err4st00', 'GamerPro_88', 'Lara_Gamer', 'Alex_99', 'Marta_Play', 'Gamer_Vlc', 'Sofia_Pixel', 'Rafa_Kill', 'Lucas_Indie'];

const Home = () => {
  const navigate = useNavigate();
  const gamesRef = useRef(null);
  const profilesRef = useRef(null);
  const [showLeft, setShowLeft] = useState({ games: false, profiles: false });

  const games = useMemo(() => GAME_TITLES.map((title, index) => ({ id: index + 1, title })), []);
  const profiles = useMemo(() => PROFILE_NAMES.map((name, index) => ({ id: index + 1, name })), []);

  const handleScrollDetect = (key, ref) => {
    const isScrolled = (ref.current?.scrollLeft || 0) > 10;
    setShowLeft((prev) => ({ ...prev, [key]: isScrolled }));
  };

  const executeScroll = (ref, direction) => {
    ref.current?.scrollBy({ left: direction === 'left' ? -500 : 500, behavior: 'smooth' });
  };

  return (
    <div className="home-page">
      <section className="home-section">
        <div className="section-header">
          <div className="section-info">
            <h2 className="section-title">NUEVOS JUEGOS</h2>
            <p className="section-description">Echa un vistazo a los últimos juegos añadidos a rentplay</p>
          </div>
          <button className="carousel-nav carousel-next" data-carousel="new-games" type="button" onClick={() => executeScroll(gamesRef, 'right')}>
            <FaChevronRight />
          </button>
        </div>

        <div className="carousel-container" id="new-games">
          {showLeft.games && (
            <button className="carousel-nav" type="button" onClick={() => executeScroll(gamesRef, 'left')} style={{ position: 'absolute', left: 0, top: '50%', zIndex: 2 }}>
              <FaChevronLeft />
            </button>
          )}
          <div className="carousel-scroll" ref={gamesRef} onScroll={() => handleScrollDetect('games', gamesRef)}>
            {games.map((game) => (
              <div key={game.id} className="game-item" onClick={() => navigate('/ver-juego')} role="button" tabIndex={0}>
                <div className="game-image"><FaImage /></div>
                <p className="game-item-label">{game.title}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="home-section">
        <div className="section-header">
          <div className="section-info">
            <h2 className="section-title">PERFILES DESTACADOS</h2>
            <p className="section-description">Visita los perfiles mejor valorados de rentplay</p>
          </div>
          <button className="carousel-nav carousel-next" data-carousel="profiles" type="button" onClick={() => executeScroll(profilesRef, 'right')}>
            <FaChevronRight />
          </button>
        </div>

        <div className="carousel-container" id="profiles">
          {showLeft.profiles && (
            <button className="carousel-nav" type="button" onClick={() => executeScroll(profilesRef, 'left')} style={{ position: 'absolute', left: 0, top: '50%', zIndex: 2 }}>
              <FaChevronLeft />
            </button>
          )}
          <div className="carousel-scroll" ref={profilesRef} onScroll={() => handleScrollDetect('profiles', profilesRef)}>
            {profiles.map((profile, index) => (
              <div key={profile.id} className="profile-item" onClick={() => navigate('/ajustes')} role="button" tabIndex={0}>
                <div className="profile-avatar"><FaUserCircle /></div>
                <h3 className="profile-name">{profile.name}</h3>
                <div className="profile-rating">
                  <FaStar /><FaStar /><FaStar /><FaStar />
                  {index % 3 === 0 ? <FaStar /> : <FaStar style={{ opacity: 0.4 }} />}
                  <span className="rating-count">{35 + index * 3}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;

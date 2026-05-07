import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaChevronLeft, FaChevronRight, FaImage, FaStar, FaUserCircle } from 'react-icons/fa';
import { apiRequest } from '../api.js';
import cover1 from '../integrations/MAIN_Iker/assets/images/cover1.svg';

const Home = () => {
  const navigate = useNavigate();
  const gamesRef = useRef(null);
  const profilesRef = useRef(null);
  const [showLeft, setShowLeft] = useState({ games: false, profiles: false });
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);

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

  const sellerProfiles = useMemo(() => {
    const map = new Map();

    for (const game of games) {
      const seller = game.seller;
      const sellerName = typeof seller === 'string' ? seller : seller?.name;

      if (!sellerName || map.has(sellerName)) {
        continue;
      }

      map.set(sellerName, {
        id: game.id,
        name: sellerName,
        rating: seller?.rating ?? game.rating ?? 0,
        reviews: seller?.reviews ?? 0,
        gameCount: games.filter((item) => {
          const itemSeller = typeof item.seller === 'string' ? item.seller : item.seller?.name;
          return itemSeller === sellerName;
        }).length
      });
    }

    return Array.from(map.values()).slice(0, 15);
  }, [games]);

  const visibleGames = games.slice(0, 8);

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
            {loading && <p className="section-description">Cargando catálogo real...</p>}
            {!loading && visibleGames.map((game) => (
              <div key={game.id} className="game-item" onClick={() => navigate(`/games/${game.id}`)} role="button" tabIndex={0}>
                <div className="game-image">
                  {game.image ? <img src={`/${game.image}`} alt={game.title} onError={(event) => { event.currentTarget.src = cover1; }} /> : <img src={cover1} alt={game.title} />}
                </div>
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
            {!loading && sellerProfiles.map((profile) => (
              <div key={profile.name} className="profile-item" role="button" tabIndex={0}>
                <div className="profile-avatar"><FaUserCircle /></div>
                <h3 className="profile-name">{profile.name}</h3>
                <div className="profile-rating">
                  <FaStar /><FaStar /><FaStar /><FaStar />
                  <FaStar style={{ opacity: profile.rating >= 4.5 ? 1 : 0.35 }} />
                  <span className="rating-count">{profile.reviews}</span>
                </div>
                <p className="profile-description">{profile.gameCount} juegos publicados</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;

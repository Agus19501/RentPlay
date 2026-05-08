import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaChevronLeft, FaChevronRight, FaImage, FaStar, FaUserCircle } from 'react-icons/fa';
import { apiRequest, getSession } from '../api.js';
import cover1 from '../integrations/MAIN_Iker/assets/images/cover1.svg';
import './Home.css';

const Home = ({ lang }) => {
  const navigate = useNavigate();
  const gamesRef = useRef(null);
  const profilesRef = useRef(null);
  const myGamesRef = useRef(null);
  const [showLeft, setShowLeft] = useState({ games: false, profiles: false, myGames: false });
  const [games, setGames] = useState([]);
  const [myRentals, setMyRentals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [profileUpdates, setProfileUpdates] = useState(0);

  const t = {
    ES: {
      newArrivals: "NOVEDADES DEL MOMENTO",
      newDesc: "Explora los últimos videojuegos que se han añadido a nuestro catálogo",
      profiles: "PERFILES DE VENDEDORES",
      profilesDesc: "Encuentra a los mejores vendedores de videojuegos en nuestra plataforma",
      myRentals: "MIS ALQUILERES ACTIVOS",
      myRentalsDesc: "Gestiona y revisa los videojuegos que tienes alquilados actualmente",
      noRentals: "No tienes alquileres activos en este momento.",
      noGames: "No hay videojuegos disponibles en este momento.",
      loading: "Cargando contenido...",
      more: "Ver más",
      gameCount: "juegos"
    },
    EN: {
      newArrivals: "NEW ARRIVALS",
      newDesc: "Explore the latest video games added to our catalog",
      profiles: "SELLER PROFILES",
      profilesDesc: "Find the best video game sellers on our platform",
      myRentals: "MY ACTIVE RENTALS",
      myRentalsDesc: "Manage and review the video games you are currently renting",
      noRentals: "You have no active rentals at the moment.",
      noGames: "No video games available at the moment.",
      loading: "Loading content...",
      more: "View more",
      gameCount: "games"
    }
  }[lang] || {
    ES: {
      newArrivals: "NOVEDADES DEL MOMENTO",
      newDesc: "Explora los últimos videojuegos que se han añadido a nuestro catálogo",
      profiles: "PERFILES DE VENDEDORES",
      profilesDesc: "Encuentra a los mejores vendedores de videojuegos en nuestra plataforma",
      myRentals: "MIS ALQUILERES ACTIVOS",
      myRentalsDesc: "Gestiona y revisa los videojuegos que tienes alquilados actualmente",
      noRentals: "No tienes alquileres activos en este momento.",
      noGames: "No hay videojuegos disponibles en este momento.",
      loading: "Cargando contenido...",
      more: "Ver más",
      gameCount: "juegos"
    }
  };

  useEffect(() => {
    let active = true;

    const session = getSession();
    const fetchPromises = [apiRequest('/api/games')];
    if (session?.token) {
      fetchPromises.push(apiRequest('/api/rentals/mine', { token: session.token }));
    }

    Promise.all(fetchPromises)
      .then(([gamesRes, rentalsRes]) => {
        if (active) {
          setGames(gamesRes.games || []);
          if (rentalsRes) {
            setMyRentals(rentalsRes.rentals || []);
          }
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

  // Listen for storage events to update UI when profile changes
  useEffect(() => {
    const handleStorage = () => setProfileUpdates(prev => prev + 1);
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const sellerProfiles = useMemo(() => {
    const map = new Map();
    const session = getSession();

    for (const game of games) {
      const uploadedBy = game.uploadedBy;
      const seller = game.seller;
      let sellerName = typeof seller === 'string' ? seller : seller?.name;
      let sellerAvatar = seller?.avatar;

      // Override with session data if it's the logged-in user
      if (session?.user?.id === uploadedBy) {
        sellerName = session.user.name || sellerName;
        sellerAvatar = session.user.avatar || sellerAvatar;
      }

      if (!uploadedBy || !sellerName || map.has(uploadedBy)) {
        continue;
      }

      map.set(uploadedBy, {
        userId: uploadedBy,
        id: uploadedBy,
        name: sellerName,
        rating: seller?.rating ?? 0,
        reviews: seller?.reviews ?? 0,
        avatar: sellerAvatar,
        gameCount: games.filter((item) => item.uploadedBy === uploadedBy).length
      });
    }

    return Array.from(map.values()).slice(0, 15);
  }, [games, profileUpdates]);

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

  const visibleGames = uniqueGames.slice(0, 12);

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
            <h2 className="section-title">{t.newArrivals}</h2>
            <p className="section-description">{t.newDesc}</p>
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
            {loading && <p className="section-description">{t.loading}</p>}
            {!loading && visibleGames.length === 0 && <p className="section-description">{t.noGames}</p>}
            {!loading && visibleGames.map((game) => (
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

      <section className="home-section">
        <div className="section-header">
          <div className="section-info">
            <h2 className="section-title">{t.profiles}</h2>
            <p className="section-description">{t.profilesDesc}</p>
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
              <div 
                key={profile.userId} 
                className="profile-item" 
                role="button" 
                tabIndex={0}
                onClick={() => {
                  const session = getSession();
                  if (session?.user?.id === profile.userId) {
                    navigate('/perfil');
                  } else {
                    navigate(`/perfil-otro?id=${profile.userId}`);
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const session = getSession();
                    if (session?.user?.id === profile.userId) {
                      navigate('/perfil');
                    } else {
                      navigate(`/perfil-otro?id=${profile.userId}`);
                    }
                  }
                }}
              >
                <div className="profile-avatar">
                  {profile.avatar ? (
                    <img 
                      src={profile.avatar.startsWith('data:') ? profile.avatar : `/${profile.avatar}`} 
                      alt={profile.name} 
                      onError={(e) => { e.currentTarget.src = ''; e.currentTarget.parentElement.innerHTML = '👤'; }}
                      style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} 
                    />
                  ) : (
                    <FaUserCircle />
                  )}
                </div>
                <h3 className="profile-name">{profile.name}</h3>
                <div className="profile-rating">
                  <FaStar style={{ color: '#FFD700' }} />
                  <span className="rating-count" style={{ marginLeft: '4px', fontSize: '14px', fontWeight: 'bold' }}>
                    {profile.rating.toFixed(1)}
                  </span>
                  <span className="rating-count" style={{ marginLeft: '4px', opacity: 0.7 }}>
                    ({profile.reviews})
                  </span>
                </div>
                <p className="profile-description">{profile.gameCount} {t.gameCount}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {myRentals.length > 0 && (
        <section className="home-section">
          <div className="section-header">
            <div className="section-info">
              <h2 className="section-title">{t.myRentals}</h2>
              <p className="section-description">{t.myRentalsDesc}</p>
            </div>
            <button className="carousel-nav carousel-next" type="button" onClick={() => executeScroll(myGamesRef, 'right')}>
              <FaChevronRight />
            </button>
          </div>

          <div className="carousel-container">
            {showLeft.myGames && (
              <button className="carousel-nav" type="button" onClick={() => executeScroll(myGamesRef, 'left')} style={{ position: 'absolute', left: 0, top: '50%', zIndex: 2 }}>
                <FaChevronLeft />
              </button>
            )}
            <div className="carousel-scroll" ref={myGamesRef} onScroll={() => handleScrollDetect('myGames', myGamesRef)}>
              {myRentals.map((rental) => (
                <div key={rental.id} className="game-item" onClick={() => navigate(`/mi-alquiler?id=${rental.game?.id || rental.gameId}`)} role="button" tabIndex={0}>
                  <div className="game-image">
                    {rental.game?.image ? (
                      <img 
                        src={rental.game.image.startsWith('data:') ? rental.game.image : `/${rental.game.image}`} 
                        alt={rental.game.title} 
                        onError={(event) => { event.currentTarget.src = cover1; }} 
                      />
                    ) : (
                      <img src={cover1} alt={rental.game?.title || 'Juego'} />
                    )}
                  </div>
                  <p className="game-item-label">{rental.game?.title}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
};

export default Home;

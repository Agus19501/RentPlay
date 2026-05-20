import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaChevronLeft, FaChevronRight, FaStar, FaUserCircle } from 'react-icons/fa';
import { apiRequest, getSession } from '../api.js';
import { notify } from '../utils/notify.js';
import cover1 from '../integrations/MAIN_Iker/assets/images/cover1.svg';
import './Home.css';

const HOME_GAMES_CACHE_KEY = 'rentplay_home_games_cache_v1';
const HOME_GAMES_CACHE_TTL_MS = 20000;

const Home = ({ lang }) => {
  const navigate = useNavigate();
  const gamesRef = useRef(null);
  const profilesRef = useRef(null);
  const myGamesRef = useRef(null);
  const [showLeft, setShowLeft] = useState({ games: false, profiles: false, myGames: false });
  const [games, setGames] = useState([]);
  const [sellerProfiles, setSellerProfiles] = useState([]);
  const [myRentals, setMyRentals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [profilesLoading, setProfilesLoading] = useState(true);

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
      noProfiles: "No hay perfiles destacados disponibles en este momento.",
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
      noProfiles: "No featured profiles available right now.",
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
      noProfiles: "No hay perfiles destacados disponibles en este momento.",
      loading: "Cargando contenido...",
      more: "Ver más",
      gameCount: "juegos"
    }
  };

  useEffect(() => {
    let active = true;

    const session = getSession();

    // Pintar instantaneamente con cache local reciente si existe
    try {
      const cached = JSON.parse(localStorage.getItem(HOME_GAMES_CACHE_KEY) || 'null');
      if (cached?.ts && Array.isArray(cached.games) && (Date.now() - cached.ts) < HOME_GAMES_CACHE_TTL_MS) {
        setGames(cached.games);
        setLoading(false);
      }
    } catch {
      // Ignore cache parse failures
    }

    // Cargar juegos primero para pintar Home cuanto antes
    apiRequest('/api/games?lite=1')
      .then((gamesRes) => {
        if (active) {
          const nextGames = gamesRes.games || [];
          setGames(nextGames);
          try {
            localStorage.setItem(HOME_GAMES_CACHE_KEY, JSON.stringify({ ts: Date.now(), games: nextGames }));
          } catch {
            // Ignore cache write failures so a successful API response still renders Home.
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

    setProfilesLoading(true);
    apiRequest('/api/auth/top-rated?limit=10')
      .then((profilesRes) => {
        if (active) {
          setSellerProfiles(profilesRes.users || []);
        }
      })
      .catch(() => {
        if (active) {
          setSellerProfiles([]);
        }
      })
      .finally(() => {
        if (active) {
          setProfilesLoading(false);
        }
      });

    // Cargar alquileres y notificaciones del dueño en paralelo, sin bloquear el render principal
    if (session?.token) {
      apiRequest('/api/rentals/mine', { token: session.token })
        .then((rentalsRes) => {
          if (active) {
            setMyRentals(rentalsRes.rentals || []);
          }
        })
        .catch(() => {
          if (active) {
            setMyRentals([]);
          }
        });

      apiRequest('/api/rentals/owner-notifications', { token: session.token })
        .then((notificationsRes) => {
          if (!active) {
            return;
          }

          (notificationsRes.notifications || []).forEach((item) => {
            notify(item.message, 'success', 4500);
          });
        })
        .catch(() => {
          // Silent fail: notifications should not block Home rendering.
        });
    }

    return () => {
      active = false;
    };
  }, []);

  const visibleGames = useMemo(() => games.slice(0, 15), [games]);

  const resolveAssetUrl = (value) => {
    if (!value || typeof value !== 'string') {
      return '';
    }

    if (value.startsWith('data:') || value.startsWith('http') || value.startsWith('/')) {
      return value;
    }

    return `/${value}`;
  };

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
              <div
                key={game.id}
                className="game-item"
                onClick={() => navigate(`/comparativa?title=${encodeURIComponent(game.title)}`, {
                  state: {
                    prefetchedGames: games.filter((g) => (g.title || '').toLowerCase().trim() === (game.title || '').toLowerCase().trim())
                  }
                })}
                role="button"
                tabIndex={0}
              >
                <div className="game-image">
                  {game.image ? (
                    <img 
                      src={resolveAssetUrl(game.image)} 
                      alt={game.title} 
                      loading="lazy"
                      decoding="async"
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
            {profilesLoading && <p className="section-description">{t.loading}</p>}
            {!profilesLoading && sellerProfiles.length === 0 && <p className="section-description">{t.noProfiles}</p>}
            {!profilesLoading && sellerProfiles.map((profile) => (
              <div 
                key={profile.id} 
                className="profile-item" 
                role="button" 
                tabIndex={0}
                onClick={() => {
                  const session = getSession();
                  if (session?.user?.id === profile.id) {
                    navigate('/perfil');
                  } else {
                    navigate(`/perfil-otro?id=${profile.id}`);
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const session = getSession();
                    if (session?.user?.id === profile.id) {
                      navigate('/perfil');
                    } else {
                      navigate(`/perfil-otro?id=${profile.id}`);
                    }
                  }
                }}
              >
                <div className="profile-avatar">
                  <FaUserCircle className="profile-avatar-fallback" />
                  {profile.avatar ? (
                    <img 
                      src={resolveAssetUrl(profile.avatar)} 
                      className="profile-avatar-image"
                      alt={profile.name} 
                      onError={(event) => {
                        event.currentTarget.style.display = 'none';
                      }}
                    />
                  ) : null}
                </div>
                <h3 className="profile-name">{profile.name}</h3>
                <div className="profile-rating">
                  <span className="rating-value">{Number(profile.rating || 0).toFixed(1)}</span>
                  <FaStar style={{ color: '#FFD700' }} />
                  <span className="rating-count">({profile.reviews})</span>
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
                        src={resolveAssetUrl(rental.game.image)} 
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

import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaChevronLeft, FaChevronRight, FaCheckCircle, FaImage, FaPaperPlane, FaStar, FaUser, FaUserCircle } from 'react-icons/fa';
import { apiRequest } from '../../../api.js';
import cover1 from '../assets/images/cover1.svg';

export default function MiAlquiler() {
  const navigate = useNavigate();
  const [rentals, setRentals] = useState([]);
  const [sessionUser, setSessionUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [countdown, setCountdown] = useState('00:00:00');

  useEffect(() => {
    let active = true;

    const loadData = async () => {
      try {
        const [meResponse, rentalsResponse] = await Promise.all([
          apiRequest('/api/auth/me').catch(() => null),
          apiRequest('/api/rentals/mine').catch(() => ({ rentals: [] }))
        ]);

        if (!active) {
          return;
        }

        setSessionUser(meResponse?.user || null);
        setRentals(rentalsResponse.rentals || []);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadData();

    return () => {
      active = false;
    };
  }, []);

  const latestRental = rentals[0] || null;
  const rentalGame = latestRental?.game || null;

  useEffect(() => {
    if (!latestRental?.expiresAt) {
      setCountdown('00:00:00');
      return undefined;
    }

    const updateCountdown = () => {
      const remaining = new Date(latestRental.expiresAt).getTime() - Date.now();
      if (remaining <= 0) {
        setCountdown('00:00:00');
        return;
      }

      const hours = Math.floor(remaining / 3600000);
      const minutes = Math.floor((remaining % 3600000) / 60000);
      const seconds = Math.floor((remaining % 60000) / 1000);
      setCountdown([hours, minutes, seconds].map((value) => String(value).padStart(2, '0')).join(':'));
    };

    updateCountdown();
    const timer = setInterval(updateCountdown, 1000);
    return () => clearInterval(timer);
  }, [latestRental]);

  const recommendedGames = useMemo(() => rentals.slice(1, 4).map((rental) => rental.game).filter(Boolean), [rentals]);

  return (
    <div className="main-content">
      <div className="container">
        <div className="breadcrumb">
          <button type="button" onClick={() => navigate('/home')} style={{ background: 'none', border: 0, color: 'inherit', cursor: 'pointer', padding: 0 }}>Mis Alquileres</button> / <span>{rentalGame?.title || 'Sin alquileres'}</span>
        </div>

        <section className="product-section">
          <div className="product-content">
            <div className="product-gallery">
              <div className="main-image-container">
                <div className="image-placeholder main-image">
                  {rentalGame?.image ? <img src={`/${rentalGame.image}`} alt={rentalGame.title} onError={(event) => { event.currentTarget.src = cover1; }} /> : <img src={cover1} alt={rentalGame?.title || 'Juego'} />}
                </div>
              </div>
              <div className="gallery-controls">
                <button className="btn-nav-prev" type="button"><FaChevronLeft /><span>ANTERIOR</span></button>
                <button className="btn-nav-next" type="button"><span>SIGUIENTE</span><FaChevronRight /></button>
              </div>
              <div className="rating">
                <FaStar /><FaStar /><FaStar /><FaStar /><FaStar style={{ opacity: 0.45 }} />
                <span className="rating-value">{rentalGame?.rating ?? 0}</span>
              </div>
            </div>

            <div className="product-info">
              <div className="product-header">
                <h1 className="product-title">{rentalGame?.title || 'No tienes alquileres activos'}</h1>
                <button className="wishlist-btn" type="button" aria-label="Favorito"><FaStar style={{ opacity: 0.35 }} /></button>
              </div>

              <div className="description-section">
                <h2 className="section-title">Descripción del videojuego</h2>
                <p className="description-text">{rentalGame?.description || 'Todavía no tienes un juego alquilado. Cuando alquiles uno desde el catálogo, aparecerá aquí con sus datos reales.'}</p>
                <p className="description-text">{rentalGame?.genre ? `Género: ${rentalGame.genre}.` : 'Explora el catálogo para ver la información completa de cada juego.'}</p>
              </div>

              <div className="rental-details">
                <div className="detail-item">
                  <span className="detail-label">DURACIÓN ALQUILER</span>
                  <span className="detail-value">{rentalGame?.rentalDays ? `${rentalGame.rentalDays} DÍAS` : 'SIN DATOS'}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">TIEMPO RESTANTE DE ALQUILER</span>
                  <span className="detail-value countdown" id="countdown">{latestRental ? countdown : '00:00:00'}</span>
                </div>
              </div>

              <div className="rental-status">
                <FaCheckCircle />
                <span>{latestRental ? 'ALQUILADO' : 'SIN ALQUILER ACTIVO'}</span>
              </div>
            </div>

            <div className="seller-section">
              <h3 className="section-title">ALQUILADO A</h3>
              <div className="seller-card">
                <div className="seller-avatar-placeholder"><FaUser /></div>
                <h4 className="seller-name">{rentalGame?.seller?.name || 'Sin vendedor'}</h4>
                <div className="seller-rating">
                  <FaStar /><FaStar /><FaStar /><FaStar /><FaStar style={{ opacity: 0.45 }} />
                  <span className="rating-value">{rentalGame?.seller?.rating ?? rentalGame?.rating ?? 0}</span>
                </div>
                <button className="btn-contact-rental" type="button" onClick={() => navigate('/mensajes')}>
                  <FaPaperPlane /> Mensajes
                </button>
                <button className="btn-valorar" type="button" style={{ marginLeft: 10 }} onClick={() => navigate(`/ver-juego?gameId=${rentalGame?.id || ''}`)}>VER JUEGO</button>
              </div>
            </div>
          </div>

          <div className="recommended-section">
            <h2 className="section-title">VIDEOJUEGOS RECOMENDADOS</h2>
            <div className="games-grid">
              {(recommendedGames.length > 0 ? recommendedGames : rentals.slice(0, 3).map((rental) => rental.game).filter(Boolean)).map((game) => (
                <div className="game-card" key={game.id}>
                  <div className="game-image-placeholder">{game.image ? <img src={`/${game.image}`} alt={game.title} onError={(event) => { event.currentTarget.src = cover1; }} /> : <img src={cover1} alt={game.title} />}</div>
                  <h3 className="game-title">{game.title}</h3>
                  <p className="game-price">{game.price ? `${game.price} €` : 'Precio no disponible'}</p>
                  <button className="btn-secondary" type="button" onClick={() => navigate(`/ver-juego?gameId=${game.id}`)}>Ver Detalles</button>
                </div>
              ))}
            </div>
          </div>

          {!loading && rentals.length === 0 && (
            <div className="ratings-list" style={{ marginTop: 24 }}>
              <div className="rating-item">
                <div className="rating-user-avatar"><FaUserCircle /></div>
                <div className="rating-user-info">
                  <h4 className="rating-username">{sessionUser?.name || 'Tu cuenta'}</h4>
                  <p className="rating-comment">Todavía no tienes alquileres activos. Cuando alquiles un juego desde el catálogo, aparecerá aquí.</p>
                </div>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

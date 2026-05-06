import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaChevronLeft, FaChevronRight, FaCheckCircle, FaImage, FaPaperPlane, FaStar, FaTimes, FaUser } from 'react-icons/fa';

const FALLBACK_RENTAL = {
  game: 'GRAND THEFT AUTO : VICE CITY',
  seller: 'Pepe_gom01',
  durationDays: 6,
  payment: 'PayPal',
  countdown: '06:23:45'
};

const RECOMMENDED = [
  { id: 1, title: 'GTA: San Andreas', price: '15.99 €' },
  { id: 2, title: 'GTA III', price: '12.99 €' },
  { id: 3, title: 'Red Dead Redemption', price: '18.99 €' }
];

const SOURCE_RATINGS = [
  {
    id: 1,
    username: 'Juan_6794',
    score: 4,
    comment: 'Un trato estupendo. Un placer hacer negocios con él. Le pongo 4 estrellas porque lo puso un poco caro'
  },
  {
    id: 2,
    username: 'Alba_222',
    score: 3,
    comment: 'Un trato decente pero como tiene juegos exclusivos se aprovecha y sube mucho el precio'
  }
];

export default function MiAlquiler() {
  const navigate = useNavigate();
  const [latestRental, setLatestRental] = useState(null);
  const [countdown, setCountdown] = useState(FALLBACK_RENTAL.countdown);
  const [dbRatings, setDbRatings] = useState([]);

  useEffect(() => {
    const loadRentals = async () => {
      const api = window.RentPlayApi;
      let token = localStorage.getItem('rentplayToken');

      if (api && !token) {
        try {
          await api.register({
            username: `UserTest_${Math.random().toString(36).slice(2, 7)}`,
            email: 'test@rentplay.com',
            password: 'password123'
          });
          token = localStorage.getItem('rentplayToken');
        } catch {
          // Ya existe
        }
      }

      if (api && token) {
        try {
          const response = await api.getMyRentals();
          if (response?.rentals?.length > 0) {
            setLatestRental(response.rentals[0]);
          }
        } catch (error) {
          console.error('Error BD:', error.message);
        }
      }

      const savedRental = JSON.parse(localStorage.getItem('rentHistory') || '[]').slice(-1)[0];
      if (!latestRental && savedRental) {
        setLatestRental({
          game: savedRental.game,
          durationDays: 6,
          payment: savedRental.payment || 'PayPal'
        });
      }
    };

    loadRentals();
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((current) => {
        const [hours, minutes, seconds] = current.split(':').map(Number);
        let total = hours * 3600 + minutes * 60 + seconds - 1;
        if (Number.isNaN(total) || total <= 0) {
          return '00:00:00';
        }
        const h = String(Math.floor(total / 3600)).padStart(2, '0');
        const m = String(Math.floor((total % 3600) / 60)).padStart(2, '0');
        const s = String(total % 60).padStart(2, '0');
        return `${h}:${m}:${s}`;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!window.RentPlayApi?.getSellerRatings || !latestRental) {
      return;
    }

    window.RentPlayApi.getSellerRatings(FALLBACK_RENTAL.seller)
      .then((response) => {
        if (response?.ratings) {
          setDbRatings(response.ratings);
        }
      })
      .catch(() => {});
  }, [latestRental]);

  const displayRatings = useMemo(() => {
    const remoteRatings = dbRatings.map((item, index) => ({
      id: `db-${index}`,
      username: item.username || 'Usuario Anónimo',
      score: Number(item.score || item.rating || 0),
      comment: item.comment || ''
    }));
    return [...remoteRatings, ...SOURCE_RATINGS];
  }, [dbRatings]);

  const rental = latestRental || FALLBACK_RENTAL;

  return (
    <div className="main-content">
      <div className="container">
        <div className="breadcrumb">
          <button type="button" onClick={() => navigate('/home')} style={{ background: 'none', border: 0, color: 'inherit', cursor: 'pointer', padding: 0 }}>Mis Alquileres</button> / <span>{rental.game}</span>
        </div>

        <section className="product-section">
          <div className="product-content">
            <div className="product-gallery">
              <div className="main-image-container">
                <div className="image-placeholder main-image">
                  <FaImage />
                  <p>Imagen del Juego</p>
                </div>
              </div>
              <div className="gallery-controls">
                <button className="btn-nav-prev" type="button"><FaChevronLeft /><span>ANTERIOR</span></button>
                <button className="btn-nav-next" type="button"><span>SIGUIENTE</span><FaChevronRight /></button>
              </div>
              <div className="rating">
                <FaStar /><FaStar /><FaStar /><FaStar /><FaStar style={{ opacity: 0.45 }} />
                <span className="rating-value">4.2</span>
              </div>
            </div>

            <div className="product-info">
              <div className="product-header">
                <h1 className="product-title">{rental.game}</h1>
                <button className="wishlist-btn" type="button" aria-label="Favorito"><FaStar style={{ opacity: 0.35 }} /></button>
              </div>

              <div className="description-section">
                <h2 className="section-title">Descripción del videojuego</h2>
                <p className="description-text">Grand Theft Auto: Vice City es un juego de mundo abierto ambientado en los años 80, con una ciudad llena de neones y estilo retro.</p>
                <p className="description-text">Sigue la historia de Tommy Vercetti mientras sube en el mundo criminal, haciendo misiones, comprando negocios y explorando la ciudad a tu ritmo.</p>
              </div>

              <div className="rental-details">
                <div className="detail-item">
                  <span className="detail-label">DURACIÓN ALQUILER</span>
                  <span className="detail-value">{rental.durationDays || 6} DÍAS</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">TIEMPO RESTANTE DE ALQUILER</span>
                  <span className="detail-value countdown" id="countdown">{countdown}</span>
                </div>
              </div>

              <div className="rental-status">
                <FaCheckCircle />
                <span>ALQUILADO</span>
              </div>
            </div>

            <div className="seller-section">
              <h3 className="section-title">ALQUILADO A</h3>
              <div className="seller-card">
                <div className="seller-avatar-placeholder"><FaUser /></div>
                <h4 className="seller-name">{rental.seller || FALLBACK_RENTAL.seller}</h4>
                <div className="seller-rating">
                  <FaStar /><FaStar /><FaStar /><FaStar /><FaStar style={{ opacity: 0.45 }} />
                  <span className="rating-value">4.1</span>
                </div>
                <button className="btn-contact-rental" type="button" onClick={() => alert('Contacto pendiente de integrar')}>
                  <FaPaperPlane /> Contactar
                </button>
                <button className="btn-valorar" type="button" style={{ marginLeft: 10 }} onClick={() => navigate('/ver-juego')}>VALORAR</button>
              </div>
            </div>
          </div>

          <div className="recommended-section">
            <h2 className="section-title">VIDEOJUEGOS RECOMENDADOS</h2>
            <div className="games-grid">
              {RECOMMENDED.map((game) => (
                <div className="game-card" key={game.id}>
                  <div className="game-image-placeholder"><FaImage /></div>
                  <h3 className="game-title">{game.title}</h3>
                  <p className="game-price">{game.price}</p>
                  <button className="btn-secondary" type="button" onClick={() => navigate('/ver-juego')}>Ver Detalles</button>
                </div>
              ))}
            </div>
          </div>

          <div className="ratings-list" style={{ marginTop: 24 }}>
            {displayRatings.map((item) => (
              <div className="rating-item" key={item.id || `${item.username}-${item.score}`}>
                <div className="rating-user-avatar"><FaUserCircle /></div>
                <div className="rating-user-info">
                  <h4 className="rating-username">{item.username}</h4>
                  <div className="rating-stars">
                    {[0, 1, 2, 3, 4].map((index) => (
                      <FaStar key={index} style={{ opacity: index < Math.round(item.score) ? 1 : 0.25 }} />
                    ))}
                    <span className="rating-score">{Number(item.score).toFixed(1)}</span>
                  </div>
                  <p className="rating-comment">{item.comment}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
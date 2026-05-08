import { useEffect, useMemo, useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { FaChevronLeft, FaChevronRight, FaHeart, FaRegHeart, FaStar, FaStarHalfAlt, FaTimes, FaUser, FaCheckCircle } from 'react-icons/fa';
import '../assets/css/ver-juego.css';
import cover1 from '../assets/images/cover1.svg';
import avatar from '../assets/images/avatar.svg';
import { apiRequest } from '../../../api.js';

export default function MiAlquiler({ lang = 'ES' }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [rentals, setRentals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [localTimeRemaining, setLocalTimeRemaining] = useState('00:00:00');
  const timerRef = useRef(null);

  const texts = {
    ES: {
      loading: 'Cargando alquileres...',
      empty: 'No tienes ningún juego alquilado actualmente.',
      goCatalog: 'Ir al catálogo',
      rentals: 'Mis Alquileres',
      prev: 'ANTERIOR',
      next: 'SIGUIENTE',
      desc: 'Descripción del videojuego',
      noDesc: 'Sin descripción disponible.',
      genre: 'Género',
      devs: 'Desarrolladores',
      duration: 'DURACIÓN ALQUILER',
      noData: 'SIN DATOS',
      remaining: 'TIEMPO RESTANTE',
      rented: 'ALQUILADO',
      owner: 'PROPIETARIO',
      noSeller: 'Sin vendedor',
      rate: 'VALORAR'
    },
    EN: {
      loading: 'Loading rentals...',
      empty: 'You currently have no rented games.',
      goCatalog: 'Go to catalog',
      rentals: 'My rentals',
      prev: 'PREVIOUS',
      next: 'NEXT',
      desc: 'Game description',
      noDesc: 'No description available.',
      genre: 'Genre',
      devs: 'Developers',
      duration: 'RENTAL DURATION',
      noData: 'NO DATA',
      remaining: 'TIME LEFT',
      rented: 'RENTED',
      owner: 'OWNER',
      noSeller: 'No seller',
      rate: 'RATE'
    }
  };
  const t = texts[lang] || texts.ES;

  useEffect(() => {
    let active = true;

    apiRequest('/api/rentals/mine')
      .then((rentalsRes) => {
        if (active) {
          setRentals(rentalsRes.rentals || []);
        }
      })
      .catch(() => {
        if (active) {
          setRentals([]);
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

  const requestedGameId = searchParams.get('id');

  const latestRental = useMemo(() => {
    if (!rentals.length) return null;
    
    // Si tenemos un requestedGameId en la URL, buscamos ese alquiler específico
    if (requestedGameId) {
      const found = rentals.find(r => {
        const gameId = r.game?.id || r.gameId || r.game?._id;
        return String(gameId) === String(requestedGameId);
      });
      if (found) return found;
    }
    
    // Si no hay id o no se encontró, mostramos el alquiler más reciente (el primero de la lista)
    return rentals[0];
  }, [rentals, requestedGameId]);

  const rentalGame = useMemo(() => latestRental?.game || null, [latestRental]);

  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    
    if (!latestRental?.expiresAt) {
      setLocalTimeRemaining('00:00:00');
      return;
    }

    const updateCountdown = () => {
      const total = Date.parse(latestRental.expiresAt) - Date.parse(new Date());
      if (total <= 0) {
        setLocalTimeRemaining('00:00:00');
        clearInterval(timerRef.current);
        return;
      }
      
      const hours = Math.floor(total / (1000 * 60 * 60));
      const minutes = Math.floor((total / (1000 * 60)) % 60);
      const seconds = Math.floor((total / 1000) % 60);
      
      setLocalTimeRemaining(`${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`);
    };

    updateCountdown();
    timerRef.current = setInterval(updateCountdown, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [latestRental]);

  if (loading) {
    return (
      <div className="main-content">
        <div className="container">
          <p>{t.loading}</p>
        </div>
      </div>
    );
  }

  if (!rentalGame) {
    return (
      <div className="main-content">
        <div className="container">
          <p>{t.empty}</p>
          <button className="btn-rent" onClick={() => navigate('/home')} style={{ marginTop: '20px' }}>
            {t.goCatalog}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="main-content">
      <div className="container">
        <div className="breadcrumb">
          <button type="button" onClick={() => navigate('/home')} style={{ background: 'none', border: 0, color: 'inherit', cursor: 'pointer', padding: 0 }}>{t.rentals}</button> / <span>{rentalGame.title}</span>
        </div>

        <section className="product-section">
          <div className="product-content">
            <div className="product-gallery">
              <div className="main-image-container">
                <div className="image-frame">
                  {rentalGame.image ? (
                    <img 
                      src={rentalGame.image.startsWith('data:') ? rentalGame.image : `/${rentalGame.image}`} 
                      alt={rentalGame.title} 
                      className="main-image" 
                      onError={(event) => { event.currentTarget.src = cover1; }} 
                    />
                  ) : (
                    <img src={cover1} alt={rentalGame.title} className="main-image" />
                  )}
                </div>
              </div>
              <div className="gallery-controls">
                <button className="btn-nav-prev" type="button"><FaChevronLeft /><span>{t.prev}</span></button>
                <button className="btn-nav-next" type="button"><span>{t.next}</span><FaChevronRight /></button>
              </div>
            </div>

            <div className="product-info">
              <div className="product-header">
                <h1 className="product-title">{rentalGame.title}</h1>
              </div>

              <div className="description-section">
                <h2 className="section-title">{t.desc}</h2>
                <p className="description-text">{rentalGame.description || t.noDesc}</p>
                <p className="description-text">{rentalGame.genre ? `${t.genre}: ${rentalGame.genre}.` : ''} {rentalGame.developers ? `${t.devs}: ${rentalGame.developers}.` : ''}</p>
              </div>

              <div className="rental-details">
                <div className="detail-item">
                  <span className="detail-label">{t.duration}</span>
                  <span className="detail-value">{rentalGame.rentalDays ? `${rentalGame.rentalDays} ${lang === 'EN' ? 'DAYS' : 'DÍAS'}` : t.noData}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">{t.remaining}</span>
                  <span className="detail-value countdown">{localTimeRemaining}</span>
                </div>
              </div>

              <div className="rental-status" style={{ marginTop: '20px', display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--orange)', fontWeight: '800', fontSize: '20px' }}>
                <FaCheckCircle style={{ fontSize: '26px' }} />
                <span>{t.rented}</span>
              </div>
            </div>

            <div className="seller-section">
              <h3 className="section-title">{t.owner}</h3>
              <div className="seller-card">
                <div 
                  className="seller-avatar-placeholder" 
                  onClick={() => rentalGame.seller?.id && navigate(`/perfil-otro?id=${rentalGame.seller.id}`)}
                  style={{ cursor: 'pointer' }}
                >
                  {rentalGame.seller?.avatar ? (
                    <img 
                      src={rentalGame.seller.avatar.startsWith('data:') ? rentalGame.seller.avatar : `/${rentalGame.seller.avatar}`} 
                      alt="avatar" 
                    />
                  ) : (
                    <img src={avatar} alt="avatar" />
                  )}
                </div>
                <h4 className="seller-name">{rentalGame.seller?.name || t.noSeller}</h4>
                <div className="seller-rating">
                  {[1, 2, 3, 4, 5].map((num) => (
                    <FaStar 
                      key={num} 
                      style={{ 
                        color: num <= Math.round(rentalGame.seller?.rating || 0) ? '#ff6100' : '#ccc',
                        cursor: 'pointer'
                      }} 
                      onClick={() => rentalGame.seller?.id && navigate(`/perfil-otro?id=${rentalGame.seller.id}`)}
                    />
                  ))}
                  <span className="rating-value">{rentalGame.seller?.rating?.toFixed(1) || '0.0'}</span>
                </div>
                <button className="btn-valorar" type="button" onClick={() => rentalGame.seller?.id && navigate(`/perfil-otro?id=${rentalGame.seller.id}`)}>
                  {t.rate}
                </button>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

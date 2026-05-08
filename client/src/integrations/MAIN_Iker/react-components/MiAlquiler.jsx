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
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
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
      rate: 'VALORAR',
      noRatings: 'Sin valoraciones'
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
      rate: 'RATE',
      noRatings: 'No ratings yet'
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

  const mediaFiles = useMemo(() => {
    if (!rentalGame) return [];

    const media = Array.isArray(rentalGame.media) ? rentalGame.media : [];
    const normalizedMedia = media
      .map((item) => {
        if (!item) return null;
        const type = item.type || (String(item.data || item).startsWith('data:video') ? 'video' : 'image');
        const rawData = item.data || item.url || item;
        if (!rawData) return null;
        const data = String(rawData).startsWith('data:') || String(rawData).startsWith('http') || String(rawData).startsWith('/')
          ? String(rawData)
          : `/${String(rawData)}`;
        return {
          id: item.id || `${type}-${String(rawData).slice(0, 20)}`,
          type,
          name: item.name || 'media',
          data
        };
      })
      .filter(Boolean);

    if (normalizedMedia.length > 0) {
      return normalizedMedia;
    }

    if (rentalGame.image) {
      const data = rentalGame.image.startsWith('data:') || rentalGame.image.startsWith('/') || rentalGame.image.startsWith('http')
        ? rentalGame.image
        : `/${rentalGame.image}`;
      return [{ id: 'main-image', type: 'image', name: 'image', data }];
    }

    return [{ id: 'fallback-image', type: 'image', name: 'image', data: cover1 }];
  }, [rentalGame]);

  useEffect(() => {
    setCurrentMediaIndex(0);
  }, [rentalGame?.id]);

  const goToPreviousMedia = () => {
    if (mediaFiles.length > 0) {
      setCurrentMediaIndex((prev) => (prev === 0 ? mediaFiles.length - 1 : prev - 1));
    }
  };

  const goToNextMedia = () => {
    if (mediaFiles.length > 0) {
      setCurrentMediaIndex((prev) => (prev === mediaFiles.length - 1 ? 0 : prev + 1));
    }
  };

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
                  <div className="upload-image-preview-container">
                    {mediaFiles.length > 0 ? (
                      <>
                        {mediaFiles[currentMediaIndex]?.type === 'image' ? (
                          <img src={mediaFiles[currentMediaIndex].data} alt="Vista previa" className="upload-image-preview main-image" id="preview-img" crossOrigin="anonymous" onError={(event) => { event.currentTarget.src = cover1; }} />
                        ) : (
                          <video src={mediaFiles[currentMediaIndex].data} controls className="upload-image-preview main-image" id="preview-video" />
                        )}
                        {mediaFiles.length > 1 && <div className="media-counter">{currentMediaIndex + 1} / {mediaFiles.length}</div>}
                      </>
                    ) : (
                      <img src={cover1} alt={rentalGame.title} className="main-image" />
                    )}
                  </div>
                </div>
              </div>

              {mediaFiles.length > 0 && (
                <div className="media-list">
                  {mediaFiles.map((media, index) => (
                    <div
                      key={media.id}
                      className={`media-thumbnail ${index === currentMediaIndex ? 'active' : ''}`}
                      onClick={() => setCurrentMediaIndex(index)}
                    >
                      {media.type === 'image' ? (
                        <img src={media.data} alt={`Media ${index + 1}`} />
                      ) : (
                        <div className="video-thumbnail">
                          <span>VIDEO</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              <div className="upload-image-nav">
                <button className="upload-nav-btn" type="button" onClick={goToPreviousMedia}><div className="nav-icon-circle"><FaChevronLeft /></div><span>{t.prev}</span></button>
                <button className="upload-nav-btn" type="button" onClick={goToNextMedia}><div className="nav-icon-circle"><FaChevronRight /></div><span>{t.next}</span></button>
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
                  <span className="rating-value">{Number(rentalGame.seller?.reviews || 0) > 0 ? Number(rentalGame.seller?.rating || 0).toFixed(1) : t.noRatings}</span>
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

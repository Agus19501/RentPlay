import { useEffect, useMemo, useState, useRef } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { FaChevronLeft, FaChevronRight, FaHeart, FaRegHeart, FaStar, FaStarHalfAlt, FaTimes, FaUser, FaCheckCircle } from 'react-icons/fa';
import '../assets/css/ver-juego.css';
import cover1 from '../assets/images/cover1.svg';
import avatar from '../assets/images/avatar.svg';
import { apiRequest, getSession } from '../../../api.js';
import { notify } from '../../../utils/notify.js';
import RatingModal from '../../../components/RatingModal.jsx';

export default function VerJuego({ lang = 'ES' }) {
  const navigate = useNavigate();
  const { gameId: paramGameId } = useParams();
  const [searchParams] = useSearchParams();
  const [games, setGames] = useState([]);
  const [rentals, setRentals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isRentalModalOpen, setRentalModalOpen] = useState(false);
  const [isRatingModalOpen, setRatingModalOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('paypal');
  const [wishlistActive, setWishlistActive] = useState(false);
  const [localTimeRemaining, setLocalTimeRemaining] = useState('00:00:00');
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
  const timerRef = useRef(null);

  const texts = {
    ES: {
      loading: 'Cargando juego...',
      notFound: 'No se ha encontrado ningún juego en el catálogo.',
      home: 'Inicio',
      prev: 'ANTERIOR',
      next: 'SIGUIENTE',
      gameDesc: 'Descripción del videojuego',
      noDesc: 'Sin descripción disponible.',
      genre: 'Género',
      devs: 'Desarrolladores',
      rentalDuration: 'DURACIÓN ALQUILER',
      noData: 'SIN DATOS',
      timeRemaining: 'TIEMPO RESTANTE',
      price: 'PRECIO',
      notAvailable: 'NO DISPONIBLE',
      rented: 'ALQUILADO',
      unavailableRented: 'NO DISPONIBLE (YA ALQUILADO)',
      rentNow: '¡ALQUILAR YA!',
      edit: 'EDITAR',
      owner: 'PROPIETARIO',
      noSeller: 'Sin vendedor',
      rate: 'VALORAR',
      contact: 'CHATEAR',
      chatError: 'Error al iniciar el chat.',
      rentalOk: '¡Juego alquilado correctamente!',
      rentalFail: 'No se ha podido crear el alquiler.',
      paymentMethods: 'MÉTODOS DE PAGO',
      creditCard: 'Tarjeta Crédito',
      rent: 'ALQUILAR'
    },
    EN: {
      loading: 'Loading game...',
      notFound: 'No game was found in the catalog.',
      home: 'Home',
      prev: 'PREVIOUS',
      next: 'NEXT',
      gameDesc: 'Game description',
      noDesc: 'No description available.',
      genre: 'Genre',
      devs: 'Developers',
      rentalDuration: 'RENTAL DURATION',
      noData: 'NO DATA',
      timeRemaining: 'TIME LEFT',
      price: 'PRICE',
      notAvailable: 'NOT AVAILABLE',
      rented: 'RENTED',
      unavailableRented: 'NOT AVAILABLE (ALREADY RENTED)',
      rentNow: 'RENT NOW!',
      edit: 'EDIT',
      owner: 'OWNER',
      noSeller: 'No seller',
      rate: 'RATE',
      contact: 'CHAT',
      chatError: 'Error starting chat.',
      rentalOk: 'Game rented successfully!',
      rentalFail: 'Rental could not be created.',
      paymentMethods: 'PAYMENT METHODS',
      creditCard: 'Credit Card',
      rent: 'RENT'
    }
  };
  const t = texts[lang] || texts.ES;
  const loginRequiredMessage = 'Debes iniciar sesión para realizar esta accion';

  const selectedGameId = paramGameId || searchParams.get('id') || searchParams.get('gameId');
  const [selectedGame, setSelectedGame] = useState(null);

  useEffect(() => {
    let active = true;
    setLoading(true);

    const session = getSession();

    const gamePromise = selectedGameId
      ? apiRequest(`/api/games/${selectedGameId}?compact=1`).then(r => r.game || null)
      : apiRequest('/api/games?lite=1').then(r => (r.games || [])[0] || null);

    gamePromise
      .then((game) => {
        if (active) {
          setSelectedGame(game);
        }

        return Promise.all([
          apiRequest('/api/games?lite=1').catch(() => ({ games: [] })),
          session?.token
            ? apiRequest('/api/rentals/mine', { token: session.token }).catch(() => ({ rentals: [] }))
            : Promise.resolve({ rentals: [] })
        ]);
      })
      .then((results) => {
        if (!active || !results) {
          return;
        }
        const [gamesRes, rentalsRes] = results;
        setGames(gamesRes.games || []);
        setRentals(rentalsRes.rentals || []);
      })
      .catch(() => {
        if (active) {
          setSelectedGame(null);
          setGames([]);
          setRentals([]);
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => { active = false; };
  }, [selectedGameId]);

  const mediaFiles = useMemo(() => {
    if (!selectedGame) return [];

    const media = Array.isArray(selectedGame.media) ? selectedGame.media : [];
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

    if (selectedGame.image) {
      const data = selectedGame.image.startsWith('data:') || selectedGame.image.startsWith('/') || selectedGame.image.startsWith('http')
        ? selectedGame.image
        : `/${selectedGame.image}`;
      return [{ id: 'main-image', type: 'image', name: 'image', data }];
    }

    return [{ id: 'fallback-image', type: 'image', name: 'image', data: cover1 }];
  }, [selectedGame]);

  useEffect(() => {
    setCurrentMediaIndex(0);
  }, [selectedGame?.id]);

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

  const isRented = useMemo(() => {
    // Comprobar si está alquilado específicamente por el usuario actual
    const isRentedByMe = rentals.some(r => {
      const rentalGameId = r.game?.id || r.gameId;
      return String(rentalGameId) === String(selectedGame?.id) && r.status === 'active';
    });
    
    // Comprobar si el juego está alquilado por CUALQUIER usuario (status active o marcado en el juego)
    const isRentedByAnyone = selectedGame?.status === 'rented' || isRentedByMe;
    
    return { isRentedByMe, isRentedByAnyone };
  }, [rentals, selectedGame]);

  useEffect(() => {
    if (!loading && isRented.isRentedByMe && selectedGame) {
      navigate(`/mi-alquiler?id=${selectedGame.id}`, { replace: true });
    }
  }, [loading, isRented.isRentedByMe, selectedGame, navigate]);

  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    
    // Obtener el alquiler del usuario actual para este juego
    const rental = rentals.find(r => String(r.game?.id) === String(selectedGame?.id) && r.status === 'active');
    if (!rental?.expiresAt) {
      setLocalTimeRemaining('00:00:00');
      return;
    }

    const updateCountdown = () => {
      const total = Date.parse(rental.expiresAt) - Date.parse(new Date());
      if (total <= 0) {
        setLocalTimeRemaining('0 días 0 horas 0 seg');
        clearInterval(timerRef.current);
        return;
      }

      const days = Math.floor(total / (1000 * 60 * 60 * 24));
      const hours = Math.floor((total % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((total % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((total % (1000 * 60)) / 1000);

      const parts = [];
      if (days > 0) parts.push(`${days} día${days !== 1 ? 's' : ''}`);
      if (hours > 0 || days > 0) parts.push(`${hours} h`);
      if (days > 0) {
        parts.push(`${String(minutes).padStart(2, '0')}m`);
      } else {
        parts.push(`${String(minutes).padStart(2, '0')}m ${String(seconds).padStart(2, '0')}s`);
      }

      setLocalTimeRemaining(parts.join(' '));
    };

    updateCountdown();
    timerRef.current = setInterval(updateCountdown, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [rentals, selectedGame]);

  const recommendedGames = useMemo(() => {
    if (!selectedGame) {
      return [];
    }

    return games
      .filter((game) => game.id !== selectedGame.id)
      .sort((left, right) => (right.rating || 0) - (left.rating || 0))
      .slice(0, 3);
  }, [games, selectedGame]);

  const isOwner = useMemo(() => {
    const session = getSession();
    const sessionUserId = session?.user?.id || session?.userId || session?.sub;
    return Boolean(
      sessionUserId &&
      selectedGame?.seller?.id &&
      String(sessionUserId) === String(selectedGame.seller.id)
    );
  }, [selectedGame]);

  useEffect(() => {
    if (!selectedGame) {
      return;
    }

    const savedWishlist = JSON.parse(localStorage.getItem('wishlist') || '[]');
    setWishlistActive(savedWishlist.includes(String(selectedGame.id)));
  }, [selectedGame]);

  useEffect(() => {
    if (!isRentalModalOpen) {
      document.body.classList.remove('modal-open');
      return undefined;
    }

    document.body.classList.add('modal-open');
    return () => document.body.classList.remove('modal-open');
  }, [isRentalModalOpen]);

  const toggleWishlist = () => {
    if (!selectedGame) {
      return;
    }

    const session = getSession();
    if (!session?.token) {
      notify(loginRequiredMessage, 'info');
      return;
    }

    const saved = JSON.parse(localStorage.getItem('wishlist') || '[]');
    const key = String(selectedGame.id);

    if (wishlistActive) {
      localStorage.setItem('wishlist', JSON.stringify(saved.filter((item) => item !== key)));
      setWishlistActive(false);
    } else {
      localStorage.setItem('wishlist', JSON.stringify([...saved, key]));
      setWishlistActive(true);
    }
  };

  const handleConfirmRental = async () => {
    if (!selectedGame) {
      return;
    }

    const session = getSession();
    if (!session?.token) {
      setRentalModalOpen(false);
      notify(loginRequiredMessage, 'info');
      return;
    }

    try {
      const response = await apiRequest('/api/rentals', {
        method: 'POST',
        body: {
          gameId: selectedGame.id,
          paymentMethod
        }
      });
      
      if (response.ok) {
        notify(t.rentalOk, 'success');
        setRentalModalOpen(false);
        navigate(`/mi-alquiler?id=${selectedGame.id}`);
      } else {
        notify(response.message || t.rentalFail, 'error');
      }
    } catch (error) {
      notify(error.message || t.rentalFail, 'error');
    }
  };

  const handleOpenRentalModal = () => {
    const session = getSession();
    if (!session?.token) {
      notify(loginRequiredMessage, 'info');
      return;
    }
    setRentalModalOpen(true);
  };

  const handleOpenRatingModal = () => {
    const session = getSession();
    if (!session?.token) {
      notify(loginRequiredMessage, 'info');
      return;
    }
    if (!selectedGame?.seller?.id) {
      return;
    }
    setRatingModalOpen(true);
  };

  const handleContact = async () => {
    const session = getSession();
    if (!session?.token) {
      notify(loginRequiredMessage, 'info');
      return;
    }
    if (!selectedGame?.seller?.id || !selectedGame?.id) return;
    try {
      const res = await apiRequest('/api/chats', {
        method: 'POST',
        body: { sellerId: selectedGame.seller.id, gameId: selectedGame.id }
      });
      if (res.chatId) {
        navigate(`/chats?id=${res.chatId}`);
      }
    } catch (e) {
      notify(e.message || t.chatError, 'error');
    }
  };

  const handleEditGame = async () => {
    if (!selectedGame?.id) return;
    try {
      const res = await apiRequest(`/api/games/${selectedGame.id}`);
      const fullGame = res.game || res;
      navigate('/subir-juego', { state: { editGame: fullGame } });
    } catch (e) {
      notify('Error al cargar el juego para editar.', 'error');
    }
  };

  if (loading) {
    return (
      <div className="main-content">
        <div className="container">
          <p>{t.loading}</p>
        </div>
      </div>
    );
  }

  if (!selectedGame) {
    return (
      <div className="main-content">
        <div className="container">
          <p>{t.notFound}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="main-content">
      <div className="container">
        <div className="breadcrumb">
          <button type="button" onClick={() => navigate('/home')} style={{ background: 'none', border: 0, color: 'inherit', cursor: 'pointer', padding: 0 }}>{t.home}</button> / <span>{selectedGame.title}</span>
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
                          <img src={mediaFiles[currentMediaIndex].data} alt="Vista previa" className="upload-image-preview main-image" id="preview-img" onError={(event) => { event.currentTarget.src = cover1; }} />
                        ) : (
                          <video src={mediaFiles[currentMediaIndex].data} controls className="upload-image-preview main-image" id="preview-video" />
                        )}
                        {mediaFiles.length > 1 && <div className="media-counter">{currentMediaIndex + 1} / {mediaFiles.length}</div>}
                      </>
                    ) : (
                      <img src={cover1} alt={selectedGame.title} className="main-image" />
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
                <h1 className="product-title">{selectedGame.title}</h1>
                {!isOwner && (
                  <button className="wishlist-btn" type="button" onClick={toggleWishlist}>
                    {wishlistActive ? <FaHeart /> : <FaRegHeart />}
                  </button>
                )}
              </div>

              <div className="description-section">
                <h2 className="section-title">{t.gameDesc}</h2>
                <p className="description-text">
                  {(() => {
                    const desc = selectedGame.description || t.noDesc;
                    return desc.length > 300 ? desc.slice(0, 300) + '\u2026' : desc;
                  })()}
                </p>
                <div className="game-meta-tags">
                  {selectedGame.genre && <p className="game-meta-line"><span className="game-meta-label">{t.genre}:</span> {selectedGame.genre}</p>}
                  {selectedGame.developers && <p className="game-meta-line"><span className="game-meta-label">{t.devs}:</span> {selectedGame.developers}</p>}
                </div>
              </div>

              <div className="rental-details">
                <div className="detail-item">
                  <span className="detail-label">{t.rentalDuration}</span>
                  <span className="detail-value">{selectedGame.rentalDays ? `${selectedGame.rentalDays} ${lang === 'EN' ? 'DAYS' : 'DÍAS'}` : t.noData}</span>
                </div>
                {isRented.isRentedByMe ? (
                  <div className="detail-item">
                    <span className="detail-label">{t.timeRemaining}</span>
                    <span className="detail-value countdown">{localTimeRemaining}</span>
                  </div>
                ) : (
                  <div className="detail-item">
                    <span className="detail-label">{t.price}</span>
                    <span className="detail-value price">{selectedGame.price ? `${selectedGame.price} €` : t.notAvailable}</span>
                  </div>
                )}
              </div>

              {isOwner && isRented.isRentedByAnyone ? (
                <div className="rental-status" style={{ marginTop: '20px', display: 'flex', alignItems: 'center', gap: '10px', color: '#ff4444', fontWeight: '800', fontSize: '20px' }}>
                  <FaTimes style={{ fontSize: '26px' }} />
                  <span>{t.unavailableRented}</span>
                </div>
              ) : isOwner ? (
                <button className="btn-rent" type="button" onClick={handleEditGame}>{t.edit}</button>
              ) : isRented.isRentedByMe ? (
                <div className="rental-status" style={{ marginTop: '20px', display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--orange)', fontWeight: '800', fontSize: '20px' }}>
                  <FaCheckCircle style={{ fontSize: '26px' }} />
                  <span>{t.rented}</span>
                </div>
              ) : isRented.isRentedByAnyone ? (
                <div className="rental-status" style={{ marginTop: '20px', display: 'flex', alignItems: 'center', gap: '10px', color: '#ff4444', fontWeight: '800', fontSize: '20px' }}>
                  <FaTimes style={{ fontSize: '26px' }} />
                  <span>{t.unavailableRented}</span>
                </div>
              ) : (
                <button className="btn-rent" type="button" onClick={handleOpenRentalModal}>{t.rentNow}</button>
              )}
            </div>

            <div className="seller-section">
              <h3 className="section-title">{t.owner}</h3>
              <div className="seller-card">
                <div 
                  className="seller-avatar-placeholder" 
                  onClick={() => selectedGame.seller?.id && navigate(`/perfil-otro?id=${selectedGame.seller.id}`)}
                  style={{ cursor: 'pointer' }}
                >
                  {selectedGame.seller?.avatar ? (
                    <img 
                      src={selectedGame.seller.avatar.startsWith('data:') ? selectedGame.seller.avatar : `/${selectedGame.seller.avatar}`} 
                      alt="avatar" 
                    />
                  ) : (
                    <img src={avatar} alt="avatar" />
                  )}
                </div>
                <h4 className="seller-name">{selectedGame.seller?.name || t.noSeller}</h4>
                <div className="seller-rating">
                  {[1, 2, 3, 4, 5].map((num) => (
                    <FaStar 
                      key={num} 
                      style={{ 
                        color: num <= Math.round(selectedGame.seller?.rating || 0) ? '#ff6100' : '#ccc',
                        cursor: 'pointer'
                      }} 
                      onClick={() => selectedGame.seller?.id && navigate(`/perfil-otro?id=${selectedGame.seller.id}`)}
                    />
                  ))}
                  <span className="rating-value">{selectedGame.seller?.rating?.toFixed(1) || '0.0'}</span>
                </div>
                {!isOwner && (
                  <>
                    <button className="btn-valorar" type="button" onClick={handleOpenRatingModal}>
                      {t.rate}
                    </button>
                    <button className="btn-contactar" type="button" onClick={handleContact}>
                      {t.contact}
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
          {/* <div className="recommended-section">
            <h2 className="section-title">VIDEOJUEGOS RECOMENDADOS</h2>
            <div className="games-grid">
              {recommendedGames.map((game) => (
                <div className="game-card" key={game.id}>
                  <div className="game-image-placeholder">
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
                  <h3 className="game-title">{game.title}</h3>
                  <p className="game-price">{game.price ? `${game.price} €` : 'Precio no disponible'}</p>
                  <button className="btn-secondary" type="button" onClick={() => navigate(`/ver-juego?gameId=${game.id}`)}>Ver Detalles</button>
                </div>
              ))}
            </div>
          </div> */}
        </section>
      </div>

      {isRentalModalOpen && (
        <div className="modal-overlay active" onClick={() => setRentalModalOpen(false)}>
          <div className="modal active" id="modal-rental" onClick={e => e.stopPropagation()}>
            <div className="modal-content modal-rental-content">
              <button className="modal-close" type="button" onClick={() => setRentalModalOpen(false)}><FaTimes /></button>
              <h2 className="modal-title">{t.paymentMethods}</h2>
              <div className="payment-methods">
                <label className={`payment-option ${paymentMethod === 'paypal' ? 'active' : ''}`}>
                  <input type="radio" name="payment" value="paypal" checked={paymentMethod === 'paypal'} onChange={(event) => setPaymentMethod(event.target.value)} />
                  <div className="payment-icon">
                    <span style={{ fontWeight: 900, fontSize: 18 }}>
                      <span style={{ color: '#009cde' }}>Pay</span><span style={{ color: '#003087' }}>Pal</span>
                    </span>
                  </div>
                  <span className="payment-name">PayPal</span>
                  <div className="payment-dot"></div>
                </label>
                <label className={`payment-option ${paymentMethod === 'credit-card' ? 'active' : ''}`}>
                  <input type="radio" name="payment" value="credit-card" checked={paymentMethod === 'credit-card'} onChange={(event) => setPaymentMethod(event.target.value)} />
                  <div className="payment-icon">
                    <svg width="44" height="29" viewBox="0 0 52 34" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <rect width="52" height="34" rx="4" fill="#555"/>
                      <rect y="8" width="52" height="8" fill="#888"/>
                      <rect x="6" y="21" width="16" height="6" rx="2" fill="#f36b24"/>
                    </svg>
                  </div>
                  <span className="payment-name">{t.creditCard}</span>
                  <div className="payment-dot"></div>
                </label>
                <label className={`payment-option ${paymentMethod === 'applepay' ? 'active' : ''}`}>
                  <input type="radio" name="payment" value="applepay" checked={paymentMethod === 'applepay'} onChange={(event) => setPaymentMethod(event.target.value)} />
                  <div className="payment-icon">
                    <span style={{ fontWeight: 600, fontSize: 13, color: '#fff', fontFamily: 'system-ui,-apple-system,sans-serif', letterSpacing: '0.5px' }}>Apple Pay</span>
                  </div>
                  <span className="payment-name">ApplePay</span>
                  <div className="payment-dot"></div>
                </label>
              </div>
              <button className="btn-rent modal-btn-rent" type="button" onClick={handleConfirmRental}>{t.rent}</button>
            </div>
          </div>
        </div>
      )}

      <RatingModal
        isOpen={isRatingModalOpen}
        onClose={() => setRatingModalOpen(false)}
        targetUserId={selectedGame?.seller?.id}
        targetUserName={selectedGame?.seller?.name}
        lang={lang}
        onRated={({ rating, reviews }) => {
          setSelectedGame((prev) => {
            if (!prev) return prev;
            return {
              ...prev,
              seller: {
                ...(prev.seller || {}),
                rating,
                reviews
              }
            };
          });
          window.dispatchEvent(new Event('storage'));
        }}
      />
    </div>
  );
}

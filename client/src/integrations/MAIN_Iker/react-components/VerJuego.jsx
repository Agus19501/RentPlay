import { useEffect, useMemo, useState, useRef } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { FaChevronLeft, FaChevronRight, FaHeart, FaRegHeart, FaStar, FaStarHalfAlt, FaTimes, FaUser, FaCheckCircle } from 'react-icons/fa';
import '../assets/css/ver-juego.css';
import cover1 from '../assets/images/cover1.svg';
import avatar from '../assets/images/avatar.svg';
import { apiRequest } from '../../../api.js';

export default function VerJuego({ lang = 'ES' }) {
  const navigate = useNavigate();
  const { gameId: paramGameId } = useParams();
  const [searchParams] = useSearchParams();
  const [games, setGames] = useState([]);
  const [rentals, setRentals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isRentalModalOpen, setRentalModalOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('paypal');
  const [wishlistActive, setWishlistActive] = useState(false);
  const [localTimeRemaining, setLocalTimeRemaining] = useState('00:00:00');
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
      owner: 'PROPIETARIO',
      noSeller: 'Sin vendedor',
      rate: 'VALORAR',
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
      owner: 'OWNER',
      noSeller: 'No seller',
      rate: 'RATE',
      rentalOk: 'Game rented successfully!',
      rentalFail: 'Rental could not be created.',
      paymentMethods: 'PAYMENT METHODS',
      creditCard: 'Credit Card',
      rent: 'RENT'
    }
  };
  const t = texts[lang] || texts.ES;

  useEffect(() => {
    let active = true;

    Promise.all([
      apiRequest('/api/games'),
      apiRequest('/api/rentals/mine').catch(() => ({ rentals: [] }))
    ])
      .then(([gamesRes, rentalsRes]) => {
        if (active) {
          setGames(gamesRes.games || []);
          setRentals(rentalsRes.rentals || []);
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

  const selectedGameId = paramGameId || searchParams.get('id') || searchParams.get('gameId');
  const selectedGame = useMemo(() => {
    if (!games.length) {
      return null;
    }

    if (!selectedGameId) return games[0];

    return games.find((game) => String(game.id) === String(selectedGameId)) || games[0];
  }, [games, selectedGameId]);

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

    try {
      const response = await apiRequest('/api/rentals', {
        method: 'POST',
        body: {
          gameId: selectedGame.id,
          paymentMethod
        }
      });
      
      if (response.ok) {
        alert(t.rentalOk);
        setRentalModalOpen(false);
        navigate(`/mi-alquiler?id=${selectedGame.id}`);
      } else {
        alert(response.message || t.rentalFail);
      }
    } catch (error) {
      alert(error.message || t.rentalFail);
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
                  {selectedGame.image ? (
                    <img 
                      src={selectedGame.image.startsWith('data:') ? selectedGame.image : `/${selectedGame.image}`} 
                      alt={selectedGame.title} 
                      className="main-image" 
                      onError={(event) => { event.currentTarget.src = cover1; }} 
                    />
                  ) : (
                    <img src={cover1} alt={selectedGame.title} className="main-image" />
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
                <h1 className="product-title">{selectedGame.title}</h1>
                <button className="wishlist-btn" type="button" onClick={toggleWishlist}>
                  {wishlistActive ? <FaHeart /> : <FaRegHeart />}
                </button>
              </div>

              <div className="description-section">
                <h2 className="section-title">{t.gameDesc}</h2>
                <p className="description-text">{selectedGame.description || t.noDesc}</p>
                <p className="description-text">{selectedGame.genre ? `${t.genre}: ${selectedGame.genre}.` : ''} {selectedGame.developers ? `${t.devs}: ${selectedGame.developers}.` : ''}</p>
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

              {isRented.isRentedByMe ? (
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
                <button className="btn-rent" type="button" onClick={() => setRentalModalOpen(true)}>{t.rentNow}</button>
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
                <button className="btn-valorar" type="button" onClick={() => selectedGame.seller?.id && navigate(`/perfil-otro?id=${selectedGame.seller.id}`)}>
                  {t.rate}
                </button>
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
                  <div className="payment-icon"><i className="fab fa-paypal"></i></div>
                  <span className="payment-name">PayPal</span>
                  <div className="payment-dot"></div>
                </label>
                <label className={`payment-option ${paymentMethod === 'credit-card' ? 'active' : ''}`}>
                  <input type="radio" name="payment" value="credit-card" checked={paymentMethod === 'credit-card'} onChange={(event) => setPaymentMethod(event.target.value)} />
                  <div className="payment-icon"><i className="fas fa-credit-card"></i></div>
                  <span className="payment-name">{t.creditCard}</span>
                  <div className="payment-dot"></div>
                </label>
                <label className={`payment-option ${paymentMethod === 'applepay' ? 'active' : ''}`}>
                  <input type="radio" name="payment" value="applepay" checked={paymentMethod === 'applepay'} onChange={(event) => setPaymentMethod(event.target.value)} />
                  <div className="payment-icon"><i className="fab fa-apple"></i></div>
                  <span className="payment-name">ApplePay</span>
                  <div className="payment-dot"></div>
                </label>
              </div>
              <button className="btn-rent modal-btn-rent" type="button" onClick={handleConfirmRental}>{t.rent}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

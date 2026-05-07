import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { FaChevronLeft, FaChevronRight, FaHeart, FaRegHeart, FaStar, FaStarHalfAlt, FaTimes, FaUser } from 'react-icons/fa';
import '../assets/css/ver-juego.css';
import cover1 from '../assets/images/cover1.svg';
import avatar from '../assets/images/avatar.svg';
import { apiRequest } from '../../../api.js';

export default function VerJuego() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isRentalModalOpen, setRentalModalOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('paypal');
  const [wishlistActive, setWishlistActive] = useState(false);

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

  const selectedGameId = Number(searchParams.get('gameId'));
  const selectedGame = useMemo(() => {
    if (!games.length) {
      return null;
    }

    return games.find((game) => game.id === selectedGameId) || games[0];
  }, [games, selectedGameId]);

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
      await apiRequest('/api/rentals', {
        method: 'POST',
        body: {
          gameId: selectedGame.id,
          paymentMethod
        }
      });
      setRentalModalOpen(false);
      navigate('/mi-alquiler');
    } catch (error) {
      alert(error.message || 'No se ha podido crear el alquiler.');
    }
  };

  if (loading) {
    return (
      <div className="main-content">
        <div className="container">
          <p>Cargando juego...</p>
        </div>
      </div>
    );
  }

  if (!selectedGame) {
    return (
      <div className="main-content">
        <div className="container">
          <p>No se ha encontrado ningún juego en el catálogo.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="main-content">
      <div className="container">
        <div className="breadcrumb">
          <button type="button" onClick={() => navigate('/home')} style={{ background: 'none', border: 0, color: 'inherit', cursor: 'pointer', padding: 0 }}>Inicio</button> / <span>{selectedGame.title}</span>
        </div>

        <section className="product-section">
          <div className="product-content">
            <div className="product-gallery">
              <div className="main-image-container">
                <div className="image-frame">
                  {selectedGame.image ? <img src={`/${selectedGame.image}`} alt={selectedGame.title} className="main-image" onError={(event) => { event.currentTarget.src = cover1; }} /> : <img src={cover1} alt={selectedGame.title} className="main-image" />}
                </div>
              </div>
              <div className="gallery-controls">
                <button className="btn-nav-prev" type="button"><FaChevronLeft /><span>ANTERIOR</span></button>
                <button className="btn-nav-next" type="button"><span>SIGUIENTE</span><FaChevronRight /></button>
              </div>
              <div className="rating">
                <FaStar /><FaStar /><FaStar /><FaStar /><FaStarHalfAlt />
                <span className="rating-value">{selectedGame.rating ?? 0}</span>
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
                <h2 className="section-title">Descripción del videojuego</h2>
                <p className="description-text">{selectedGame.description || 'Sin descripción disponible en Atlas.'}</p>
                <p className="description-text">{selectedGame.genre ? `Género: ${selectedGame.genre}.` : ''} {selectedGame.developers ? `Desarrolladores: ${selectedGame.developers}.` : ''}</p>
              </div>

              <div className="rental-details">
                <div className="detail-item">
                  <span className="detail-label">DURACIÓN ALQUILER</span>
                  <span className="detail-value">{selectedGame.rentalDays ? `${selectedGame.rentalDays} DÍAS` : 'SIN DATOS'}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">PRECIO</span>
                  <span className="detail-value price">{selectedGame.price ? `${selectedGame.price} €` : 'NO DISPONIBLE'}</span>
                </div>
              </div>

              <button className="btn-rent" type="button" onClick={() => setRentalModalOpen(true)}>ALQUILAR</button>
            </div>

            <div className="seller-section">
              <h3 className="section-title">PROPIETARIO</h3>
              <div className="seller-card">
                <div className="seller-avatar-placeholder"><img src={avatar} alt="avatar" /></div>
                <h4 className="seller-name">{selectedGame.seller?.name || 'Sin vendedor'}</h4>
                <div className="seller-rating">
                  <FaStar /><FaStar /><FaStar /><FaStar /><FaStar style={{ opacity: 0.4 }} />
                  <span className="rating-value">{selectedGame.seller?.rating ?? selectedGame.rating ?? 0}</span>
                </div>
                <button className="btn-valorar" type="button" onClick={() => navigate('/mensajes')}>MENSAJES</button>
              </div>
            </div>
          </div>

          <div className="recommended-section">
            <h2 className="section-title">VIDEOJUEGOS RECOMENDADOS</h2>
            <div className="games-grid">
              {recommendedGames.map((game) => (
                <div className="game-card" key={game.id}>
                  <div className="game-image-placeholder">{game.image ? <img src={`/${game.image}`} alt={game.title} onError={(event) => { event.currentTarget.src = cover1; }} /> : <img src={cover1} alt={game.title} />}</div>
                  <h3 className="game-title">{game.title}</h3>
                  <p className="game-price">{game.price ? `${game.price} €` : 'Precio no disponible'}</p>
                  <button className="btn-secondary" type="button" onClick={() => navigate(`/ver-juego?gameId=${game.id}`)}>Ver Detalles</button>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>

      {isRentalModalOpen && <div className="modal-overlay active" onClick={() => setRentalModalOpen(false)} />}

      {isRentalModalOpen && (
        <div className="modal active" id="modal-rental">
          <div className="modal-content modal-rental-content">
            <button className="modal-close" type="button" onClick={() => setRentalModalOpen(false)}><FaTimes /></button>
            <h2 className="modal-title">MÉTODOS DE PAGO</h2>
            <div className="payment-methods">
              <label className="payment-option">
                <input type="radio" name="payment" value="paypal" checked={paymentMethod === 'paypal'} onChange={(event) => setPaymentMethod(event.target.value)} />
                <div className="payment-icon"><i className="fab fa-paypal"></i></div>
                <span>PayPal</span>
              </label>
              <label className="payment-option">
                <input type="radio" name="payment" value="credit-card" checked={paymentMethod === 'credit-card'} onChange={(event) => setPaymentMethod(event.target.value)} />
                <div className="payment-icon"><i className="fas fa-credit-card"></i></div>
                <span>Tarjeta Crédito</span>
              </label>
              <label className="payment-option">
                <input type="radio" name="payment" value="applepay" checked={paymentMethod === 'applepay'} onChange={(event) => setPaymentMethod(event.target.value)} />
                <div className="payment-icon"><i className="fab fa-apple"></i></div>
                <span>ApplePay</span>
              </label>
            </div>
            <button className="btn-rent modal-btn-rent" type="button" onClick={handleConfirmRental}>ALQUILAR</button>
          </div>
        </div>
      )}
    </div>
  );
}

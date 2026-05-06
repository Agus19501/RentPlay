import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaChevronLeft, FaChevronRight, FaHeart, FaRegHeart, FaStar, FaStarHalfAlt, FaTimes, FaUser, FaUserCircle, FaPaperPlane } from 'react-icons/fa';

const GAME = {
  title: 'GRAND THEFT AUTO : VICE CITY',
  descriptionOne: 'Grand Theft Auto: Vice City es un juego de mundo abierto ambientado en los años 80, con una ciudad llena de neones y estilo retro.',
  descriptionTwo: 'Sigue la historia de Tommy Vercetti mientras sube en el mundo criminal, haciendo misiones, comprando negocios y explorando la ciudad a tu ritmo.',
  price: '19.99 €',
  priceRaw: '19.99',
  seller: 'Pepe_gom01',
  sellerRating: '4.1',
  rating: '4.2',
  durationDays: 6,
  ownerProfile: 'Pepe_gom01'
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

export default function VerJuego() {
  const navigate = useNavigate();
  const [isRentalModalOpen, setRentalModalOpen] = useState(false);
  const [isRatingModalOpen, setRatingModalOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('paypal');
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [dbRatings, setDbRatings] = useState([]);
  const [wishlistActive, setWishlistActive] = useState(false);

  const displayRatings = useMemo(() => {
    const remoteRatings = dbRatings.map((item, index) => ({
      id: `db-${index}`,
      username: item.username || 'Usuario Anónimo',
      score: Number(item.score || item.rating || 0),
      comment: item.comment || ''
    }));
    return [...remoteRatings, ...SOURCE_RATINGS];
  }, [dbRatings]);

  useEffect(() => {
    const savedWishlist = JSON.parse(localStorage.getItem('wishlist')) || [];
    setWishlistActive(savedWishlist.includes(GAME.title));
  }, []);

  useEffect(() => {
    if (!isRatingModalOpen || !window.RentPlayApi) {
      return;
    }

    window.RentPlayApi.getSellerRatings(GAME.seller)
      .then((response) => {
        if (response && response.ratings) {
          setDbRatings(response.ratings);
        }
      })
      .catch(() => {});
  }, [isRatingModalOpen]);

  useEffect(() => {
    if (!isRentalModalOpen && !isRatingModalOpen) {
      document.body.classList.remove('modal-open');
      return;
    }
    document.body.classList.add('modal-open');
  }, [isRentalModalOpen, isRatingModalOpen]);

  const toggleWishlist = () => {
    const saved = JSON.parse(localStorage.getItem('wishlist')) || [];
    if (wishlistActive) {
      localStorage.setItem('wishlist', JSON.stringify(saved.filter((item) => item !== GAME.title)));
      setWishlistActive(false);
    } else {
      localStorage.setItem('wishlist', JSON.stringify([...saved, GAME.title]));
      setWishlistActive(true);
    }
  };

  const handleConfirmRental = async () => {
    if (window.RentPlayApi) {
      try {
        await window.RentPlayApi.createRental({
          game: GAME.title,
          price: GAME.priceRaw,
          payment: paymentMethod,
          durationDays: GAME.durationDays
        });
      } catch (error) {
        console.warn('Backend:', error.message);
      }
    }

    const rentHistory = JSON.parse(localStorage.getItem('rentHistory')) || [];
    rentHistory.push({ game: GAME.title, price: GAME.price, payment: paymentMethod, date: new Date().toLocaleDateString('es-ES') });
    localStorage.setItem('rentHistory', JSON.stringify(rentHistory));
    setRentalModalOpen(false);
    navigate('/mi-alquiler');
  };

  const handleSubmitRating = async () => {
    if (rating === 0) {
      alert('Selecciona una puntuación');
      return;
    }

    if (window.RentPlayApi) {
      try {
        await window.RentPlayApi.createRating({ toSeller: GAME.seller, score: rating, comment });
      } catch (error) {
        console.warn('Error BD:', error.message);
      }
    }

    const userRatings = JSON.parse(localStorage.getItem('userRatings')) || [];
    userRatings.push({ seller: GAME.seller, rating, comment, date: new Date().toLocaleDateString('es-ES') });
    localStorage.setItem('userRatings', JSON.stringify(userRatings));
    setRatingModalOpen(false);
    setComment('');
    setRating(0);
  };

  return (
    <div className="main-content">
      <div className="container">
        <div className="breadcrumb">
          <button type="button" onClick={() => navigate('/home')} style={{ background: 'none', border: 0, color: 'inherit', cursor: 'pointer', padding: 0 }}>Inicio</button> / <span>{GAME.title}</span>
        </div>

        <section className="product-section">
          <div className="product-content">
            <div className="product-gallery">
              <div className="main-image-container">
                <div className="image-placeholder main-image">
                  <i className="fas fa-image"></i>
                  <p>Imagen del Juego</p>
                </div>
              </div>
              <div className="gallery-controls">
                <button className="btn-nav-prev" type="button"><FaChevronLeft /><span>ANTERIOR</span></button>
                <button className="btn-nav-next" type="button"><span>SIGUIENTE</span><FaChevronRight /></button>
              </div>
              <div className="rating">
                <FaStar /><FaStar /><FaStar /><FaStar /><FaStarHalfAlt />
                <span className="rating-value">{GAME.rating}</span>
              </div>
            </div>

            <div className="product-info">
              <div className="product-header">
                <h1 className="product-title">{GAME.title}</h1>
                <button className="wishlist-btn" type="button" onClick={toggleWishlist}>
                  {wishlistActive ? <FaHeart /> : <FaRegHeart />}
                </button>
              </div>

              <div className="description-section">
                <h2 className="section-title">Descripción del videojuego</h2>
                <p className="description-text">{GAME.descriptionOne}</p>
                <p className="description-text">{GAME.descriptionTwo}</p>
              </div>

              <div className="rental-details">
                <div className="detail-item">
                  <span className="detail-label">DURACIÓN ALQUILER</span>
                  <span className="detail-value">{GAME.durationDays} DÍAS</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">PRECIO</span>
                  <span className="detail-value price">{GAME.price}</span>
                </div>
              </div>

              <button className="btn-rent" type="button" onClick={() => setRentalModalOpen(true)}>ALQUILAR</button>
            </div>

            <div className="seller-section">
              <h3 className="section-title">PROPIETARIO</h3>
              <div className="seller-card">
                <div className="seller-avatar-placeholder"><FaUser /></div>
                <h4 className="seller-name">{GAME.ownerProfile}</h4>
                <div className="seller-rating">
                  <FaStar /><FaStar /><FaStar /><FaStar /><FaStar style={{ opacity: 0.4 }} />
                  <span className="rating-value">{GAME.sellerRating}</span>
                </div>
                <button className="btn-valorar" type="button" onClick={() => setRatingModalOpen(true)}>VALORAR</button>
              </div>
            </div>
          </div>

          <div className="recommended-section">
            <h2 className="section-title">VIDEOJUEGOS RECOMENDADOS</h2>
            <div className="games-grid">
              {RECOMMENDED.map((game) => (
                <div className="game-card" key={game.id}>
                  <div className="game-image-placeholder"><i className="fas fa-image"></i></div>
                  <h3 className="game-title">{game.title}</h3>
                  <p className="game-price">{game.price}</p>
                  <button className="btn-secondary" type="button" onClick={() => navigate('/ver-juego')}>Ver Detalles</button>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>

      {isRentalModalOpen && <div className="modal-overlay active" onClick={() => setRentalModalOpen(false)} />}
      {isRatingModalOpen && <div className="modal-overlay active" onClick={() => setRatingModalOpen(false)} />}

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

      {isRatingModalOpen && (
        <div className="modal active" id="modal-ratings">
          <div className="modal-content modal-ratings-content">
            <button className="modal-close" type="button" onClick={() => setRatingModalOpen(false)}><FaTimes /></button>
            <h2 className="modal-title">VALORACIONES DE OTROS USUARIOS</h2>

            <div className="ratings-list">
              {displayRatings.map((item) => (
                <div className="rating-item" key={item.id || `${item.username}-${item.score}`}>
                  <div className="rating-user-avatar"><FaUserCircle /></div>
                  <div className="rating-user-info">
                    <h4 className="rating-username">{item.username}</h4>
                    <div className="rating-stars">
                      {Array.from({ length: 5 }, (_, index) => (
                        <span key={index}>
                          <FaStar style={{ opacity: index < Math.round(item.score) ? 1 : 0.25 }} />
                        </span>
                      ))}
                      <span className="rating-score">{Number(item.score).toFixed(1)}</span>
                    </div>
                    <p className="rating-comment">{item.comment}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="user-rating-input">
              <h3 className="section-title">TU VALORACIÓN</h3>
              <div className="rating-input-stars">
                {[1, 2, 3, 4, 5].map((value) => (
                  <FaStar
                    key={value}
                    className={`rating-star${rating >= value ? ' active' : ''}`}
                    data-rating={value}
                    onClick={() => setRating(value)}
                  />
                ))}
              </div>
              <input
                type="text"
                className="rating-comment-input"
                placeholder="Escribe un comentario..."
                value={comment}
                onChange={(event) => setComment(event.target.value)}
              />
              <button className="btn-submit-rating" type="button" onClick={handleSubmitRating}>
                <span>ENVIAR</span>
                <FaPaperPlane />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
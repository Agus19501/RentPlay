import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { FaStar, FaUserCircle } from 'react-icons/fa';
import { apiRequest, getSession } from '../api';
import './PerfilOtro.css';

const usuarioOtroFallback = {
  apodo: 'Cargando...',
  nombre: 'Cargando...',
  fechaUnion: '...',
  rating: 0,
  reviews: 0,
  avatar: null,
};

export default function PerfilOtro() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [usuarioOtro, setUsuarioOtro] = useState(usuarioOtroFallback);
  const [juegosOtro, setJuegosOtro] = useState([]);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [selectedRating, setSelectedRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);

  async function handleContact() {
    const session = getSession();
    if (!session) {
      navigate('/login');
      return;
    }

    if (juegosOtro.length === 0) {
      alert('Este usuario no tiene juegos disponibles para contactar.');
      return;
    }

    try {
      // Creamos un chat vinculado al primer juego del vendedor (o podríamos dejar que el usuario elija)
      const res = await apiRequest('/api/chats', {
        method: 'POST',
        token: session.token,
        body: {
          sellerId: usuarioOtro.id,
          gameId: juegosOtro[0].id
        }
      });

      if (res.chatId) {
        navigate(`/chats?id=${res.chatId}`);
      }
    } catch (e) {
      console.error('Error al iniciar chat:', e);
      alert(e.message || 'Error al iniciar el chat');
    }
  }

  async function cargarOtro() {
    try {
      const userId = searchParams.get('id') || searchParams.get('userId');
      if (!userId) return;

      const data = await apiRequest(`/api/auth/${userId}`);
      if (data.user) {
        setUsuarioOtro({
          id: data.user.id,
          apodo: data.user.name,
          nombre: data.user.name,
          fechaUnion: data.user.createdAt ? new Date(data.user.createdAt).toLocaleDateString('es-ES') : 'Recientemente',
          rating: data.user.rating || 0,
          reviews: data.user.reviews || 0,
          avatar: data.user.avatar || null
        });
        setJuegosOtro(data.games || []);
      }
    } catch (e) {
      console.error('Error cargando perfil otro:', e);
    }
  }

  useEffect(() => {
    cargarOtro();
  }, [searchParams]);

  const handleRate = async () => {
    if (selectedRating === 0) return;
    try {
      const res = await apiRequest(`/api/auth/${usuarioOtro.id}/rate`, {
        method: 'POST',
        body: { rating: selectedRating }
      });
      
      if (res.ok) {
        alert('¡Usuario valorado exitosamente!');
        setUsuarioOtro(prev => ({
          ...prev,
          rating: res.rating,
          reviews: res.reviews
        }));
        setShowRatingModal(false);
        setSelectedRating(0);
        window.dispatchEvent(new Event('storage'));
      }
    } catch (error) {
      if (error.message.includes('Ya has valorado')) {
        alert('Solo puedes valorar a un usuario una vez');
      } else {
        alert(error.message || 'Error al enviar la valoración');
      }
    }
  };

  return (
    <div className="perfil-otro-page">
      <section className="perfil-otro-shell">
        <aside className="otro-left">
          <div className="otro-stack">
            <div className="otro-avatar">
              {usuarioOtro.avatar ? (
                <img 
                  src={usuarioOtro.avatar.startsWith('data:') ? usuarioOtro.avatar : `/${usuarioOtro.avatar}`} 
                  alt={usuarioOtro.nombre} 
                  style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }}
                />
              ) : (
                <FaUserCircle size="100%" />
              )}
            </div>

            <h2 className="otro-apodo">{usuarioOtro.apodo}</h2>

            <div className="otro-rating">
              <span className="otro-stars">
                {[1, 2, 3, 4, 5].map((s) => (
                  <FaStar key={s} style={{ color: s <= Math.round(usuarioOtro.rating) ? 'var(--color-primary)' : '#ccc' }} />
                ))}
              </span>
              <span className="otro-rating-value">{usuarioOtro.rating.toFixed(1)} ({usuarioOtro.reviews})</span>
            </div>

            <button className="btn-valorar" type="button" onClick={() => setShowRatingModal(true)}>Valorar</button>

            <div className="otro-joined">Se unió el {usuarioOtro.fechaUnion}</div>

            <button className="btn-contactar" type="button" onClick={handleContact}>Contactar</button>
          </div>
        </aside>

        <section className="otro-right">
          <div className="otro-right-header">
            <h3 className="otro-right-title">JUEGOS PUESTOS EN ALQUILER</h3>
            <div className="otro-right-count">{juegosOtro.length} JUEGOS SUBIDOS</div>
          </div>
          <div className="otro-right-body">
            <div className="perfil-games-grid">
              {juegosOtro.map((juego) => (
                <article key={juego.id} className="juego-card">
                  <img 
                    src={juego.image ? (juego.image.startsWith('data:') ? juego.image : `/${juego.image}`) : 'https://via.placeholder.com/150'} 
                    alt={juego.title}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                </article>
              ))}
            </div>
          </div>
        </section>
      </section>

      {showRatingModal && (
        <div className="perfil-modal-backdrop" onClick={() => setShowRatingModal(false)}>
          <div className="perfil-modal" onClick={e => e.stopPropagation()} style={{ textAlign: 'center', padding: '2rem' }}>
            <h3>Valorar a {usuarioOtro.apodo}</h3>
            <div className="rating-stars-input">
              {[1, 2, 3, 4, 5].map((num) => (
                <button
                  key={num}
                  type="button"
                  className="rating-star-btn"
                  onClick={() => setSelectedRating(num)}
                  onMouseEnter={() => setHoverRating(num)}
                  onMouseLeave={() => setHoverRating(0)}
                >
                  <FaStar 
                    style={{ 
                      color: num <= (hoverRating || selectedRating) ? 'var(--color-primary)' : '#ccc' 
                    }} 
                  />
                </button>
              ))}
            </div>
            <div className="rating-actions">
              <button 
                className="btn-valorar-confirm" 
                onClick={handleRate}
                disabled={selectedRating === 0}
              >
                Aceptar
              </button>
              <button className="perfil-modal-secondary" onClick={() => setShowRatingModal(false)}>
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

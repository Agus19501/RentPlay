import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { FaStar, FaUserCircle } from 'react-icons/fa';
import { apiRequest, getSession } from '../api';
import { notify } from '../utils/notify.js';
import RatingModal from '../components/RatingModal.jsx';
import './PerfilOtro.css';

const usuarioOtroFallback = {
  apodo: 'Cargando...',
  nombre: 'Cargando...',
  birthDate: null,
  fechaUnion: '...',
  rating: 0,
  reviews: 0,
  avatar: null,
};

export default function PerfilOtro({ lang = 'ES' }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [usuarioOtro, setUsuarioOtro] = useState(usuarioOtroFallback);
  const [juegosOtro, setJuegosOtro] = useState([]);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const loginRequiredMessage = 'Debes iniciar sesión para realizar esta accion';

  const texts = {
    ES: {
      recently: 'Recientemente',
      ratedOk: '¡Usuario valorado exitosamente!',
      alreadyRated: 'Solo puedes valorar a un usuario una vez',
      ratingError: 'Error al enviar la valoración',
      rate: 'Valorar',
      joinedOn: 'Se unió el',
      gamesForRent: 'JUEGOS PUESTOS EN ALQUILER',
      uploadedGames: 'JUEGOS SUBIDOS',
      rateTo: 'Valorar a',
      accept: 'Aceptar',
      cancel: 'Cancelar',
      birthDate: 'Fecha de nacimiento',
      noProvided: 'No proporcionado'
    },
    EN: {
      recently: 'Recently',
      ratedOk: 'User rated successfully!',
      alreadyRated: 'You can only rate a user once',
      ratingError: 'Error sending rating',
      rate: 'Rate',
      joinedOn: 'Joined on',
      gamesForRent: 'GAMES LISTED FOR RENT',
      uploadedGames: 'UPLOADED GAMES',
      rateTo: 'Rate',
      accept: 'Accept',
      cancel: 'Cancel',
      birthDate: 'Birth date',
      noProvided: 'Not provided'
    }
  };
  const t = texts[lang] || texts.ES;

  function handleOpenRateModal() {
    const session = getSession();
    if (!session?.token) {
      notify(loginRequiredMessage, 'info');
      return;
    }
    setShowRatingModal(true);
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
          birthDate: data.user.birthDate || null,
          fechaUnion: data.user.createdAt ? new Date(data.user.createdAt).toLocaleDateString(lang === 'EN' ? 'en-US' : 'es-ES') : t.recently,
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
  }, [searchParams, lang]);

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


            <div className="otro-rating" aria-label={`Valoración: ${usuarioOtro.rating.toFixed(1)} de 5`}>
              <span className="otro-stars" role="img" aria-label={`Estrellas: ${usuarioOtro.rating.toFixed(1)} de 5`}>
                {[1, 2, 3, 4, 5].map((s) => (
                  <FaStar key={s} style={{ color: s <= Math.round(usuarioOtro.rating) ? 'var(--color-primary)' : '#888' }} aria-hidden="true" />
                ))}
              </span>
              <span className="otro-rating-value">{usuarioOtro.rating.toFixed(1)} <span className="sr-only">puntuación</span> ({usuarioOtro.reviews})</span>
            </div>

            <button className="btn-valorar" type="button" onClick={handleOpenRateModal} tabIndex={0} aria-label={t.rate}>
              {t.rate}
            </button>

            <div className="otro-joined">{t.joinedOn} {usuarioOtro.fechaUnion}</div>
            <div className="otro-birth">{t.birthDate}: {usuarioOtro.birthDate || t.noProvided}</div>
          </div>
        </aside>

        <section className="otro-right">
          <div className="otro-right-header">
            <h3 className="otro-right-title">{t.gamesForRent}</h3>
            <div className="otro-right-count">{juegosOtro.length} {t.uploadedGames}</div>
          </div>
          <div className="otro-right-body">
            <div className="perfil-games-grid" role="list" aria-label="Juegos en alquiler">
              {juegosOtro.map((juego) => (
                <article 
                  key={juego.id} 
                  className="juego-card" 
                  tabIndex={0}
                  role="listitem"
                  aria-label={`Ver juego: ${juego.title}`}
                  onClick={() => navigate(`/ver-juego/${juego.id}`)}
                  onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') navigate(`/ver-juego/${juego.id}`); }}
                  style={{ cursor: 'pointer', outline: 'none' }}
                >
                  <img 
                    src={juego.image ? (juego.image.startsWith('data:') || juego.image.startsWith('http') || juego.image.startsWith('/') ? juego.image : `/${juego.image}`) : 'https://via.placeholder.com/150'} 
                    alt={juego.title}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', maxHeight: '320px', borderRadius: '8px', display: 'block' }}
                  />
                </article>
              ))}
            </div>
          </div>
        </section>
      </section>

      <RatingModal
        isOpen={showRatingModal}
        onClose={() => setShowRatingModal(false)}
        targetUserId={usuarioOtro.id}
        targetUserName={usuarioOtro.apodo}
        lang={lang}
        onRated={({ rating, reviews }) => {
          setUsuarioOtro((prev) => ({ ...prev, rating, reviews }));
          window.dispatchEvent(new Event('storage'));
        }}
      />
    </div>
  );
}

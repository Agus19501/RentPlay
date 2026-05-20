import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaHeart, FaStar } from 'react-icons/fa';
import { apiRequest } from '../api.js';
import { notify } from '../utils/notify.js';
import RatingModal from '../components/RatingModal.jsx';
import './PerfilPropio.css';

const tabs = [
  { key: 'alquilados' },
  { key: 'subidos' },
  { key: 'favoritos' }
];

function JuegoCard({ juego, rental, isAddCard = false, onAddClick, onDelete, onEdit, onRequestDelete, onRequestRemoveFavorite, type, navigate, t, isCurrentlyRented = false }) {
  if (isAddCard) {
    return (
      <button type="button" className="juego-card juego-card-add" aria-label={t.uploadGameAria} onClick={onAddClick}>
        <span className="add-icon">+</span>
      </button>
    );
  }

  const imageSrc = juego.image 
    ? (juego.image.startsWith('data:') || juego.image.startsWith('http') || juego.image.startsWith('/') ? juego.image : `/${juego.image}`)
    : 'https://via.placeholder.com/150';

  const getTimeRemaining = (expiresAt) => {
    const total = Date.parse(expiresAt) - Date.parse(new Date());
    const days = Math.floor(total / (1000 * 60 * 60 * 24));
    const hours = Math.floor((total / (1000 * 60 * 60)) % 24);
    
    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${t.remaining}`;
    return t.expiringSoon;
  };

  return (
    <article 
      className="juego-card" 
      key={juego.id}
      onClick={() => {
        if (type === 'alquilado') {
          navigate(`/mi-alquiler?id=${juego.id}`);
        } else if (type === 'subido') {
          // Opcional: navegar a ver-juego o dejar solo edición
          navigate(`/ver-juego?id=${juego.id}`);
        } else if (type === 'favorito') {
          navigate(`/ver-juego?id=${juego.id}`);
        }
      }}
      style={{ cursor: type === 'alquilado' || type === 'subido' || type === 'favorito' ? 'pointer' : 'default' }}
    >
      <img 
        src={imageSrc} 
        alt={juego.title}
        className="juego-cover-img"
        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
      />
      {rental && (
        <div className="tiempo-restante" style={{ 
          position: 'absolute', 
          bottom: '10px', 
          right: '10px', 
          background: 'rgba(0,0,0,0.8)', 
          color: '#fff', 
          padding: '2px 8px', 
          borderRadius: '4px',
          fontSize: '12px',
          fontWeight: 'bold'
        }}>
          {getTimeRemaining(rental.expiresAt)}
        </div>
      )}

      {type === 'subido' && isCurrentlyRented && (
        <div className="juego-rented-badge">{t.rentedLabel}</div>
      )}

      <div className="juego-overlay" aria-hidden="true">
        {type === 'subido' && !isCurrentlyRented && (
          <>
            <button 
              className="overlay-btn overlay-btn-close" 
              type="button"
              title={t.deleteGame}
              onClick={(e) => {
                e.stopPropagation();
                onRequestDelete?.(juego);
              }}
            >
              ×
            </button>
            <button 
              className="overlay-btn overlay-btn-more" 
              type="button"
              title={t.editGame}
              onClick={(e) => {
                e.stopPropagation();
                onEdit(juego);
              }}
            >
              ✎
            </button>
          </>
        )}
        {type === 'favorito' && (
          <button
            className="overlay-btn overlay-btn-favorite"
            type="button"
            title={t.removeFavorite}
            onClick={(e) => {
              e.stopPropagation();
              onRequestRemoveFavorite?.(juego);
            }}
          >
            <FaHeart />
          </button>
        )}
      </div>
    </article>
  );
}

export default function PerfilPropio({ session, lang = 'ES' }) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('alquilados');
  const [usuario, setUsuario] = useState(null);
  const [showRatingsModal, setShowRatingsModal] = useState(false);
  const [juegosSubidos, setJuegosSubidos] = useState([]);
  const [alquileres, setAlquileres] = useState([]);
  const [catalogoJuegos, setCatalogoJuegos] = useState([]);
  const [juegosFavoritos, setJuegosFavoritos] = useState([]);
  const [ownerActiveRentalGameIds, setOwnerActiveRentalGameIds] = useState(new Set());
  const [mostrarModalDatos, setMostrarModalDatos] = useState(false);
  const [mostrarModalAvatar, setMostrarModalAvatar] = useState(false);
  const [juegoPendienteEliminar, setJuegoPendienteEliminar] = useState(null);
  const [favoritoPendienteEliminar, setFavoritoPendienteEliminar] = useState(null);
  const [archivoAvatar, setArchivoAvatar] = useState('');
  const [formulario, setFormulario] = useState({
    apodo: '',
    nombre: '',
    fechaNacimiento: '',
    correo: '',
    contrasena: ''
  });

  const texts = {
    ES: {
      tabs: { alquilados: 'Alquilados', subidos: 'Subidos', favoritos: 'Favoritos' },
      uploadGameAria: 'Subir un juego',
      remaining: 'restantes',
      expiringSoon: 'Expirando pronto',
      deleteGame: 'Borrar juego',
      deleteGameTitle: 'Eliminar juego',
      deleteConfirm: '¿Estás seguro de que quieres borrar este juego por completo?',
      editGame: 'Editar juego',
      loading: 'Cargando...',
      noData: 'No proporcionada',
      name: 'Nombre',
      birthDate: 'Fecha de nacimiento',
      email: 'Correo',
      password: 'Contraseña',
      editData: 'EDITAR DATOS',
      sectionsGames: 'Secciones de juegos',
      editProfileData: 'Editar datos de perfil',
      closeForm: 'Cerrar formulario',
      cancel: 'Cancelar',
      saveChanges: 'Guardar cambios',
      updateImage: 'Actualizar imagen',
      closeAvatarUpload: 'Cerrar carga de avatar',
      selectImage: 'Selecciona una imagen',
      file: 'Archivo',
      uploadImage: 'Subir imagen',
      reviewsLabel: 'reseñas',
      removeFavorite: 'Quitar de favoritos',
      removeFavoriteQuestion: '¿Quieres eliminar este juego de favoritos?',
      removeFavoriteTitle: 'Eliminar favorito',
      accept: 'Aceptar',
      delete: 'Eliminar',
      rentedLabel: 'Alquilado'
    },
    EN: {
      tabs: { alquilados: 'Rented', subidos: 'Uploaded', favoritos: 'Favorites' },
      uploadGameAria: 'Upload a game',
      remaining: 'left',
      expiringSoon: 'Expiring soon',
      deleteGame: 'Delete game',
      deleteGameTitle: 'Delete game',
      deleteConfirm: 'Are you sure you want to fully delete this game?',
      editGame: 'Edit game',
      loading: 'Loading...',
      noData: 'Not provided',
      name: 'Name',
      birthDate: 'Birth date',
      email: 'Email',
      password: 'Password',
      editData: 'EDIT DATA',
      sectionsGames: 'Game sections',
      editProfileData: 'Edit profile data',
      closeForm: 'Close form',
      cancel: 'Cancel',
      saveChanges: 'Save changes',
      updateImage: 'Update image',
      closeAvatarUpload: 'Close avatar upload',
      selectImage: 'Select an image',
      file: 'File',
      uploadImage: 'Upload image',
      reviewsLabel: 'reviews',
      removeFavorite: 'Remove from favorites',
      removeFavoriteQuestion: 'Do you want to remove this game from favorites?',
      removeFavoriteTitle: 'Remove favorite',
      accept: 'Accept',
      delete: 'Delete',
      rentedLabel: 'Rented'
    }
  };
  const t = texts[lang] || texts.ES;
  const ratingValue = Number(usuario?.rating || 0);
  const reviewsValue = Number(usuario?.reviews || 0);

  const syncFavoritos = (catalogo = catalogoJuegos) => {
    const savedWishlist = JSON.parse(localStorage.getItem('wishlist') || '[]');
    const ids = new Set(savedWishlist.map((id) => String(id)));
    const favoritos = (catalogo || []).filter((game) => ids.has(String(game.id)));
    setJuegosFavoritos(favoritos);
  };

  useEffect(() => {
    async function cargarDatos() {
      if (!session?.token) return;
      try {
        const userData = await apiRequest('/api/auth/me', { token: session.token });
        if (userData.user) {
          setUsuario(userData.user);
          setFormulario({
            apodo: userData.user.name || '',
            nombre: userData.user.name || '',
            fechaNacimiento: userData.user.birthDate || '',
            correo: userData.user.email || '',
            contrasena: ''
          });

          const [gamesJson, rentalsData, ownerRentalsData, gamesCatalogData] = await Promise.all([
            apiRequest(`/api/games/user/${userData.user.id}?lite=1`).catch(() => ({ games: [] })),
            apiRequest('/api/rentals/mine', { token: session.token }).catch(() => ({ rentals: [] })),
            apiRequest('/api/rentals/owner-active', { token: session.token }).catch(() => ({ ok: false, activeRentals: [] })),
            apiRequest('/api/games?lite=1').catch(() => ({ games: [] }))
          ]);

          if (gamesJson.games) {
            setJuegosSubidos(gamesJson.games);
          }

          if (rentalsData.rentals) {
            setAlquileres(rentalsData.rentals);
          }

          if (ownerRentalsData.ok && Array.isArray(ownerRentalsData.activeRentals)) {
            setOwnerActiveRentalGameIds(new Set(ownerRentalsData.activeRentals.map((rental) => String(rental.gameId)).filter(Boolean)));
          }

          const catalogo = gamesCatalogData.games || [];
          setCatalogoJuegos(catalogo);
          const savedWishlist = JSON.parse(localStorage.getItem('wishlist') || '[]');
          const ids = new Set(savedWishlist.map((id) => String(id)));
          setJuegosFavoritos(catalogo.filter((game) => ids.has(String(game.id))));
        }
      } catch (e) {
        console.error('Error cargando datos:', e);
      }
    }

    cargarDatos();
  }, [session]);

  useEffect(() => {
    const onStorage = () => syncFavoritos();
    const onFocus = () => syncFavoritos();
    window.addEventListener('storage', onStorage);
    window.addEventListener('focus', onFocus);
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('focus', onFocus);
    };
  }, [catalogoJuegos]);

  async function borrarJuego(gameId) {
    try {
      const res = await apiRequest(`/api/games/${gameId}`, {
        method: 'DELETE',
        token: session.token
      });
      if (res.ok) {
        setJuegosSubidos(prev => prev.filter(g => g.id !== gameId));
        setJuegoPendienteEliminar(null);
      } else {
        notify(res.message || 'Error al borrar el juego', 'error');
      }
    } catch (e) {
      console.error('Error borrando juego:', e);
    }
  }

  function solicitarEliminarJuego(juego) {
    setJuegoPendienteEliminar(juego);
  }

  function confirmarEliminarJuego() {
    if (!juegoPendienteEliminar) return;
    borrarJuego(juegoPendienteEliminar.id);
  }

  async function editarJuego(juego) {
    try {
      const gameRes = await apiRequest(`/api/games/${juego.id}`);
      const editGame = gameRes.game || juego;
      navigate('/subir-juego', { state: { editGame } });
    } catch (e) {
      console.error('Error cargando juego para editar:', e);
      navigate('/subir-juego', { state: { editGame: juego } });
    }
  }

  function solicitarEliminarFavorito(juego) {
    setFavoritoPendienteEliminar(juego);
  }

  function confirmarEliminarFavorito() {
    if (!favoritoPendienteEliminar) return;

    const savedWishlist = JSON.parse(localStorage.getItem('wishlist') || '[]');
    const nextWishlist = savedWishlist.filter((id) => String(id) !== String(favoritoPendienteEliminar.id));
    localStorage.setItem('wishlist', JSON.stringify(nextWishlist));
    syncFavoritos();
    window.dispatchEvent(new Event('storage'));
    setFavoritoPendienteEliminar(null);
  }

  const setJuegosVisualizar = () => {
    switch(activeTab) {
      case 'subidos':
        return [
          ...juegosSubidos.map(j => ({
            ...j,
            type: 'subido',
            isCurrentlyRented: ownerActiveRentalGameIds.has(String(j.id))
          })),
          { id: 'add-card', isAddCard: true }
        ];
      case 'alquilados':
        // Mapeamos los alquileres asegurando que el ID del juego existe
        return alquileres.map(r => {
          const gameData = r.game || {};
          const gameId = gameData.id || gameData._id || r.gameId;
          
          return { 
            ...gameData, 
            id: gameId, 
            rental: r, 
            type: 'alquilado', 
            uniqueKey: r.id || r._id
          };
        });
      case 'favoritos':
        return juegosFavoritos.map((j) => ({ ...j, type: 'favorito' }));
      default:
        return [];
    }
  };

  const juegosActivos = setJuegosVisualizar();

  function abrirModalDatos() {
    setFormulario((prev) => ({
      ...prev,
      apodo: usuario?.name || '',
      nombre: usuario?.name || '',
      correo: usuario?.email || ''
    }));
    setMostrarModalDatos(true);
  }

  function guardarDatos(event) {
    event.preventDefault();
    (async () => {
      try {
        const res = await apiRequest('/api/auth/update', {
          method: 'PUT',
          token: session.token,
          body: {
            name: formulario.nombre,
            email: formulario.correo,
            birthDate: formulario.fechaNacimiento
          }
        });

        if (res.user) {
          setUsuario(res.user);
          setFormulario({
            apodo: res.user.name || '',
            nombre: res.user.name || '',
            fechaNacimiento: res.user.birthDate || '',
            correo: res.user.email || '',
            contrasena: ''
          });
          // Actualizar la sesión local para que el Header y otros componentes vean el cambio
          const currentSession = JSON.parse(localStorage.getItem('rentplay_session'));
          if (currentSession) {
            currentSession.user = { 
              ...currentSession.user, 
              name: res.user.name, 
              email: res.user.email,
              avatar: res.user.avatar 
            };
            localStorage.setItem('rentplay_session', JSON.stringify(currentSession));
            window.dispatchEvent(new Event('storage'));
          }
        } else {
          console.error('No se actualizó en DB', res);
        }
      } catch (e) {
        console.error('Error actualizando usuario:', e);
      } finally {
        setMostrarModalDatos(false);
      }
    })();
  }

  function guardarAvatar(event) {
    event.preventDefault();
    const input = event.target.querySelector('input[type="file"]');
    const file = input.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      const base64 = e.target.result;
      try {
        const res = await apiRequest('/api/auth/update', {
          method: 'PUT',
          token: session.token,
          body: { avatar: base64 }
        });

        if (res.user) {
          setUsuario(res.user);
          const currentSession = JSON.parse(localStorage.getItem('rentplay_session'));
          if (currentSession) {
            currentSession.user = { ...currentSession.user, avatar: res.user.avatar };
            localStorage.setItem('rentplay_session', JSON.stringify(currentSession));
            window.dispatchEvent(new Event('storage'));
          }
        }
      } catch (error) {
        console.error('Error subiendo avatar:', error);
      } finally {
        setMostrarModalAvatar(false);
      }
    };
    reader.readAsDataURL(file);
  }

  if (!usuario) {
    return <div className="perfil-page"><p>{t.loading}</p></div>;
  }

  return (
    <div className="perfil-page">
      <section className="perfil-shell">
        <aside className="perfil-panel perfil-panel-left">
          <div className="perfil-top">
            <div className="perfil-avatar-wrap">
              <div className="perfil-avatar">
                {usuario.avatar ? (
                  <img 
                    src={usuario.avatar.startsWith('data:') ? usuario.avatar : `/${usuario.avatar}`} 
                    alt={usuario.name} 
                    style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} 
                  />
                ) : (
                  '👤'
                )}
              </div>
              <button
                type="button"
                className="perfil-avatar-edit"
                onClick={() => setMostrarModalAvatar(true)}
                aria-label="Editar imagen de perfil"
              >
                ✎
              </button>
            </div>

            <div className="perfil-identidad">
              <h1 className="perfil-nickname">{usuario.name}</h1>
              <div className="perfil-rating">
                <span className="perfil-stars">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <FaStar key={star} className={star <= Math.round(ratingValue) ? 'perfil-star-filled' : 'perfil-star-empty'} />
                  ))}
                </span>
                <span className="perfil-rating-value">
                  {ratingValue.toFixed(1)}{' '}
                  <button
                    type="button"
                    className="perfil-reviews-link"
                    onClick={() => setShowRatingsModal(true)}
                  >
                    ({reviewsValue} {t.reviewsLabel || 'reseñas'})
                  </button>
                </span>
              </div>
            </div>
          </div>

          <div className="perfil-data-block">
            <div className="perfil-data-grid">
              <div className="perfil-field">
                <span className="perfil-field-label">{t.name}</span>
                <span className="perfil-field-value">{usuario.name}</span>
              </div>
              <div className="perfil-field">
                <span className="perfil-field-label">{t.birthDate}</span>
                <span className="perfil-field-value">{usuario.birthDate || t.noData}</span>
              </div>
            </div>

            <div className="perfil-data-divider" />

            <div className="perfil-data-grid">
              <div className="perfil-field">
                <span className="perfil-field-label">{t.email}</span>
                <span className="perfil-field-value">{usuario.email}</span>
              </div>
              <div className="perfil-field">
                <span className="perfil-field-label">{t.password}</span>
                <span className="perfil-field-value">**********</span>
              </div>
            </div>
          </div>

          <button className="perfil-edit-button" type="button" onClick={abrirModalDatos}>
            {t.editData}
            <span className="perfil-edit-icon">✎</span>
          </button>
        </aside>

        <section className="perfil-panel perfil-panel-right">
          <div className="perfil-tabs" role="tablist" aria-label={t.sectionsGames}>
            {tabs.map((tab) => (
              <button
                key={tab.key}
                type="button"
                role="tab"
                aria-selected={activeTab === tab.key}
                className={`perfil-tab ${activeTab === tab.key ? 'is-active' : ''}`}
                onClick={() => setActiveTab(tab.key)}
              >
                {t.tabs[tab.key]}
              </button>
            ))}
          </div>

          <div className="perfil-games-grid" role="tabpanel">
            {juegosActivos.map((item) => (
              <JuegoCard
                key={item.uniqueKey || item.id}
                juego={item}
                rental={item.rental}
                isAddCard={item.isAddCard}
                onAddClick={() => navigate('/subir-juego')}
                onDelete={borrarJuego}
                onEdit={editarJuego}
                onRequestDelete={solicitarEliminarJuego}
                onRequestRemoveFavorite={solicitarEliminarFavorito}
                type={item.type}
                isCurrentlyRented={item.isCurrentlyRented}
                navigate={navigate}
                t={t}
              />
            ))}
          </div>
        </section>
      </section>

      {mostrarModalDatos && (
        <div className="perfil-modal-backdrop" role="presentation" onClick={() => setMostrarModalDatos(false)}>
          <section
            className="perfil-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-datos-titulo"
            onClick={(event) => event.stopPropagation()}
          >
            <header className="perfil-modal-header">
              <h2 id="modal-datos-titulo">{t.editProfileData}</h2>
              <button
                type="button"
                className="perfil-modal-close"
                onClick={() => setMostrarModalDatos(false)}
                aria-label={t.closeForm}
              >
                ×
              </button>
            </header>

            <form className="perfil-modal-form" onSubmit={guardarDatos}>
              <label>
                {t.name}
                <input
                  type="text"
                  value={formulario.nombre}
                  onChange={(event) => setFormulario((prev) => ({ ...prev, nombre: event.target.value }))}
                  required
                />
              </label>
              <label>
                {t.birthDate}
                <input
                  type="date"
                  value={formulario.fechaNacimiento}
                  onChange={(event) => setFormulario((prev) => ({ ...prev, fechaNacimiento: event.target.value }))}
                />
              </label>
              <label>
                {t.email}
                <input
                  type="email"
                  value={formulario.correo}
                  onChange={(event) => setFormulario((prev) => ({ ...prev, correo: event.target.value }))}
                  required
                />
              </label>

              <div className="perfil-modal-actions">
                <button type="button" className="perfil-modal-secondary" onClick={() => setMostrarModalDatos(false)}>
                  {t.cancel}
                </button>
                <button type="submit" className="perfil-modal-primary">
                  {t.saveChanges}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

      {mostrarModalAvatar && (
        <div className="perfil-modal-backdrop" role="presentation" onClick={() => setMostrarModalAvatar(false)}>
          <section
            className="perfil-modal perfil-modal-small"
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-avatar-titulo"
            onClick={(event) => event.stopPropagation()}
          >
            <header className="perfil-modal-header">
              <h2 id="modal-avatar-titulo">{t.updateImage}</h2>
              <button
                type="button"
                className="perfil-modal-close"
                onClick={() => setMostrarModalAvatar(false)}
                aria-label={t.closeAvatarUpload}
              >
                ×
              </button>
            </header>

            <form className="perfil-modal-form" onSubmit={guardarAvatar}>
              <label>
                {t.selectImage}
                <input
                  type="file"
                  accept="image/*"
                  onChange={(event) => {
                    const archivo = event.target.files?.[0];
                    setArchivoAvatar(archivo ? archivo.name : '');
                  }}
                />
              </label>
              {archivoAvatar && <p className="perfil-file-name">{t.file}: {archivoAvatar}</p>}

              <div className="perfil-modal-actions">
                <button type="button" className="perfil-modal-secondary" onClick={() => setMostrarModalAvatar(false)}>
                  {t.cancel}
                </button>
                <button type="submit" className="perfil-modal-primary">
                  {t.uploadImage}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

      {favoritoPendienteEliminar && (
        <div className="perfil-modal-backdrop" role="presentation" onClick={() => setFavoritoPendienteEliminar(null)}>
          <section
            className="perfil-modal perfil-modal-small"
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-favorito-titulo"
            onClick={(event) => event.stopPropagation()}
          >
            <header className="perfil-modal-header">
              <h2 id="modal-favorito-titulo">{t.removeFavoriteTitle}</h2>
              <button
                type="button"
                className="perfil-modal-close"
                onClick={() => setFavoritoPendienteEliminar(null)}
                aria-label={t.cancel}
              >
                ×
              </button>
            </header>

            <div className="perfil-modal-form">
              <p className="perfil-confirm-text">{t.removeFavoriteQuestion}</p>
              <div className="perfil-modal-actions">
                <button type="button" className="perfil-modal-secondary" onClick={() => setFavoritoPendienteEliminar(null)}>
                  {t.cancel}
                </button>
                <button type="button" className="perfil-modal-primary" onClick={confirmarEliminarFavorito}>
                  {t.accept}
                </button>
              </div>
            </div>
          </section>
        </div>
      )}

      {juegoPendienteEliminar && (
        <div className="perfil-modal-backdrop" role="presentation" onClick={() => setJuegoPendienteEliminar(null)}>
          <section
            className="perfil-modal perfil-modal-small"
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-borrar-juego-titulo"
            onClick={(event) => event.stopPropagation()}
          >
            <header className="perfil-modal-header">
              <h2 id="modal-borrar-juego-titulo">{t.deleteGameTitle}</h2>
              <button
                type="button"
                className="perfil-modal-close"
                onClick={() => setJuegoPendienteEliminar(null)}
                aria-label={t.cancel}
              >
                ×
              </button>
            </header>

            <div className="perfil-modal-form">
              <p className="perfil-confirm-text">{t.deleteConfirm}</p>
              <div className="perfil-modal-actions">
                <button type="button" className="perfil-modal-secondary" onClick={() => setJuegoPendienteEliminar(null)}>
                  {t.cancel}
                </button>
                <button type="button" className="perfil-modal-primary" onClick={confirmarEliminarJuego}>
                  {t.delete}
                </button>
              </div>
            </div>
          </section>
        </div>
      )}

      <RatingModal
        isOpen={showRatingsModal}
        onClose={() => setShowRatingsModal(false)}
        targetUserId={usuario?.id}
        targetUserName={usuario?.name}
        lang={lang}
        onRated={() => {}}
      />
    </div>
  );
}

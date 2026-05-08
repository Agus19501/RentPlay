import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiRequest } from '../api.js';
import './PerfilPropio.css';

const tabs = [
  { key: 'alquilados', label: 'Alquilados' },
  { key: 'subidos', label: 'Subidos' },
  { key: 'favoritos', label: 'Favoritos' }
];

function JuegoCard({ juego, rental, isAddCard = false, onAddClick, onDelete, onEdit, type, navigate }) {
  if (isAddCard) {
    return (
      <button type="button" className="juego-card juego-card-add" aria-label="Subir un juego" onClick={onAddClick}>
        <span className="add-icon">+</span>
      </button>
    );
  }

  const imageSrc = juego.image 
    ? (juego.image.startsWith('data:') ? juego.image : `/${juego.image}`)
    : 'https://via.placeholder.com/150';

  const getTimeRemaining = (expiresAt) => {
    const total = Date.parse(expiresAt) - Date.parse(new Date());
    const days = Math.floor(total / (1000 * 60 * 60 * 24));
    const hours = Math.floor((total / (1000 * 60 * 60)) % 24);
    
    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h restantes`;
    return 'Expirando pronto';
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
        }
      }}
      style={{ cursor: type === 'alquilado' || type === 'subido' ? 'pointer' : 'default' }}
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
      <div className="juego-overlay" aria-hidden="true">
        {type === 'subido' && (
          <>
            <button 
              className="overlay-btn overlay-btn-close" 
              type="button"
              title="Borrar juego"
              onClick={(e) => {
                e.stopPropagation();
                if (window.confirm('¿Estás seguro de que quieres borrar este juego por completo?')) {
                  onDelete(juego.id);
                }
              }}
            >
              ×
            </button>
            <button 
              className="overlay-btn overlay-btn-more" 
              type="button"
              title="Editar juego"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(juego);
              }}
            >
              ✎
            </button>
          </>
        )}
      </div>
    </article>
  );
}

export default function PerfilPropio({ session }) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('alquilados');
  const [usuario, setUsuario] = useState(null);
  const [juegosSubidos, setJuegosSubidos] = useState([]);
  const [alquileres, setAlquileres] = useState([]);
  const [mostrarModalDatos, setMostrarModalDatos] = useState(false);
  const [mostrarModalAvatar, setMostrarModalAvatar] = useState(false);
  const [archivoAvatar, setArchivoAvatar] = useState('');
  const [formulario, setFormulario] = useState({
    apodo: '',
    nombre: '',
    fechaNacimiento: '',
    correo: '',
    contrasena: ''
  });

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

          // Cargar juegos del usuario
          const gamesData = await fetch(`/api/games/user/${userData.user.id}`);
          const gamesJson = await gamesData.json();
          if (gamesJson.games) {
            setJuegosSubidos(gamesJson.games);
          }

          // Cargar alquileres del usuario
          const rentalsData = await apiRequest('/api/rentals/mine', { token: session.token });
          if (rentalsData.rentals) {
            setAlquileres(rentalsData.rentals);
          }
        }
      } catch (e) {
        console.error('Error cargando datos:', e);
      }
    }

    cargarDatos();
  }, [session]);

  async function borrarJuego(gameId) {
    try {
      const res = await apiRequest(`/api/games/${gameId}`, {
        method: 'DELETE',
        token: session.token
      });
      if (res.ok) {
        setJuegosSubidos(prev => prev.filter(g => g.id !== gameId));
      } else {
        alert(res.message || 'Error al borrar el juego');
      }
    } catch (e) {
      console.error('Error borrando juego:', e);
    }
  }

  function editarJuego(juego) {
    // Verificar si el juego está alquilado (podemos intentar verlo en los datos que ya tenemos o dejar que el backend falle)
    // Para mayor UX, navegamos y el componente de edición cargará los datos
    navigate('/subir-juego', { state: { editGame: juego } });
  }

  const setJuegosVisualizar = () => {
    switch(activeTab) {
      case 'subidos':
        return [...juegosSubidos.map(j => ({ ...j, type: 'subido' })), { id: 'add-card', isAddCard: true }];
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
        return [];
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
    return <div className="perfil-page"><p>Cargando...</p></div>;
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
                <span className="perfil-stars">★★★★☆</span>
                <span className="perfil-rating-value">4.1</span>
              </div>
            </div>
          </div>

          <div className="perfil-data-block">
            <div className="perfil-data-grid">
              <div className="perfil-field">
                <span className="perfil-field-label">Nombre</span>
                <span className="perfil-field-value">{usuario.name}</span>
              </div>
              <div className="perfil-field">
                <span className="perfil-field-label">Fecha de nacimiento</span>
                <span className="perfil-field-value">{usuario.birthDate || 'No disponible'}</span>
              </div>
            </div>

            <div className="perfil-data-divider" />

            <div className="perfil-data-grid">
              <div className="perfil-field">
                <span className="perfil-field-label">Correo</span>
                <span className="perfil-field-value">{usuario.email}</span>
              </div>
              <div className="perfil-field">
                <span className="perfil-field-label">Contraseña</span>
                <span className="perfil-field-value">**********</span>
              </div>
            </div>
          </div>

          <button className="perfil-edit-button" type="button" onClick={abrirModalDatos}>
            EDITAR DATOS
            <span className="perfil-edit-icon">✎</span>
          </button>
        </aside>

        <section className="perfil-panel perfil-panel-right">
          <div className="perfil-tabs" role="tablist" aria-label="Secciones de juegos">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                type="button"
                role="tab"
                aria-selected={activeTab === tab.key}
                className={`perfil-tab ${activeTab === tab.key ? 'is-active' : ''}`}
                onClick={() => setActiveTab(tab.key)}
              >
                {tab.label}
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
                type={item.type}
                navigate={navigate}
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
              <h2 id="modal-datos-titulo">Editar datos de perfil</h2>
              <button
                type="button"
                className="perfil-modal-close"
                onClick={() => setMostrarModalDatos(false)}
                aria-label="Cerrar formulario"
              >
                ×
              </button>
            </header>

            <form className="perfil-modal-form" onSubmit={guardarDatos}>
              <label>
                Nombre
                <input
                  type="text"
                  value={formulario.nombre}
                  onChange={(event) => setFormulario((prev) => ({ ...prev, nombre: event.target.value }))}
                  required
                />
              </label>
              <label>
                Fecha de nacimiento
                <input
                  type="date"
                  value={formulario.fechaNacimiento}
                  onChange={(event) => setFormulario((prev) => ({ ...prev, fechaNacimiento: event.target.value }))}
                />
              </label>
              <label>
                Correo
                <input
                  type="email"
                  value={formulario.correo}
                  onChange={(event) => setFormulario((prev) => ({ ...prev, correo: event.target.value }))}
                  required
                />
              </label>

              <div className="perfil-modal-actions">
                <button type="button" className="perfil-modal-secondary" onClick={() => setMostrarModalDatos(false)}>
                  Cancelar
                </button>
                <button type="submit" className="perfil-modal-primary">
                  Guardar cambios
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
              <h2 id="modal-avatar-titulo">Actualizar imagen</h2>
              <button
                type="button"
                className="perfil-modal-close"
                onClick={() => setMostrarModalAvatar(false)}
                aria-label="Cerrar carga de avatar"
              >
                ×
              </button>
            </header>

            <form className="perfil-modal-form" onSubmit={guardarAvatar}>
              <label>
                Selecciona una imagen
                <input
                  type="file"
                  accept="image/*"
                  onChange={(event) => {
                    const archivo = event.target.files?.[0];
                    setArchivoAvatar(archivo ? archivo.name : '');
                  }}
                />
              </label>
              {archivoAvatar && <p className="perfil-file-name">Archivo: {archivoAvatar}</p>}

              <div className="perfil-modal-actions">
                <button type="button" className="perfil-modal-secondary" onClick={() => setMostrarModalAvatar(false)}>
                  Cancelar
                </button>
                <button type="submit" className="perfil-modal-primary">
                  Subir imagen
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}

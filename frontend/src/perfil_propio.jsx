import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './perfil_propio.css';

const usuarioInicial = {
  apodo: 'Pepe_gom01',
  nombre: 'Pepe Gómez García',
  fechaNacimiento: '5 de Agosto de 2001',
  correo: 'pepe.gomez@gmail.com',
  contrasena: '**********',
  rating: 4.1,
  avatar: '🐶'
};

const juegos = {
  alquilados: [
    { id: 1, nombre: 'Dark Souls', cover: 'DS', className: 'cover-dark-souls' },
    { id: 2, nombre: 'Terraria', cover: 'TR', className: 'cover-terraria' }
  ],
  subidos: [
      { id: 3, nombre: 'GTA Vice City', cover: 'VC', className: 'cover-vice-city' },
      { id: 4, nombre: 'Terraria', cover: 'TR', className: 'cover-terraria' },
      { id: 'add', nombre: 'Subir juego', cover: '+', className: 'cover-vice-city', isAddCard: true }
  ],
  favoritos: [
    { id: 5, nombre: 'Stardew Valley', cover: 'SV', className: 'cover-stardew' }
  ]
};

const tabs = [
  { key: 'alquilados', label: 'Alquilados' },
  { key: 'subidos', label: 'Subidos' },
  { key: 'favoritos', label: 'Favoritos' }
];

function JuegoCard({ juego, isAddCard = false, onAddClick }) {
  if (isAddCard) {
    return (
      <button type="button" className="juego-card juego-card-add" aria-label="Subir un juego" onClick={onAddClick}>
        <span className="add-icon">+</span>
      </button>
    );
  }

  return (
    <article className="juego-card">
      <div className={`juego-cover ${juego.className}`}>
        <span className="juego-cover-text">{juego.cover}</span>
      </div>
      <div className="juego-overlay" aria-hidden="true">
        <button className="overlay-btn overlay-btn-close" type="button">×</button>
        <button className="overlay-btn overlay-btn-more" type="button">✎</button>
      </div>
    </article>
  );
}

export default function PerfilPropio() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('alquilados');
  const [usuario, setUsuario] = useState(usuarioInicial);
  const [mostrarModalDatos, setMostrarModalDatos] = useState(false);
  const [mostrarModalAvatar, setMostrarModalAvatar] = useState(false);
  const [archivoAvatar, setArchivoAvatar] = useState('');
  const [formulario, setFormulario] = useState({
    apodo: usuarioInicial.apodo,
    nombre: usuarioInicial.nombre,
    fechaNacimiento: usuarioInicial.fechaNacimiento,
    correo: usuarioInicial.correo,
    contrasena: usuarioInicial.contrasena
  });

  const juegosActivos = juegos[activeTab] ?? [];

  useEffect(() => {
    async function cargarUsuario() {
      try {
        const stored = localStorage.getItem('rentplayUser');
        if (!stored) return;
        const parsed = JSON.parse(stored);
        const email = parsed.email;
        if (!email) return;

        const body = new URLSearchParams({ email });
        const res = await fetch('/.netlify/functions/getUser', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
          body
        });
        const data = await res.json();
        if (data.ok && data.user) {
          setUsuario((prev) => ({ ...prev, apodo: data.user.apodo || data.user.name || prev.apodo, nombre: data.user.name || prev.nombre, fechaNacimiento: data.user.fechaNacimiento || prev.fechaNacimiento, correo: data.user.email || prev.correo }));
          setFormulario((prev) => ({ ...prev, apodo: data.user.apodo || data.user.name || prev.apodo, nombre: data.user.name || prev.nombre, fechaNacimiento: data.user.fechaNacimiento || prev.fechaNacimiento, correo: data.user.email || prev.correo }));
        }
      } catch (e) {
        // ignore errors, keep defaults
        console.error('Error cargando usuario:', e);
      }
    }

    cargarUsuario();
  }, []);

  function abrirModalDatos() {
    setFormulario({
      apodo: usuario.apodo,
      nombre: usuario.nombre,
      fechaNacimiento: usuario.fechaNacimiento,
      correo: usuario.correo,
      contrasena: usuario.contrasena
    });
    setMostrarModalDatos(true);
  }

  function guardarDatos(event) {
    event.preventDefault();
    (async () => {
      try {
        const body = new URLSearchParams({
          email: usuario.correo || formulario.correo,
          name: formulario.nombre,
          apodo: formulario.apodo,
          fechaNacimiento: formulario.fechaNacimiento
        });

        const res = await fetch('/.netlify/functions/updateUser', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
          body
        });
        const data = await res.json();
        if (data.ok) {
          setUsuario((prevUsuario) => ({
            ...prevUsuario,
            apodo: formulario.apodo,
            nombre: formulario.nombre,
            fechaNacimiento: formulario.fechaNacimiento,
            correo: formulario.correo,
            contrasena: formulario.contrasena
          }));
        } else {
          console.error('No se actualizo en DB', data);
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
    setMostrarModalAvatar(false);
  }

  return (
    <div className="perfil-page">
      <section className="perfil-shell">
        <aside className="perfil-panel perfil-panel-left">
          <div className="perfil-top">
            <div className="perfil-avatar-wrap">
              <div className="perfil-avatar">{usuario.avatar}</div>
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
              <h1 className="perfil-nickname">{usuario.apodo}</h1>
              <div className="perfil-rating">
                <span className="perfil-stars">★★★★☆</span>
                <span className="perfil-rating-value">{usuario.rating}</span>
              </div>
            </div>
          </div>

          <div className="perfil-data-block">
            <div className="perfil-data-grid">
              <div className="perfil-field">
                <span className="perfil-field-label">Nombre</span>
                <span className="perfil-field-value">{usuario.nombre}</span>
              </div>
              <div className="perfil-field">
                <span className="perfil-field-label">Fecha de nacimiento</span>
                <span className="perfil-field-value">{usuario.fechaNacimiento}</span>
              </div>
            </div>

            <div className="perfil-data-divider" />

            <div className="perfil-data-grid">
              <div className="perfil-field">
                <span className="perfil-field-label">Correo</span>
                <span className="perfil-field-value">{usuario.correo}</span>
              </div>
              <div className="perfil-field">
                <span className="perfil-field-label">Contraseña</span>
                <span className="perfil-field-value">{usuario.contrasena}</span>
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
            {juegosActivos.map((juego) => (
              <JuegoCard
                key={juego.id}
                juego={juego}
                isAddCard={juego.isAddCard}
                onAddClick={() => navigate('/subir-juego')}
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
                Apodo
                <input
                  type="text"
                  value={formulario.apodo}
                  onChange={(event) => setFormulario((prev) => ({ ...prev, apodo: event.target.value }))}
                  required
                />
              </label>
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
                  type="text"
                  value={formulario.fechaNacimiento}
                  onChange={(event) => setFormulario((prev) => ({ ...prev, fechaNacimiento: event.target.value }))}
                  required
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
              <label>
                Contraseña
                <input
                  type="password"
                  value={formulario.contrasena}
                  onChange={(event) => setFormulario((prev) => ({ ...prev, contrasena: event.target.value }))}
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

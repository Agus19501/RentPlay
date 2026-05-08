import { useEffect, useState } from 'react';
import { Link, Navigate, Route, Routes, useLocation, useNavigate, useParams } from 'react-router-dom';
import { apiRequest, clearSession, getSession, saveSession } from './api.js';
import Header from './components/Header.jsx';
import Footer from './components/Footer.jsx';
import Home from './pages/Home.jsx';
import Filtros from './pages/Filtros.jsx';
import Resultados from './pages/Resultados.jsx';
import Comparativa from './pages/Comparativa.jsx';
import Mensajes from './pages/Mensajes.jsx';
import Perfil from './pages/Perfil.jsx';
import PerfilPropio from './pages/PerfilPropio.jsx';
import PerfilOtro from './pages/PerfilOtro.jsx';
import Chats from './pages/Chats.jsx';

// Integración: componentes desde MAIN_Iker (se preservan estilos originales)
import Ajustes from './integrations/MAIN_Iker/react-components/Ajustes.jsx';
import MiAlquiler from './integrations/MAIN_Iker/react-components/MiAlquiler.jsx';
import SubirJuego from './integrations/MAIN_Iker/react-components/SubirJuego.jsx';
import VerJuego from './integrations/MAIN_Iker/react-components/VerJuego.jsx';

const authCopy = {
  login: {
    eyebrow: 'INICIAR SESIÓN',
    helperPrefix: '¿No tienes una cuenta aún?',
    helperLink: 'Registrate',
    title: '¡Bienvenido de nuevo!',
    lines: ['¿Listo para', 'darle al', '?']
  },
  register: {
    eyebrow: 'CREAR UNA CUENTA',
    helperPrefix: '¿Ya tienes una cuenta?',
    helperLink: 'Accede',
    title: '¡Bienvenido a RentPlay!',
    lines: ['¿Listo para', 'darle al', '?']
  }
};

function formatPrice(value) {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR'
  }).format(value);
}

function App() {
  const [session, setSession] = useState(getSession());
  const [lang, setLang] = useState('ES');
  const location = useLocation();
  const isAuthRoute = location.pathname === '/login' || location.pathname === '/register';

  useEffect(() => {
    const onStorage = () => setSession(getSession());
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const updateSession = (nextSession) => {
    if (nextSession) {
      saveSession(nextSession);
    } else {
      clearSession();
    }
    setSession(nextSession);
  };

  return (
    <div className="app-shell">
      {!isAuthRoute && <Header lang={lang} setLang={setLang} session={session} onLogout={() => updateSession(null)} />}
      <main className={isAuthRoute ? 'app-main auth-route-main' : 'app-main'}>
        <Routes>
          <Route path="/" element={<Navigate to="/home" replace />} />
          <Route path="/home" element={<Home lang={lang} />} />
          <Route path="/filtros" element={<Filtros lang={lang} />} />
          <Route path="/resultados" element={<Resultados lang={lang} />} />
          <Route path="/comparativa" element={<Comparativa lang={lang} />} />
          {/* Rutas integradas desde MAIN_Iker (diseño preservado) */}
          <Route path="/ajustes" element={<Ajustes lang={lang} setLang={setLang} />} />
          <Route path="/perfil" element={<PerfilPropio session={session} lang={lang} />} />
          <Route path="/perfil_propio" element={<PerfilPropio session={session} lang={lang} />} />
          <Route path="/perfil-propio" element={<PerfilPropio session={session} lang={lang} />} />
          <Route path="/perfil_otro" element={<PerfilOtro lang={lang} />} />
          <Route path="/perfil-otro" element={<PerfilOtro lang={lang} />} />
          <Route path="/mi-alquiler" element={<MiAlquiler lang={lang} />} />
          <Route path="/subir-juego" element={<SubirJuego lang={lang} />} />
          <Route path="/ver-juego/:gameId" element={<VerJuego lang={lang} />} />
          <Route path="/ver-juego" element={<VerJuego lang={lang} />} />
          <Route path="/mensajes" element={<Chats lang={lang} />} />
          <Route path="/chats" element={<Chats lang={lang} />} />
          <Route path="/login" element={<AuthPage mode="login" onAuth={updateSession} session={session} lang={lang} />} />
          <Route path="/register" element={<AuthPage mode="register" onAuth={updateSession} session={session} lang={lang} />} />
          <Route path="/games/:gameId" element={<GameDetailPage session={session} onAuth={updateSession} />} />
          <Route path="/rentals" element={<RentalsPage session={session} />} />
          <Route path="*" element={<Navigate to="/home" replace />} />
        </Routes>
      </main>
      {!isAuthRoute && <Footer lang={lang} />}
    </div>
  );
}

function AuthPage({ mode, onAuth, session, lang }) {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', name: '', password: '', passwordRepeat: '', acceptTerms: false });
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const copy = authCopy[mode] || authCopy.login;

  if (session) {
    return <Navigate to="/" replace />;
  }

  const submit = async (event) => {
    event.preventDefault();
    setBusy(true);
    setMessage('');

    if (mode === 'register') {
      if (form.password !== form.passwordRepeat) {
        setMessage('Las contrasenas no coinciden.');
        setBusy(false);
        return;
      }

      if (!form.acceptTerms) {
        setMessage('Debes aceptar los terminos del servicio.');
        setBusy(false);
        return;
      }
    }

    try {
      const payload = mode === 'register'
        ? { email: form.email, name: form.name, password: form.password }
        : { email: form.email, password: form.password };
      const result = await apiRequest(`/api/auth/${mode}`, {
        method: 'POST',
        body: payload
      });

      onAuth(result.session);
      navigate('/', { replace: true });
    } catch (error) {
      setMessage(error.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth-page">
      <Header session={null} lang={lang} onLanguageChange={() => {}} setLang={() => {}} onLogout={() => {}} />
      <main className="auth-main">
        <section className="auth-layout">
          <article className="auth-card">
            <h1 className="auth-eyebrow">{mode === 'register' ? 'CREAR UNA CUENTA' : 'INICIAR SESIÓN'}</h1>
            <p className="auth-switch">
              {copy.helperPrefix}{' '}
              <Link to={mode === 'register' ? '/login' : '/register'} className="auth-link">
                {copy.helperLink}
              </Link>
            </p>

            <form className="auth-form" onSubmit={submit} noValidate>
              <div className="auth-field">
                <label className="sr-only" htmlFor={`${mode}-email`}>Correo Electrónico</label>
                <input
                  id={`${mode}-email`}
                  className="auth-input"
                  type="email"
                  value={form.email}
                  onChange={(event) => setForm({ ...form, email: event.target.value })}
                  placeholder="Correo Electrónico"
                  autoComplete="email"
                  required
                />
              </div>

              {mode === 'register' && (
                <div className="auth-field">
                  <label className="sr-only" htmlFor={`${mode}-name`}>Nombre</label>
                  <input
                    id={`${mode}-name`}
                    className="auth-input"
                    type="text"
                    value={form.name}
                    onChange={(event) => setForm({ ...form, name: event.target.value })}
                    placeholder="Nombre"
                    autoComplete="name"
                    required
                  />
                </div>
              )}

              <div className="auth-field">
                <label className="sr-only" htmlFor={`${mode}-password`}>Contraseña</label>
                <input
                  id={`${mode}-password`}
                  className="auth-input"
                  type="password"
                  value={form.password}
                  onChange={(event) => setForm({ ...form, password: event.target.value })}
                  placeholder="Contraseña"
                  autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
                  required
                />
              </div>

              {mode === 'register' && (
                <>
                  <div className="auth-field">
                    <label className="sr-only" htmlFor={`${mode}-password-repeat`}>Repetir contraseña</label>
                    <input
                      id={`${mode}-password-repeat`}
                      className="auth-input"
                      type="password"
                      value={form.passwordRepeat}
                      onChange={(event) => setForm({ ...form, passwordRepeat: event.target.value })}
                      placeholder="Repetir Contraseña"
                      autoComplete="new-password"
                      required
                    />
                  </div>

                  <div className="terms-row">
                    <input type="checkbox" checked={form.acceptTerms} onChange={(event) => setForm({ ...form, acceptTerms: event.target.checked })} />
                    <span>Acepto los <a href="#" className="auth-link">términos</a> del servicio</span>
                  </div>
                </>
              )}

              {mode === 'login' && <a href="#" className="forgot-link">¿Has olvidado tu contraseña?</a>}

              <button className="auth-submit" type="submit" disabled={busy}>
                {busy ? 'Procesando...' : mode === 'register' ? 'Crear' : 'Iniciar Sesión'}
              </button>
            </form>

            {message && <p className="feedback">{message}</p>}
          </article>

          <aside className="auth-hero" aria-label="Mensaje de bienvenida">
            <h2 className="auth-hero-title">{copy.title}</h2>
            <p className="auth-hero-line">
              ¿Listo para darle al
              <span className="auth-play">
                <svg viewBox="0 0 24 24" width="0.5em" height="0.5em" fill="currentColor">
                  <path d="M8 5v14l11-7z"/>
                </svg>
              </span>
              ?
            </p>
          </aside>
        </section>
      </main>
    </div>
  );
}

function GameDetailPage({ session }) {
  const { gameId } = useParams();
  const navigate = useNavigate();
  const [game, setGame] = useState(null);
  const [status, setStatus] = useState('loading');
  const [paymentMethod, setPaymentMethod] = useState('paypal');
  const [message, setMessage] = useState('');

  useEffect(() => {
    let active = true;
    setStatus('loading');
    apiRequest(`/api/games/${gameId}`)
      .then((data) => {
        if (active) {
          setGame(data.game || null);
          setStatus('ready');
        }
      })
      .catch(() => {
        if (active) {
          setGame(null);
          setStatus('error');
        }
      });

    return () => {
      active = false;
    };
  }, [gameId]);

  const rentGame = async () => {
    if (!session) {
      navigate('/login');
      return;
    }

    try {
      const result = await apiRequest('/api/rentals', {
        method: 'POST',
        token: session.token,
        body: { gameId, paymentMethod }
      });
      setMessage(result.message || 'Alquiler creado');
      navigate('/perfil', { replace: true });
    } catch (error) {
      setMessage(error.message);
    }
  };

  if (status === 'loading') {
    return (
      <div className="container page-stack">
        <p className="muted">Cargando detalle...</p>
      </div>
    );
  }

  if (status === 'error' || !game) {
    return (
      <div className="container page-stack">
        <section className="card empty-state">
          <h1>Juego no encontrado</h1>
          <p>No se pudo cargar el videojuego solicitado.</p>
          <Link className="button button-primary" to="/">Volver al catalogo</Link>
        </section>
      </div>
    );
  }

  return (
    <div className="container page-stack">
      <section className="detail-layout">
        <article className="card detail-card">
          <div className="game-art detail-art">{game.platform || 'Game'}</div>
          <h1>{game.title}</h1>
          <p>{game.description}</p>
          <dl className="detail-list">
            <div><dt>Precio</dt><dd>{formatPrice(game.price)}</dd></div>
            <div><dt>Duracion</dt><dd>{game.rentalDays} dias</dd></div>
            <div><dt>Valoracion</dt><dd>{game.rating}</dd></div>
            <div><dt>Propietario</dt><dd>{game.seller?.name || 'RentPlay'}</dd></div>
          </dl>
          <div className="payment-row">
            <label>
              Metodo de pago
              <select value={paymentMethod} onChange={(event) => setPaymentMethod(event.target.value)}>
                <option value="paypal">PayPal</option>
                <option value="credit-card">Tarjeta de credito</option>
                <option value="applepay">Apple Pay</option>
              </select>
            </label>
            <button className="button button-primary" onClick={rentGame}>Alquilar</button>
          </div>
          {message && <p className="feedback">{message}</p>}
        </article>
        <aside className="card detail-side">
          <h2>Resumen rapido</h2>
          <p>{game.features?.join(' | ')}</p>
          <p>Si no has iniciado sesion, te redirigimos al login antes de alquilar.</p>
        </aside>
      </section>
    </div>
  );
}

function RentalsPage({ session }) {
  const [rentals, setRentals] = useState([]);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!session) {
      setMessage('Inicia sesion para ver tus alquileres.');
      return;
    }

    apiRequest('/api/rentals/mine', { token: session.token })
      .then((data) => {
        setRentals(data.rentals || []);
      })
      .catch((error) => {
        setMessage(error.message);
      });
  }, [session]);

  if (!session) {
    return (
      <div className="container page-stack">
        <section className="card empty-state">
          <h1>Mis alquileres</h1>
          <p>{message}</p>
          <Link className="button button-primary" to="/login">Ir al login</Link>
        </section>
      </div>
    );
  }

  return (
    <div className="container page-stack">
      <section className="section-block">
        <div className="section-heading">
          <h1>Mis alquileres</h1>
          <span>{rentals.length} activos</span>
        </div>
        {message && <p className="muted">{message}</p>}
        <div className="rentals-grid">
          {rentals.map((rental) => (
            <article className="card rental-card" key={rental.id}>
              <h2>{rental.game?.title || 'Juego'}</h2>
              <p>{rental.game?.description}</p>
              <div className="card-meta">
                <span className="pill">{rental.status}</span>
                <span>{formatPrice(rental.game?.price || 0)}</span>
              </div>
              <p>Fin: {new Date(rental.expiresAt).toLocaleDateString('es-ES')}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

export default App;
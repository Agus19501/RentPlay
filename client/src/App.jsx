import { useEffect, useRef, useState } from 'react';
import { Link, Navigate, Route, Routes, useLocation, useNavigate, useParams } from 'react-router-dom';
import { FaPlay } from 'react-icons/fa';
import { apiRequest, clearSession, getSession, saveSession } from './api.js';
import Header from './components/Header.jsx';
import Footer from './components/Footer.jsx';
import ToastHost from './components/ToastHost.jsx';
import Home from './pages/Home.jsx';
import Filtros from './pages/Filtros.jsx';
import Resultados from './pages/Resultados.jsx';
import Comparativa from './pages/Comparativa.jsx';
import Mensajes from './pages/Mensajes.jsx';
import PerfilPropio from './pages/PerfilPropio.jsx';
import PerfilOtro from './pages/PerfilOtro.jsx';
import Chats from './pages/Chats.jsx';
import Terminos from './pages/Terminos.jsx';

// Integración: componentes desde MAIN_Iker (se preservan estilos originales)
import Ajustes from './integrations/MAIN_Iker/react-components/Ajustes.jsx';
import MiAlquiler from './integrations/MAIN_Iker/react-components/MiAlquiler.jsx';
import SubirJuego from './integrations/MAIN_Iker/react-components/SubirJuego.jsx';
import VerJuego from './integrations/MAIN_Iker/react-components/VerJuego.jsx';

const authCopy = {
  ES: {
    login: {
      eyebrow: 'INICIAR SESIÓN',
      helperPrefix: '¿No tienes una cuenta aún?',
      helperLink: 'Regístrate',
      heroTitleTop: 'Bienvenido',
      heroTitleBottom: 'de nuevo',
      emailLabel: 'Correo Electrónico',
      emailPlaceholder: 'Correo Electrónico',
      nameLabel: 'Nombre de usuario',
      namePlaceholder: 'Nombre de usuario',
      passwordLabel: 'Contraseña',
      passwordPlaceholder: 'Contraseña',
      repeatPasswordLabel: 'Repetir contraseña',
      repeatPasswordPlaceholder: 'Repetir Contraseña',
      termsPrefix: 'Acepto los',
      termsLink: 'términos',
      termsSuffix: 'del servicio',
      forgotPassword: '¿Has olvidado tu contraseña?',
      processing: 'Procesando...',
      submitRegister: 'Crear',
      submitLogin: 'Iniciar Sesión',
      mismatch: 'Las contraseñas no coinciden.',
      mustAccept: 'Debes aceptar los términos del servicio.',
      heroAria: 'Mensaje de bienvenida',
      heroLine: '¿Listo para darle al'
    },
    register: {
      eyebrow: 'CREAR UNA CUENTA',
      helperPrefix: '¿Ya tienes una cuenta?',
      helperLink: 'Accede',
      heroTitleTop: 'Bienvenido',
      heroTitleBottom: 'de nuevo'
    }
  },
  EN: {
    login: {
      eyebrow: 'LOG IN',
      helperPrefix: "Don't have an account yet?",
      helperLink: 'Sign up',
      heroTitleTop: 'Welcome',
      heroTitleBottom: 'back',
      emailLabel: 'Email',
      emailPlaceholder: 'Email',
      nameLabel: 'Username',
      namePlaceholder: 'Username',
      passwordLabel: 'Password',
      passwordPlaceholder: 'Password',
      repeatPasswordLabel: 'Repeat password',
      repeatPasswordPlaceholder: 'Repeat Password',
      termsPrefix: 'I accept the',
      termsLink: 'terms',
      termsSuffix: 'of service',
      forgotPassword: 'Forgot your password?',
      processing: 'Processing...',
      submitRegister: 'Create account',
      submitLogin: 'Log in',
      mismatch: 'Passwords do not match.',
      mustAccept: 'You must accept the terms of service.',
      heroAria: 'Welcome message',
      heroLine: 'Ready to press'
    },
    register: {
      eyebrow: 'CREATE ACCOUNT',
      helperPrefix: 'Already have an account?',
      helperLink: 'Log in',
      heroTitleTop: 'Welcome',
      heroTitleBottom: 'back'
    }
  }
};

const detailCopy = {
  ES: {
    loading: 'Cargando detalle...',
    notFoundTitle: 'Juego no encontrado',
    notFoundText: 'No se pudo cargar el videojuego solicitado.',
    backToCatalog: 'Volver al catálogo',
    gameFallback: 'Juego',
    price: 'Precio',
    duration: 'Duración',
    days: 'días',
    rating: 'Valoración',
    owner: 'Propietario',
    ownerFallback: 'RentPlay',
    paymentMethod: 'Método de pago',
    rent: 'Alquilar',
    quickSummary: 'Resumen rápido',
    noSessionHint: 'Si no has iniciado sesión, te redirigimos al login antes de alquilar.',
    createdRental: 'Alquiler creado'
  },
  EN: {
    loading: 'Loading details...',
    notFoundTitle: 'Game not found',
    notFoundText: 'The requested game could not be loaded.',
    backToCatalog: 'Back to catalog',
    gameFallback: 'Game',
    price: 'Price',
    duration: 'Duration',
    days: 'days',
    rating: 'Rating',
    owner: 'Owner',
    ownerFallback: 'RentPlay',
    paymentMethod: 'Payment method',
    rent: 'Rent',
    quickSummary: 'Quick summary',
    noSessionHint: 'If you are not logged in, we will redirect you to login before renting.',
    createdRental: 'Rental created'
  }
};

const rentalsCopy = {
  ES: {
    loginToView: 'Inicia sesión para ver tus alquileres.',
    title: 'Mis alquileres',
    goLogin: 'Ir al login',
    active: 'activos',
    gameFallback: 'Juego',
    end: 'Fin:'
  },
  EN: {
    loginToView: 'Log in to view your rentals.',
    title: 'My rentals',
    goLogin: 'Go to login',
    active: 'active',
    gameFallback: 'Game',
    end: 'Ends:'
  }
};

function formatPrice(value) {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR'
  }).format(value);
}

function getInitialTheme() {
  const stored = localStorage.getItem('rentplay_theme');
  if (stored === 'light' || stored === 'dark') return stored;
  if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) return 'light';
  return 'dark';
}

const FONT_SCALES = {
  small: '90%',
  normal: '100%',
  large: '115%'
};

function applyGlobalFontScale(size) {
  const scale = FONT_SCALES[size] || FONT_SCALES.normal;
  // Keep root font size stable and scale UI globally for pages that rely on px sizes.
  document.documentElement.style.fontSize = '100%';
  document.body.style.zoom = scale;
}

function App() {
  const [session, setSession] = useState(getSession());
  const [lang, setLang] = useState('ES');
  const [theme, setTheme] = useState(getInitialTheme());
  const previousUserIdRef = useRef(localStorage.getItem('rentplay_last_user_id'));
  const location = useLocation();
  const isAuthRoute = location.pathname === '/login' || location.pathname === '/register';

  const currentUserId = session?.user?.id || session?.userId || session?.sub || null;

  useEffect(() => {
    document.body.setAttribute('data-theme', theme);
    localStorage.setItem('rentplay_theme', theme);
  }, [theme]);

  useEffect(() => {
    const savedFontSize = localStorage.getItem('rentplay_fontsize') || 'normal';
    applyGlobalFontScale(savedFontSize);
  }, []);

  useEffect(() => {
    const onStorage = () => setSession(getSession());
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  useEffect(() => {
    const previousUserId = previousUserIdRef.current;

    if (previousUserId && currentUserId && previousUserId !== currentUserId) {
      setTheme('dark');
      localStorage.setItem('rentplay_theme', 'dark');
      localStorage.setItem('rentplay_fontsize', 'normal');
      applyGlobalFontScale('normal');
    }

    previousUserIdRef.current = currentUserId;
  }, [currentUserId]);

  const updateSession = (nextSession) => {
    const nextUserId = nextSession?.user?.id || nextSession?.userId || nextSession?.sub || null;
    const lastUserId = localStorage.getItem('rentplay_last_user_id');

    if (nextUserId && lastUserId && nextUserId !== lastUserId) {
      setTheme('dark');
      localStorage.setItem('rentplay_theme', 'dark');
      localStorage.setItem('rentplay_fontsize', 'normal');
      applyGlobalFontScale('normal');
    }

    if (nextSession) {
      saveSession(nextSession);
      if (nextUserId) {
        localStorage.setItem('rentplay_last_user_id', nextUserId);
      }
    } else {
      clearSession();
    }
    setSession(nextSession);
  };

  // Permite cambiar el tema desde cualquier sitio
  const toggleTheme = () => setTheme(theme === 'light' ? 'dark' : 'light');

  return (
    <div className="app-shell" data-theme={theme}>
      {!isAuthRoute && <Header lang={lang} setLang={setLang} session={session} onLogout={() => updateSession(null)} theme={theme} setTheme={setTheme} toggleTheme={toggleTheme} />}
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
          <Route path="/terminos" element={<Terminos lang={lang} />} />
          <Route path="/terms" element={<Terminos lang={lang} />} />
          <Route path="/mi-alquiler" element={<MiAlquiler lang={lang} />} />
          <Route path="/subir-juego" element={<SubirJuego lang={lang} />} />
          <Route path="/ver-juego/:gameId" element={<VerJuego lang={lang} />} />
          <Route path="/ver-juego" element={<VerJuego lang={lang} />} />
          <Route path="/mensajes" element={<Chats lang={lang} />} />
          <Route path="/chats" element={<Chats lang={lang} />} />
          <Route path="/login" element={<AuthPage mode="login" onAuth={updateSession} session={session} lang={lang} setLang={setLang} />} />
          <Route path="/register" element={<AuthPage mode="register" onAuth={updateSession} session={session} lang={lang} setLang={setLang} />} />
          <Route path="/games/:gameId" element={<GameDetailPage session={session} lang={lang} onAuth={updateSession} />} />
          <Route path="/rentals" element={<RentalsPage session={session} lang={lang} />} />
          <Route path="*" element={<Navigate to="/home" replace />} />
        </Routes>
      </main>
      <ToastHost />
      {!isAuthRoute && <Footer lang={lang} />}
    </div>
  );
}

function AuthPage({ mode, onAuth, session, lang, setLang }) {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', name: '', password: '', passwordRepeat: '', acceptTerms: false });
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const langPack = authCopy[lang] || authCopy.ES;
  const baseCopy = langPack.login;
  const modeCopy = langPack[mode] || langPack.login;
  const copy = { ...baseCopy, ...modeCopy };

  if (session) {
    return <Navigate to="/" replace />;
  }

  const submit = async (event) => {
    event.preventDefault();
    setBusy(true);
    setMessage('');

    if (mode === 'register') {
      if (form.password !== form.passwordRepeat) {
        setMessage(copy.mismatch);
        setBusy(false);
        return;
      }

      if (!form.acceptTerms) {
        setMessage(copy.mustAccept);
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
      <Header session={null} lang={lang} setLang={setLang} onLogout={() => {}} />
      <main className="auth-main">
        <section className="auth-layout">
          <article className="auth-card">
            <h1 className="auth-eyebrow">{copy.eyebrow}</h1>
            <p className="auth-switch">
              {copy.helperPrefix}{' '}
              <Link to={mode === 'register' ? '/login' : '/register'} className="auth-link">
                {copy.helperLink}
              </Link>
            </p>

            <form className="auth-form" onSubmit={submit} noValidate>
              <div className="auth-field">
                <label className="sr-only" htmlFor={`${mode}-email`}>{copy.emailLabel}</label>
                <input
                  id={`${mode}-email`}
                  className="auth-input"
                  type="email"
                  value={form.email}
                  onChange={(event) => setForm({ ...form, email: event.target.value })}
                  placeholder={copy.emailPlaceholder}
                  autoComplete="email"
                  required
                />
              </div>

              {mode === 'register' && (
                <div className="auth-field">
                  <label className="sr-only" htmlFor={`${mode}-name`}>{copy.nameLabel}</label>
                  <input
                    id={`${mode}-name`}
                    className="auth-input"
                    type="text"
                    value={form.name}
                    onChange={(event) => setForm({ ...form, name: event.target.value })}
                    placeholder={copy.namePlaceholder}
                    autoComplete="name"
                    required
                  />
                </div>
              )}

              <div className="auth-field">
                <label className="sr-only" htmlFor={`${mode}-password`}>{copy.passwordLabel}</label>
                <input
                  id={`${mode}-password`}
                  className="auth-input"
                  type="password"
                  value={form.password}
                  onChange={(event) => setForm({ ...form, password: event.target.value })}
                  placeholder={copy.passwordPlaceholder}
                  autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
                  required
                />
              </div>

              {mode === 'register' && (
                <>
                  <div className="auth-field">
                    <label className="sr-only" htmlFor={`${mode}-password-repeat`}>{copy.repeatPasswordLabel}</label>
                    <input
                      id={`${mode}-password-repeat`}
                      className="auth-input"
                      type="password"
                      value={form.passwordRepeat}
                      onChange={(event) => setForm({ ...form, passwordRepeat: event.target.value })}
                      placeholder={copy.repeatPasswordPlaceholder}
                      autoComplete="new-password"
                      required
                    />
                  </div>

                  <div className="terms-row">
                    <input type="checkbox" checked={form.acceptTerms} onChange={(event) => setForm({ ...form, acceptTerms: event.target.checked })} />
                    <span>{copy.termsPrefix} <Link to="/terminos" className="auth-link">{copy.termsLink}</Link> {copy.termsSuffix}</span>
                  </div>
                </>
              )}

              {mode === 'login' && <a href="#" className="forgot-link">{copy.forgotPassword}</a>}

              <button className="auth-submit" type="submit" disabled={busy}>
                {busy ? copy.processing : mode === 'register' ? copy.submitRegister : copy.submitLogin}
              </button>
            </form>

            {message && <p className="feedback">{message}</p>}
          </article>

          <aside className="auth-hero" aria-label={copy.heroAria}>
            <h2 className="auth-hero-title">
              <span className="auth-hero-title-line">{copy.heroTitleTop}</span>
              <span className="auth-hero-title-line auth-hero-title-line-nowrap">{copy.heroTitleBottom}</span>
            </h2>
            <p className="auth-hero-line">
              {copy.heroLine}
              <span className="auth-play">
                <FaPlay className="play-svg" />
              </span>
              ?
            </p>
          </aside>
        </section>
      </main>
    </div>
  );
}

function GameDetailPage({ session, lang }) {
  const { gameId } = useParams();
  const navigate = useNavigate();
  const t = detailCopy[lang] || detailCopy.ES;
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
      setMessage(result.message || t.createdRental);
      navigate('/perfil', { replace: true });
    } catch (error) {
      setMessage(error.message);
    }
  };

  if (status === 'loading') {
    return (
      <div className="container page-stack">
        <p className="muted">{t.loading}</p>
      </div>
    );
  }

  if (status === 'error' || !game) {
    return (
      <div className="container page-stack">
        <section className="card empty-state">
          <h1>{t.notFoundTitle}</h1>
          <p>{t.notFoundText}</p>
          <Link className="button button-primary" to="/">{t.backToCatalog}</Link>
        </section>
      </div>
    );
  }

  return (
    <div className="container page-stack">
      <section className="detail-layout">
        <article className="card detail-card">
          <div className="game-art detail-art">{game.platform || t.gameFallback}</div>
          <h1>{game.title}</h1>
          <p>{game.description}</p>
          <dl className="detail-list">
            <div><dt>{t.price}</dt><dd>{formatPrice(game.price)}</dd></div>
            <div><dt>{t.duration}</dt><dd>{game.rentalDays} {t.days}</dd></div>
            <div><dt>{t.rating}</dt><dd>{game.rating}</dd></div>
            <div><dt>{t.owner}</dt><dd>{game.seller?.name || t.ownerFallback}</dd></div>
          </dl>
          <div className="payment-row">
            <label>
              {t.paymentMethod}
              <select value={paymentMethod} onChange={(event) => setPaymentMethod(event.target.value)}>
                <option value="paypal">PayPal</option>
                <option value="credit-card">Tarjeta de credito</option>
                <option value="applepay">Apple Pay</option>
              </select>
            </label>
            <button className="button button-primary" onClick={rentGame}>{t.rent}</button>
          </div>
          {message && <p className="feedback">{message}</p>}
        </article>
        <aside className="card detail-side">
          <h2>{t.quickSummary}</h2>
          <p>{game.features?.join(' | ')}</p>
          <p>{t.noSessionHint}</p>
        </aside>
      </section>
    </div>
  );
}

function RentalsPage({ session, lang }) {
  const t = rentalsCopy[lang] || rentalsCopy.ES;
  const [rentals, setRentals] = useState([]);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!session) {
      setMessage(t.loginToView);
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
          <h1>{t.title}</h1>
          <p>{message}</p>
          <Link className="button button-primary" to="/login">{t.goLogin}</Link>
        </section>
      </div>
    );
  }

  return (
    <div className="container page-stack">
      <section className="section-block">
        <div className="section-heading">
          <h1>{t.title}</h1>
          <span>{rentals.length} {t.active}</span>
        </div>
        {message && <p className="muted">{message}</p>}
        <div className="rentals-grid">
          {rentals.map((rental) => (
            <article className="card rental-card" key={rental.id}>
              <h2>{rental.game?.title || t.gameFallback}</h2>
              <p>{rental.game?.description}</p>
              <div className="card-meta">
                <span className="pill">{rental.status}</span>
                <span>{formatPrice(rental.game?.price || 0)}</span>
              </div>
              <p>{t.end} {new Date(rental.expiresAt).toLocaleDateString(lang === 'EN' ? 'en-US' : 'es-ES')}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

export default App;
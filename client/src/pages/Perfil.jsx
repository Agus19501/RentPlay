import { useEffect, useState } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { FaEnvelope, FaGamepad, FaHome, FaPaperPlane, FaUserCircle } from 'react-icons/fa';
import { apiRequest } from '../api.js';
import './Perfil.css';

export default function Perfil({ session, lang = 'ES' }) {
  const [profile, setProfile] = useState(null);
  const [rentals, setRentals] = useState([]);
  const [message, setMessage] = useState('');

  const texts = {
    ES: {
      myProfile: 'Mi perfil',
      user: 'Usuario',
      notAvailable: 'No disponible',
      messages: 'Mensajes',
      summary: 'Resumen',
      recentActivity: 'Actividad reciente',
      rentals: 'alquileres',
      activeAccount: 'cuenta activa',
      links: 'Enlaces',
      quickAccess: 'Accesos rápidos',
      backHome: 'Volver al inicio',
      openMessages: 'Abrir mensajes',
      viewRentals: 'Ver alquileres',
      latestRentals: 'Últimos alquileres',
      game: 'Juego',
      noPrice: 'Precio no disponible'
    },
    EN: {
      myProfile: 'My profile',
      user: 'User',
      notAvailable: 'Not available',
      messages: 'Messages',
      summary: 'Summary',
      recentActivity: 'Recent activity',
      rentals: 'rentals',
      activeAccount: 'active account',
      links: 'Links',
      quickAccess: 'Quick access',
      backHome: 'Back home',
      openMessages: 'Open messages',
      viewRentals: 'View rentals',
      latestRentals: 'Latest rentals',
      game: 'Game',
      noPrice: 'Price unavailable'
    }
  };
  const t = texts[lang] || texts.ES;

  useEffect(() => {
    if (!session?.token) {
      return;
    }

    const loadProfile = async () => {
      try {
        const meResponse = await apiRequest('/api/auth/me', { token: session.token });
        setProfile(meResponse.user || null);

        // Cargar alquileres sin bloquear la vista principal de perfil
        apiRequest('/api/rentals/mine', { token: session.token })
          .then((rentalsResponse) => {
            setRentals(rentalsResponse.rentals || []);
          })
          .catch(() => {
            setRentals([]);
          });
      } catch (error) {
        setMessage(error.message);
      }
    };

    loadProfile();
  }, [session]);

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="container profile-page">
      <section className="profile-hero card">
        <div className="profile-avatar"><FaUserCircle /></div>
        <div className="profile-copy">
          <p className="profile-eyebrow">{t.myProfile}</p>
          <h1>{profile?.name || session.user?.name || t.user}</h1>
          <p>{profile?.email || session.user?.email || t.notAvailable}</p>
        </div>
        <Link className="profile-link" to="/mensajes"><FaPaperPlane /> {t.messages}</Link>
      </section>

      <section className="profile-grid">
        <article className="card profile-card">
          <p className="profile-eyebrow">{t.summary}</p>
          <h2>{t.recentActivity}</h2>
          <p></p>
          <div className="profile-metrics">
            <div>
              <FaGamepad />
              <strong>{rentals.length}</strong>
              <span>{t.rentals}</span>
            </div>
            <div>
              <FaEnvelope />
              <strong>{profile?.email ? 1 : 0}</strong>
              <span>{t.activeAccount}</span>
            </div>
          </div>
        </article>

        <article className="card profile-card">
          <p className="profile-eyebrow">{t.links}</p>
          <h2>{t.quickAccess}</h2>
          <div className="profile-actions">
            <Link to="/home"><FaHome /> {t.backHome}</Link>
            <Link to="/mensajes"><FaPaperPlane /> {t.openMessages}</Link>
            <Link to="/mi-alquiler"><FaGamepad /> {t.viewRentals}</Link>
          </div>
        </article>
      </section>

      {message && <p className="profile-feedback">{message}</p>}
      {rentals.length > 0 && (
        <section className="card profile-rentals">
          <p className="profile-eyebrow">{t.latestRentals}</p>
          <div className="profile-rental-list">
            {rentals.slice(0, 3).map((rental) => (
              <article key={rental.id} className="profile-rental-item">
                <strong>{rental.game?.title || t.game}</strong>
                <span>{rental.game?.price || t.noPrice}</span>
                <p>{rental.status}</p>
              </article>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
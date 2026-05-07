import { useEffect, useState } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { FaEnvelope, FaGamepad, FaHome, FaPaperPlane, FaUserCircle } from 'react-icons/fa';
import { apiRequest } from '../api.js';
import './Perfil.css';

export default function Perfil({ session }) {
  const [profile, setProfile] = useState(null);
  const [rentals, setRentals] = useState([]);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!session?.token) {
      return;
    }

    const loadProfile = async () => {
      try {
        const [meResponse, rentalsResponse] = await Promise.all([
          apiRequest('/api/auth/me', { token: session.token }),
          apiRequest('/api/rentals/mine', { token: session.token })
        ]);

        setProfile(meResponse.user || null);
        setRentals(rentalsResponse.rentals || []);
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
          <p className="profile-eyebrow">Mi perfil</p>
          <h1>{profile?.name || session.user?.name || 'Usuario'}</h1>
          <p>{profile?.email || session.user?.email || 'No disponible'}</p>
        </div>
        <Link className="profile-link" to="/mensajes"><FaPaperPlane /> Mensajes</Link>
      </section>

      <section className="profile-grid">
        <article className="card profile-card">
          <p className="profile-eyebrow">Resumen</p>
          <h2>Actividad reciente</h2>
          <p></p>
          <div className="profile-metrics">
            <div>
              <FaGamepad />
              <strong>{rentals.length}</strong>
              <span>alquileres</span>
            </div>
            <div>
              <FaEnvelope />
              <strong>{profile?.email ? 1 : 0}</strong>
              <span>cuenta activa</span>
            </div>
          </div>
        </article>

        <article className="card profile-card">
          <p className="profile-eyebrow">Enlaces</p>
          <h2>Accesos rápidos</h2>
          <div className="profile-actions">
            <Link to="/home"><FaHome /> Volver al inicio</Link>
            <Link to="/mensajes"><FaPaperPlane /> Abrir mensajes</Link>
            <Link to="/mi-alquiler"><FaGamepad /> Ver alquileres</Link>
          </div>
        </article>
      </section>

      {message && <p className="profile-feedback">{message}</p>}
      {rentals.length > 0 && (
        <section className="card profile-rentals">
          <p className="profile-eyebrow">Últimos alquileres</p>
          <div className="profile-rental-list">
            {rentals.slice(0, 3).map((rental) => (
              <article key={rental.id} className="profile-rental-item">
                <strong>{rental.game?.title || 'Juego'}</strong>
                <span>{rental.game?.price || 'Precio no disponible'}</span>
                <p>{rental.status}</p>
              </article>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
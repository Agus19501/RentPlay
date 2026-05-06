import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaPlay, FaSearch, FaPaperPlane, FaUserCircle, FaUser, FaSignOutAlt, FaCog } from 'react-icons/fa';

const Header = ({ lang, setLang, session, onLogout }) => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');

  const handleSearch = () => {
    const value = searchTerm.trim();
    if (value) {
      navigate('/resultados');
    }
  };

  const handleUserClick = () => {
    if (session) {
      navigate('/ajustes');
    } else {
      navigate('/login');
    }
  };

  return (
    <header className="header">
      <div className="header-container">
        <button className="logo" type="button" onClick={() => navigate('/home')} aria-label="Ir al inicio">
          <div className="logo-icon">
            <FaPlay />
          </div>
          <span className="logo-text">rent<span className="logo-highlight">play</span></span>
        </button>

        <div className="search-container">
          <input
            className="search-input"
            type="text"
            placeholder="Buscar videojuegos..."
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            onKeyDown={(event) => event.key === 'Enter' && handleSearch()}
          />
          <FaSearch className="search-icon" />
        </div>

        <div className="header-actions">
          <button className="btn-primary" type="button" onClick={() => navigate('/subir-juego')}>AÑADIR +</button>
          <button className="language-btn" type="button" onClick={() => setLang?.(lang === 'ES' ? 'EN' : 'ES')}>
            <span className="flag-icon" aria-hidden="true" style={{ display: 'inline-block', background: lang === 'ES' ? 'linear-gradient(180deg, #c60b1e 0 33.33%, #f1bf00 33.33% 66.66%, #c60b1e 66.66% 100%)' : 'linear-gradient(180deg, #012169 0 100%)' }} />
          </button>
          <button className="send-btn" type="button" onClick={() => navigate('/mi-alquiler')} aria-label="Mensajes o alquiler actual">
            <FaPaperPlane />
          </button>
          <button className="user-btn" type="button" onClick={handleUserClick} aria-label="Perfil">
            <FaUserCircle />
          </button>
          {session && (
            <button className="btn-primary" type="button" onClick={onLogout} title="Cerrar sesión">
              <FaSignOutAlt />
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;

import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FaSearch, FaPaperPlane, FaUserCircle, FaPlus, FaPlay, FaCog, FaSignOutAlt, FaUser } from 'react-icons/fa';
import './Header.css';

const Header = ({ lang, setLang, session, onLogout }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const menuRef = useRef(null);

  const isFiltersPage = location.pathname === '/filtros';
  const isManageFiltersPage = location.pathname === '/resultados' || location.pathname === '/comparativa';

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    setShowProfileMenu(false);
    onLogout && onLogout();
    navigate('/login');
  };

  const texts = {
    ES: {
      placeholder: 'Buscar juegos...', add: 'AÑADIR', langLabel: 'Idioma', chats: 'Chats',
      profile: 'Perfil', logout: 'Cerrar sesión', settings: 'Ajustes', myProfile: 'Mi Perfil',
      filters: 'BÚSQUEDA POR FILTROS', apply: 'APLICAR FILTROS', manage: 'GESTIONAR FILTROS',
      fShort: 'FILTROS', aShort: 'APLICAR', mShort: 'FILTROS'
    },
    EN: {
      placeholder: 'Search games...', add: 'ADD', langLabel: 'Language', chats: 'Chats',
      profile: 'Profile', logout: 'Logout', settings: 'Settings', myProfile: 'My Profile',
      filters: 'FILTER SEARCH', apply: 'APPLY FILTERS', manage: 'MANAGE FILTERS',
      fShort: 'FILTERS', aShort: 'APPLY', mShort: 'FILTERS'
    }
  };

  const current = texts[lang] || texts.ES;

  const getButtonText = () => {
    if (isFiltersPage) return { full: current.apply, short: current.aShort };
    if (isManageFiltersPage) return { full: current.manage, short: current.mShort };
    return { full: current.filters, short: current.fShort };
  };

  const btnText = getButtonText();

  return (
    <header className="main-header" role="banner">
      <div className="header-container">
        <div className="logo" onClick={() => navigate('/home')} role="button" aria-label="Ir a inicio">
          <div className="logo-icon"><FaPlay className="play-svg" /></div>
          <span className="logo-text">rent<span className="orange">play</span></span>
        </div>

        <div className="search-bar">
          <FaSearch className="search-icon" />
          <input
            type="text"
            placeholder={current.placeholder}
            onKeyDown={(e) => e.key === 'Enter' && navigate('/resultados')}
          />
          <button className="btn-filters" onClick={() => navigate(isFiltersPage ? '/resultados' : '/filtros')}>
            <span className="txt-full">{btnText.full}</span>
            <span className="txt-short">{btnText.short}</span>
          </button>
        </div>

        <nav className="header-actions">
          {session && (
            <button className="btn-add" onClick={() => navigate('/subir-juego')}>
              <span className="action-text">{current.add}</span> <FaPlus />
            </button>
          )}

          <button className="icon-btn action-item" onClick={() => setLang(lang === 'ES' ? 'EN' : 'ES')}>
            <span className="icon-wrapper">{lang === 'ES' ? '🇪🇸' : '🇬🇧'}</span>
            <span className="action-text">{current.langLabel}</span>
          </button>

          {session && (
            <button className="icon-btn action-item" onClick={() => navigate('/chats')}>
              <span className="icon-wrapper"><FaPaperPlane /></span>
              <span className="action-text">{current.chats}</span>
            </button>
          )}

          {session ? (
            <div className="profile-menu-container" ref={menuRef}>
              <button className="icon-btn action-item" onClick={() => setShowProfileMenu(!showProfileMenu)}>
                <span className="icon-wrapper"><FaUserCircle /></span>
                <span className="action-text">{session.user?.name || current.profile}</span>
              </button>

              {showProfileMenu && (
                <div className="profile-dropdown">
                  <div className="dropdown-item" onClick={() => navigate('/perfil_propio')}><FaUser /> {current.myProfile}</div>
                  <div className="dropdown-item" onClick={() => navigate('/ajustes')}><FaCog /> {current.settings}</div>
                  <div className="dropdown-divider"></div>
                  <div className="dropdown-item logout" onClick={handleLogout}><FaSignOutAlt /> {current.logout}</div>
                </div>
              )}
            </div>
          ) : (
            <button className="btn-add" onClick={() => navigate('/login')}>
              <span className="action-text">Iniciar Sesión</span>
            </button>
          )}
        </nav>
      </div>
    </header>
  );
};

export default Header;

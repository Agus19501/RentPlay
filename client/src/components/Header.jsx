import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { FaSearch, FaPaperPlane, FaUserCircle, FaPlus, FaPlay, FaCog, FaSignOutAlt, FaUser } from 'react-icons/fa';
import './Header.css';

const Header = ({ lang, setLang, session, onLogout }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
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

  const texts = {
    ES: {
      placeholder: 'Buscar juegos...',
      add: 'AÑADIR',
      langLabel: 'Idioma',
      chats: 'Chat',
      profile: 'Perfil',
      logout: 'Cerrar sesión',
      settings: 'Ajustes',
      myProfile: 'Mi perfil',
      filters: 'BÚSQUEDA POR FILTROS',
      apply: 'APLICAR FILTROS',
      manage: 'GESTIONAR FILTROS',
      fShort: 'FILTROS',
      aShort: 'APLICAR',
      mShort: 'GESTIONAR'
    },
    EN: {
      placeholder: 'Search games...',
      add: 'ADD',
      langLabel: 'Language',
      chats: 'Chat',
      profile: 'Profile',
      logout: 'Logout',
      settings: 'Settings',
      myProfile: 'My profile',
      filters: 'FILTER SEARCH',
      apply: 'APPLY FILTERS',
      manage: 'MANAGE FILTERS',
      fShort: 'FILTERS',
      aShort: 'APPLY',
      mShort: 'MANAGE'
    }
  };

  const current = texts[lang] || texts.ES;

  const handleLogout = () => {
    setShowProfileMenu(false);
    if (onLogout) {
      onLogout();
    }
    navigate('/login');
  };

  const getButtonText = () => {
    if (isFiltersPage) return { full: current.apply, short: current.aShort };
    if (isManageFiltersPage) return { full: current.manage, short: current.mShort };
    return { full: current.filters, short: current.fShort };
  };

  const btnText = getButtonText();

  return (
    <header className="main-header" role="banner">
      <div className="header-container">
        <button className="logo" onClick={() => navigate('/home')} type="button" aria-label="Ir a inicio">
          <div className="logo-icon"><FaPlay className="play-svg" /></div>
          <span className="logo-text">rent<span className="orange">play</span></span>
        </button>

        <div className="search-bar">
          <FaSearch className="search-icon" />
          <input
            type="text"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder={current.placeholder}
            onKeyDown={(event) => event.key === 'Enter' && navigate(`/resultados${searchTerm.trim() ? `?q=${encodeURIComponent(searchTerm.trim())}` : ''}`)}
          />
          <button className="btn-filters" onClick={() => navigate(isFiltersPage ? `/resultados${searchTerm.trim() ? `?q=${encodeURIComponent(searchTerm.trim())}` : ''}` : '/filtros')} type="button">
            <span className="txt-full">{btnText.full}</span>
            <span className="txt-short">{btnText.short}</span>
          </button>
        </div>

        <nav className="header-actions" aria-label="Navegación principal">
          <Link className="btn-add" to="/home">
            <span className="action-text">{current.add}</span> <FaPlus />
          </Link>

          <button className="icon-btn action-item" onClick={() => setLang(lang === 'ES' ? 'EN' : 'ES')} type="button">
            <span className="icon-wrapper">{lang === 'ES' ? '🇪🇸' : '🇬🇧'}</span>
            <span className="action-text">{current.langLabel}</span>
          </button>

          <button className="icon-btn action-item" onClick={() => navigate('/rentals')} type="button">
            <span className="icon-wrapper"><FaPaperPlane /></span>
            <span className="action-text">{current.chats}</span>
          </button>

          <div className="profile-menu-container" ref={menuRef}>
            <button className="icon-btn action-item" onClick={() => setShowProfileMenu(!showProfileMenu)} type="button">
              <span className="icon-wrapper"><FaUserCircle /></span>
              <span className="action-text">{current.profile}</span>
            </button>

            {showProfileMenu && (
              <div className="profile-dropdown">
                <button className="dropdown-item" onClick={() => navigate('/rentals')} type="button"><FaUser /> {current.myProfile}</button>
                <button className="dropdown-item" onClick={() => navigate('/filtros')} type="button"><FaCog /> {current.settings}</button>
                <div className="dropdown-divider" />
                {session ? (
                  <button className="dropdown-item logout" onClick={handleLogout} type="button"><FaSignOutAlt /> {current.logout}</button>
                ) : (
                  <>
                    <button className="dropdown-item logout" onClick={() => navigate('/login')} type="button"><FaSignOutAlt /> {current.logout}</button>
                  </>
                )}
              </div>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
};

export default Header;

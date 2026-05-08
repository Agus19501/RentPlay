import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom'; 
import { FaSearch, FaPaperPlane, FaUserCircle, FaPlus, FaPlay, FaCog, FaSignOutAlt, FaUser, FaSignInAlt, FaUserPlus } from 'react-icons/fa';
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
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const texts = {
    ES: { 
      placeholder: "Buscar juegos...", add: "AÑADIR", langLabel: "Idioma", chats: "Chats", 
      profile: "Perfil", logout: "Cerrar sesión", settings: "Ajustes", myProfile: "Mi Perfil",
      filters: "BÚSQUEDA POR FILTROS", apply: "APLICAR FILTROS", manage: "GESTIONAR FILTROS",
      fShort: "FILTROS", aShort: "APLICAR", mShort: "FILTROS",
      login: "Entrar", register: "Registro"
    },
    EN: { 
      placeholder: "Search games...", add: "ADD", langLabel: "Language", chats: "Chats", 
      profile: "Profile", logout: "Logout", settings: "Settings", myProfile: "My Profile",
      filters: "FILTER SEARCH", apply: "APPLY FILTERS", manage: "MANAGE FILTERS",
      fShort: "FILTERS", aShort: "APPLY", mShort: "FILTERS",
      login: "Login", register: "Sign Up"
    }
  };

  const current = texts[lang];
  const isLoggedIn = Boolean(session?.token);
  const [searchQuery, setSearchQuery] = useState("");

  const handleLogout = () => {
    setShowProfileMenu(false);
    onLogout?.();
    navigate('/login'); 
  };

  const handleSearch = (e) => {
    if (e.key === 'Enter') {
      const query = searchQuery.trim();
      if (!query) {
        navigate('/home');
      } else {
        navigate(`/resultados?search=${encodeURIComponent(query)}`);
      }
    }
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
        <div className="logo" onClick={() => navigate('/home')} role="button" aria-label="Ir a inicio">
          <div className="logo-icon"><FaPlay className="play-svg" /></div>
          <span className="logo-text">rent<span className="orange">play</span></span>
        </div>

        <div className="search-bar">
          <FaSearch className="search-icon" />
          <input 
            type="text" 
            placeholder={current.placeholder}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleSearch}
          />
          {!isManageFiltersPage && !isFiltersPage && (
            <button 
              className="btn-filters" 
              onClick={() => navigate(isFiltersPage ? '/resultados' : '/filtros')}
            >
              <span className="txt-full">{btnText.full}</span>
              <span className="txt-short">{btnText.short}</span>
            </button>
          )}
        </div>

        <nav className="header-actions">
          <button className="btn-add" onClick={() => navigate(isLoggedIn ? '/subir-juego' : '/login')}>
            <span className="action-text">{current.add}</span> <FaPlus />
          </button>

          <button className="icon-btn action-item" onClick={() => setLang(lang === 'ES' ? 'EN' : 'ES')}>
            <span className="icon-wrapper">{lang === 'ES' ? '🇪🇸' : '🇬🇧'}</span>
            <span className="action-text">{current.langLabel}</span>
          </button>

          <button className="icon-btn action-item" onClick={() => navigate(isLoggedIn ? '/mensajes' : '/login')}>
            <span className="icon-wrapper"><FaPaperPlane /></span>
            <span className="action-text">{current.chats}</span>
          </button>

          {isLoggedIn ? (
            <div className="profile-menu-container" ref={menuRef}>
              <button className="icon-btn action-item" onClick={() => setShowProfileMenu(!showProfileMenu)}>
                <span className="icon-wrapper"><FaUserCircle /></span>
                <span className="action-text">{current.profile}</span>
              </button>

              {showProfileMenu && (
                <div className="profile-dropdown">
                  <button type="button" className="dropdown-item" onClick={() => navigate('/perfil')}><FaUser /> {current.myProfile}</button>
                  <button type="button" className="dropdown-item" onClick={() => navigate('/ajustes')}><FaCog /> {current.settings}</button>
                  <div className="dropdown-divider"></div>
                  <button type="button" className="dropdown-item logout" onClick={handleLogout}><FaSignOutAlt /> {current.logout}</button>
                </div>
              )}
            </div>
          ) : (
            <div className="auth-actions">
              <button className="icon-btn action-item auth-action-btn" onClick={() => navigate('/login')}>
                <span className="icon-wrapper"><FaSignInAlt /></span>
                <span className="action-text">{current.login}</span>
              </button>
              <button className="icon-btn action-item auth-action-btn" onClick={() => navigate('/register')}>
                <span className="icon-wrapper"><FaUserPlus /></span>
                <span className="action-text">{current.register}</span>
              </button>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
};

export default Header;
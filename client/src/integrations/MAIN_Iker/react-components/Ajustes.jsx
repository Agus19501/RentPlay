import { useEffect, useState } from 'react';
import '../assets/css/ajustes.css';

const FONT_SCALES = {
  small: '80%',
  normal: '100%',
  large: '125%'
};

export default function Ajustes({ lang, setLang }) {
  const [theme, setTheme] = useState('dark');
  const [fontSize, setFontSize] = useState('normal');
  const [paymentMethod, setPaymentMethod] = useState('credit');
  const [settings, setSettings] = useState({
    filter18: false,
    alertGeneral: true,
    alertFav: false
  });

  const texts = {
    ES: {
      title: 'Ajustes',
      visualPrefs: 'PREFERENCIAS DE VISUALIZACIÓN',
      light: 'Claro',
      dark: 'Oscuro',
      fontSize: 'Tamaño de Fuente',
      small: 'Pequeño',
      normal: 'Normal',
      large: 'Grande',
      generalLang: 'IDIOMA GENERAL',
      langDesc: 'Cambia el idioma predeterminado de la plataforma',
      navExp: 'EXPERIENCIA DE NAVEGACIÓN',
      pegi18: 'Filtro contenido PEGI +18',
      alertsGen: 'Alertas de Ofertas Generales',
      alertsFav: 'Alertas Ofertas Contenido Favorito',
      payMethods: 'MÉTODOS DE PAGO',
      credit: 'Tarjeta Crédito'
    },
    EN: {
      title: 'Settings',
      visualPrefs: 'VISUAL PREFERENCES',
      light: 'Light',
      dark: 'Dark',
      fontSize: 'Font Size',
      small: 'Small',
      normal: 'Normal',
      large: 'Large',
      generalLang: 'GENERAL LANGUAGE',
      langDesc: 'Change the platform\'s default language',
      navExp: 'NAVIGATION EXPERIENCE',
      pegi18: 'PEGI +18 Content Filter',
      alertsGen: 'General Offer Alerts',
      alertsFav: 'Favorite Content Offer Alerts',
      payMethods: 'PAYMENT METHODS',
      credit: 'Credit Card'
    }
  };

  const t = texts[lang];

  useEffect(() => {
    const savedTheme = localStorage.getItem('rentplay_theme') || 'dark';
    const savedFontSize = localStorage.getItem('rentplay_fontsize') || 'normal';
    const savedPayment = localStorage.getItem('rentplay_payment') || 'credit';

    setTheme(savedTheme);
    setFontSize(savedFontSize);
    setPaymentMethod(savedPayment);
    document.documentElement.setAttribute('data-theme', savedTheme === 'light' ? 'light' : 'dark');
    document.documentElement.style.fontSize = FONT_SCALES[savedFontSize] || FONT_SCALES.normal;

    const storedSettings = {
      filter18: localStorage.getItem('rentplay_filter-18') === 'true',
      alertGeneral: localStorage.getItem('rentplay_alert-general') !== 'false',
      alertFav: localStorage.getItem('rentplay_alert-fav') === 'true'
    };
    setSettings(storedSettings);
  }, []);

  const saveSettingToDB = async (key, value) => {
    if (window.RentPlayApi && typeof window.RentPlayApi.updateSettings === 'function') {
      try {
        await window.RentPlayApi.updateSettings({ [key]: value });
      } catch (error) {
        console.warn('Información de DB pendiente:', error.message);
      }
    }
  };

  const handleThemeChange = async (event) => {
    const newTheme = event.target.checked ? 'dark' : 'light';
    setTheme(newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('rentplay_theme', newTheme);
    saveSettingToDB('theme', newTheme);
  };

  const handleFontSizeChange = (event) => {
    const size = event.target.value;
    setFontSize(size);
    localStorage.setItem('rentplay_fontsize', size);
    document.documentElement.style.fontSize = FONT_SCALES[size] || FONT_SCALES.normal;
  };

  const handlePaymentChange = (event) => {
    setPaymentMethod(event.target.value);
    localStorage.setItem('rentplay_payment', event.target.value);
  };

  const handleToggleChange = (key) => (event) => {
    const value = event.target.checked;
    setSettings((current) => ({ ...current, [key]: value }));
    localStorage.setItem(`rentplay_${key}`, String(value));
  };

  return (
    <div className="main-content settings-main">
      <div className="container settings-container">
        <h1 className="settings-page-title sr-only">{t.title}</h1>

        <div className="settings-grid">
          <div className="settings-card">
            <h2 className="settings-card-title">{t.visualPrefs}</h2>

            <div className="settings-row theme-toggle-row">
              <span className="setting-label">{t.light}</span>
              <div className="control-wrapper">
                <label className="switch-toggle theme-switch" htmlFor="theme-toggle">
                  <input type="checkbox" id="theme-toggle" checked={theme === 'dark'} onChange={handleThemeChange} />
                  <span className="slider round">
                    <span className="switch-icon icon-sun">☀</span>
                    <span className="switch-icon icon-moon">☾</span>
                  </span>
                </label>
              </div>
              <span className="setting-label">{t.dark}</span>
            </div>

            <hr className="settings-separator" />

            <div className="settings-row font-size-row">
              <span className="setting-label">{t.fontSize}</span>
              <div className="font-size-controls">
                <label className="custom-radio">
                  <input type="radio" name="font-size" value="small" checked={fontSize === 'small'} onChange={handleFontSizeChange} />
                  <span className="radio-mark"></span>
                  <span className="radio-label">{t.small}</span>
                </label>
                <label className="custom-radio">
                  <input type="radio" name="font-size" value="normal" checked={fontSize === 'normal'} onChange={handleFontSizeChange} />
                  <span className="radio-mark"></span>
                  <span className="radio-label">{t.normal}</span>
                </label>
                <label className="custom-radio">
                  <input type="radio" name="font-size" value="large" checked={fontSize === 'large'} onChange={handleFontSizeChange} />
                  <span className="radio-mark"></span>
                  <span className="radio-label">{t.large}</span>
                </label>
              </div>
            </div>
          </div>

          <div className="settings-card">
            <h2 className="settings-card-title">{t.generalLang}</h2>
            <p className="settings-description">{t.langDesc}</p>

            <div className="custom-select-wrapper">
              <select 
                className="settings-select" 
                id="language-select" 
                value={lang.toLowerCase()}
                onChange={(e) => setLang(e.target.value.toUpperCase())}
              >
                <option value="es">Español (ES)</option>
                <option value="en">English (US)</option>
              </select>
              <div className="select-arrow"><span>▾</span></div>
            </div>

            <div className="language-links">
              <a href="#" className="lang-link" onClick={(e) => { e.preventDefault(); setLang('EN'); }}>English (US)</a>
            </div>
          </div>

          <div className="settings-card">
            <h2 className="settings-card-title">{t.navExp}</h2>

            <div className="settings-row toggle-row">
              <span className="setting-label">{t.pegi18}</span>
              <div className="control-wrapper">
                <label className="switch-toggle standard-switch">
                  <input type="checkbox" id="filter-18" checked={settings.filter18} onChange={handleToggleChange('filter-18')} />
                  <span className="slider round"></span>
                </label>
              </div>
            </div>

            <div className="settings-row toggle-row">
              <span className="setting-label">{t.alertsGen}</span>
              <div className="control-wrapper">
                <label className="switch-toggle standard-switch">
                  <input type="checkbox" id="alert-general" checked={settings.alertGeneral} onChange={handleToggleChange('alert-general')} />
                  <span className="slider round"></span>
                </label>
              </div>
            </div>

            <div className="settings-row toggle-row">
              <span className="setting-label">{t.alertsFav}</span>
              <div className="control-wrapper">
                <label className="switch-toggle standard-switch">
                  <input type="checkbox" id="alert-fav" checked={settings.alertFav} onChange={handleToggleChange('alert-fav')} />
                  <span className="slider round"></span>
                </label>
              </div>
            </div>
          </div>

          <div className="settings-card">
            <h2 className="settings-card-title">{t.payMethods}</h2>

            <div className="payment-methods-grid">
              <label className={`payment-card-label${paymentMethod === 'paypal' ? ' checked' : ''}`}>
                <div className="payment-icon-wrapper">
                  <span style={{ fontWeight: 900, fontSize: 15 }}>
                    <span style={{ color: '#009cde' }}>Pay</span><span style={{ color: '#012169' }}>Pal</span>
                  </span>
                </div>
                <span className="payment-name">PayPal</span>
                <input type="radio" name="payment-method" value="paypal" checked={paymentMethod === 'paypal'} onChange={handlePaymentChange} />
                <span className="payment-radio-mark"></span>
              </label>

              <label className={`payment-card-label${paymentMethod === 'credit' ? ' checked' : ''}`}>
                <div className="payment-icon-wrapper">
                  <svg width="52" height="34" viewBox="0 0 52 34" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect width="52" height="34" rx="4" fill="#555"/>
                    <rect y="8" width="52" height="8" fill="#888"/>
                    <rect x="6" y="21" width="16" height="6" rx="2" fill="#f36b24"/>
                  </svg>
                </div>
                <span className="payment-name">{t.credit}</span>
                <input type="radio" name="payment-method" value="credit" checked={paymentMethod === 'credit'} onChange={handlePaymentChange} />
                <span className="payment-radio-mark"></span>
              </label>

              <label className={`payment-card-label${paymentMethod === 'apple' ? ' checked' : ''}`}>
                <div className="payment-icon-wrapper">
                  <span style={{ fontWeight: 600, fontSize: 14, color: '#fff', fontFamily: 'system-ui, -apple-system, sans-serif', letterSpacing: 0.5 }}>Apple Pay</span>
                </div>
                <span className="payment-name">ApplePay</span>
                <input type="radio" name="payment-method" value="apple" checked={paymentMethod === 'apple'} onChange={handlePaymentChange} />
                <span className="payment-radio-mark"></span>
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
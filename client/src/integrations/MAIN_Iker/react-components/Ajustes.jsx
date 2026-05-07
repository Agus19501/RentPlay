import { useEffect, useState } from 'react';
import '../assets/css/ajustes.css';

const FONT_SCALES = {
  small: '80%',
  normal: '100%',
  large: '125%'
};

export default function Ajustes() {
  const [theme, setTheme] = useState('dark');
  const [fontSize, setFontSize] = useState('normal');
  const [paymentMethod, setPaymentMethod] = useState('credit');
  const [settings, setSettings] = useState({
    filter18: false,
    alertGeneral: true,
    alertFav: false
  });

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
        <h1 className="settings-page-title sr-only">Ajustes</h1>

        <div className="settings-grid">
          <div className="settings-card">
            <h2 className="settings-card-title">PREFERENCIAS DE VISUALIZACIÓN</h2>

            <div className="settings-row theme-toggle-row">
              <span className="setting-label">Claro</span>
              <div className="control-wrapper">
                <label className="switch-toggle theme-switch" htmlFor="theme-toggle">
                  <input type="checkbox" id="theme-toggle" checked={theme === 'dark'} onChange={handleThemeChange} />
                  <span className="slider round">
                    <span className="switch-icon icon-sun">☀</span>
                    <span className="switch-icon icon-moon">☾</span>
                  </span>
                </label>
              </div>
              <span className="setting-label">Oscuro</span>
            </div>

            <hr className="settings-separator" />

            <div className="settings-row font-size-row">
              <span className="setting-label">Tamaño de Fuente</span>
              <div className="font-size-controls">
                <label className="custom-radio">
                  <input type="radio" name="font-size" value="small" checked={fontSize === 'small'} onChange={handleFontSizeChange} />
                  <span className="radio-mark"></span>
                  <span className="radio-label">Pequeño</span>
                </label>
                <label className="custom-radio">
                  <input type="radio" name="font-size" value="normal" checked={fontSize === 'normal'} onChange={handleFontSizeChange} />
                  <span className="radio-mark"></span>
                  <span className="radio-label">Normal</span>
                </label>
                <label className="custom-radio">
                  <input type="radio" name="font-size" value="large" checked={fontSize === 'large'} onChange={handleFontSizeChange} />
                  <span className="radio-mark"></span>
                  <span className="radio-label">Grande</span>
                </label>
              </div>
            </div>
          </div>

          <div className="settings-card">
            <h2 className="settings-card-title">IDIOMA GENERAL</h2>
            <p className="settings-description">Cambia el idioma predeterminado de la plataforma</p>

            <div className="custom-select-wrapper">
              <select className="settings-select" id="language-select" defaultValue="es">
                <option value="es">Español (ES)</option>
                <option value="en">English (US)</option>
                <option value="fr">Français (FR)</option>
              </select>
              <div className="select-arrow"><span>▾</span></div>
            </div>

            <div className="language-links">
              <a href="#" className="lang-link">English (US)</a>
              <a href="#" className="lang-link">Français (FR)</a>
            </div>
          </div>

          <div className="settings-card">
            <h2 className="settings-card-title">EXPERIENCIA DE NAVEGACIÓN</h2>

            <div className="settings-row toggle-row">
              <span className="setting-label">Filtro contenido PEGI +18</span>
              <div className="control-wrapper">
                <label className="switch-toggle standard-switch">
                  <input type="checkbox" id="filter-18" checked={settings.filter18} onChange={handleToggleChange('filter-18')} />
                  <span className="slider round"></span>
                </label>
              </div>
            </div>

            <div className="settings-row toggle-row">
              <span className="setting-label">Alertas de Ofertas Generales</span>
              <div className="control-wrapper">
                <label className="switch-toggle standard-switch">
                  <input type="checkbox" id="alert-general" checked={settings.alertGeneral} onChange={handleToggleChange('alert-general')} />
                  <span className="slider round"></span>
                </label>
              </div>
            </div>

            <div className="settings-row toggle-row">
              <span className="setting-label">Alertas Ofertas Contenido Favorito</span>
              <div className="control-wrapper">
                <label className="switch-toggle standard-switch">
                  <input type="checkbox" id="alert-fav" checked={settings.alertFav} onChange={handleToggleChange('alert-fav')} />
                  <span className="slider round"></span>
                </label>
              </div>
            </div>
          </div>

          <div className="settings-card">
            <h2 className="settings-card-title">MÉTODOS DE PAGO</h2>

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
                <span className="payment-name">Tarjeta Crédito</span>
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
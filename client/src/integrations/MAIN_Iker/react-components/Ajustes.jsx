import React, { useState, useEffect } from 'react';
import '../assets/css/style.css'; // Mantengo la ruta relativa hacia el CSS copiado

export default function Ajustes() {
  const [theme, setTheme] = useState('dark');

  useEffect(() => {
    const savedTheme = localStorage.getItem('rentplay_theme') || 'dark';
    setTheme(savedTheme);
    document.documentElement.setAttribute('data-theme', savedTheme);
  }, []);

  const handleThemeChange = async (e) => {
    const newTheme = e.target.checked ? 'dark' : 'light';
    setTheme(newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('rentplay_theme', newTheme);

    if (window.RentPlayApi && typeof window.RentPlayApi.updateSettings === 'function') {
      try {
        await window.RentPlayApi.updateSettings({ theme: newTheme });
      } catch (err) {
        console.warn("Error guardando en BD:", err);
      }
    }
  };

  return (
    <div className="settings-main">
      <h1 className="settings-title">AJUSTES</h1>
      <div className="settings-grid">
        <div className="settings-card">
          <h2 className="settings-card-title">Pantalla y visualización</h2>
          <div className="settings-option">
            <span className="settings-option-label">Modo Oscuro</span>
            <label className="switch-toggle" htmlFor="theme-toggle">
              <input 
                type="checkbox" 
                id="theme-toggle" 
                checked={theme === 'dark'}
                onChange={handleThemeChange} 
              />
              <span className="slider"></span>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}
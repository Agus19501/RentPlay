(function initConfig() {
  const developmentApiBaseUrl = 'http://localhost:4000/api';
  const productionApiBaseUrl = 'https://REEMPLAZA-CON-TU-BACKEND.onrender.com/api';
  const fromStorage = localStorage.getItem('rentplayApiBaseUrl');
  const fromMeta = document.querySelector('meta[name="rentplay-api-base"]')?.content;
  const fromHost = window.location.hostname.includes('localhost')
    ? developmentApiBaseUrl
    : productionApiBaseUrl;

  window.RENTPLAY_CONFIG = {
    API_BASE_URL: fromStorage || fromMeta || fromHost
  };
})();

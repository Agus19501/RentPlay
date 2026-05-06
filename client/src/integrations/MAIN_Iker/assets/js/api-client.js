(function exposeApiClient() {
  const TOKEN_KEY = 'rentplayToken';
  const USER_KEY = 'rentplayUser';

  function getApiBaseUrl() {
    return window.RENTPLAY_CONFIG?.API_BASE_URL || 'http://localhost:4000/api';
  }

  function getToken() {
    return localStorage.getItem(TOKEN_KEY);
  }

  function setSession(token, user) {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  }

  function clearSession() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }

  async function request(path, options) {
    const token = getToken();
    const headers = {
      'Content-Type': 'application/json',
      ...(options?.headers || {})
    };

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(`${getApiBaseUrl()}${path}`, {
      ...options,
      headers
    });

    let data = null;
    try {
      data = await response.json();
    } catch (error) {
      data = null;
    }

    if (!response.ok) {
      const errorMessage = data?.message || 'No se pudo completar la solicitud';
      throw new Error(errorMessage);
    }

    return data;
  }

  async function register(payload) {
    const data = await request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    setSession(data.token, data.user);
    return data;
  }

  async function login(payload) {
    const data = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    setSession(data.token, data.user);
    return data;
  }

  async function getMe() {
    return request('/auth/me', {
      method: 'GET'
    });
  }

  async function createRental(payload) {
    return request('/rentals', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }

  async function getMyRentals() {
    return request('/rentals/mine', {
      method: 'GET'
    });
  }

  async function createRating(payload) {
    return request('/ratings', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }

  async function getSellerRatings(sellerName) {
    return request(`/ratings/${encodeURIComponent(sellerName)}`, {
      method: 'GET'
    });
  }

  window.RentPlayApi = {
    getToken,
    setSession,
    clearSession,
    register,
    login,
    getMe,
    createRental,
    getMyRentals,
    createRating,
    getSellerRatings
  };
})();
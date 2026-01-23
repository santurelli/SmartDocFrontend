import axios from 'axios';

const API_URL = 'http://localhost:8080/api/auth/';

const login = async (username, password, ente) => {
  const response = await axios.post(API_URL + 'login', {
    username,
    password,
    ente,
  });

  if (response.data.token) {
    localStorage.setItem('user', JSON.stringify(response.data));
    // Decode token to get config immediately
    const token = response.data.token;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      localStorage.setItem('appConfig', JSON.stringify(payload));
    } catch (e) {
      console.error("Error decoding token for config", e);
    }
  }

  return response.data;
};

const getConfig = () => {
  const cfg = localStorage.getItem('appConfig');
  return cfg ? JSON.parse(cfg) : {};
}

const updateConfig = (newConfig) => {
  // For manual updates if backend config changes during session
  // This allows "immediate update" without logout if we manually refresh this
  localStorage.setItem('appConfig', JSON.stringify(newConfig));
}

const logout = () => {
  localStorage.removeItem('user');
};

const getCurrentUser = () => {
  return JSON.parse(localStorage.getItem('user'));
};

const getMunicipalities = async (inputValue) => {
  if (!inputValue) return [];
  try {
    const response = await axios.get(`http://localhost:8080/api/municipalities/suggestion?q=${inputValue}`);
    // Map backend DTO to React-Select format { value, label }
    return response.data.map(m => ({ value: m.dbName, label: m.text || m.denominazione || m.dbName, dbName: m.dbName }));
  } catch (error) {
    console.error("Error fetching municipalities", error);
    return [];
  }
};

const authHeader = () => {
  const user = JSON.parse(localStorage.getItem('user'));
  if (user && user.token) {
    return { Authorization: 'Bearer ' + user.token };
  } else {
    return {};
  }
};

const authService = {
  login,
  logout,
  getCurrentUser,
  getCurrentUser,
  getMunicipalities,
  getConfig,
  updateConfig,
  authHeader
};

export default authService;

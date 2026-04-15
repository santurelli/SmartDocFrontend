import axios from 'axios';
import api from './api';
import authStorage from './authStorage';

const AUTH_URL = '/api/auth/';

const login = async (username, password, ente) => {
  const response = await axios.post(AUTH_URL + 'login', {
    username,
    password,
    ente,
  });

  if (response.data.token) {
    sessionStorage.setItem('user', JSON.stringify(response.data));
    const token = response.data.token;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      sessionStorage.setItem('appConfig', JSON.stringify(payload));
    } catch (e) {
      console.error("Error decoding token for config", e);
    }
  }

  return response.data;
};

const getConfig = () => {
  const cfg = sessionStorage.getItem('appConfig');
  return cfg ? JSON.parse(cfg) : {};
}

const updateConfig = (newConfig) => {
  sessionStorage.setItem('appConfig', JSON.stringify(newConfig));
}

const logout = () => {
  authStorage.logout();
};

const getCurrentUser = () => {
  return authStorage.getCurrentUser();
};

const getMunicipalities = async (inputValue) => {
  if (!inputValue) return [];
  try {
    const response = await api.get(`/municipalities/suggestion?q=${inputValue}`);
    return response.data.map(m => ({ value: m.dbName, label: m.text || m.denominazione || m.dbName, dbName: m.dbName }));
  } catch (error) {
    console.error("Error fetching municipalities", error);
    return [];
  }
};

const authHeader = () => {
  const user = authStorage.getCurrentUser();
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
  getMunicipalities,
  getConfig,
  updateConfig,
  authHeader
};

export default authService;

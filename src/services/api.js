// frontend/src/services/api.js

import axios from 'axios';

const API = axios.create({
  baseURL: 'https://stingray-app-prmsm.ondigitalocean.app/api',
});

export const fetchCryptoStats = (crypto) => API.get(`/${crypto}`);

import axios from 'axios';

// Single axios instance used across the app. Base URL comes from the
// client's own env config - the client NEVER talks to the AI service
// directly, only to the Node.js backend (see architecture rules).
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach JWT automatically once auth is implemented in Phase 3.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('viavoce_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;

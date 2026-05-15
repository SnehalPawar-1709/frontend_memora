import axios from 'axios';

const api = axios.create({
  baseURL:  import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  timeout:  20000,
  headers:  { 'Content-Type': 'application/json' },
});

api.interceptors.request.use(cfg => {
  const token = localStorage.getItem('memora_token');
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

api.interceptors.response.use(
  res => res,
  err => {
    // Only redirect on 401 if NOT on auth pages
    if (err.response?.status === 401) {
      const path = window.location.pathname;
      if (path !== '/login' && path !== '/register' && path !== '/') {
        localStorage.removeItem('memora_token');
        localStorage.removeItem('memora_user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(err);
  }
);

export default api;

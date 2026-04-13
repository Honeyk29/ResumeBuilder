import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_BASE_URI + '/api',
});

// Add a request interceptor to include the auth token
api.interceptors.request.use(
  (config) => {
    const storedUser = localStorage.getItem('resume_user');
    if (storedUser) {
      const { token } = JSON.parse(storedUser);
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;

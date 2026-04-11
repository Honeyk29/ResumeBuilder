import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5001/api',
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

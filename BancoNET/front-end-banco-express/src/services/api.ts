// eslint-disable-next-line @typescript-eslint/no-unused-vars
import axios, { AxiosError, AxiosInstance } from 'axios';

// Create the axios instance
const api: AxiosInstance = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 seconds timeout
});

// Request interceptor for adding auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for handling common errors
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    // Handle unauthorized errors (401)
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      // Redirect to login if needed
      // window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
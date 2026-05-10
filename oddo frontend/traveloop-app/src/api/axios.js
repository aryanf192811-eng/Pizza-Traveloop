import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  withCredentials: true,
});

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('traveloop_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle 401 globally — redirect to login
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('traveloop_token');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

// Helper to extract error message from any API error shape
export const getApiError = (err) => {
  if (err.response?.data?.errors?.[0]?.message) return err.response.data.errors[0].message;
  if (err.response?.data?.error) return err.response.data.error;
  if (err.message) return err.message;
  return 'Something went wrong';
};

export default api;

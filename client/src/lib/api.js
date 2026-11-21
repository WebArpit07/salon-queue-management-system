import axios from 'axios';

const rawApiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const API_BASE_URL = rawApiUrl.replace(/\/$/, '');

export const getStaffHeaders = () => {
  const pin = typeof window !== 'undefined' ? sessionStorage.getItem('salon_staff_pin') : null;
  return pin ? { 'x-staff-pin': pin } : {};
};

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach x-staff-pin automatically if stored in sessionStorage
api.interceptors.request.use((config) => {
  const staffPin = typeof window !== 'undefined' ? sessionStorage.getItem('salon_staff_pin') : null;
  if (staffPin && !config.headers['x-staff-pin']) {
    config.headers['x-staff-pin'] = staffPin;
  }
  return config;
});

// Response interceptor for unified error logging and 401 session clearing
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('salon_staff_pin');
        window.dispatchEvent(new CustomEvent('staff_pin_invalid'));
      }
    }
    console.warn('[API Error]:', error?.response?.data || error.message);
    return Promise.reject(error);
  }
);

export default api;

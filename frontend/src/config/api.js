const normalizeBaseUrl = (value) => value.replace(/\/+$/, '');

const resolveDefaultApiBaseUrl = () => {
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL;
  }

  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    const isLocalHost =
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname === '0.0.0.0';

    if (isLocalHost) {
      return 'http://localhost:5000';
    }
  }

  if (import.meta.env.DEV) {
    return 'http://localhost:5000';
  }

  return 'https://grab-menu-app.onrender.com';
};

export const API_BASE_URL = normalizeBaseUrl(resolveDefaultApiBaseUrl());

export const SOCKET_BASE_URL = API_BASE_URL;

export const getApiUrl = (path) => {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE_URL}${normalizedPath}`;
};

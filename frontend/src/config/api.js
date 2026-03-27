const normalizeBaseUrl = (value) => value.replace(/\/+$/, '');

export const API_BASE_URL = normalizeBaseUrl(
  import.meta.env.VITE_API_BASE_URL || 'https://grab-menu-app.onrender.com'
);

export const SOCKET_BASE_URL = API_BASE_URL;

export const getApiUrl = (path) => {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE_URL}${normalizedPath}`;
};

import api from './api.js';

function getBackendBaseUrl() {
  const configuredApiUrl = import.meta.env.VITE_API_URL;
  const baseUrl = configuredApiUrl || api.defaults.baseURL || '';
  return String(baseUrl).replace(/\/api\/?$/i, '');
}

export function resolveAssetUrl(value) {
  const rawValue = String(value || '').trim();
  if (!rawValue) return '';
  if (/^(https?:|data:|blob:)/i.test(rawValue)) return rawValue;

  const baseUrl = getBackendBaseUrl();
  if (!baseUrl) return rawValue;

  try {
    return new URL(rawValue, `${baseUrl}/`).toString();
  } catch {
    return rawValue;
  }
}
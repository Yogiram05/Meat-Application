const rawBaseUrl = process.env.EXPO_PUBLIC_BACKEND_URL || 'http://10.217.47.131:3001/api';

export const BASE_URL = rawBaseUrl.replace(/\/api\/?$/, '').replace(/\/$/, '');
export const REQUEST_TIMEOUT_MS = 20000;
export const REQUEST_RETRY_COUNT = 1;
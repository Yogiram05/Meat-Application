const rawBaseUrl = process.env.EXPO_PUBLIC_BACKEND_URL?.trim();

if (!rawBaseUrl) {
	throw new Error('Backend URL missing. Set EXPO_PUBLIC_BACKEND_URL in .env.');
}

export const BASE_URL = rawBaseUrl.replace(/\/api\/?$/, '').replace(/\/$/, '');
export const REQUEST_TIMEOUT_MS = 30000;
export const REQUEST_RETRY_COUNT = 1;
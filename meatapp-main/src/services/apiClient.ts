import { BASE_URL, REQUEST_RETRY_COUNT, REQUEST_TIMEOUT_MS } from './apiConfig';

const DEFAULT_TIMEOUT_MS = REQUEST_TIMEOUT_MS;
const DEFAULT_RETRY_COUNT = REQUEST_RETRY_COUNT;

export class ApiError extends Error {
    status?: number;
    baseUrl?: string;
    path?: string;
    isNetworkError: boolean;

    constructor(message: string, options?: { status?: number; baseUrl?: string; path?: string; isNetworkError?: boolean; cause?: unknown }) {
        super(message);
        this.name = 'ApiError';
        this.status = options?.status;
        this.baseUrl = options?.baseUrl;
        this.path = options?.path;
        this.isNetworkError = options?.isNetworkError ?? false;
        if (options?.cause !== undefined) {
            (this as Error & { cause?: unknown }).cause = options.cause;
        }
    }
}

function sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

async function readErrorMessage(response: Response) {
    const text = await response.text();

    if (!text) {
        return `HTTP ${response.status}`;
    }

    try {
        const parsed = JSON.parse(text);
        if (typeof parsed?.error === 'string') {
            return parsed.error;
        }
        if (typeof parsed?.message === 'string') {
            return parsed.message;
        }
    } catch {
        // Ignore JSON parse failures and use the raw body.
    }

    return text.slice(0, 200);
}

function createRequestError(message: string, baseUrl: string, path: string, options?: { status?: number; isNetworkError?: boolean; cause?: unknown }) {
    return new ApiError(message, {
        baseUrl,
        path,
        status: options?.status,
        isNetworkError: options?.isNetworkError,
        cause: options?.cause,
    });
}

function shouldRetryStatus(status: number) {
    return status >= 500 || status === 408 || status === 429;
}

export async function requestResponse(path: string, init: RequestInit = {}, settings?: { retries?: number; timeoutMs?: number }) {
    const retries = settings?.retries ?? DEFAULT_RETRY_COUNT;
    const timeoutMs = settings?.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    let lastError: unknown;

    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    const url = `${BASE_URL}/api${normalizedPath}`;

    for (let attempt = 0; attempt <= retries; attempt += 1) {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), timeoutMs);

        try {
            const response = await fetch(url, { ...init, signal: controller.signal });
            clearTimeout(timeout);

            if (!response.ok && shouldRetryStatus(response.status) && attempt < retries) {
                console.warn(`[api] retrying ${path} after HTTP ${response.status} from ${BASE_URL}/api`);
                await sleep(200 * (attempt + 1));
                continue;
            }

            return { response, baseUrl: `${BASE_URL}/api` };
        } catch (error) {
            clearTimeout(timeout);
            lastError = error;

            const isAbortError = error instanceof Error && error.name === 'AbortError';
            const isNetworkError = isAbortError || error instanceof TypeError;
            const message = isAbortError
                ? `Request timed out after ${timeoutMs}ms`
                : error instanceof Error
                    ? error.message
                    : 'Unknown network error';

            console.warn(`[api] attempt ${attempt + 1} failed for ${path} via ${BASE_URL}/api: ${message}`);

            if (attempt < retries && isNetworkError) {
                await sleep(250 * (attempt + 1));
                continue;
            }

            break;
        }
    }

    if (lastError instanceof Error) {
        throw createRequestError(lastError.message, `${BASE_URL}/api`, path, { isNetworkError: true, cause: lastError });
    }

    throw createRequestError('Unable to reach the backend server.', `${BASE_URL}/api`, path, { isNetworkError: true });
}

export async function requestJson<T>(path: string, init: RequestInit = {}, settings?: { retries?: number; timeoutMs?: number }) {
    const { response, baseUrl } = await requestResponse(path, init, settings);

    if (!response.ok) {
        const message = await readErrorMessage(response);
        throw createRequestError(message, baseUrl, path, { status: response.status });
    }

    if (response.status === 204) {
        return { data: undefined as T, response, baseUrl };
    }

    const text = await response.text();
    const data = text ? JSON.parse(text) as T : undefined;
    return { data, response, baseUrl };
}

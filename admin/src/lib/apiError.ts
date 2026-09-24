import axios from 'axios';

interface ApiErrorBody {
  message?: unknown;
  error?: unknown;
}

export function getApiErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error)) {
    const body = error.response?.data as ApiErrorBody | undefined;
    if (typeof body?.message === 'string' && body.message.trim()) return body.message;
    if (error.response?.status === 429) return 'Too many attempts. Please wait a moment and try again.';
    if (!error.response || error.code === 'ERR_NETWORK') return 'Unable to reach the server. Check your connection and try again.';
    if (error.response) return fallback;
  }

  if (error instanceof Error && error.message.trim()) return error.message;
  return fallback;
}

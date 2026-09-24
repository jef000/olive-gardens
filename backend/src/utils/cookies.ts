import { Response } from 'express';
import config from '../config/env';

export function getCookie(header: string | undefined, name: string): string | undefined {
  if (!header) return undefined;
  const item = header.split(';').find((part) => part.trim().startsWith(`${name}=`));
  return item ? decodeURIComponent(item.trim().slice(name.length + 1)) : undefined;
}

function cookieFlags(maxAge: number): string {
  const secure = config.isProduction ? '; Secure' : '';
  return `Path=/; Max-Age=${maxAge}; HttpOnly; SameSite=Strict${secure}`;
}

export function setAuthCookies(
  res: Response,
  accessToken: string,
  refreshToken: string,
  sessionId: string
): void {
  res.append(
    'Set-Cookie',
    `access_token=${encodeURIComponent(accessToken)}; ${cookieFlags(15 * 60)}`
  );
  res.append(
    'Set-Cookie',
    `refresh_token=${encodeURIComponent(refreshToken)}; ${cookieFlags(7 * 24 * 60 * 60)}`
  );
  res.append('Set-Cookie', `session_id=${encodeURIComponent(sessionId)}; ${cookieFlags(30 * 60)}`);
}

export function clearAuthCookies(res: Response): void {
  for (const name of ['access_token', 'refresh_token', 'session_id']) {
    res.append('Set-Cookie', `${name}=; ${cookieFlags(0)}`);
  }
}

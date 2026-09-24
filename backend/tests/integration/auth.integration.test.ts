import { strict as assert } from 'node:assert';
import { test, before, after, beforeEach } from 'node:test';
import { randomUUID } from 'node:crypto';
import express from 'express';
import type { Server } from 'node:http';
import routes from '../../src/routes';
import { query, testConnection, closePool } from '../../src/db/pool';
import redisClient from '../../src/db/redis';
import { hashPassword } from '../../src/utils/password';

let server: Server;
let baseUrl = '';

before(async () => {
  const app = express();
  app.use(express.json());
  app.use('/api', routes);
  await new Promise<void>((resolve) => {
    server = app.listen(0, '127.0.0.1', () => resolve());
  });
  const address = server.address();
  if (address && typeof address === 'object') {
    baseUrl = `http://127.0.0.1:${address.port}/api`;
  }
});

after(async () => {
  // fetch keeps sockets alive (undici); close the idle ones so close() can
  // finish. A short settle delay lets the test-runner IPC flush this file's
  // final results before the child exits.
  server.closeIdleConnections?.();
  await new Promise<void>((resolve) => server.close(() => resolve()));
  redisClient.disconnect();
  await closePool();
  await new Promise((resolve) => setTimeout(resolve, 50));
});

beforeEach(async () => {
  // The auth limiter is 5 requests / 15 minutes per address; reset between tests.
  const keys = await redisClient.keys('ratelimit:*');
  if (keys.length > 0) await redisClient.del(...keys);
});

async function databaseAvailable(): Promise<boolean> {
  try {
    return await testConnection();
  } catch {
    return false;
  }
}

function cookiesFrom(response: Response): Record<string, string> {
  const jar: Record<string, string> = {};
  for (const header of response.headers.getSetCookie()) {
    const [pair] = header.split(';');
    const index = pair.indexOf('=');
    if (index > 0) jar[pair.slice(0, index).trim()] = pair.slice(index + 1).trim();
  }
  return jar;
}

const cookieHeader = (jar: Record<string, string>) =>
  Object.entries(jar).map(([name, value]) => `${name}=${value}`).join('; ');

const uniqueEmail = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@test.local`;
const password = 'Integration-Test1!';

test('self-registration always creates a standard user, never an admin', async (t) => {
  if (!(await databaseAvailable())) return t.skip('PostgreSQL unavailable');

  const email = uniqueEmail('register');
  const response = await fetch(`${baseUrl}/auth/register`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email, password, role: 'admin' }),
  });

  assert.equal(response.status, 201);
  const body = await response.json();
  assert.equal(body.data.user.role, 'user', 'client-supplied role must be ignored');

  const stored = await query<{ role: string }>('SELECT role FROM users WHERE email = $1', [email]);
  assert.equal(stored.rows[0]?.role, 'user');

  await query('DELETE FROM users WHERE email = $1', [email]);
});

test('login issues a live session and refresh tokens cannot be replayed', async (t) => {
  if (!(await databaseAvailable())) return t.skip('PostgreSQL unavailable');

  const email = uniqueEmail('refresh');
  const userId = randomUUID();
  await query(
    `INSERT INTO users (id, email, password, role) VALUES ($1, $2, $3, 'admin')`,
    [userId, email, await hashPassword(password)]
  );

  const login = await fetch(`${baseUrl}/auth/login`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  assert.equal(login.status, 200);
  const jar = cookiesFrom(login);
  assert.ok(jar.access_token, 'login should set an access token cookie');
  assert.ok(jar.refresh_token, 'login should set a refresh token cookie');

  const me = await fetch(`${baseUrl}/auth/me`, { headers: { cookie: cookieHeader(jar) } });
  assert.equal(me.status, 200);
  assert.equal((await me.json()).data.user.email, email);

  const refreshed = await fetch(`${baseUrl}/auth/refresh`, {
    method: 'POST',
    headers: { cookie: `refresh_token=${jar.refresh_token}; session_id=${jar.session_id}` },
  });
  assert.equal(refreshed.status, 200);
  const rotated = cookiesFrom(refreshed);
  assert.notEqual(rotated.refresh_token, jar.refresh_token, 'refresh token should rotate');

  const replay = await fetch(`${baseUrl}/auth/refresh`, {
    method: 'POST',
    headers: { cookie: `refresh_token=${jar.refresh_token}; session_id=${jar.session_id}` },
  });
  assert.equal(replay.status, 401, 'a consumed refresh token must not be reusable');

  await query('DELETE FROM users WHERE id = $1', [userId]);
});

test('rejects authenticated requests once the session is revoked', async (t) => {
  if (!(await databaseAvailable())) return t.skip('PostgreSQL unavailable');

  const email = uniqueEmail('revoke');
  const userId = randomUUID();
  await query(
    `INSERT INTO users (id, email, password, role) VALUES ($1, $2, $3, 'admin')`,
    [userId, email, await hashPassword(password)]
  );

  const login = await fetch(`${baseUrl}/auth/login`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  assert.equal(login.status, 200);
  const jar = cookiesFrom(login);

  const { default: sessionService } = await import('../../src/services/session.service');
  await sessionService.terminateAllUserSessions(userId);

  const me = await fetch(`${baseUrl}/auth/me`, { headers: { cookie: cookieHeader(jar) } });
  assert.equal(me.status, 401);

  await query('DELETE FROM users WHERE id = $1', [userId]);
});

import { strict as assert } from 'node:assert';
import { test, before, after, beforeEach } from 'node:test';
import { randomUUID } from 'node:crypto';
import sessionService from '../../src/services/session.service';
import redisClient from '../../src/db/redis';
import { query, testConnection, closePool } from '../../src/db/pool';

const userId = randomUUID();
const email = `session-${Date.now()}@test.local`;
const payload = { userId, email, role: 'admin' };
const metadata = { device: 'node-test', ipAddress: '127.0.0.1', userAgent: 'node-test' };

let dbReady = false;

before(async () => {
  try {
    dbReady = await testConnection();
  } catch {
    dbReady = false;
  }

  if (dbReady) {
    await query(
      `INSERT INTO users (id, email, password, role) VALUES ($1, $2, 'test-hash', 'admin')`,
      [userId, email]
    );
  }
});

after(async () => {
  if (dbReady) await query('DELETE FROM users WHERE id = $1', [userId]);
  redisClient.disconnect();
  await closePool();
});

beforeEach(async () => {
  if (dbReady) await sessionService.terminateAllUserSessions(userId);
});

test('creates, reads, touches and terminates a session', async (t) => {
  if (!dbReady) return t.skip('PostgreSQL unavailable');
  const sessionId = randomUUID();

  await sessionService.createSession(sessionId, payload, metadata);
  const created = await sessionService.getSession(sessionId);
  assert.ok(created, 'session should exist after creation');
  assert.equal(created?.userId, userId);

  await sessionService.updateActivity(sessionId);
  assert.ok(await sessionService.getSession(sessionId), 'session should survive an activity update');

  await sessionService.terminateSession(sessionId);
  assert.equal(await sessionService.getSession(sessionId), null);
});

test('terminateAllUserSessions removes every session for the user', async (t) => {
  if (!dbReady) return t.skip('PostgreSQL unavailable');

  await sessionService.createSession(randomUUID(), payload, metadata);
  await sessionService.createSession(randomUUID(), payload, metadata);

  await sessionService.terminateAllUserSessions(userId);

  assert.equal((await sessionService.getUserSessions(userId)).length, 0);
});

test('enforces the concurrent session limit', async (t) => {
  if (!dbReady) return t.skip('PostgreSQL unavailable');

  for (let index = 0; index < 6; index += 1) {
    await sessionService.createSession(randomUUID(), payload, metadata);
  }

  const sessions = await sessionService.getUserSessions(userId);
  assert.ok(
    sessions.length > 0 && sessions.length <= 3,
    `expected at most 3 concurrent sessions, found ${sessions.length}`
  );
});

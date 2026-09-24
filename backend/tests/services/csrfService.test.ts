import { strict as assert } from 'node:assert';
import { test, after } from 'node:test';
import csrfService, { timingSafeTokenEqual } from '../../src/services/csrf.service';
import redisClient from '../../src/db/redis';

after(() => {
  redisClient.disconnect();
});

test('CSRF token comparison is exact and rejects different lengths/content', () => {
  assert.equal(timingSafeTokenEqual('abc', 'abc'), true);
  assert.equal(timingSafeTokenEqual('abc', 'abd'), false);
  assert.equal(timingSafeTokenEqual('abc', 'abcd'), false);
});

test('generates a session token that validates and can be re-read without rotation', async () => {
  const sessionId = `csrf-test-${Date.now()}`;

  const token = await csrfService.generateToken(sessionId);
  assert.ok(token.length >= 32);
  assert.equal(await csrfService.validateToken(sessionId, token), true);

  // Reading must not rotate the token (concurrent writes depend on this).
  assert.equal(await csrfService.getToken(sessionId), token);
  assert.equal(await csrfService.validateToken(sessionId, token), true);
});

test('rejects wrong tokens and invalidates on logout', async () => {
  const sessionId = `csrf-test-${Date.now()}-b`;
  const token = await csrfService.generateToken(sessionId);

  assert.equal(await csrfService.validateToken(sessionId, 'wrong-token'), false);

  await csrfService.invalidateToken(sessionId);
  assert.equal(await csrfService.getToken(sessionId), null);
  assert.equal(await csrfService.validateToken(sessionId, token), false);
});


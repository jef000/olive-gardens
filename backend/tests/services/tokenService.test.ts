import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import jwt from 'jsonwebtoken';
import config from '../../src/config/env';
import tokenService from '../../src/services/token.service';

const payload = { userId: '00000000-0000-0000-0000-000000000001', email: 'test@example.com', role: 'admin' };

test('access tokens require the configured issuer and audience', () => {
  const token = jwt.sign(payload, config.jwt.secret, { expiresIn: '15m', issuer: 'olive-garden-api', audience: 'olive-garden-client' });
  const verified = tokenService.verifyAccessToken(token);
  assert.deepEqual({ userId: verified.userId, email: verified.email, role: verified.role }, payload);
  const wrongAudience = jwt.sign(payload, config.jwt.secret, { expiresIn: '15m', issuer: 'wrong', audience: 'wrong' });
  assert.throws(() => tokenService.verifyAccessToken(wrongAudience), /Invalid access token/);
});

test('MFA challenges are purpose-bound and short-lived JWTs', () => {
  const challenge = tokenService.createMFAChallenge(payload.userId);
  assert.equal(tokenService.verifyMFAChallenge(challenge), payload.userId);
  const accessToken = jwt.sign(payload, config.jwt.secret, { expiresIn: '15m', issuer: 'olive-garden-api', audience: 'olive-garden-client' });
  assert.equal(tokenService.verifyMFAChallenge(accessToken), null);
});

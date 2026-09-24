import { strict as assert } from 'node:assert';
import { test, beforeEach, after } from 'node:test';
import type { NextFunction, Request, Response } from 'express';
import { enhancedRateLimiter } from '../../src/middleware/enhancedRateLimiter';
import redisClient from '../../src/db/redis';

after(() => {
  redisClient.disconnect();
});

function makeRequest(ip: string): Request {
  return {
    method: 'POST',
    ip,
    headers: {},
    socket: { remoteAddress: ip },
  } as unknown as Request;
}

function makeResponse() {
  const state = { statusCode: 200, body: null as unknown, headers: {} as Record<string, string> };
  const res = {
    status(code: number) {
      state.statusCode = code;
      return res;
    },
    json(payload: unknown) {
      state.body = payload;
      return res;
    },
    setHeader(name: string, value: string) {
      state.headers[name] = value;
      return res;
    },
  } as unknown as Response;
  return { res, state };
}

async function flushRateLimits() {
  const keys = await redisClient.keys('ratelimit:*');
  if (keys.length > 0) await redisClient.del(...keys);
}

beforeEach(flushRateLimits);

test('allows requests up to the limit and blocks the next one', async () => {
  const middleware = enhancedRateLimiter({ isAuthEndpoint: true });
  const ip = '203.0.113.10';

  let allowed = 0;
  let blocked = 0;

  for (let attempt = 0; attempt < 7; attempt += 1) {
    const { res, state } = makeResponse();
    await middleware(makeRequest(ip), res, (() => { allowed += 1; }) as NextFunction);
    if (state.statusCode === 429) blocked += 1;
  }

  assert.equal(allowed, 5, `expected 5 allowed requests, saw ${allowed}`);
  assert.equal(blocked, 2, `expected 2 blocked requests, saw ${blocked}`);
});

test('tracks separate buckets per client address', async () => {
  const middleware = enhancedRateLimiter({ isAuthEndpoint: true });

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const { res } = makeResponse();
    await middleware(makeRequest('203.0.113.20'), res, (() => undefined) as NextFunction);
  }

  // A different client must not inherit the exhausted bucket.
  const { res, state } = makeResponse();
  let passed = false;
  await middleware(makeRequest('203.0.113.21'), res, (() => { passed = true; }) as NextFunction);
  assert.equal(passed, true);
  assert.equal(state.statusCode, 200);
});

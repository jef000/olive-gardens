import { strict as assert } from 'node:assert';
import { test, beforeEach, after } from 'node:test';
import type { NextFunction, Request, Response } from 'express';
import { csrfMiddleware } from '../../src/middleware/csrf.middleware';
import csrfService from '../../src/services/csrf.service';
import redisClient from '../../src/db/redis';

after(() => {
  redisClient.disconnect();
});

function makeRequest(options: { method: string; url: string; sessionId?: string; csrf?: string }): Request {
  const headers: Record<string, string> = {};
  if (options.csrf) headers['x-csrf-token'] = options.csrf;

  return {
    method: options.method,
    originalUrl: options.url,
    path: options.url,
    sessionId: options.sessionId,
    headers,
    header(name: string) {
      return headers[name.toLowerCase()];
    },
  } as unknown as Request;
}

function makeResponse() {
  const state = { statusCode: 200, headers: {} as Record<string, string> };
  const res = {
    status(code: number) {
      state.statusCode = code;
      return res;
    },
    json() {
      return res;
    },
    setHeader(name: string, value: string) {
      state.headers[name] = value;
      return res;
    },
  } as unknown as Response;
  return { res, state };
}

async function flushCsrf() {
  const keys = await redisClient.keys('csrf:*');
  if (keys.length > 0) await redisClient.del(...keys);
}

beforeEach(flushCsrf);

test('rejects an authenticated mutation without a CSRF token', async () => {
  const sessionId = `csrf-mw-${Date.now()}`;
  await csrfService.generateToken(sessionId);

  const { res, state } = makeResponse();
  let passed = false;
  await csrfMiddleware(makeRequest({ method: 'POST', url: '/api/users/1', sessionId }), res, (() => { passed = true; }) as NextFunction);

  assert.equal(passed, false);
  assert.equal(state.statusCode, 403);
});

test('allows an authenticated mutation carrying the session token', async () => {
  const sessionId = `csrf-mw-${Date.now()}-ok`;
  const token = await csrfService.generateToken(sessionId);

  const { res, state } = makeResponse();
  let passed = false;
  await csrfMiddleware(makeRequest({ method: 'POST', url: '/api/users/1', sessionId, csrf: token }), res, (() => { passed = true; }) as NextFunction);

  assert.equal(passed, true);
  assert.notEqual(state.statusCode, 403);
});

test('exposes a stable token on safe requests instead of rotating it', async () => {
  const sessionId = `csrf-mw-${Date.now()}-safe`;
  const first = await csrfService.generateToken(sessionId);

  const responseA = makeResponse();
  await csrfMiddleware(makeRequest({ method: 'GET', url: '/api/users', sessionId }), responseA.res, (() => undefined) as NextFunction);
  const responseB = makeResponse();
  await csrfMiddleware(makeRequest({ method: 'GET', url: '/api/users', sessionId }), responseB.res, (() => undefined) as NextFunction);

  assert.equal(responseA.state.headers['X-CSRF-Token'], first);
  assert.equal(responseB.state.headers['X-CSRF-Token'], first);
});

test('skips CSRF checks for public auth paths', async () => {
  let passed = false;
  const { res, state } = makeResponse();
  await csrfMiddleware(makeRequest({ method: 'POST', url: '/api/auth/login' }), res, (() => { passed = true; }) as NextFunction);

  assert.equal(passed, true);
  assert.notEqual(state.statusCode, 403);
});

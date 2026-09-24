import { strict as assert } from 'node:assert';
import { test, before, after } from 'node:test';
import { randomUUID } from 'crypto';
import { generate, generateSecret } from 'otplib';
import { NobleCryptoPlugin } from '@otplib/plugin-crypto-noble';
import { ScureBase32Plugin } from '@otplib/plugin-base32-scure';
import mfaService from '../../src/services/mfa.service';
import { query, testConnection, closePool } from '../../src/db/pool';
import { hashPassword } from '../../src/utils/password';

const crypto = new NobleCryptoPlugin();
const base32 = new ScureBase32Plugin();

let userId = '';
let email = '';
let dbReady = false;

before(async () => {
  try {
    dbReady = await testConnection();
  } catch {
    dbReady = false;
  }

  if (dbReady) {
    userId = randomUUID();
    email = `mfa-${Date.now()}@test.local`;
    await query(
      `INSERT INTO users (id, email, password, role, mfa_enabled, mfa_secret)
       VALUES ($1, $2, $3, 'admin', FALSE, NULL)`,
      [userId, email, await hashPassword('Integration-Test1!')]
    );
  }
});

after(async () => {
  if (dbReady) await query('DELETE FROM users WHERE id = $1', [userId]);
  await closePool();
});

test('MFA setup, verification, login checks and backup codes', async (t) => {
  if (!dbReady) return t.skip('PostgreSQL unavailable');

  // Secrets are encrypted at rest; backup codes are keyed HMACs, single-use.
  const setup = await mfaService.setupMFA(userId, email);
  assert.ok(setup.secret, 'setup should return a secret');
  assert.match(setup.qrCode, /^data:image\/png;base64,/, 'setup should return a QR data URL');
  assert.equal(setup.backupCodes.length, 10);
  assert.equal(await mfaService.verifyTOTP(userId, '000000'), false, 'MFA is not enabled yet');

  const storedSecret = await query<{ mfa_secret: string }>('SELECT mfa_secret FROM users WHERE id = $1', [userId]);
  assert.match(storedSecret.rows[0].mfa_secret, /^enc:/, 'TOTP secret must be encrypted at rest');

  const token = await generate({ secret: setup.secret, crypto, base32 });
  assert.equal(await mfaService.verifyAndEnableMFA(userId, token), true);

  const validToken = await generate({ secret: setup.secret, crypto, base32 });
  assert.equal(await mfaService.verifyTOTP(userId, validToken), true);
  assert.equal(await mfaService.verifyTOTP(userId, '000000'), false);

  const backupCode = setup.backupCodes[0];
  assert.equal(await mfaService.verifyBackupCode(userId, backupCode), true);
  assert.equal(await mfaService.verifyBackupCode(userId, backupCode), false, 'backup codes are single-use');

  // Unknown users must never verify, even with a valid code from another secret.
  const unknownSecret = generateSecret({ length: 20 });
  const unknownToken = await generate({ secret: unknownSecret, crypto, base32 });
  assert.equal(await mfaService.verifyTOTP(randomUUID(), unknownToken), false);

  await mfaService.disableMFA(userId);
  const stored = await query<{ mfa_enabled: boolean; mfa_secret: string | null }>(
    'SELECT mfa_enabled, mfa_secret FROM users WHERE id = $1',
    [userId]
  );
  assert.equal(stored.rows[0].mfa_enabled, false);
  assert.equal(stored.rows[0].mfa_secret, null);
});

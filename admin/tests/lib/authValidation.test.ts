import test from 'node:test';
import assert from 'node:assert/strict';
import { backupCodeSchema, emailSchema, mfaCodeSchema, passwordSchema } from '../../src/lib/validation.ts';

test('admin auth validation accepts backend-compatible credentials', () => {
  assert.equal(emailSchema.safeParse(' admin@example.com ').success, true);
  assert.equal(passwordSchema.safeParse('SecurePass1!').success, true);
  assert.equal(mfaCodeSchema.safeParse('123456').success, true);
  assert.equal(backupCodeSchema.safeParse('A1B2C3D4').success, true);
});

test('admin auth validation rejects malformed credentials with actionable rules', () => {
  assert.equal(emailSchema.safeParse('not-an-email').success, false);
  assert.equal(passwordSchema.safeParse('weakpassword').success, false);
  assert.equal(mfaCodeSchema.safeParse('1234').success, false);
  assert.equal(backupCodeSchema.safeParse('not-a-code').success, false);
});

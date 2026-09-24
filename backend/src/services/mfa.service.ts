import { generateSecret, generateURI, verify } from 'otplib';
import qrcode from 'qrcode';
import { randomBytes, createHash, createCipheriv, createDecipheriv, createHmac } from 'crypto';
import { query } from '../db/pool';
import config from '../config/env';
import { NobleCryptoPlugin } from '@otplib/plugin-crypto-noble';
import { ScureBase32Plugin } from '@otplib/plugin-base32-scure';

// Configure plugins for TOTP
const crypto = new NobleCryptoPlugin();
const base32 = new ScureBase32Plugin();

// Key material for encrypting TOTP seeds and HMACing backup codes. Set
// MFA_ENCRYPTION_KEY in production so rotating JWT_SECRET does not orphan MFA.
const MFA_KEY = createHash('sha256')
  .update(process.env.MFA_ENCRYPTION_KEY || config.jwt.secret)
  .digest();

function encryptSecret(plain: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', MFA_KEY, iv);
  const encrypted = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
  return `enc:${iv.toString('hex')}:${cipher.getAuthTag().toString('hex')}:${encrypted.toString('hex')}`;
}

function decryptSecret(stored: string): string | null {
  if (!stored.startsWith('enc:')) return stored; // legacy plaintext rows
  try {
    const [prefix, ivHex, tagHex, dataHex] = stored.split(':');
    if (prefix !== 'enc' || !ivHex || !tagHex || !dataHex) return null;
    const decipher = createDecipheriv('aes-256-gcm', MFA_KEY, Buffer.from(ivHex, 'hex'));
    decipher.setAuthTag(Buffer.from(tagHex, 'hex'));
    return Buffer.concat([decipher.update(Buffer.from(dataHex, 'hex')), decipher.final()]).toString(
      'utf8'
    );
  } catch {
    return null;
  }
}

/**
 * MFA setup data returned to user
 */
export interface MFASetupData {
  secret: string;
  qrCode: string;
  backupCodes: string[];
}

/**
 * MFA Service
 * Handles TOTP-based multi-factor authentication
 */
export class MFAService {
  private readonly APP_NAME = 'Olive Garden Admin';
  private readonly BACKUP_CODE_COUNT = 10;

  /**
   * Generate MFA secret and QR code for user
   */
  async setupMFA(userId: string, email: string): Promise<MFASetupData> {
    // Generate TOTP secret
    const secret = generateSecret({ length: 20 });

    // Generate OTP auth URL for QR code (defaults to TOTP)
    const otpauth = generateURI({
      issuer: this.APP_NAME,
      label: email,
      secret,
    });

    // Generate QR code as data URL
    const qrCode = await qrcode.toDataURL(otpauth);

    // Generate backup codes
    const backupCodes = this.generateBackupCodes(this.BACKUP_CODE_COUNT);

    // Hash backup codes before storage
    const hashedBackupCodes = backupCodes.map((code) => this.hashBackupCode(code));

    // Store secret and hashed backup codes in database
    // MFA is not enabled yet - user must verify TOTP first
    await query(
      `UPDATE users 
       SET mfa_secret = $1, 
           mfa_backup_codes = $2,
           mfa_enabled = FALSE
       WHERE id = $3`,
      [encryptSecret(secret), JSON.stringify(hashedBackupCodes), userId]
    );

    // Return plain backup codes to user (only time they see them)
    return {
      secret,
      qrCode,
      backupCodes,
    };
  }

  /**
   * Verify TOTP code and enable MFA
   */
  async verifyAndEnableMFA(userId: string, token: string): Promise<boolean> {
    // Get secret from database
    const result = await query('SELECT mfa_secret FROM users WHERE id = $1', [userId]);

    if (result.rows.length === 0) {
      return false;
    }

    const { mfa_secret } = result.rows[0];

    if (!mfa_secret) {
      return false;
    }

    const secret = decryptSecret(mfa_secret);
    if (!secret) {
      return false;
    }

    // Verify TOTP token
    const verifyResult = await verify({
      token,
      secret,
      crypto,
      base32,
    });

    const isValid = verifyResult.valid;

    if (isValid) {
      // Enable MFA for user
      await query('UPDATE users SET mfa_enabled = TRUE WHERE id = $1', [userId]);
    }

    return isValid;
  }

  /**
   * Verify TOTP code during login
   */
  async verifyTOTP(userId: string, token: string): Promise<boolean> {
    // Get secret and MFA status from database
    const result = await query('SELECT mfa_secret, mfa_enabled FROM users WHERE id = $1', [userId]);

    if (result.rows.length === 0 || !result.rows[0].mfa_enabled) {
      return false;
    }

    const { mfa_secret } = result.rows[0];

    if (!mfa_secret) {
      return false;
    }

    const secret = decryptSecret(mfa_secret);
    if (!secret) {
      return false;
    }

    // Verify TOTP with time tolerance for clock drift
    // epochTolerance=30 allows codes from 1 step before/after current time (30s window)
    const verifyResult = await verify({
      token,
      secret,
      crypto,
      base32,
      epochTolerance: 30,
    });

    return verifyResult.valid;
  }

  /**
   * Verify and invalidate backup code
   */
  async verifyBackupCode(userId: string, code: string): Promise<boolean> {
    // Get backup codes from database
    const result = await query('SELECT mfa_backup_codes FROM users WHERE id = $1', [userId]);

    if (result.rows.length === 0) {
      return false;
    }

    const backupCodesJson = result.rows[0].mfa_backup_codes;

    if (!backupCodesJson) {
      return false;
    }

    try {
      const backupCodes: string[] = JSON.parse(backupCodesJson);
      const hashedCode = this.hashBackupCode(code);
      const legacyHash = createHash('sha256').update(code).digest('hex');

      // Accept the current keyed hash, plus unsalted hashes written before the
      // keyed hashing migration.
      const index = backupCodes.indexOf(hashedCode);
      const resolvedIndex = index === -1 ? backupCodes.indexOf(legacyHash) : index;

      if (resolvedIndex === -1) {
        return false; // Code not found
      }

      // Remove used backup code
      backupCodes.splice(resolvedIndex, 1);

      // Update database with remaining codes
      await query('UPDATE users SET mfa_backup_codes = $1 WHERE id = $2', [
        JSON.stringify(backupCodes),
        userId,
      ]);

      return true;
    } catch (error) {
      console.error('Error parsing backup codes:', error);
      return false;
    }
  }

  /**
   * Disable MFA for user
   */
  async disableMFA(userId: string): Promise<void> {
    await query(
      `UPDATE users 
       SET mfa_enabled = FALSE, 
           mfa_secret = NULL, 
           mfa_backup_codes = NULL 
       WHERE id = $1`,
      [userId]
    );
  }

  /**
   * Generate backup codes
   */
  private generateBackupCodes(count: number): string[] {
    const codes: string[] = [];

    for (let i = 0; i < count; i++) {
      // 8 bytes = 64 bits of entropy per backup code
      const code = randomBytes(8).toString('hex').toUpperCase();
      codes.push(code);
    }

    return codes;
  }

  /**
   * Hash backup code with a keyed HMAC so a database leak alone cannot recover
   * codes offline (the previous unsalted SHA-256 was brute-forceable).
   */
  private hashBackupCode(code: string): string {
    return createHmac('sha256', MFA_KEY).update(code).digest('hex');
  }
}

export default new MFAService();

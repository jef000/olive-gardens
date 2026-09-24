import config from '../config/env';
import { getMailer } from '../services/mailer.service';
import {
  generateTemporaryPasswordEmail,
  generatePasswordChangeConfirmationEmail,
  generatePasswordResetEmail,
} from './emailTemplates';

/**
 * Email Service for Authentication and User Management
 *
 * Security Considerations:
 * - Uses environment variables for credentials
 * - Supports both real SMTP and a development relay
 * - Does not expose user existence in responses
 * - All emails are logged for audit purposes
 *
 * Transport concerns live in services/mailer.service, which reuses a single
 * SMTP transporter for the lifetime of the process.
 */

/**
 * Send password reset email
 * Security: Token is sent via secure link, email does not reveal if user exists
 */
export const sendPasswordResetEmail = async (email: string, resetToken: string): Promise<void> => {
  const resetUrl = `${config.frontend.url}/reset-password?token=${resetToken}`;
  const { html, text } = generatePasswordResetEmail({ email, resetUrl });

  try {
    await getMailer().send({
      to: email,
      subject: 'Password Reset Request - Olive Garden Gateway',
      html,
      text,
    });
    console.log(`📧 Password reset email sent to: ${email}`);
  } catch (error) {
    console.error('❌ Failed to send password reset email:', error);
    if (config.isDevelopment) {
      console.log('🔗 Development reset link:', resetUrl);
      console.log('⚠️  Email not sent - using development mode (reset link logged above)');
      // Don't throw error in development - allow password reset to proceed
      return;
    }
    throw new Error('Failed to send password reset email');
  }
};

/**
 * Send temporary password email to newly created user
 * Security: Password sent once via email, must be changed on first login
 */
export const sendTemporaryPasswordEmail = async (
  email: string,
  temporaryPassword: string,
  expiryHours: number = 24
): Promise<void> => {
  const loginUrl = `${config.frontend.url}/login`;
  const { html, text } = generateTemporaryPasswordEmail({
    email,
    temporaryPassword,
    expiryHours,
    loginUrl,
  });

  try {
    await getMailer().send({
      to: email,
      subject: 'Welcome to Olive Garden - Your Temporary Password',
      html,
      text,
    });
    console.log(`📧 Temporary password email sent to: ${email}`);
  } catch (error) {
    console.error('❌ Failed to send temporary password email:', error);
    if (config.isDevelopment) {
      console.log('🔑 Development temporary password:', temporaryPassword);
      console.log('⚠️  Email not sent - using development mode (password logged above)');
      // Don't throw error in development - allow user creation to proceed
      return;
    }
    throw new Error('Failed to send temporary password email');
  }
};

/**
 * Send password change confirmation email
 * Security: Notifies user of password change for security awareness
 */
export const sendPasswordChangeConfirmationEmail = async (email: string): Promise<void> => {
  const { html, text } = generatePasswordChangeConfirmationEmail(email);

  try {
    await getMailer().send({
      to: email,
      subject: 'Password Changed Successfully - Olive Garden',
      html,
      text,
    });
    console.log(`📧 Password change confirmation sent to: ${email}`);
  } catch (error) {
    console.error('❌ Failed to send password change confirmation:', error);
    // Don't throw error - this is a non-critical notification
  }
};

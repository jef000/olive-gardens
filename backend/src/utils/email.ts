import nodemailer from 'nodemailer';
import config from '../config/env';
import { 
  generateTemporaryPasswordEmail, 
  generatePasswordChangeConfirmationEmail,
  generatePasswordResetEmail
} from './emailTemplates';

/**
 * Email Service for Authentication and User Management
 * 
 * Security Considerations:
 * - Uses environment variables for credentials
 * - Supports both real SMTP and mock email for development
 * - Does not expose user existence in responses
 * - All emails are logged for audit purposes
 */

const createTransporter = () => {
  if (!config.email.user || !config.email.password) {
    console.warn('⚠️  Email credentials not configured. Using mock email service.');
    return nodemailer.createTransport({
      host: 'localhost',
      port: 1025,
      secure: false,
      ignoreTLS: true,
    });
  }

  // Debug logging to verify credentials are read correctly
  console.log(`📧 Setting up email transport with host: ${config.email.host}, user: ${config.email.user}`);

  return nodemailer.createTransport({
    host: config.email.host,
    port: config.email.port,
    secure: config.email.secure,
    auth: {
      user: config.email.user,
      pass: config.email.password,
    },
  });
};

/**
 * Send password reset email
 * Security: Token is sent via secure link, email does not reveal if user exists
 */
export const sendPasswordResetEmail = async (
  email: string,
  resetToken: string
): Promise<void> => {
  const transporter = createTransporter();
  
  const resetUrl = `${config.frontend.url}/reset-password?token=${resetToken}`;
  const { html, text } = generatePasswordResetEmail({ email, resetUrl });
  
  const mailOptions = {
    from: config.email.from,
    to: email,
    subject: 'Password Reset Request - Olive Garden Gateway',
    html,
    text,
  };

  try {
    await transporter.sendMail(mailOptions);
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
  const transporter = createTransporter();
  
  const loginUrl = `${config.frontend.url}/login`;
  const { html, text } = generateTemporaryPasswordEmail({
    email,
    temporaryPassword,
    expiryHours,
    loginUrl,
  });
  
  const mailOptions = {
    from: config.email.from,
    to: email,
    subject: 'Welcome to Olive Garden - Your Temporary Password',
    html,
    text,
  };

  try {
    await transporter.sendMail(mailOptions);
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
export const sendPasswordChangeConfirmationEmail = async (
  email: string
): Promise<void> => {
  const transporter = createTransporter();
  
  const { html, text } = generatePasswordChangeConfirmationEmail(email);
  
  const mailOptions = {
    from: config.email.from,
    to: email,
    subject: 'Password Changed Successfully - Olive Garden',
    html,
    text,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`📧 Password change confirmation sent to: ${email}`);
  } catch (error) {
    console.error('❌ Failed to send password change confirmation:', error);
    // Don't throw error - this is a non-critical notification
  }
};

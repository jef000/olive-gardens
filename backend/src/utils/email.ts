import nodemailer from 'nodemailer';
import config from '../config/env';

/**
 * Email Service for Password Reset
 * 
 * Security Considerations:
 * - Uses environment variables for credentials
 * - Supports both real SMTP and mock email for development
 * - Does not expose user existence in responses
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
  
  const mailOptions = {
    from: config.email.from,
    to: email,
    subject: 'Password Reset Request - Olive Garden Gateway',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #4a5568; color: white; padding: 20px; text-align: center; }
            .content { background: #f7fafc; padding: 30px; border-radius: 5px; margin-top: 20px; }
            .button { display: inline-block; padding: 12px 24px; background: #4a5568; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #718096; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Password Reset Request</h1>
            </div>
            <div class="content">
              <p>Hello,</p>
              <p>We received a request to reset your password for your Olive Garden Gateway account.</p>
              <p>Click the button below to reset your password:</p>
              <p style="text-align: center;">
                <a href="${resetUrl}" class="button">Reset Password</a>
              </p>
              <p>Or copy and paste this link into your browser:</p>
              <p style="word-break: break-all; background: white; padding: 10px; border-radius: 3px;">
                ${resetUrl}
              </p>
              <p><strong>This link will expire in 1 hour.</strong></p>
              <p>If you didn't request this password reset, please ignore this email. Your password will remain unchanged.</p>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} Olive Garden Gateway. All rights reserved.</p>
              <p>This is an automated email. Please do not reply.</p>
            </div>
          </div>
        </body>
      </html>
    `,
    text: `
      Password Reset Request
      
      Hello,
      
      We received a request to reset your password for your Olive Garden Gateway account.
      
      Click the link below to reset your password:
      ${resetUrl}
      
      This link will expire in 1 hour.
      
      If you didn't request this password reset, please ignore this email.
      
      © ${new Date().getFullYear()} Olive Garden Gateway
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`📧 Password reset email sent to: ${email}`);
  } catch (error) {
    console.error('❌ Failed to send password reset email:', error);
    if (config.isDevelopment) {
      console.log('🔗 Development reset link:', resetUrl);
    }
    throw new Error('Failed to send password reset email');
  }
};

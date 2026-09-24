import Mailgen from 'mailgen';
import config from '../config/env';
import { encodeSpecialChars, sanitizeHTML, sanitizeText } from './sanitizer';

/**
 * Modern Email Templates Generator using Mailgen
 *
 * Provides responsive, highly tested email templates that look great
 * across all major email clients including Outlook, Apple Mail, and mobile apps.
 */

// Initialize Mailgen generator with theme and branding
const mailGenerator = new Mailgen({
  theme: 'default',
  product: {
    name: 'Olive Garden Gateway',
    link: config.frontend.url, // Points to the frontend application
    // Add a logo here when available
    // logo: 'https://your-app-domain.com/logo.png',
    copyright: `© ${new Date().getFullYear()} Olive Garden Gateway. All rights reserved.`,
  },
});

interface TemporaryPasswordEmailData {
  email: string;
  temporaryPassword: string;
  expiryHours: number;
  loginUrl: string;
}

interface PasswordResetEmailData {
  email: string;
  resetUrl: string;
}

/**
 * Generate email for temporary password onboarding
 */
export const generateTemporaryPasswordEmail = (
  data: TemporaryPasswordEmailData
): { html: string; text: string } => {
  const emailBody = {
    body: {
      title: 'Welcome to Olive Garden Gateway',
      name: data.email,
      intro: [
        'Welcome aboard! Your account has been successfully created.',
        'To get started, please use the temporary password generated below to log into the system.',
      ],
      dictionary: {
        'Temporary Password': data.temporaryPassword,
        'Expires In': `${data.expiryHours} hours`,
      },
      action: {
        instructions:
          'Click the button below to sign in. For security reasons, you will be required to change this password immediately upon your first login.',
        button: {
          color: '#8b9172', // Olive Garden brand color
          text: 'Login to Your Account',
          link: data.loginUrl,
        },
      },
      outro: [
        '🔒 **Security Best Practices:**',
        '• Do not share this temporary password with anyone.',
        '• This password is for one-time initial access only.',
        '• When creating your new password, ensure it is at least 8 characters long and includes a mix of uppercase letters, lowercase letters, numbers, and special characters.',
      ],
    },
  };

  return {
    html: mailGenerator.generate(emailBody),
    text: mailGenerator.generatePlaintext(emailBody),
  };
};

/**
 * Generate email for password reset requests
 */
export const generatePasswordResetEmail = (
  data: PasswordResetEmailData
): { html: string; text: string } => {
  const emailBody = {
    body: {
      title: 'Password Reset Request',
      name: data.email,
      intro:
        'We received a request to reset the password associated with your Olive Garden Gateway account.',
      action: {
        instructions:
          'If you initiated this request, click the button below to securely reset your password. Please note that this link will expire in **1 hour**.',
        button: {
          color: '#4a5568',
          text: 'Reset Password',
          link: data.resetUrl,
        },
      },
      outro: [
        'If you did not request a password reset, no further action is required on your part and your current password will remain unchanged.',
        'If you have any concerns about the security of your account, please contact your administrator immediately.',
      ],
    },
  };

  return {
    html: mailGenerator.generate(emailBody),
    text: mailGenerator.generatePlaintext(emailBody),
  };
};

/**
 * Generate email for successful password change confirmation
 */
export const generatePasswordChangeConfirmationEmail = (
  email: string
): { html: string; text: string } => {
  const emailBody = {
    body: {
      title: '🔒 Password Changed Successfully',
      name: email,
      intro: `This is a confirmation that the password for your Olive Garden Gateway account was successfully changed on **${new Date().toLocaleString()}**.`,
      action: {
        instructions: 'You can now access your account using your new password.',
        button: {
          color: '#8b9172',
          text: 'Go to Dashboard',
          link: config.frontend.url,
        },
      },
      outro: [
        '**Did you make this change?**',
        'If you changed your password, you can safely ignore this email.',
        '',
        "**Didn't change your password?**",
        'If you did not make this change, your account may be compromised. Please contact your system administrator immediately to secure your account.',
      ],
    },
  };

  return {
    html: mailGenerator.generate(emailBody),
    text: mailGenerator.generatePlaintext(emailBody),
  };
};

interface InquiryReplyEmailData {
  customerName: string;
  bodyHtml: string;
  originalMessage: string;
}

/** Convert allow-listed reply HTML into a readable plain-text alternative. */
function htmlToPlainText(html: string): string {
  const withBreaks = html.replace(/<br\s*\/?>/gi, '\n').replace(/<\/(p|li|h[1-6]|div)>/gi, '\n');
  return sanitizeText(withBreaks)
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/**
 * Generate the email sent to a customer when an admin replies to their inquiry.
 * The reply is admin-authored rich text (already sanitized against the shared
 * allow-list); the quoted original comes from a public form and is HTML-encoded.
 * Hand-built rather than templated so the admin preview and the delivered email
 * render from exactly the same markup.
 */
export const generateInquiryReplyEmail = (
  data: InquiryReplyEmailData
): { html: string; text: string } => {
  const bodyHtml = sanitizeHTML(data.bodyHtml);
  const plainBody = htmlToPlainText(bodyHtml);
  const customerName = encodeSpecialChars(data.customerName);
  const quotedMessage = encodeSpecialChars(sanitizeText(data.originalMessage));

  const html = `<!doctype html>
<html lang="en">
  <body style="margin:0;padding:0;background-color:#f4f5f0;font-family:'Segoe UI',Helvetica,Arial,sans-serif;">
    <div style="max-width:560px;margin:0 auto;padding:24px 16px;">
      <div style="overflow:hidden;border:1px solid #e2e4d9;border-radius:12px;background-color:#ffffff;">
        <div style="background-color:#8b9172;padding:18px 24px;color:#ffffff;font-size:16px;font-weight:600;letter-spacing:0.02em;">
          Olive Garden Gateway
        </div>
        <div style="padding:24px;color:#1f2937;font-size:15px;line-height:1.7;">
          <p style="margin:0 0 16px;">Hello ${customerName},</p>
          <div>${bodyHtml}</div>
          <div style="margin-top:24px;border-left:3px solid #d8dec0;background-color:#f9faf7;padding:14px 16px;color:#4b5563;font-size:13px;line-height:1.6;">
            <p style="margin:0 0 8px;font-weight:600;color:#6f7455;">Your original message</p>
            <div style="white-space:pre-line;">${quotedMessage}</div>
          </div>
          <p style="margin:24px 0 0;">Warm regards,<br />The Olive Garden team</p>
        </div>
        <div style="background-color:#f3f4f6;padding:14px 24px;color:#6b7280;font-size:12px;">
          You are receiving this email because you contacted Olive Garden Gateway.
        </div>
      </div>
    </div>
  </body>
</html>`;

  const text = [
    `Hello ${data.customerName},`,
    '',
    plainBody,
    '',
    '--- Your original message ---',
    sanitizeText(data.originalMessage),
    '',
    'Warm regards,',
    'The Olive Garden team',
  ].join('\n');

  return { html, text };
};

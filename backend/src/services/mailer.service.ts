import nodemailer, { type Transporter } from 'nodemailer';
import config from '../config/env';

export interface MailMessage {
  to: string;
  subject: string;
  html: string;
  text: string;
}

export interface Mailer {
  send(message: MailMessage): Promise<{ messageId: string }>;
}

let cachedTransporter: Transporter | null = null;

/**
 * One transporter per process. The previous implementation created a new SMTP
 * connection pool on every send, which leaks sockets and re-authenticates
 * unnecessarily.
 */
function getTransporter(): Transporter {
  if (cachedTransporter) return cachedTransporter;

  if (!config.email.user || !config.email.password) {
    console.warn(
      '⚠️  Email credentials not configured. Using development SMTP relay on localhost:1025.'
    );
    cachedTransporter = nodemailer.createTransport({
      host: 'localhost',
      port: 1025,
      secure: false,
      ignoreTLS: true,
    });
    return cachedTransporter;
  }

  cachedTransporter = nodemailer.createTransport({
    host: config.email.host,
    port: config.email.port,
    secure: config.email.secure,
    auth: {
      user: config.email.user,
      pass: config.email.password,
    },
  });
  return cachedTransporter;
}

export const smtpMailer: Mailer = {
  async send(message: MailMessage) {
    const info = await getTransporter().sendMail({
      from: config.email.from,
      to: message.to,
      subject: message.subject,
      html: message.html,
      text: message.text,
    });
    return { messageId: info.messageId };
  },
};

export function getMailer(): Mailer {
  return smtpMailer;
}

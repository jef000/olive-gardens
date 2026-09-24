import { getMailer, type Mailer } from './mailer.service';
import { generateInquiryReplyEmail } from '../utils/emailTemplates';
import { sanitizeHTML, sanitizeText } from '../utils/sanitizer';
import type { InquiryReplyStore, ReplyRecord } from './inquiryReply.store';
import { postgresInquiryReplyStore } from './inquiryReply.postgres.store';

export const REPLY_SUBJECT = 'Re: Your inquiry to Olive Garden Gateway';

export type InquiryReplyErrorCode = 'not_found' | 'already_sent' | 'invalid_body';

export class InquiryReplyError extends Error {
  constructor(
    message: string,
    readonly code: InquiryReplyErrorCode
  ) {
    super(message);
    this.name = 'InquiryReplyError';
  }
}

export interface ReplyPreview {
  subject: string;
  html: string;
  text: string;
}

export interface InquiryReplyService {
  queueReply(inquiryId: string, body: string): Promise<ReplyRecord>;
  deliver(replyId: string): Promise<ReplyRecord | null>;
  retry(replyId: string): Promise<ReplyRecord>;
  listReplies(inquiryId: string): Promise<ReplyRecord[]>;
  previewReply(inquiryId: string, body: string): Promise<ReplyPreview>;
  recoverQueued(): Promise<number>;
}

export interface CreateInquiryReplyServiceOptions {
  store?: InquiryReplyStore;
  mailer?: Mailer;
  /** When false, queueReply/retry leave delivery to the caller (used in tests). */
  autoDeliver?: boolean;
}

const MAX_ERROR_LENGTH = 500;

function errorMessage(error: unknown): string {
  const message = error instanceof Error ? error.message : 'Unknown delivery error';
  return message.slice(0, MAX_ERROR_LENGTH);
}

/** Keep only allow-listed rich-text markup; reject bodies that sanitize to nothing. */
function sanitizeReplyBody(body: string): string {
  const safeBody = sanitizeHTML(body);
  if (!sanitizeText(safeBody)) {
    throw new InquiryReplyError('Reply body is empty', 'invalid_body');
  }
  return safeBody;
}

export function createInquiryReplyService({
  store = postgresInquiryReplyStore,
  mailer = getMailer(),
  autoDeliver = true,
}: CreateInquiryReplyServiceOptions = {}): InquiryReplyService {
  const dispatch = (replyId: string) => {
    void deliver(replyId).catch((error) => {
      console.error('❌ Inquiry reply dispatch failed:', error);
    });
  };

  const deliver = async (replyId: string): Promise<ReplyRecord | null> => {
    const reply = await store.findReply(replyId);
    if (!reply || reply.status === 'sent') return reply;

    const claimed = await store.markAttempt(replyId);
    if (!claimed) {
      // Another worker already claimed (or completed) this delivery.
      return store.findReply(replyId);
    }

    const inquiry = await store.findInquiry(reply.inquiryId);
    if (!inquiry) {
      return store.markFailed(replyId, 'The original inquiry no longer exists');
    }

    try {
      const { html, text } = generateInquiryReplyEmail({
        customerName: inquiry.customerName,
        bodyHtml: reply.body,
        originalMessage: inquiry.message,
      });
      await mailer.send({ to: reply.toEmail, subject: reply.subject, html, text });
      const sent = await store.markSent(replyId);
      await store.markInquiryReplied(reply.inquiryId);
      return sent;
    } catch (error) {
      return store.markFailed(replyId, errorMessage(error));
    }
  };

  const queueReply = async (inquiryId: string, body: string): Promise<ReplyRecord> => {
    const inquiry = await store.findInquiry(inquiryId);
    if (!inquiry) {
      throw new InquiryReplyError('Inquiry not found', 'not_found');
    }

    const reply = await store.createReply({
      inquiryId,
      toEmail: inquiry.email,
      subject: REPLY_SUBJECT,
      body: sanitizeReplyBody(body),
    });

    if (autoDeliver) dispatch(reply.id);
    return reply;
  };

  const retry = async (replyId: string): Promise<ReplyRecord> => {
    const reply = await store.findReply(replyId);
    if (!reply) {
      throw new InquiryReplyError('Reply not found', 'not_found');
    }
    if (reply.status === 'sent') {
      throw new InquiryReplyError('This reply has already been sent', 'already_sent');
    }

    if (autoDeliver) {
      dispatch(replyId);
      return (await store.findReply(replyId)) ?? reply;
    }
    return reply;
  };

  const listReplies = (inquiryId: string) => store.listReplies(inquiryId);

  const previewReply = async (inquiryId: string, body: string): Promise<ReplyPreview> => {
    const inquiry = await store.findInquiry(inquiryId);
    if (!inquiry) {
      throw new InquiryReplyError('Inquiry not found', 'not_found');
    }

    const { html, text } = generateInquiryReplyEmail({
      customerName: inquiry.customerName,
      bodyHtml: sanitizeReplyBody(body),
      originalMessage: inquiry.message,
    });

    return { subject: REPLY_SUBJECT, html, text };
  };

  const recoverQueued = async (): Promise<number> => {
    const queued = await store.listQueued();
    queued.forEach((reply) => dispatch(reply.id));
    return queued.length;
  };

  return { queueReply, deliver, retry, listReplies, previewReply, recoverQueued };
}

const inquiryReplyService = createInquiryReplyService();

export default inquiryReplyService;

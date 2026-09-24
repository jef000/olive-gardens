import { query } from '../db/pool';
import type {
  InquiryContext,
  InquiryReplyStore,
  NewReply,
  ReplyRecord,
} from './inquiryReply.store';

interface ReplyRow {
  id: string;
  inquiry_id: string;
  to_email: string;
  subject: string;
  body: string;
  status: ReplyRecord['status'];
  error: string | null;
  attempts: number;
  sent_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

interface InquiryRow {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  message: string;
}

function toRecord(row: ReplyRow): ReplyRecord {
  return {
    id: row.id,
    inquiryId: row.inquiry_id,
    toEmail: row.to_email,
    subject: row.subject,
    body: row.body,
    status: row.status,
    error: row.error,
    attempts: row.attempts,
    sentAt: row.sent_at ? row.sent_at.toISOString() : null,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  };
}

export const postgresInquiryReplyStore: InquiryReplyStore = {
  async findInquiry(inquiryId: string): Promise<InquiryContext | null> {
    const result = await query<InquiryRow>(
      'SELECT id, first_name, last_name, email, message FROM inquiries WHERE id = $1',
      [inquiryId]
    );
    const row = result.rows[0];
    if (!row) return null;
    return {
      id: row.id,
      customerName: `${row.first_name} ${row.last_name}`.trim(),
      email: row.email,
      message: row.message,
    };
  },

  async createReply(reply: NewReply): Promise<ReplyRecord> {
    const result = await query<ReplyRow>(
      `INSERT INTO inquiry_replies (inquiry_id, to_email, subject, body, status)
       VALUES ($1, $2, $3, $4, 'queued')
       RETURNING *`,
      [reply.inquiryId, reply.toEmail, reply.subject, reply.body]
    );
    return toRecord(result.rows[0]);
  },

  async findReply(replyId: string): Promise<ReplyRecord | null> {
    const result = await query<ReplyRow>('SELECT * FROM inquiry_replies WHERE id = $1', [replyId]);
    return result.rows[0] ? toRecord(result.rows[0]) : null;
  },

  async listReplies(inquiryId: string): Promise<ReplyRecord[]> {
    const result = await query<ReplyRow>(
      'SELECT * FROM inquiry_replies WHERE inquiry_id = $1 ORDER BY created_at DESC',
      [inquiryId]
    );
    return result.rows.map(toRecord);
  },

  async listQueued(): Promise<ReplyRecord[]> {
    const result = await query<ReplyRow>("SELECT * FROM inquiry_replies WHERE status = 'queued'");
    return result.rows.map(toRecord);
  },

  async markAttempt(replyId: string): Promise<ReplyRecord | null> {
    // The status guard turns this into an atomic claim: only one worker can
    // move a reply from queued/failed into the sending state.
    const result = await query<ReplyRow>(
      `UPDATE inquiry_replies
       SET status = 'queued', error = NULL, attempts = attempts + 1, updated_at = NOW()
       WHERE id = $1 AND status IN ('queued', 'failed')
       RETURNING *`,
      [replyId]
    );
    return result.rows[0] ? toRecord(result.rows[0]) : null;
  },

  async markSent(replyId: string): Promise<ReplyRecord | null> {
    const result = await query<ReplyRow>(
      `UPDATE inquiry_replies
       SET status = 'sent', error = NULL, sent_at = NOW(), updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [replyId]
    );
    return result.rows[0] ? toRecord(result.rows[0]) : null;
  },

  async markFailed(replyId: string, error: string): Promise<ReplyRecord | null> {
    const result = await query<ReplyRow>(
      `UPDATE inquiry_replies
       SET status = 'failed', error = $2, updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [replyId, error]
    );
    return result.rows[0] ? toRecord(result.rows[0]) : null;
  },

  async markInquiryReplied(inquiryId: string): Promise<void> {
    await query(
      `UPDATE inquiries SET status = 'replied', updated_at = NOW()
       WHERE id = $1 AND status NOT IN ('replied', 'archived')`,
      [inquiryId]
    );
  },
};

export type ReplyStatus = 'queued' | 'sent' | 'failed';

export interface InquiryContext {
  id: string;
  customerName: string;
  email: string;
  message: string;
}

export interface ReplyRecord {
  id: string;
  inquiryId: string;
  toEmail: string;
  subject: string;
  body: string;
  status: ReplyStatus;
  error: string | null;
  attempts: number;
  sentAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface NewReply {
  inquiryId: string;
  toEmail: string;
  subject: string;
  body: string;
}

export interface InquiryReplyStore {
  findInquiry(inquiryId: string): Promise<InquiryContext | null>;
  createReply(reply: NewReply): Promise<ReplyRecord>;
  findReply(replyId: string): Promise<ReplyRecord | null>;
  listReplies(inquiryId: string): Promise<ReplyRecord[]>;
  listQueued(): Promise<ReplyRecord[]>;
  markAttempt(replyId: string): Promise<ReplyRecord | null>;
  markSent(replyId: string): Promise<ReplyRecord | null>;
  markFailed(replyId: string, error: string): Promise<ReplyRecord | null>;
  markInquiryReplied(inquiryId: string): Promise<void>;
}

/**
 * In-memory substitute for the Postgres store. It lets the reply logic run in
 * tests (and local experiments) without a database, through the same interface
 * the production adapter implements.
 */
export type MemoryInquiryReplyStore = InquiryReplyStore & {
  wasInquiryMarkedReplied(inquiryId: string): boolean;
};

export function createMemoryInquiryReplyStore(
  inquiries: InquiryContext[] = []
): MemoryInquiryReplyStore {
  const inquiryById = new Map(inquiries.map((inquiry) => [inquiry.id, inquiry]));
  const replies = new Map<string, ReplyRecord>();
  const repliedInquiries = new Set<string>();
  const now = () => new Date().toISOString();
  let sequence = 0;

  const update = (replyId: string, patch: Partial<ReplyRecord>): ReplyRecord | null => {
    const existing = replies.get(replyId);
    if (!existing) return null;
    const updated = { ...existing, ...patch, updatedAt: now() };
    replies.set(replyId, updated);
    return updated;
  };

  return {
    async findInquiry(inquiryId) {
      return inquiryById.get(inquiryId) ?? null;
    },
    async createReply(reply) {
      sequence += 1;
      const record: ReplyRecord = {
        id: `reply-${sequence}`,
        inquiryId: reply.inquiryId,
        toEmail: reply.toEmail,
        subject: reply.subject,
        body: reply.body,
        status: 'queued',
        error: null,
        attempts: 0,
        sentAt: null,
        createdAt: now(),
        updatedAt: now(),
      };
      replies.set(record.id, record);
      return record;
    },
    async findReply(replyId) {
      return replies.get(replyId) ?? null;
    },
    async listReplies(inquiryId) {
      return [...replies.values()]
        .filter((reply) => reply.inquiryId === inquiryId)
        .sort((left, right) => right.createdAt.localeCompare(left.createdAt));
    },
    async listQueued() {
      return [...replies.values()].filter((reply) => reply.status === 'queued');
    },
    async markAttempt(replyId) {
      const existing = replies.get(replyId);
      if (!existing || existing.status === 'sent') return null;
      return update(replyId, { status: 'queued', error: null, attempts: existing.attempts + 1 });
    },
    async markSent(replyId) {
      return update(replyId, { status: 'sent', error: null, sentAt: now() });
    },
    async markFailed(replyId, error) {
      return update(replyId, { status: 'failed', error });
    },
    async markInquiryReplied(inquiryId) {
      if (inquiryById.has(inquiryId)) repliedInquiries.add(inquiryId);
    },
    wasInquiryMarkedReplied(inquiryId: string) {
      return repliedInquiries.has(inquiryId);
    },
  };
}

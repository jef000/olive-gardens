import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import { createMemoryInquiryReplyStore, type InquiryContext } from '../../src/services/inquiryReply.store';
import { createInquiryReplyService, InquiryReplyError, REPLY_SUBJECT } from '../../src/services/inquiryReply.service';
import type { Mailer, MailMessage } from '../../src/services/mailer.service';

const inquiry: InquiryContext = {
  id: 'inquiry-1',
  customerName: 'Ana Wanjiru',
  email: 'ana@example.com',
  message: 'Do you host garden weddings in December?',
};

function createMailer() {
  const sent: MailMessage[] = [];
  let failNext = false;
  const mailer: Mailer = {
    async send(message) {
      if (failNext) {
        failNext = false;
        throw new Error('SMTP connection refused');
      }
      sent.push(message);
      return { messageId: `msg-${sent.length}` };
    },
  };
  return { mailer, sent, failNext: () => { failNext = true; } };
}

function createService() {
  const store = createMemoryInquiryReplyStore([inquiry]);
  const { mailer, sent, failNext } = createMailer();
  const service = createInquiryReplyService({ store, mailer, autoDeliver: false });
  return { service, store, sent, failNext };
}

test('queues a reply addressed to the email stored on the inquiry', async () => {
  const { service, sent } = createService();

  const reply = await service.queueReply(inquiry.id, 'Yes — December is available.');

  assert.equal(reply.status, 'queued');
  assert.equal(reply.toEmail, inquiry.email);
  assert.equal(reply.subject, REPLY_SUBJECT);

  const delivered = await service.deliver(reply.id);

  assert.equal(delivered?.status, 'sent');
  assert.equal(sent.length, 1);
  assert.equal(sent[0].to, inquiry.email);
  assert.match(sent[0].text, /December is available/);
  assert.match(sent[0].text, /garden weddings in December/);
});

test('marks the inquiry as replied after a successful send', async () => {
  const { service, store } = createService();

  const reply = await service.queueReply(inquiry.id, 'Thanks for reaching out.');
  await service.deliver(reply.id);

  const replies = await service.listReplies(inquiry.id);
  assert.equal(replies.length, 1);
  assert.equal(replies[0].status, 'sent');
  assert.equal(replies[0].attempts, 1);
  assert.ok(replies[0].sentAt);
  assert.equal(store.wasInquiryMarkedReplied(inquiry.id), true);
});

test('records failures with the error message and attempt count', async () => {
  const { service, failNext } = createService();
  failNext();

  const reply = await service.queueReply(inquiry.id, 'This one fails.');
  const failed = await service.deliver(reply.id);

  assert.equal(failed?.status, 'failed');
  assert.equal(failed?.attempts, 1);
  assert.match(failed?.error ?? '', /SMTP connection refused/);
});

test('retries a failed reply and can reach sent', async () => {
  const { service, failNext, sent } = createService();
  failNext();

  const reply = await service.queueReply(inquiry.id, 'Retry me.');
  await service.deliver(reply.id);

  await service.retry(reply.id);
  const retried = await service.deliver(reply.id);

  assert.equal(retried?.status, 'sent');
  assert.equal(retried?.attempts, 2);
  assert.equal(sent.length, 1);
});

test('refuses to retry a reply that was already sent', async () => {
  const { service } = createService();

  const reply = await service.queueReply(inquiry.id, 'Already delivered.');
  await service.deliver(reply.id);

  await assert.rejects(
    () => service.retry(reply.id),
    (error: unknown) => error instanceof InquiryReplyError && error.code === 'already_sent'
  );
});

test('rejects unknown inquiries and unknown replies', async () => {
  const { service } = createService();

  await assert.rejects(
    () => service.queueReply('missing-inquiry', 'Hello'),
    (error: unknown) => error instanceof InquiryReplyError && error.code === 'not_found'
  );

  await assert.rejects(
    () => service.retry('missing-reply'),
    (error: unknown) => error instanceof InquiryReplyError && error.code === 'not_found'
  );
});

test('recoverQueued re-dispatches replies left queued after a crash', async () => {
  const store = createMemoryInquiryReplyStore([inquiry]);
  const { mailer, sent } = createMailer();
  const service = createInquiryReplyService({ store, mailer, autoDeliver: false });

  await service.queueReply(inquiry.id, 'Queued before shutdown.');
  const count = await service.recoverQueued();

  assert.equal(count, 1);
  await new Promise((resolve) => setTimeout(resolve, 0));
  assert.equal(sent.length, 1);
});

test('keeps safe rich-text formatting and drops scripts from the body', async () => {
  const { service, sent } = createService();

  const reply = await service.queueReply(
    inquiry.id,
    '<p>Hi <strong>Ana</strong></p><script>alert(1)</script><ul><li>Option one</li></ul>'
  );
  await service.deliver(reply.id);

  const html = sent[0].html;
  assert.match(html, /<strong>Ana<\/strong>/);
  assert.match(html, /<li>Option one<\/li>/);
  assert.doesNotMatch(html, /<script>/);
  assert.match(sent[0].text, /Hi Ana/);
  assert.match(sent[0].text, /Option one/);
});

test('rejects a body that sanitizes to nothing', async () => {
  const { service } = createService();

  await assert.rejects(
    () => service.queueReply(inquiry.id, '<script>alert(1)</script>'),
    (error: unknown) => error instanceof InquiryReplyError && error.code === 'invalid_body'
  );
});

test('previewReply renders the exact email that would be sent', async () => {
  const { service } = createService();

  const preview = await service.previewReply(inquiry.id, '<p>See you <em>soon</em>.</p>');

  assert.equal(preview.subject, REPLY_SUBJECT);
  assert.match(preview.html, /See you <em>soon<\/em>\./);
  assert.match(preview.html, /garden weddings in December/);
  assert.match(preview.text, /See you soon\./);
  assert.match(preview.text, /garden weddings in December/);
});

test('previewReply rejects unknown inquiries', async () => {
  const { service } = createService();

  await assert.rejects(
    () => service.previewReply('missing-inquiry', 'Hello'),
    (error: unknown) => error instanceof InquiryReplyError && error.code === 'not_found'
  );
});

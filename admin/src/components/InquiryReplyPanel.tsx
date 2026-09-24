import { lazy, Suspense, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Eye, Loader2, RotateCw, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import EmailPreviewDialog from '@/components/EmailPreviewDialog';
import inquiryService from '@/services/inquiry.service';
import { useToast } from '@/hooks/use-toast';
import { htmlToPlainText } from '@/lib/emailText';
import type { Inquiry, ReplyStatus } from '@/types';

/**
 * TipTap and its extensions are only needed while an admin edits a reply, so
 * the editor is loaded on demand instead of shipping with the main bundle.
 */
const RichTextEditor = lazy(() => import('@/components/RichTextEditor'));

const STATUS_STYLES: Record<ReplyStatus, string> = {
  queued: 'border-amber-200 bg-amber-50 text-amber-700',
  sent: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  failed: 'border-red-200 bg-red-50 text-red-700',
};

const STATUS_LABELS: Record<ReplyStatus, string> = {
  queued: 'Queued',
  sent: 'Sent',
  failed: 'Failed',
};

function formatTimestamp(value: string | null): string | null {
  return value ? format(new Date(value), 'MMM d, yyyy · p') : null;
}

export default function InquiryReplyPanel({ inquiry }: { inquiry: Inquiry }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState('');
  const [previewOpen, setPreviewOpen] = useState(false);
  const draftText = useMemo(() => htmlToPlainText(draft), [draft]);

  const repliesQuery = useQuery({
    queryKey: ['inquiry-replies', inquiry.id],
    queryFn: () => inquiryService.listReplies(inquiry.id),
  });
  const replies = repliesQuery.data ?? [];
  const hasQueuedReplies = replies.some((reply) => reply.status === 'queued');

  const sendMutation = useMutation({
    mutationFn: () => inquiryService.sendReply(inquiry.id, draft),
    onSuccess: () => {
      toast({ title: 'Reply queued', description: `Sending your message to ${inquiry.email}.` });
      setDraft('');
      void queryClient.invalidateQueries({ queryKey: ['inquiry-replies', inquiry.id] });
      void queryClient.invalidateQueries({ queryKey: ['inquiries'] });
    },
    onError: (error: unknown) => {
      toast({
        title: 'Could not queue reply',
        description: error instanceof Error ? error.message : 'The reply was not queued.',
        variant: 'destructive',
      });
    },
  });

  const retryMutation = useMutation({
    mutationFn: (replyId: string) => inquiryService.retryReply(inquiry.id, replyId),
    onSuccess: () => {
      toast({ title: 'Reply re-queued', description: `Retrying delivery to ${inquiry.email}.` });
      void queryClient.invalidateQueries({ queryKey: ['inquiry-replies', inquiry.id] });
    },
    onError: (error: unknown) => {
      toast({
        title: 'Could not retry reply',
        description: error instanceof Error ? error.message : 'The reply was not re-queued.',
        variant: 'destructive',
      });
    },
  });

  return (
    <section className="space-y-4 rounded-xl border border-gray-100 bg-white p-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <p className="text-sm font-medium text-gray-700">Reply</p>
          <p className="text-xs text-gray-500">
            Your message is emailed to <span className="font-medium text-gray-700">{inquiry.email}</span> with the original inquiry quoted below it.
          </p>
        </div>
        <p className="text-[11px] text-gray-400">Bold, italic, lists and undo are supported</p>
      </div>

      <Suspense
        fallback={
          <div className="flex h-64 items-center justify-center gap-2 rounded-xl bg-gray-50 text-sm text-gray-400">
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            Loading editor…
          </div>
        }
      >
        <RichTextEditor value={draft} onChange={setDraft} />
      </Suspense>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-gray-500">
          {draftText ? `${draftText.length} characters · ${draftText.split('\n').length} line(s)` : 'Write your reply in the document above.'}
        </p>
        <div className="flex gap-2">
          <Button type="button" variant="outline" disabled={!draftText} onClick={() => setPreviewOpen(true)}>
            <Eye className="mr-2 h-4 w-4" aria-hidden="true" />
            Preview email
          </Button>
          <Button type="button" onClick={() => sendMutation.mutate()} disabled={!draftText || sendMutation.isPending}>
            {sendMutation.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <Send className="mr-2 h-4 w-4" aria-hidden="true" />
            )}
            Queue reply
          </Button>
        </div>
      </div>

      <EmailPreviewDialog inquiry={inquiry} bodyHtml={draft} open={previewOpen} onOpenChange={setPreviewOpen} />

      <div className="border-t border-gray-100 pt-3">
        <div className="flex items-center justify-between gap-2">
          <p className="text-[10px] uppercase tracking-wider text-gray-400">Delivery history</p>
          {hasQueuedReplies && (
            <span className="flex items-center gap-1.5 text-[11px] text-amber-600">
              <Loader2 className="h-3 w-3 animate-spin" aria-hidden="true" />
              Checking delivery…
            </span>
          )}
        </div>

        {repliesQuery.isLoading ? (
          <p className="mt-2 text-xs text-gray-500">Loading replies…</p>
        ) : replies.length === 0 ? (
          <p className="mt-2 text-xs text-gray-500">No replies sent yet.</p>
        ) : (
          <ul className="mt-2 space-y-2">
            {replies.map((reply) => (
              <li key={reply.id} className="rounded-lg border border-gray-100 p-3 text-xs">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`rounded-full border px-2 py-0.5 font-semibold ${STATUS_STYLES[reply.status]}`}>
                    {STATUS_LABELS[reply.status]}
                  </span>
                  <span className="text-gray-500">Queued {formatTimestamp(reply.createdAt)}</span>
                  {reply.attempts > 1 && <span className="text-gray-400">· attempt {reply.attempts}</span>}
                  {reply.status !== 'sent' && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="ml-auto h-7 px-2 text-xs"
                      onClick={() => retryMutation.mutate(reply.id)}
                      disabled={retryMutation.isPending}
                    >
                      <RotateCw className="mr-1 h-3 w-3" aria-hidden="true" />
                      Retry
                    </Button>
                  )}
                </div>
                {reply.status === 'sent' && reply.sentAt && (
                  <p className="mt-1 text-gray-500">Delivered {formatTimestamp(reply.sentAt)}</p>
                )}
                {reply.error && <p className="mt-1 text-red-600" role="alert">{reply.error}</p>}
                <p className="mt-1 whitespace-pre-wrap text-gray-500">{htmlToPlainText(reply.body)}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

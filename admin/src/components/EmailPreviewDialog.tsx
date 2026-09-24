import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import inquiryService from '@/services/inquiry.service';
import type { Inquiry } from '@/types';

interface EmailPreviewDialogProps {
  inquiry: Inquiry;
  bodyHtml: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function EmailPreviewDialog({ inquiry, bodyHtml, open, onOpenChange }: EmailPreviewDialogProps) {
  const [tab, setTab] = useState('html');
  const previewQuery = useQuery({
    queryKey: ['inquiry-reply-preview', inquiry.id, bodyHtml],
    queryFn: () => inquiryService.previewReply(inquiry.id, bodyHtml),
    enabled: open && Boolean(bodyHtml),
    staleTime: 60_000,
    retry: false,
  });
  const preview = previewQuery.data;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[760px]">
        <DialogHeader>
          <DialogTitle>Email preview</DialogTitle>
          <DialogDescription>
            To {inquiry.email} · Subject: {preview?.subject ?? '…'} — this is the exact email that will be sent.
          </DialogDescription>
        </DialogHeader>

        {previewQuery.isLoading ? (
          <div className="flex h-80 items-center justify-center gap-2 text-sm text-gray-500">
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            Rendering preview…
          </div>
        ) : previewQuery.isError ? (
          <p className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700" role="alert">
            {previewQuery.error instanceof Error ? previewQuery.error.message : 'Could not render the preview.'}
          </p>
        ) : preview ? (
          <Tabs value={tab} onValueChange={setTab}>
            <TabsList>
              <TabsTrigger value="html">Rendered email</TabsTrigger>
              <TabsTrigger value="text">Plain text</TabsTrigger>
            </TabsList>
            <TabsContent value="html">
              <iframe
                title="Email preview"
                sandbox=""
                srcDoc={preview.html}
                className="h-[26rem] w-full rounded-lg border border-gray-200 bg-white dark:border-white/10"
              />
            </TabsContent>
            <TabsContent value="text">
              <pre className="max-h-[26rem] overflow-auto whitespace-pre-wrap rounded-lg border border-gray-200 bg-gray-50 p-4 text-xs text-gray-700 dark:border-white/10">
                {preview.text}
              </pre>
            </TabsContent>
          </Tabs>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

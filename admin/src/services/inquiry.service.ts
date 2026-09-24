import api from '@/lib/api';
import type { ApiResponse, InquiryReply } from '@/types';

export interface ReplyPreview {
  subject: string;
  html: string;
  text: string;
}

class InquiryService {
  async listReplies(inquiryId: string): Promise<InquiryReply[]> {
    const response = await api.get<ApiResponse<{ replies: InquiryReply[] }>>(`/inquiries/${inquiryId}/replies`);
    return response.data.data.replies;
  }

  async sendReply(inquiryId: string, body: string): Promise<InquiryReply> {
    const response = await api.post<ApiResponse<{ reply: InquiryReply }>>(`/inquiries/${inquiryId}/replies`, { body });
    return response.data.data.reply;
  }

  async retryReply(inquiryId: string, replyId: string): Promise<InquiryReply> {
    const response = await api.post<ApiResponse<{ reply: InquiryReply }>>(`/inquiries/${inquiryId}/replies/${replyId}/retry`);
    return response.data.data.reply;
  }

  async previewReply(inquiryId: string, body: string): Promise<ReplyPreview> {
    const response = await api.post<ApiResponse<{ preview: ReplyPreview }>>(`/inquiries/${inquiryId}/replies/preview`, { body });
    return response.data.data.preview;
  }
}

export default new InquiryService();

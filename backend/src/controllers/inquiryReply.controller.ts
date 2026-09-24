import { Request, Response, NextFunction } from 'express';
import inquiryReplyService, { InquiryReplyError } from '../services/inquiryReply.service';
import { sendSuccess, sendError } from '../utils/response';

function handleReplyError(error: unknown, res: Response, next: NextFunction): void {
  if (error instanceof InquiryReplyError) {
    const status = error.code === 'not_found' ? 404 : error.code === 'invalid_body' ? 400 : 409;
    sendError(res, error.message, status);
    return;
  }
  next(error);
}

export class InquiryReplyController {
  /**
   * List replies for an inquiry with delivery status
   * GET /api/inquiries/:id/replies
   * Security: Admin and moderator only
   */
  async listReplies(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const replies = await inquiryReplyService.listReplies(req.params.id);
      sendSuccess(res, { replies });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Render the exact email that a reply would deliver, without sending it.
   * POST /api/inquiries/:id/replies/preview
   * Security: Admin and moderator only
   */
  async previewReply(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const preview = await inquiryReplyService.previewReply(req.params.id, req.body.body);
      sendSuccess(res, { preview });
    } catch (error) {
      handleReplyError(error, res, next);
    }
  }

  /**
   * Queue a reply to the address stored on the inquiry. The recipient is never
   * taken from the request body, so a compromised admin session cannot redirect
   * the email to an arbitrary address.
   * POST /api/inquiries/:id/replies
   * Security: Admin and moderator only
   */
  async createReply(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const reply = await inquiryReplyService.queueReply(req.params.id, req.body.body);
      sendSuccess(res, { reply }, 'Reply queued for delivery', 202);
    } catch (error) {
      handleReplyError(error, res, next);
    }
  }

  /**
   * Re-queue a failed or queued reply
   * POST /api/inquiries/:id/replies/:replyId/retry
   * Security: Admin and moderator only
   */
  async retryReply(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const reply = await inquiryReplyService.retry(req.params.replyId);
      sendSuccess(res, { reply }, 'Reply re-queued for delivery', 202);
    } catch (error) {
      handleReplyError(error, res, next);
    }
  }
}

export default new InquiryReplyController();

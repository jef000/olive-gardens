import { Request, Response, NextFunction } from 'express';
import { query } from '../db/pool';
import { sendSuccess, sendError } from '../utils/response';

export interface Inquiry {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  message: string;
  status: 'new' | 'read' | 'replied' | 'archived';
  created_at: Date;
  updated_at: Date;
}

export class InquiryController {
  /**
   * Get all inquiries with pagination and filtering
   */
  async getInquiries(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const status = req.query.status as string;
      const offset = (page - 1) * limit;

      let countQuery = 'SELECT COUNT(*) FROM inquiries';
      let dataQuery = 'SELECT * FROM inquiries';
      const params: any[] = [];
      const dataParams: any[] = [];

      if (status) {
        countQuery += ' WHERE status = $1';
        dataQuery += ' WHERE status = $1';
        params.push(status);
        dataParams.push(status);
      }

      dataQuery += ` ORDER BY created_at DESC LIMIT $${dataParams.length + 1} OFFSET $${dataParams.length + 2}`;
      dataParams.push(limit, offset);

      const [countResult, dataResult] = await Promise.all([
        query(countQuery, params),
        query<Inquiry>(dataQuery, dataParams),
      ]);

      const total = parseInt(countResult.rows[0].count);

      sendSuccess(res, {
        inquiries: dataResult.rows,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get inquiry by ID
   */
  async getInquiry(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const result = await query<Inquiry>('SELECT * FROM inquiries WHERE id = $1', [id]);

      if (result.rows.length === 0) {
        sendError(res, 'Inquiry not found', 404);
        return;
      }

      sendSuccess(res, { inquiry: result.rows[0] });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update inquiry status
   */
  async updateStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { status } = req.body;

      const validStatuses = ['new', 'read', 'replied', 'archived'];
      if (!validStatuses.includes(status)) {
        sendError(res, 'Invalid status', 400);
        return;
      }

      const result = await query<Inquiry>(
        'UPDATE inquiries SET status = $1 WHERE id = $2 RETURNING *',
        [status, id]
      );

      if (result.rows.length === 0) {
        sendError(res, 'Inquiry not found', 404);
        return;
      }

      sendSuccess(res, { inquiry: result.rows[0] }, 'Inquiry status updated successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete inquiry
   */
  async deleteInquiry(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const result = await query('DELETE FROM inquiries WHERE id = $1 RETURNING id', [id]);

      if (result.rows.length === 0) {
        sendError(res, 'Inquiry not found', 404);
        return;
      }

      sendSuccess(res, null, 'Inquiry deleted successfully');
    } catch (error) {
      next(error);
    }
  }
}

export const inquiryController = new InquiryController();

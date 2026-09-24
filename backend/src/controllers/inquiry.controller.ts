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
      const page = Math.max(1, parseInt(req.query.page as string) || 1);
      const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 10));
      const offset = (page - 1) * limit;
      const { status, search, start_date, end_date, year } = req.query as {
        status?: string;
        search?: string;
        start_date?: string;
        end_date?: string;
        year?: string;
      };

      const conditions: string[] = [];
      const values: string[] = [];
      const add = (template: string, value: string) => {
        values.push(value);
        conditions.push(template.replace(/\$\?/g, `$${values.length}`));
      };

      if (status && status !== 'all') {
        add('status = $?', status);
      }

      if (search) {
        add(
          '(first_name ILIKE $? OR last_name ILIKE $? OR email ILIKE $? OR phone ILIKE $? OR message ILIKE $?)',
          `%${search}%`
        );
      }

      if (year && /^\d{4}$/.test(year)) {
        add('created_at >= $?::date', `${year}-01-01`);
        add("created_at < ($?::date + INTERVAL '1 year')", `${year}-01-01`);
      }

      if (start_date) {
        add('created_at >= $?::date', start_date);
      }

      if (end_date) {
        add("created_at < ($?::date + INTERVAL '1 day')", end_date);
      }

      const whereClause = conditions.length ? ` WHERE ${conditions.join(' AND ')}` : '';

      const countQuery = `SELECT COUNT(*) FROM inquiries${whereClause}`;
      const dataQuery = `SELECT * FROM inquiries${whereClause} ORDER BY created_at DESC LIMIT $${values.length + 1} OFFSET $${values.length + 2}`;
      const yearsQuery =
        'SELECT DISTINCT EXTRACT(YEAR FROM created_at)::int AS year FROM inquiries ORDER BY year DESC';

      const [countResult, dataResult, yearsResult] = await Promise.all([
        query<{ count: string }>(countQuery, values),
        query<Inquiry>(dataQuery, [...values, limit, offset]),
        query<{ year: number }>(yearsQuery),
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
        years: yearsResult.rows.map((row) => row.year),
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

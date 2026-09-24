import { Request, Response, NextFunction } from 'express';
import { query, getClient } from '../db/pool';
import { sendSuccess } from '../utils/response';

interface ServicePriceRow {
  service_id: string;
  price: string;
  updated_at: string;
}

export class PricingController {
  /**
   * Get all service prices
   * GET /api/pricing
   * Public: the website renders these labels next to each service.
   */
  async getAllPrices(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await query<ServicePriceRow>(
        'SELECT service_id, price, updated_at FROM service_prices ORDER BY service_id'
      );
      sendSuccess(res, { prices: result.rows });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Bulk update service prices
   * PUT /api/pricing
   * Admin only: upserts every submitted row in a single transaction so the
   * website never renders a half-applied price list.
   */
  async updatePrices(req: Request, res: Response, next: NextFunction): Promise<void> {
    const { prices } = req.body as { prices: Array<{ service_id: string; price: string }> };
    const client = await getClient();

    try {
      await client.query('BEGIN');
      const updated: ServicePriceRow[] = [];

      for (const { service_id, price } of prices) {
        const result = await client.query<ServicePriceRow>(
          `INSERT INTO service_prices (service_id, price, updated_by)
           VALUES ($1, $2, $3)
           ON CONFLICT (service_id)
           DO UPDATE SET price = EXCLUDED.price,
                         updated_by = EXCLUDED.updated_by,
                         updated_at = CURRENT_TIMESTAMP
           RETURNING service_id, price, updated_at`,
          [service_id, price, req.user?.userId ?? null]
        );
        const row = result.rows[0];
        if (row) updated.push(row);
      }

      await client.query('COMMIT');
      sendSuccess(res, { prices: updated }, 'Prices updated');
    } catch (error) {
      await client.query('ROLLBACK').catch(() => undefined);
      next(error);
    } finally {
      client.release();
    }
  }
}

export default new PricingController();

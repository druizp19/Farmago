// ============================================================================
// ORDERS CONTROLLER
// ============================================================================

import type { Request, Response } from 'express';
import { VtexClient } from '../../infrastructure/http/VtexClient';
import { logger } from '../../shared/logger';

export class OrdersController {
  constructor(private vtexClient: VtexClient) {}

  /**
   * GET /api/orders - List orders with pagination and filters
   */
  async listOrders(req: Request, res: Response): Promise<void> {
    try {
      const { page = '1', per_page = '20', status: _status = '', search: _search = '' } = req.query;
      
      // This would need to be implemented in VtexClient
      // For now, return a simple response
      res.json({
        list: [],
        paging: {
          page: Number(page),
          perPage: Number(per_page),
          total: 0,
          pages: 0,
        },
      });
    } catch (err: any) {
      logger.error('Error listing orders:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * GET /api/orders/:orderId - Get single order detail
   */
  async getOrderDetail(req: Request, res: Response): Promise<void> {
    try {
      const { orderId } = req.params;
      
      // Ensure orderId is a string
      const orderIdStr = Array.isArray(orderId) ? orderId[0] : orderId;
      
      if (!orderIdStr) {
        res.status(400).json({ error: 'Order ID is required' });
        return;
      }
      
      const order = await this.vtexClient.fetchOrderDetail(orderIdStr);
      
      if (!order) {
        res.status(404).json({ error: 'Order not found' });
        return;
      }
      
      res.json(order);
    } catch (err: any) {
      logger.error('Error fetching order detail:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}

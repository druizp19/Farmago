// ============================================================================
// STOCK CONTROLLER
// ============================================================================

import type { Request, Response } from 'express';
import { StockService } from '../../domain/services/StockService';
import { logger } from '../../shared/logger';

export class StockController {
  constructor(private stockService: StockService) {}

  /**
   * GET /api/stock - Get all stock
   */
  async getAllStock(req: Request, res: Response): Promise<void> {
    try {
      const stock = await this.stockService.getAllStock();
      const info = await this.stockService.getCacheInfo();

      res.json({
        stock,
        info,
        timestamp: new Date().toISOString(),
      });
    } catch (err: any) {
      logger.error('Error getting stock:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * GET /api/stock/:refId - Get stock for specific product
   */
  async getProductStock(req: Request, res: Response): Promise<void> {
    try {
      const refId = String(req.params.refId);
      const { warehouse } = req.query;

      if (!refId) {
        res.status(400).json({ error: 'RefId is required' });
        return;
      }

      let warehouseId = 'PT';
      if (warehouse && typeof warehouse === 'string') {
        warehouseId = warehouse;
      } else if (warehouse && Array.isArray(warehouse) && warehouse.length > 0) {
        warehouseId = String(warehouse[0]);
      }
      
      const stock = await this.stockService.getCurrentStock(refId, warehouseId);

      res.json({
        refId,
        warehouse: warehouseId,
        stock,
        timestamp: new Date().toISOString(),
      });
    } catch (err: any) {
      logger.error('Error getting product stock:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * POST /api/stock/sync - Force sync with Stock API
   */
  async forceSync(req: Request, res: Response): Promise<void> {
    try {
      logger.info('🔄 Force sync requested');
      const { discrepancies, alerts } = await this.stockService.syncWithAPI();

      res.json({
        success: true,
        discrepancies,
        alerts,
        timestamp: new Date().toISOString(),
      });
    } catch (err: any) {
      logger.error('Error forcing sync:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * GET /api/stock/info - Get cache info
   */
  async getCacheInfo(req: Request, res: Response): Promise<void> {
    try {
      const info = await this.stockService.getCacheInfo();
      res.json(info);
    } catch (err: any) {
      logger.error('Error getting cache info:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}

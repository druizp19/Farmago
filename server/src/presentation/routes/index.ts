// ============================================================================
// ROUTES
// ============================================================================

import { Router } from 'express';
import { OrdersController } from '../controllers/OrdersController';
import { StockController } from '../controllers/StockController';
import { VtexClient } from '../../infrastructure/http/VtexClient';
import { StockApiClient } from '../../infrastructure/http/StockApiClient';
import { StockService } from '../../domain/services/StockService';
import { cacheRepository } from '../../infrastructure/cache/CacheRepository';

const router = Router();

// Initialize dependencies
const vtexClient = new VtexClient();
const stockApiClient = new StockApiClient();
const stockService = new StockService(stockApiClient, cacheRepository);

const ordersController = new OrdersController(vtexClient);
const stockController = new StockController(stockService);

// ============================================================================
// ORDERS ROUTES
// ============================================================================

router.get('/orders', (req, res) => ordersController.listOrders(req, res));
router.get('/orders/:orderId', (req, res) => ordersController.getOrderDetail(req, res));

// ============================================================================
// STOCK ROUTES
// ============================================================================

router.get('/stock', (req, res) => stockController.getAllStock(req, res));
router.get('/stock/info', (req, res) => stockController.getCacheInfo(req, res));
router.get('/stock/:refId', (req, res) => stockController.getProductStock(req, res));
router.post('/stock/sync', (req, res) => stockController.forceSync(req, res));

// ============================================================================
// HEALTH CHECK
// ============================================================================

router.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    cache: cacheRepository.getCacheType(),
    timestamp: new Date().toISOString(),
  });
});

// ============================================================================
// CACHE MANAGEMENT
// ============================================================================

router.post('/cache/clear', async (_req, res) => {
  try {
    await cacheRepository.delete('historical_orders');
    await cacheRepository.delete('order_details');
    res.json({ success: true, message: 'Cache cleared successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to clear cache' });
  }
});

export { router };

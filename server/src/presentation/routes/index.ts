// ============================================================================
// ROUTES
// ============================================================================

import { Router } from 'express';
import { OrdersController } from '../controllers/OrdersController';
import { VtexClient } from '../../infrastructure/http/VtexClient';
import { cacheRepository } from '../../infrastructure/cache/CacheRepository';

const router = Router();

// Initialize dependencies
const vtexClient = new VtexClient();
const ordersController = new OrdersController(vtexClient);

// ============================================================================
// ORDERS ROUTES
// ============================================================================

router.get('/orders', (req, res) => ordersController.listOrders(req, res));
router.get('/orders/:orderId', (req, res) => ordersController.getOrderDetail(req, res));

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

// ============================================================================
// MAIN SERVER - TypeScript Version
// ============================================================================

import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { ENV, validateEnv } from './config/env';
import { SYNC_CONFIG } from './config/constants';
import { logger } from './shared/logger';
import { cacheRepository } from './infrastructure/cache/CacheRepository';
import { VtexClient } from './infrastructure/http/VtexClient';
import { ProductAggregationService } from './domain/services/ProductAggregationService';
import { CategoryAggregationService } from './domain/services/CategoryAggregationService';
import { DeliveryAggregationService } from './domain/services/DeliveryAggregationService';
import { GetDashboardDataUseCase } from './application/usecases/GetDashboardDataUseCase';
import { SocketHandler } from './presentation/websocket/SocketHandler';
import { router } from './presentation/routes';

// ============================================================================
// VALIDATE ENVIRONMENT
// ============================================================================

try {
  validateEnv();
} catch (err) {
  logger.critical('Environment validation failed:', err);
  process.exit(1);
}

// ============================================================================
// EXPRESS APP
// ============================================================================

const app = express();
const httpServer = createServer(app);

// Middleware
app.use(cors({
  origin: ENV.CORS_ORIGINS,
  methods: ['GET', 'POST'],
}));
app.use(express.json());

// Routes
app.use('/api', router);

// ============================================================================
// SOCKET.IO
// ============================================================================

const io = new Server(httpServer, {
  cors: {
    origin: ENV.CORS_ORIGINS,
    methods: ['GET', 'POST'],
  },
});

// ============================================================================
// DEPENDENCY INJECTION
// ============================================================================

const vtexClient = new VtexClient();
const productService = new ProductAggregationService();
const categoryService = new CategoryAggregationService();
const deliveryService = new DeliveryAggregationService();

const getDashboardDataUseCase = new GetDashboardDataUseCase(
  vtexClient,
  cacheRepository,
  productService,
  categoryService,
  deliveryService
);

const socketHandler = new SocketHandler(io, getDashboardDataUseCase);

// ============================================================================
// START SERVER
// ============================================================================

async function start(): Promise<void> {
  try {
    logger.info('🚀 Starting FarmaGo Dashboard Server...');
    logger.info(`📍 Environment: ${ENV.NODE_ENV}`);
    logger.info(`📍 Port: ${ENV.PORT}`);

    // Connect to cache
    await cacheRepository.connect();
    logger.info(`💾 Cache: ${cacheRepository.getCacheType()}`);

    // Initialize socket handlers
    socketHandler.initialize();

    // Start auto-sync
    socketHandler.startAutoSync(SYNC_CONFIG.AUTO_SYNC_INTERVAL_MS);
    logger.info(`🔄 Auto-sync every ${SYNC_CONFIG.AUTO_SYNC_INTERVAL_MS / 1000}s`);

    // Start HTTP server
    httpServer.listen(ENV.PORT, () => {
      logger.info(`✅ Server running at http://localhost:${ENV.PORT}`);
      logger.info(`📅 Historical data from ${SYNC_CONFIG.HISTORICAL_DATE.split('T')[0]}`);
      logger.info(`🔄 Syncing last ${SYNC_CONFIG.DAYS_TO_SYNC} days`);
    });
  } catch (error) {
    logger.critical('Failed to start server:', error);
    process.exit(1);
  }
}

// ============================================================================
// GRACEFUL SHUTDOWN
// ============================================================================

process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, closing server...');
  await cacheRepository.disconnect();
  httpServer.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, closing server...');
  await cacheRepository.disconnect();
  httpServer.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});

// ============================================================================
// START
// ============================================================================

start();

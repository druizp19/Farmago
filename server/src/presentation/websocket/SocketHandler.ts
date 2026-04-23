// ============================================================================
// SOCKET HANDLER
// ============================================================================

import { Server, Socket } from 'socket.io';
import { GetDashboardDataUseCase } from '../../application/usecases/GetDashboardDataUseCase';
import { logger } from '../../shared/logger';
import type { DashboardData } from '../../application/usecases/GetDashboardDataUseCase';

export class SocketHandler {
  private currentData: DashboardData | null = null;

  constructor(
    private io: Server,
    private getDashboardDataUseCase: GetDashboardDataUseCase
  ) {}

  /**
   * Initialize socket handlers
   */
  initialize(): void {
    this.io.on('connection', async (socket: Socket) => {
      logger.info(`🔌 Client connected: ${socket.id}`);

      try {
        // Initialize data if not loaded
        if (!this.currentData) {
          this.currentData = await this.getDashboardDataUseCase.execute();
        }

        // Send initial data
        socket.emit('orders:update', this.ordersPayload(this.currentData));
        socket.emit('products:update', this.productsPayload(this.currentData));
      } catch (err) {
        logger.error('Error initializing socket:', err);
        socket.emit('error', { message: 'Error loading data' });
      }

      // Handle refresh request
      socket.on('orders:refresh', async () => {
        try {
          logger.info('🔄 Manual refresh requested');
          this.currentData = await this.getDashboardDataUseCase.execute();
          this.io.emit('orders:update', this.ordersPayload(this.currentData));
          this.io.emit('products:update', this.productsPayload(this.currentData));
        } catch (err) {
          logger.error('Error refreshing data:', err);
          socket.emit('error', { message: 'Error refreshing data' });
        }
      });

      socket.on('disconnect', () => {
        logger.info(`❌ Client disconnected: ${socket.id}`);
      });
    });
  }

  /**
   * Auto-sync data periodically
   */
  startAutoSync(intervalMs: number): void {
    setInterval(async () => {
      try {
        this.currentData = await this.getDashboardDataUseCase.execute();
        this.io.emit('orders:update', this.ordersPayload(this.currentData));
        this.io.emit('products:update', this.productsPayload(this.currentData));
      } catch (err) {
        logger.error('Auto-sync error:', err);
      }
    }, intervalMs);
  }

  private ordersPayload(data: DashboardData) {
    return {
      orders: data.orders,
      timestamp: new Date().toISOString(),
      newOrdersCount: 0,
      updatedOrdersCount: 0,
    };
  }

  private productsPayload(data: DashboardData) {
    return {
      products: data.topProducts,
      categoryStats: data.categoryStats,
      categoryList: data.categoryList,
      orderCategoryMap: data.orderCategoryMap,
      productsByOrder: data.productsByOrder,
      locationData: data.locationData,
      deliveryStats: data.deliveryStats,
      orderDetailsMap: data.orderDetailsMap,
      timestamp: new Date().toISOString(),
    };
  }
}

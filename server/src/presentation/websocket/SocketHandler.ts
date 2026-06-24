// ============================================================================
// SOCKET HANDLER
// ============================================================================

import { Server, Socket } from 'socket.io';
import { GetDashboardDataUseCase } from '../../application/usecases/GetDashboardDataUseCase';
import { StockService } from '../../domain/services/StockService';
import { logger } from '../../shared/logger';
import type { DashboardData } from '../../application/usecases/GetDashboardDataUseCase';

export class SocketHandler {
  private currentData: DashboardData | null = null;
  /** Último snapshot de stock listo para enviar a nuevas conexiones */
  private lastStockPayload: {
    stock: any;
    info: any;
    timestamp: string;
  } | null = null;

  constructor(
    private io: Server,
    private getDashboardDataUseCase: GetDashboardDataUseCase,
    private stockService: StockService
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

        // Send initial dashboard data
        socket.emit('orders:update', this.ordersPayload(this.currentData));
        socket.emit('products:update', this.productsPayload(this.currentData));

        // ----- STOCK: enviar último snapshot si existe -----
        if (this.lastStockPayload) {
          // Tenemos datos en caché → enviar inmediatamente
          socket.emit('stock:update', this.lastStockPayload);
        } else {
          // No hay datos aún → intentar cargar y emitir
          try {
            const stockData = await this.stockService.getAllStock();
            const stockInfo = await this.stockService.getCacheInfo();
            const payload = {
              stock: stockData,
              info: stockInfo,
              timestamp: new Date().toISOString(),
            };
            this.lastStockPayload = payload;
            socket.emit('stock:update', payload);
          } catch (stockErr) {
            logger.warn('⚠️ No se pudo obtener stock para el cliente nuevo:', stockErr);
            // Emitir payload vacío para que el frontend salga del estado "loading"
            socket.emit('stock:update', {
              stock: {},
              info: { lastSync: null, lastUpdate: null, totalProducts: 0, productsByWarehouse: {} },
              timestamp: new Date().toISOString(),
            });
          }
        }
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

      // Handle stock refresh request
      socket.on('stock:refresh', async () => {
        try {
          logger.info('🔄 Stock refresh requested by client');
          await this.stockService.syncWithAPI();
          const stockData = await this.stockService.getAllStock();
          const stockInfo = await this.stockService.getCacheInfo();
          const payload = {
            stock: stockData,
            info: stockInfo,
            timestamp: new Date().toISOString(),
          };
          this.lastStockPayload = payload;
          this.io.emit('stock:update', payload);
        } catch (err) {
          logger.error('Error refreshing stock:', err);
          socket.emit('error', { message: 'Error refreshing stock' });
        }
      });

      socket.on('disconnect', () => {
        logger.info(`❌ Client disconnected: ${socket.id}`);
      });
    });
  }

  /**
   * Auto-sync orders periodically
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

  /**
   * Stock auto-sync: sincroniza con la API de Stock periódicamente
   * y guarda el snapshot en `lastStockPayload` para nuevas conexiones.
   */
  startStockSync(intervalMs: number): void {
    // Ejecutar una primera sincronización pasados 3 segundos del arranque
    setTimeout(() => this.runStockSync(), 3_000);

    setInterval(() => this.runStockSync(), intervalMs);
  }

  private async runStockSync(): Promise<void> {
    try {
      logger.info('🔄 Auto-syncing stock...');
      const { discrepancies, alerts } = await this.stockService.syncWithAPI();

      const stockData = await this.stockService.getAllStock();
      const stockInfo = await this.stockService.getCacheInfo();
      const payload = {
        stock: stockData,
        info: stockInfo,
        timestamp: new Date().toISOString(),
      };

      // Guardar snapshot para nuevas conexiones
      this.lastStockPayload = payload;

      // Emitir a todos los clientes conectados
      this.io.emit('stock:sync-complete', payload);

      if (discrepancies.length > 0) {
        this.io.emit('stock:corrected', {
          discrepancies,
          timestamp: new Date().toISOString(),
        });
      }

      if (alerts.length > 0) {
        this.io.emit('stock:alerts', {
          alerts,
          timestamp: new Date().toISOString(),
        });
      }
    } catch (err) {
      logger.error('Stock auto-sync error:', err);
    }
  }

  /**
   * Handle new order and update stock in real-time
   */
  async handleNewOrder(orderDetail: any): Promise<void> {
    try {
      const updates = await this.stockService.decrementStock(orderDetail);

      if (updates.length > 0) {
        for (const update of updates) {
          this.io.emit('stock:realtime-update', update);
        }

        const productNames: Record<string, string> = {};
        orderDetail.items.forEach((item: any) => {
          productNames[item.refId || item.id] = item.name;
        });

        const alerts = this.stockService.generateAlerts(updates, productNames);

        if (alerts.length > 0) {
          this.io.emit('stock:alerts', {
            alerts,
            timestamp: new Date().toISOString(),
          });
        }

        logger.info(`✅ Stock actualizado para ${updates.length} productos`);
      }
    } catch (err) {
      logger.error('Error updating stock for new order:', err);
    }
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

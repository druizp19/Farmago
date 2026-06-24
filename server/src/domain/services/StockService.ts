// ============================================================================
// STOCK SERVICE - Lógica de negocio
// ============================================================================

import { StockApiClient } from '../../infrastructure/http/StockApiClient';
import { ICacheRepository } from '../repositories/ICacheRepository';
import { CACHE_CONFIG, STOCK_CONFIG } from '../../config/constants';
import { logger } from '../../shared/logger';
import type { 
  StockCache, 
  StockByWarehouse, 
  StockUpdate,
  StockAlert,
  StockDiscrepancy 
} from '../types/Stock';
import type { OrderDetail } from '../types/Order';

export class StockService {
  constructor(
    private stockApiClient: StockApiClient,
    private cache: ICacheRepository
  ) {}

  /**
   * Inicializar: cargar stock desde API
   */
  async initialize(): Promise<void> {
    logger.info('🔄 Inicializando stock...');
    
    try {
      // Obtener stock de la API
      const stockItems = await this.stockApiClient.fetchStock();
      const apiStock = this.stockApiClient.groupByWarehouse(stockItems);

      // Crear estructura de caché
      const stockCache: StockCache = {
        apiStock,
        pendingSales: this.initializeWarehouseStructure(),
        lastSync: new Date(),
        lastUpdate: new Date(),
      };

      // Guardar en caché
      await this.cache.set(CACHE_CONFIG.KEYS.STOCK_CACHE, stockCache);

      logger.info(`✅ Stock inicializado: ${stockItems.length} productos`);
      
      // Log de distribución por almacén
      Object.keys(apiStock).forEach(warehouse => {
        const count = Object.keys(apiStock[warehouse]).length;
        logger.info(`   - ${warehouse}: ${count} productos`);
      });
    } catch (error) {
      logger.error('❌ Error inicializando stock:', error);
      throw error;
    }
  }

  /**
   * Obtener stock actual de un producto (con descuentos aplicados)
   */
  async getCurrentStock(refId: string, warehouse: string): Promise<number> {
    const cache = await this.cache.get<StockCache>(CACHE_CONFIG.KEYS.STOCK_CACHE);
    
    if (!cache) {
      return 0;
    }

    const apiStock = cache.apiStock[warehouse]?.[refId] || 0;
    const pending = cache.pendingSales[warehouse]?.[refId] || 0;

    return Math.max(0, apiStock - pending);
  }

  /**
   * Descontar stock por orden nueva (tiempo real)
   */
  async decrementStock(orderDetail: OrderDetail): Promise<StockUpdate[]> {
    const cache = await this.cache.get<StockCache>(CACHE_CONFIG.KEYS.STOCK_CACHE);
    
    if (!cache) {
      logger.warn('⚠️ Stock cache not initialized, skipping decrement');
      return [];
    }

    const updates: StockUpdate[] = [];

    for (const item of orderDetail.items) {
      const refId = item.refId || item.id;
      const quantity = item.quantity;

      if (!refId) {
        logger.warn(`⚠️ Item sin RefId en orden ${orderDetail.orderId}`);
        continue;
      }

      // 🔍 Obtener almacén desde logisticsInfo
      const logistics = orderDetail.shippingData?.logisticsInfo?.find(
        log => String(log.itemIndex) === String(item.id)
      );

      const warehouse = logistics?.warehouseId || STOCK_CONFIG.DEFAULT_WAREHOUSE;

      // Obtener stock actual
      const currentStock = await this.getCurrentStock(refId, warehouse);

      if (currentStock === 0) {
        logger.warn(`⚠️ Stock ya agotado: ${refId} (${warehouse})`);
        continue;
      }

      const newStock = Math.max(0, currentStock - quantity);

      // Actualizar pending sales
      if (!cache.pendingSales[warehouse]) {
        cache.pendingSales[warehouse] = {};
      }

      cache.pendingSales[warehouse][refId] =
        (cache.pendingSales[warehouse][refId] || 0) + quantity;

      // Guardar actualización
      updates.push({
        refId,
        warehouse,
        previousStock: currentStock,
        newStock,
        soldQuantity: quantity,
        orderId: orderDetail.orderId,
        timestamp: new Date(),
      });

      logger.info(
        `📉 Stock decrementado: ${refId} (${warehouse}): ${currentStock} → ${newStock}`
      );
    }

    // Actualizar timestamp
    cache.lastUpdate = new Date();

    // Guardar caché actualizado
    await this.cache.set(CACHE_CONFIG.KEYS.STOCK_CACHE, cache);

    return updates;
  }

  /**
   * Generar alertas de bajo stock desde updates
   */
  generateAlerts(updates: StockUpdate[], productNames: Record<string, string>): StockAlert[] {
    const alerts: StockAlert[] = [];

    for (const update of updates) {
      if (update.newStock === 0) {
        alerts.push({
          refId: update.refId,
          name: productNames[update.refId] || update.refId,
          warehouse: update.warehouse,
          stock: 0,
          level: 'depleted',
          timestamp: update.timestamp,
        });
      } else if (update.newStock <= STOCK_CONFIG.CRITICAL_THRESHOLD) {
        alerts.push({
          refId: update.refId,
          name: productNames[update.refId] || update.refId,
          warehouse: update.warehouse,
          stock: update.newStock,
          level: 'critical',
          timestamp: update.timestamp,
        });
      } else if (update.newStock <= STOCK_CONFIG.LOW_THRESHOLD) {
        alerts.push({
          refId: update.refId,
          name: productNames[update.refId] || update.refId,
          warehouse: update.warehouse,
          stock: update.newStock,
          level: 'warning',
          timestamp: update.timestamp,
        });
      }
    }

    return alerts;
  }

  /**
   * Sincronizar con API (cada N minutos)
   */
  async syncWithAPI(): Promise<{
    discrepancies: StockDiscrepancy[];
    alerts: StockAlert[];
  }> {
    logger.info('🔄 Sincronizando con API de Stock...');

    try {
      // 1. Obtener stock real de la API
      const stockItems = await this.stockApiClient.fetchStock();
      const realStock = this.stockApiClient.groupByWarehouse(stockItems);

      // 2. Obtener caché actual
      const cache = await this.cache.get<StockCache>(CACHE_CONFIG.KEYS.STOCK_CACHE);

      if (!cache) {
        throw new Error('Stock cache not initialized');
      }

      // 3. Detectar discrepancias
      const discrepancies: StockDiscrepancy[] = [];
      const alerts: StockAlert[] = [];

      for (const warehouse of STOCK_CONFIG.WAREHOUSES) {
        const cachedWarehouse = cache.apiStock[warehouse] || {};
        const realWarehouse = realStock[warehouse] || {};

        // Verificar todos los productos
        const allRefIds = new Set([
          ...Object.keys(cachedWarehouse),
          ...Object.keys(realWarehouse),
        ]);

        for (const refId of Array.from(allRefIds)) {
          const apiValue = realWarehouse[refId] || 0;
          const cachedValue = cachedWarehouse[refId] || 0;
          const pending = cache.pendingSales[warehouse]?.[refId] || 0;
          const expectedValue = cachedValue - pending;

          // Si hay diferencia
          if (apiValue !== expectedValue && pending > 0) {
            const diff = apiValue - expectedValue;
            discrepancies.push({
              refId,
              warehouse,
              expected: expectedValue,
              actual: apiValue,
              diff,
              reason: diff > 0 ? 'Reposición/Devolución' : 'Venta externa/Ajuste',
            });
          }

          // Detectar bajo stock (solo del stock real de la API)
          if (apiValue === 0) {
            alerts.push({
              refId,
              name: refId, // Se completará después con el nombre real
              warehouse,
              stock: 0,
              level: 'depleted',
              timestamp: new Date(),
            });
          } else if (apiValue <= STOCK_CONFIG.CRITICAL_THRESHOLD) {
            alerts.push({
              refId,
              name: refId,
              warehouse,
              stock: apiValue,
              level: 'critical',
              timestamp: new Date(),
            });
          } else if (apiValue <= STOCK_CONFIG.LOW_THRESHOLD) {
            alerts.push({
              refId,
              name: refId,
              warehouse,
              stock: apiValue,
              level: 'warning',
              timestamp: new Date(),
            });
          }
        }
      }

      // 4. Actualizar caché con stock real
      cache.apiStock = realStock;
      cache.pendingSales = this.initializeWarehouseStructure(); // Reset
      cache.lastSync = new Date();

      await this.cache.set(CACHE_CONFIG.KEYS.STOCK_CACHE, cache);

      logger.info(
        `✅ Sync completo. ${discrepancies.length} discrepancias, ${alerts.length} alertas`
      );

      if (discrepancies.length > 0) {
        logger.info('   Discrepancias detectadas:');
        discrepancies.slice(0, 5).forEach(d => {
          logger.info(`   - ${d.refId} (${d.warehouse}): ${d.expected} → ${d.actual} (${d.diff > 0 ? '+' : ''}${d.diff})`);
        });
      }

      return { discrepancies, alerts };
    } catch (error) {
      logger.error('❌ Error en sincronización:', error);
      throw error;
    }
  }

  /**
   * Obtener todo el stock actual (con descuentos aplicados)
   */
  async getAllStock(): Promise<StockByWarehouse> {
    const cache = await this.cache.get<StockCache>(CACHE_CONFIG.KEYS.STOCK_CACHE);

    if (!cache) {
      return this.initializeWarehouseStructure();
    }

    // Calcular stock actual (API - pending)
    const currentStock: StockByWarehouse = {};

    for (const warehouse of Object.keys(cache.apiStock)) {
      currentStock[warehouse] = {};

      for (const refId of Object.keys(cache.apiStock[warehouse])) {
        const apiValue = cache.apiStock[warehouse][refId];
        const pending = cache.pendingSales[warehouse]?.[refId] || 0;
        currentStock[warehouse][refId] = Math.max(0, apiValue - pending);
      }
    }

    return currentStock;
  }

  /**
   * Obtener información del caché
   */
  async getCacheInfo(): Promise<{
    lastSync: Date | null;
    lastUpdate: Date | null;
    totalProducts: number;
    productsByWarehouse: Record<string, number>;
  }> {
    const cache = await this.cache.get<StockCache>(CACHE_CONFIG.KEYS.STOCK_CACHE);

    if (!cache) {
      return {
        lastSync: null,
        lastUpdate: null,
        totalProducts: 0,
        productsByWarehouse: {},
      };
    }

    const productsByWarehouse: Record<string, number> = {};
    let totalProducts = 0;

    for (const warehouse of Object.keys(cache.apiStock)) {
      productsByWarehouse[warehouse] = Object.keys(cache.apiStock[warehouse]).length;
      totalProducts += productsByWarehouse[warehouse];
    }

    return {
      lastSync: cache.lastSync,
      lastUpdate: cache.lastUpdate,
      totalProducts,
      productsByWarehouse,
    };
  }

  /**
   * Inicializar estructura de almacenes vacía
   */
  private initializeWarehouseStructure(): StockByWarehouse {
    const structure: StockByWarehouse = {};
    for (const warehouse of STOCK_CONFIG.WAREHOUSES) {
      structure[warehouse] = {};
    }
    return structure;
  }
}

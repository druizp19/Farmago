// ============================================================================
// USE CASE - Get Dashboard Data
// ============================================================================

import { VtexClient } from '../../infrastructure/http/VtexClient';
import { ICacheRepository } from '../../domain/repositories/ICacheRepository';
import { ProductAggregationService } from '../../domain/services/ProductAggregationService';
import { CategoryAggregationService } from '../../domain/services/CategoryAggregationService';
import { DeliveryAggregationService } from '../../domain/services/DeliveryAggregationService';
import { PromotionDetectionService } from '../../domain/services/PromotionDetectionService';
import { PaymentMappingService } from '../../domain/services/PaymentMappingService';
import { SYNC_CONFIG, CACHE_CONFIG } from '../../config/constants';
import { logger } from '../../shared/logger';
import type { OrderListItem, OrderDetail } from '../../domain/types/Order';

export interface DashboardData {
  orders: OrderListItem[];
  topProducts: any[];
  categoryStats: any[];
  categoryList: string[];
  orderCategoryMap: Record<string, string[]>;
  productsByOrder: any;
  locationData: any[];
  deliveryStats: any[];
  orderDetailsMap: Record<string, OrderDetail>;
}

export class GetDashboardDataUseCase {
  constructor(
    private vtexClient: VtexClient,
    private cache: ICacheRepository,
    private productService: ProductAggregationService,
    private categoryService: CategoryAggregationService,
    private deliveryService: DeliveryAggregationService
  ) {}

  /**
   * Initialize dashboard data (first load or full refresh)
   */
  async execute(): Promise<DashboardData> {
    logger.info('🚀 Initializing dashboard data...');

    // Try to load from cache first
    const cachedOrders = await this.cache.get<OrderListItem[]>(CACHE_CONFIG.KEYS.HISTORICAL_ORDERS);

    let allOrders: OrderListItem[] = [];

    if (cachedOrders && cachedOrders.length > 0) {
      logger.info(`✅ Loaded ${cachedOrders.length} historical orders from cache`);
      allOrders = cachedOrders;

      // Sync recent orders
      const recentOrders = await this.syncRecentOrders();
      allOrders = this.mergeOrders(allOrders, recentOrders);
    } else {
      // First load: fetch all historical data
      logger.info('📥 First load: fetching all historical data...');
      allOrders = await this.vtexClient.fetchOrders(SYNC_CONFIG.HISTORICAL_DATE);
      logger.info(`✅ Loaded ${allOrders.length} historical orders`);
    }

    // Save to cache
    await this.cache.set(CACHE_CONFIG.KEYS.HISTORICAL_ORDERS, allOrders);

    // Build aggregations
    const aggregations = await this.buildAggregations(allOrders);

    return {
      orders: aggregations.enrichedOrders,
      topProducts: aggregations.topProducts,
      categoryStats: aggregations.categoryStats,
      categoryList: aggregations.categoryList,
      orderCategoryMap: aggregations.orderCategoryMap,
      productsByOrder: aggregations.productsByOrder,
      locationData: aggregations.locationData,
      deliveryStats: aggregations.deliveryStats,
      orderDetailsMap: aggregations.orderDetailsMap,
    };
  }

  /**
   * Sync recent orders (last N days)
   */
  async syncRecentOrders(): Promise<OrderListItem[]> {
    const now = new Date();
    const from = new Date(now);
    from.setDate(from.getDate() - SYNC_CONFIG.DAYS_TO_SYNC);
    from.setHours(0, 0, 0, 0);

    logger.info(`🔄 Syncing orders from last ${SYNC_CONFIG.DAYS_TO_SYNC} days...`);
    const recentOrders = await this.vtexClient.fetchOrders(from.toISOString());
    
    return recentOrders;
  }

  /**
   * Merge orders (update existing, add new)
   */
  private mergeOrders(existing: OrderListItem[], recent: OrderListItem[]): OrderListItem[] {
    const orderMap = new Map(existing.map(o => [o.orderId, o]));
    
    let newCount = 0;
    let updatedCount = 0;

    for (const order of recent) {
      if (orderMap.has(order.orderId)) {
        updatedCount++;
      } else {
        newCount++;
      }
      orderMap.set(order.orderId, order);
    }

    logger.info(`🔄 Sync complete: ${newCount} new, ${updatedCount} updated, ${orderMap.size} total`);

    return Array.from(orderMap.values());
  }

  /**
   * Build all aggregations
   */
  private async buildAggregations(orders: OrderListItem[]): Promise<Omit<DashboardData, 'orders'> & { enrichedOrders: OrderListItem[] }> {
    // Load cached details
    const cachedDetails = await this.cache.get<any>(CACHE_CONFIG.KEYS.ORDER_DETAILS);
    const cachedProductsByOrder = cachedDetails?.productsByOrder || {};
    const cachedOrderDetailsMap = cachedDetails?.orderDetailsMap || {};
    const cachedLocationMap = cachedDetails?.locationMap || {};

    // Find orders that need details
    const ordersToFetch = orders.filter(o => !cachedProductsByOrder[o.orderId]);

    logger.info(`🔍 Processing ${ordersToFetch.length} new orders (${orders.length - ordersToFetch.length} from cache)`);

    // Fetch new order details
    const newDetails = await this.vtexClient.fetchOrderDetailsBatch(
      ordersToFetch.map(o => o.orderId),
      SYNC_CONFIG.CONCURRENCY
    );

    // Aggregate products
    const { products, productsByOrder } = this.productService.aggregate(
      newDetails,
      cachedProductsByOrder
    );

    // Rebuild products from all cached data
    const allProducts = this.productService.rebuildFromCache(productsByOrder);

    // Aggregate categories
    const { categoryStats, categoryList, orderCategoryMap } = 
      this.categoryService.aggregate(productsByOrder);

    // Merge order details map and enrich with promotion data
    const orderDetailsMap = { ...cachedOrderDetailsMap };
    for (const detail of newDetails) {
      orderDetailsMap[detail.orderId] = detail;
    }

    // Enrich orders with promotion data
    const enrichedOrders = this.enrichOrdersWithPromotions(orders, orderDetailsMap);

    // Get all order details for delivery/location aggregation
    const allOrderDetails = Object.values(orderDetailsMap) as OrderDetail[];

    // Aggregate delivery
    const deliveryStats = this.deliveryService.aggregateDelivery(allOrderDetails);

    // Aggregate locations
    const locationData = this.deliveryService.aggregateLocations(allOrderDetails);

    // Save to cache
    await this.cache.set(CACHE_CONFIG.KEYS.ORDER_DETAILS, {
      productsByOrder,
      orderCategoryMap,
      orderDetailsMap,
      locationMap: this.buildLocationMap(locationData),
    });

    return {
      enrichedOrders,
      topProducts: allProducts,
      categoryStats,
      categoryList,
      orderCategoryMap,
      productsByOrder,
      locationData,
      deliveryStats,
      orderDetailsMap,
    };
  }

  private buildLocationMap(locationData: any[]): Record<string, any> {
    const map: Record<string, any> = {};
    for (const loc of locationData) {
      const key = `${loc.state}|${loc.city}`;
      map[key] = loc;
    }
    return map;
  }

  /**
   * Enrich orders with promotion/cyber data and normalize payment names
   */
  private enrichOrdersWithPromotions(
    orders: OrderListItem[],
    orderDetailsMap: Record<string, OrderDetail>
  ): OrderListItem[] {
    return orders.map(order => {
      const detail = orderDetailsMap[order.orderId];
      
      // Normalize payment name
      const normalizedPaymentName = PaymentMappingService.normalizePaymentName(order.paymentNames);
      
      if (!detail) {
        return {
          ...order,
          paymentNames: normalizedPaymentName,
        };
      }

      const promotionInfo = PromotionDetectionService.detectPromotion(detail);

      return {
        ...order,
        paymentNames: normalizedPaymentName,
        isCyberOrder: promotionInfo.isCyberOrder,
        promotionName: promotionInfo.promotionName,
        discountValue: promotionInfo.discountValue,
        utmCampaign: promotionInfo.utmCampaign,
      };
    });
  }
}

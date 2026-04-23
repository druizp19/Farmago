// ============================================================================
// VTEX HTTP CLIENT
// ============================================================================

import { ENV } from '../../config/env';
import { VTEX_CONFIG } from '../../config/constants';
import { logger } from '../../shared/logger';
import type { OrderListItem, OrderDetail } from '../../domain/types/Order';

export class VtexClient {
  private baseUrl: string;
  private headers: Record<string, string>;

  constructor() {
    this.baseUrl = VTEX_CONFIG.BASE_URL_TEMPLATE(ENV.VTEX_ACCOUNT);
    this.headers = {
      'X-VTEX-API-AppKey': ENV.VTEX_APP_KEY,
      'X-VTEX-API-AppToken': ENV.VTEX_APP_TOKEN,
      'Content-Type': VTEX_CONFIG.HEADERS.CONTENT_TYPE,
      'Accept': VTEX_CONFIG.HEADERS.ACCEPT,
    };
  }

  /**
   * Fetch orders list with date filter
   */
  async fetchOrders(dateFrom: string, dateTo: string = '*'): Promise<OrderListItem[]> {
    const dateFilter = `creationDate:[${dateFrom} TO ${dateTo}]`;
    let page = 1;
    let allOrders: OrderListItem[] = [];
    let hasMore = true;

    while (hasMore) {
      const url = `${this.baseUrl}/orders?page=${page}&per_page=${VTEX_CONFIG.PAGINATION.PER_PAGE}&orderBy=${VTEX_CONFIG.PAGINATION.ORDER_BY}&f_creationDate=${encodeURIComponent(dateFilter)}`;
      
      try {
        const response = await fetch(url, { headers: this.headers });
        
        if (!response.ok) {
          logger.error(`VTEX API error: ${response.status}`);
          break;
        }

        const data = await response.json() as { list?: OrderListItem[]; paging?: { pages?: number } };
        const list = data.list || [];
        allOrders = [...allOrders, ...list];
        
        const totalPages = data.paging?.pages || 1;
        
        if (page === 1) {
          logger.info(`📦 Fetching orders from ${dateFrom.split('T')[0]} (${totalPages} pages)`);
        }

        hasMore = page < totalPages && list.length > 0;
        page++;
      } catch (err) {
        logger.error('Fetch orders error:', err);
        break;
      }
    }

    return allOrders;
  }

  /**
   * Fetch single order detail with retry on 429
   */
  async fetchOrderDetail(orderId: string, retries: number = VTEX_CONFIG.RETRY.MAX_ATTEMPTS): Promise<OrderDetail | null> {
    try {
      const response = await fetch(`${this.baseUrl}/orders/${orderId}`, { 
        headers: this.headers 
      });

      if (response.status === 429 && retries > 0) {
        await this.delay(VTEX_CONFIG.RETRY.DELAY_MS);
        return this.fetchOrderDetail(orderId, retries - 1);
      }

      if (!response.ok) {
        return null;
      }

      return await response.json() as OrderDetail;
    } catch (err) {
      logger.error(`Error fetching order ${orderId}:`, err);
      return null;
    }
  }

  /**
   * Fetch multiple order details with concurrency control
   */
  async fetchOrderDetailsBatch(
    orderIds: string[], 
    concurrency: number = 40
  ): Promise<OrderDetail[]> {
    const results: OrderDetail[] = [];

    for (let i = 0; i < orderIds.length; i += concurrency) {
      const batch = orderIds.slice(i, i + concurrency);
      const batchResults = await Promise.all(
        batch.map(id => this.fetchOrderDetail(id))
      );
      
      results.push(...batchResults.filter((detail): detail is OrderDetail => detail !== null));
    }

    return results;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

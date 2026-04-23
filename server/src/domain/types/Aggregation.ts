// ============================================================================
// DOMAIN TYPES - Aggregations
// ============================================================================

export interface ProductAggregation {
  id: string;
  name: string;
  imageUrl: string;
  refId: string;
  totalQuantity: number;
  totalRevenue: number;
  orderCount: number;
  category: string;
}

export interface CategoryStat {
  category: string;
  totalQuantity: number;
  totalRevenue: number;
  orderCount: number;
}

export interface DeliveryStat {
  company: string;
  orderCount: number;
  totalCost: number;
  totalRevenue: number;
  avgCostPerOrder: number;
  costPercentage: number;
  channels: Array<{ name: string; count: number }>;
  slas: Array<{ name: string; count: number }>;
  topCities: Array<{ name: string; count: number }>;
  topStates: Array<{ name: string; count: number }>;
  processedOrders?: string[];
}

export interface LocationData {
  state: string;
  city: string;
  count: number;
  revenue: number;
  coordinates: [number, number] | null;
}

export interface ProductsByOrder {
  [orderId: string]: Array<{
    productId: string;
    name: string;
    category: string;
    quantity: number;
    price: number;
    totalValue: number;
  }>;
}

export interface OrderCategoryMap {
  [orderId: string]: string[];
}

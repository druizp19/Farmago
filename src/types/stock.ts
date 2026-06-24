// ============================================================================
// TYPES - Stock
// ============================================================================

/**
 * Stock agrupado por almacén
 */
export interface StockByWarehouse {
  [warehouse: string]: {
    [refId: string]: number;
  };
}

/**
 * Información del caché de stock
 */
export interface StockCacheInfo {
  lastSync: string | null;
  lastUpdate: string | null;
  totalProducts: number;
  productsByWarehouse: Record<string, number>;
}

/**
 * Respuesta de la API de stock
 */
export interface StockResponse {
  stock: StockByWarehouse;
  info: StockCacheInfo;
  timestamp: string;
}

/**
 * Actualización de stock en tiempo real
 */
export interface StockUpdate {
  refId: string;
  warehouse: string;
  previousStock: number;
  newStock: number;
  soldQuantity: number;
  orderId: string;
  timestamp: string;
}

/**
 * Alerta de stock
 */
export interface StockAlert {
  refId: string;
  name: string;
  warehouse: string;
  stock: number;
  level: 'warning' | 'critical' | 'depleted';
  timestamp: string;
}

/**
 * Discrepancia de stock
 */
export interface StockDiscrepancy {
  refId: string;
  warehouse: string;
  expected: number;
  actual: number;
  diff: number;
  reason: string;
}

/**
 * Stock de un producto específico
 */
export interface ProductStock {
  refId: string;
  total: number;
  byWarehouse: {
    PT: number;
    CV: number;
    '94': number;
  };
  lastUpdated: string | null;
}

/**
 * Producto enriquecido con stock
 */
export interface ProductWithStock {
  id: string;
  name: string;
  refId: string;
  imageUrl?: string;
  totalQuantity: number;
  totalRevenue: number;
  orderCount: number;
  category: string;
  stock?: ProductStock;
}

/**
 * Almacenes disponibles
 */
export type Warehouse = 'PT' | 'CV' | '94' | 'Todos';

/**
 * Estado del stock
 */
export type StockLevel = 'ok' | 'warning' | 'critical' | 'depleted';

/**
 * Helper para determinar nivel de stock
 */
export function getStockLevel(stock: number): StockLevel {
  if (stock === 0) return 'depleted';
  if (stock <= 5) return 'critical';
  if (stock <= 10) return 'warning';
  return 'ok';
}

/**
 * Helper para color de badge de stock
 */
export function getStockColor(level: StockLevel): string {
  switch (level) {
    case 'depleted':
      return 'bg-red-100 text-red-700 border-red-200';
    case 'critical':
      return 'bg-orange-100 text-orange-700 border-orange-200';
    case 'warning':
      return 'bg-yellow-100 text-yellow-700 border-yellow-200';
    case 'ok':
      return 'bg-emerald-100 text-emerald-700 border-emerald-200';
  }
}

/**
 * Helper para ícono de stock
 */
export function getStockIcon(level: StockLevel): string {
  switch (level) {
    case 'depleted':
      return '🔴';
    case 'critical':
      return '⚠️';
    case 'warning':
      return '⚡';
    case 'ok':
      return '✅';
  }
}

// ============================================================================
// DOMAIN TYPES - Stock
// ============================================================================

/**
 * Item de stock de la API externa
 */
export interface StockItem {
  lprod: string;     // RefId del producto
  sdohr: number;     // Stock disponible
  lwhs: string;      // Almacén (PT, CV, 94)
}

/**
 * Stock agrupado por almacén
 */
export interface StockByWarehouse {
  [warehouse: string]: {
    [refId: string]: number;
  };
}

/**
 * Caché de stock con ventas pendientes
 */
export interface StockCache {
  // Stock de la API (fuente de verdad)
  apiStock: StockByWarehouse;
  
  // Ventas pendientes desde última sync
  pendingSales: StockByWarehouse;
  
  // Timestamp de última sync
  lastSync: Date;
  
  // Timestamp de última actualización (orden)
  lastUpdate: Date;
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
  timestamp: Date;
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
  timestamp: Date;
}

/**
 * Discrepancia detectada en sync
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
 * Respuesta de login de API de Stock
 */
export interface StockApiLoginResponse {
  token: string;
  expiration?: string;
  expirationDate?: string;
}

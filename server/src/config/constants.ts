export const VTEX_CONFIG = {
  BASE_URL_TEMPLATE: (account: string) => 
    `https://${account}.vtexcommercestable.com.br/api/oms/pvt`,
  
  HEADERS: {
    CONTENT_TYPE: 'application/json',
    ACCEPT: 'application/json',
  },
  
  PAGINATION: {
    PER_PAGE: 100,
    ORDER_BY: 'creationDate,desc',
  },
  
  RETRY: {
    MAX_ATTEMPTS: 2,
    DELAY_MS: 1000,
  },
} as const;

export const SYNC_CONFIG = {
  HISTORICAL_DATE: '2025-11-01T00:00:00.000Z',
  DAYS_TO_SYNC: 5,
  AUTO_SYNC_INTERVAL_MS: 1 * 60 * 1000, // 1 minuto
  CONCURRENCY: 40,
} as const;

export const CACHE_CONFIG = {
  KEYS: {
    HISTORICAL_ORDERS: 'historical_orders',
    ORDER_DETAILS: 'order_details',
  },
  TTL: {
    ORDERS: 300, // 5 minutos
    DETAILS: 0, // Sin expiración
  },
} as const;

export const STATUS_LABELS: Record<string, string> = {
  'payment-pending': 'Pago Pendiente',
  'payment-approved': 'Pago Aprobado',
  'ready-for-handling': 'Listo para Preparar',
  'handling': 'En Preparación',
  'invoiced': 'Facturado',
  'canceled': 'Cancelado',
  'cancellation-requested': 'Solicitó Cancelación',
  'window-to-cancel': 'Ventana Cancelación',
  'waiting-ffmt-authorization': 'Esperando Autorización',
  'approve-payment': 'Aprobando Pago',
} as const;

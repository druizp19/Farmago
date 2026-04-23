// ============================================================================
// CONFIGURACIÓN GENERAL
// ============================================================================

export const APP_CONFIG = {
  NAME: 'FarmaGo Dashboard',
  VERSION: '1.0.0',
  DESCRIPTION: 'Panel de Órdenes VTEX',
} as const;

// ============================================================================
// API & SERVIDOR
// ============================================================================

export const API_CONFIG = {
  SERVER_URL: import.meta.env.VITE_API_URL || 'http://localhost:3001',
  SOCKET_RECONNECTION_DELAY: 1000,
  SOCKET_RECONNECTION_ATTEMPTS: 5,
  REQUEST_TIMEOUT: 30000, // 30 segundos
} as const;

// ============================================================================
// GRÁFICOS Y VISUALIZACIÓN
// ============================================================================

export const CHART_CONFIG = {
  // Límites de caracteres para nombres
  PRODUCT_NAME_MAX_LENGTH: 50,
  CATEGORY_NAME_MAX_LENGTH: 20,
  
  // Dimensiones de gráficos
  CHART_HEIGHT: 340,
  Y_AXIS_WIDTH: 280,
  
  // Límites de datos
  TOP_PRODUCTS_LIMIT: 20,
  TOP_PRODUCTS_CHART_LIMIT: 12,
  TOP_CLIENTS_LIMIT: 10,
  TOP_CATEGORIES_LIMIT: 10,
  
  // Colores para gráficos
  COLORS: [
    '#6A5CBC', // violeta principal
    '#8A74E0',
    '#9E88FD', // violeta claro
    '#B3B7F2',
    '#C4BEE4', // lavanda
    '#D3E0E0', // gris verdoso claro
    '#D7DEE4',
    '#BFCED6', // azul grisáceo
    '#6A5CBC', // violeta principal (loop)
    '#8A74E0',
    '#9E88FD',
    '#B3B7F2',
  ],
} as const;

// ============================================================================
// FILTROS Y PAGINACIÓN
// ============================================================================

export const FILTER_CONFIG = {
  DEFAULT_STATUS: 'all',
  DEFAULT_ORIGIN: 'all',
  DEFAULT_PAYMENT_METHOD: 'all',
  ORDERS_PER_PAGE: 20,
  ORDERS_PER_PAGE_OPTIONS: [10, 20, 50, 100],
} as const;

// ============================================================================
// CACHÉ Y SINCRONIZACIÓN
// ============================================================================

export const CACHE_CONFIG = {
  DASHBOARD_STALE_TIME: 60000, // 1 minuto
  DASHBOARD_CACHE_TIME: 300000, // 5 minutos
  ORDERS_STALE_TIME: 30000, // 30 segundos
  ORDERS_CACHE_TIME: 180000, // 3 minutos
} as const;

// ============================================================================
// ESTADOS DE ÓRDENES
// ============================================================================

export const ORDER_STATUS = {
  PAYMENT_PENDING: 'payment-pending',
  PAYMENT_APPROVED: 'payment-approved',
  READY_FOR_HANDLING: 'ready-for-handling',
  HANDLING: 'handling',
  INVOICED: 'invoiced',
  CANCELED: 'canceled',
  CANCELLATION_REQUESTED: 'cancellation-requested',
  WINDOW_TO_CANCEL: 'window-to-cancel',
  WAITING_FFMT_AUTHORIZATION: 'waiting-ffmt-authorization',
  APPROVE_PAYMENT: 'approve-payment',
} as const;

export const STATUS_LABELS: Record<string, string> = {
  [ORDER_STATUS.PAYMENT_PENDING]: 'Pago Pendiente',
  [ORDER_STATUS.PAYMENT_APPROVED]: 'Pago Aprobado',
  [ORDER_STATUS.READY_FOR_HANDLING]: 'Listo para Preparar',
  [ORDER_STATUS.HANDLING]: 'En Preparación',
  [ORDER_STATUS.INVOICED]: 'Facturado',
  [ORDER_STATUS.CANCELED]: 'Cancelado',
  [ORDER_STATUS.CANCELLATION_REQUESTED]: 'Solicitó Cancelación',
  [ORDER_STATUS.WINDOW_TO_CANCEL]: 'Ventana Cancelación',
  [ORDER_STATUS.WAITING_FFMT_AUTHORIZATION]: 'Esperando Autorización',
  [ORDER_STATUS.APPROVE_PAYMENT]: 'Aprobando Pago',
} as const;

// ============================================================================
// FORMATOS Y LOCALIZACIÓN
// ============================================================================

export const LOCALE_CONFIG = {
  CURRENCY: 'PEN',
  CURRENCY_SYMBOL: 'S/',
  LOCALE: 'es-PE',
  TIMEZONE: 'America/Lima',
} as const;

// ============================================================================
// DELIVERY
// ============================================================================

export const DELIVERY_CONFIG = {
  CHANNELS: {
    PICKUP: 'pickup-in-point',
    DELIVERY: 'delivery',
  },
  CHANNEL_LABELS: {
    'pickup-in-point': 'Retiro en tienda',
    'delivery': 'Domicilio',
  },
} as const;

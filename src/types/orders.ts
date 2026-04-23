export interface OrderListItem {
  orderId: string;
  creationDate: string;
  clientName: string;
  items: null | OrderItem[];
  totalValue: number;
  paymentNames: string;
  status: string;
  statusDescription: string;
  marketPlaceOrderId: string | null;
  sequence: string;
  salesChannel: string;
  affiliateId: string;
  origin: string;
  workflowInErrorState: boolean;
  workflowInRetry: boolean;
  lastMessageUnread: string | null;
  ShippingEstimatedDate: string | null;
  orderIsComplete: boolean;
  authorizedDate: string | null;
  callCenterOperatorName: string | null;
  totalItems: number;
  currencyCode: string;
  hostname: string;
  paymentApprovedDate: string | null;
  readyForHandlingDate: string | null;
  isAllDelivered: boolean;
  isAnyDelivered: boolean;
  // Cyber/Promotion fields
  isCyberOrder?: boolean;
  promotionName?: string;
  discountValue?: number;
  utmCampaign?: string;
}

export interface OrderItem {
  uniqueId: string;
  id: string;
  productId: string;
  name: string;
  quantity: number;
  price: number;
  listPrice: number;
  sellingPrice: number;
  imageUrl: string;
  refId: string;
  ean: string;
}

export interface OrderDetail {
  orderId: string;
  sequence: string;
  status: string;
  statusDescription: string;
  value: number;
  creationDate: string;
  lastChange: string;
  authorizedDate: string | null;
  invoicedDate: string | null;
  totals: Total[];
  items: OrderItem[];
  paymentData: PaymentData;
  shippingData: ShippingData;
  clientProfileData: ClientProfileData;
  itemMetadata: ItemMetadata;
}

export interface Total {
  id: string;
  name: string;
  value: number;
}

export interface PaymentData {
  transactions: Transaction[];
}

export interface Transaction {
  isActive: boolean;
  transactionId: string;
  payments: Payment[];
}

export interface Payment {
  id: string;
  paymentSystem: string;
  paymentSystemName: string;
  value: number;
  installments: number;
}

export interface ShippingData {
  address: Address;
  logisticsInfo: LogisticsInfo[];
}

export interface Address {
  addressType: string;
  receiverName: string;
  city: string;
  state: string;
  street: string;
  number: string;
  neighborhood: string;
  country: string;
}

export interface LogisticsInfo {
  itemIndex: number;
  selectedSla: string;
  selectedDeliveryChannel: string;
  deliveryCompany: string;
  shippingEstimate: string;
  price: number;
}

export interface ClientProfileData {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  documentType: string;
  document: string;
  phone: string;
}

export interface ItemMetadata {
  Items: ItemMetadataItem[];
}

export interface ItemMetadataItem {
  Id: string;
  Name: string;
  SkuName: string;
  ImageUrl: string;
  DetailUrl: string;
}

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

export interface DashboardFilters {
  status: string[]; // Cambiado de string a string[]
  dateFrom: string;
  dateTo: string;
  timeFrom: string; // Hora desde (HH:mm)
  timeTo: string; // Hora hasta (HH:mm)
  origin: string;
  paymentMethod: string[]; // Cambiado de string a string[]
  categoryLevel1: string[];
  categoryLevel2: string[];
  categoryLevel3: string[];
  isCyberOrder: string; // 'all' | 'cyber' | 'regular'
}

export interface DashboardKPIs {
  totalOrders: number;
  totalRevenue: number;
  avgOrderValue: number;
  avgTimeBetweenOrders: number; // Tiempo promedio entre órdenes en minutos
  pendingOrders: number;
  cancelledOrders: number;
  invoicedOrders: number;
  handlingOrders: number;
  readyForHandling: number;
  deliveredOrders: number;
  conversionRate: number;
  topPaymentMethod: string;
  revenueByStatus: Record<string, number>;
  ordersByHour: { hour: string; count: number }[];
  ordersByDay: { date: string; count: number; revenue: number }[];
  statusDistribution: { status: string; label: string; count: number; value: number }[];
  paymentDistribution: { name: string; count: number; value: number }[];
  topClients: { name: string; orders: number; revenue: number }[];
  deliveryChannels: { channel: string; label: string; count: number }[];
  originDistribution: { origin: string; count: number }[];
  locationDistribution: { state: string; city: string; count: number; revenue: number; coordinates: [number, number] | null }[];
  // Cyber/Promotion metrics
  cyberOrders: number;
  cyberRevenue: number;
  cyberDiscountTotal: number;
  cyberPercentage: number;
  topPromotions: { name: string; orders: number; revenue: number; discount: number }[];
}


// ─── Delivery Types ───────────────────────────────────────────────────────────
export interface DeliveryStat {
  company: string;
  orderCount: number;
  totalCost: number;
  totalRevenue: number;
  avgCostPerOrder: number;
  costPercentage: number;
  channels: { name: string; count: number }[];
  slas: { name: string; count: number }[];
  topCities: { name: string; count: number }[];
  topStates: { name: string; count: number }[];
}

export interface DeliveryKPIs {
  totalDeliveryCost: number;
  avgDeliveryCostPerOrder: number;
  deliveryCostPercentage: number;
  totalOrders: number;
  deliveryOrders: number;
  pickupOrders: number;
  topDeliveryCompany: string;
  deliveryByCompany: DeliveryStat[];
  deliveryByChannel: { channel: string; count: number; cost: number }[];
  deliveryBySLA: { sla: string; count: number; avgCost: number }[];
  deliveryCostTrend: { date: string; cost: number; orders: number }[];
  costEfficiency: { company: string; costPerOrder: number; orderCount: number }[];
}

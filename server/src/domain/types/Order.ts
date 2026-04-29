// ============================================================================
// DOMAIN TYPES - Order
// ============================================================================

export interface OrderListItem {
  orderId: string;
  sequence: string;
  marketplaceOrderId: string;
  origin: string;
  affiliateId: string;
  salesChannel: string;
  status: string;
  statusDescription: string;
  value: number;
  totalValue: number;
  creationDate: string;
  lastChange: string;
  orderGroup: string;
  hostname: string;
  isCompleted: boolean;
  authorizedDate: string | null;
  invoicedDate: string | null;
  clientName: string;
  paymentNames: string;
  cardType?: string | null; // Tipo específico de tarjeta (Visa, Mastercard, etc.)
  workflowInErrorState: boolean;
  isAllDelivered: boolean;
  // Promotion fields
  isCyberOrder?: boolean;
  promotionName?: string;
  discountValue?: number;
  utmCampaign?: string;
}

export interface OrderDetail {
  orderId: string;
  sequence: string;
  marketplaceOrderId: string;
  origin: string;
  status: string;
  value: number;
  creationDate: string;
  lastChange: string;
  authorizedDate: string | null;
  invoicedDate: string | null;
  items: OrderItem[];
  shippingData: ShippingData;
  paymentData: PaymentData;
  clientProfileData: ClientProfileData;
  ratesAndBenefitsData?: RatesAndBenefitsData;
  marketingData?: MarketingData;
  totals?: Array<{ id: string; name: string; value: number }>;
  openTextField?: OpenTextField;
  customData?: CustomData;
  packageAttachment?: PackageAttachment;
  [key: string]: any;
}

export interface OrderItem {
  id: string;
  productId: string;
  name: string;
  quantity: number;
  price: number;
  sellingPrice: number;
  imageUrl?: string;
  refId?: string;
  priceTags?: Array<{
    name: string;
    value: number;
    identifier?: string;
    [key: string]: any;
  }>;
  additionalInfo?: {
    categories?: Array<{ id: string; name: string }>;
    brandName?: string;
    brandId?: string;
    dimension?: {
      cubicweight: number;
      height: number;
      length: number;
      weight: number;
      width: number;
    };
  };
  productCategories?: Record<string, string>;
  [key: string]: any;
}

export interface ShippingData {
  address: Address;
  logisticsInfo: LogisticsInfo[];
  selectedAddresses?: Address[];
  [key: string]: any;
}

export interface Address {
  addressType: string;
  receiverName: string;
  addressId: string;
  postalCode: string;
  city: string;
  state: string;
  country: string;
  street: string;
  number: string;
  neighborhood: string;
  complement: string | null;
  reference: string | null;
  geoCoordinates: number[];
}

export interface LogisticsInfo {
  itemIndex: number;
  selectedSla: string;
  selectedDeliveryChannel: string;
  price: number;
  deliveryCompany: string;
  shippingEstimate: string;
  shippingEstimateDate: string;
  pickupStoreInfo?: PickupStoreInfo;
  slas?: SLA[];
  [key: string]: any;
}

export interface PickupStoreInfo {
  friendlyName: string;
  address: Address;
  additionalInfo?: string;
  dockId?: string;
  isPickupStore: boolean;
}

export interface SLA {
  id: string;
  name: string;
  deliveryChannel: string;
  price: number;
  shippingEstimate: string;
  pickupStoreInfo?: PickupStoreInfo;
  pickupDistance?: number;
  [key: string]: any;
}

export interface PaymentData {
  transactions: Transaction[];
  [key: string]: any;
}

export interface Transaction {
  transactionId: string;
  payments: Payment[];
  [key: string]: any;
}

export interface Payment {
  id: string;
  paymentSystem: string;
  paymentSystemName: string;
  value: number;
  installments: number;
  [key: string]: any;
}

export interface ClientProfileData {
  email: string;
  firstName: string;
  lastName: string;
  documentType: string;
  document: string;
  phone: string;
  [key: string]: any;
}

export interface RatesAndBenefitsData {
  rateAndBenefitsIdentifiers: Array<{
    id: string;
    name: string;
    description: string;
    [key: string]: any;
  }>;
}

export interface OpenTextField {
  value: string;
}

export interface CustomData {
  customApps?: Array<{
    id: string;
    fields: Record<string, any>;
  }>;
}

export interface PackageAttachment {
  packages: Array<{
    invoiceNumber: string;
    invoiceValue: number;
    issuanceDate: string;
    trackingNumber: string;
    courierStatus?: {
      deliveredDate?: string;
      status: string;
      finished: boolean;
    };
    [key: string]: any;
  }>;
}

export interface MarketingData {
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmiCampaign?: string;
  utmipage?: string;
  utmiPart?: string;
  coupon?: string;
  marketingTags?: string[];
  [key: string]: any;
}

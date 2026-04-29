import { create } from 'zustand';
import type { OrderListItem, DashboardFilters, ProductAggregation, CategoryStat, DeliveryStat } from '../../types/orders';

// ============================================================================
// ORDERS STORE
// ============================================================================

interface OrdersState {
  orders: OrderListItem[];
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
  connected: boolean;
  
  setOrders: (orders: OrderListItem[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setLastUpdated: (date: Date) => void;
  setConnected: (connected: boolean) => void;
}

export const useOrdersStore = create<OrdersState>((set) => ({
  orders: [],
  loading: true,
  error: null,
  lastUpdated: null,
  connected: false,
  
  setOrders: (orders) => set({ orders }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  setLastUpdated: (date) => set({ lastUpdated: date }),
  setConnected: (connected) => set({ connected }),
}));

// ============================================================================
// PRODUCTS STORE
// ============================================================================

interface ProductsState {
  topProducts: ProductAggregation[];
  categoryStats: CategoryStat[];
  categoryList: string[];
  orderCategoryMap: Record<string, string[]>;
  productsByOrder: Record<string, Array<{
    productId: string;
    name: string;
    category: string;
    quantity: number;
    price: number;
    totalValue: number;
  }>>;
  
  setTopProducts: (products: ProductAggregation[]) => void;
  setCategoryStats: (stats: CategoryStat[]) => void;
  setCategoryList: (list: string[]) => void;
  setOrderCategoryMap: (map: Record<string, string[]>) => void;
  setProductsByOrder: (products: Record<string, Array<any>>) => void;
}

export const useProductsStore = create<ProductsState>((set) => ({
  topProducts: [],
  categoryStats: [],
  categoryList: [],
  orderCategoryMap: {},
  productsByOrder: {},
  
  setTopProducts: (products) => set({ topProducts: products }),
  setCategoryStats: (stats) => set({ categoryStats: stats }),
  setCategoryList: (list) => set({ categoryList: list }),
  setOrderCategoryMap: (map) => set({ orderCategoryMap: map }),
  setProductsByOrder: (products) => set({ productsByOrder: products }),
}));

// ============================================================================
// FILTERS STORE
// ============================================================================

interface FiltersState {
  filters: DashboardFilters;
  setFilters: (filters: DashboardFilters) => void;
  resetFilters: () => void;
  updateFilter: <K extends keyof DashboardFilters>(key: K, value: DashboardFilters[K]) => void;
}

const DEFAULT_FILTERS: DashboardFilters = {
  status: [],
  dateFrom: '',
  dateTo: '',
  timeFrom: '',
  timeTo: '',
  origin: 'all',
  paymentMethod: [],
  cardType: [],
  categoryLevel1: [],
  categoryLevel2: [],
  categoryLevel3: [],
  isCyberOrder: 'all',
};

export const useFiltersStore = create<FiltersState>((set) => ({
  filters: DEFAULT_FILTERS,
  
  setFilters: (filters) => set({ filters }),
  resetFilters: () => set({ filters: DEFAULT_FILTERS }),
  updateFilter: (key, value) => set((state) => ({
    filters: { ...state.filters, [key]: value }
  })),
}));

// ============================================================================
// DELIVERY STORE
// ============================================================================

interface DeliveryState {
  deliveryStats: DeliveryStat[];
  locationData: Array<{
    state: string;
    city: string;
    count: number;
    revenue: number;
    coordinates: [number, number] | null;
  }>;
  orderDetailsMap: Record<string, any>;
  
  setDeliveryStats: (stats: DeliveryStat[]) => void;
  setLocationData: (data: Array<any>) => void;
  setOrderDetailsMap: (map: Record<string, any>) => void;
}

export const useDeliveryStore = create<DeliveryState>((set) => ({
  deliveryStats: [],
  locationData: [],
  orderDetailsMap: {},
  
  setDeliveryStats: (stats) => set({ deliveryStats: stats }),
  setLocationData: (data) => set({ locationData: data }),
  setOrderDetailsMap: (map) => set({ orderDetailsMap: map }),
}));

// ============================================================================
// UI STORE
// ============================================================================

interface UIState {
  selectedOrderId: string | null;
  newOrder: OrderListItem | null;
  newOrdersQueue: OrderListItem[];
  refreshing: boolean;
  
  setSelectedOrderId: (id: string | null) => void;
  setNewOrder: (order: OrderListItem | null) => void;
  addNewOrders: (orders: OrderListItem[]) => void;
  setRefreshing: (refreshing: boolean) => void;
  clearNewOrder: () => void;
  clearAllNewOrders: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  selectedOrderId: null,
  newOrder: null,
  newOrdersQueue: [],
  refreshing: false,
  
  setSelectedOrderId: (id) => set({ selectedOrderId: id }),
  setNewOrder: (order) => set({ newOrder: order }),
  addNewOrders: (orders) => set((state) => ({
    newOrdersQueue: [...state.newOrdersQueue, ...orders]
  })),
  setRefreshing: (refreshing) => set({ refreshing }),
  clearNewOrder: () => set({ newOrder: null }),
  clearAllNewOrders: () => set({ newOrder: null, newOrdersQueue: [] }),
}));

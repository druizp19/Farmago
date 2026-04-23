import { useSocket } from './useSocket';
import { useKPIs } from '../../features/analytics/hooks/useKPIs';
import { useOrderFilters } from '../../features/orders/hooks/useOrderFilters';
import { useFilteredProducts } from '../../features/products/hooks/useFilteredProducts';
import { useFilterOptions } from './useFilterOptions';
import { 
  useOrdersStore, 
  useProductsStore, 
  useFiltersStore,
  useDeliveryStore,
  useUIStore 
} from '../store/store';

/**
 * Hook principal del dashboard que combina todos los hooks especializados
 * Este reemplaza al antiguo useOrders.ts
 */
export function useDashboard() {
  // Socket connection
  const { refresh } = useSocket();

  // State from stores
  const { orders, loading, error, lastUpdated, connected } = useOrdersStore();
  const { topProducts, categoryStats, categoryList, orderCategoryMap, productsByOrder } = useProductsStore();
  const { filters, setFilters, resetFilters } = useFiltersStore();
  const { deliveryStats, locationData, orderDetailsMap } = useDeliveryStore();
  const { newOrder, newOrdersQueue, clearNewOrder, clearAllNewOrders } = useUIStore();

  // Filtered orders
  const { filteredOrders, filteredOrdersWithRevenue } = useOrderFilters(orders);

  // KPIs
  const kpis = useKPIs(filteredOrdersWithRevenue);

  // Filtered products and categories
  const { filteredProducts, filteredCategoryStats } = useFilteredProducts(filteredOrdersWithRevenue);

  // Filter options
  const { filterOptions, level1Options, level2Options, level3Options } = useFilterOptions(orders);

  // Add location data to KPIs
  const kpisWithLocation = {
    ...kpis,
    locationDistribution: locationData,
  };

  return {
    // Orders
    orders,
    filteredOrders,
    
    // Products & Categories
    topProducts,
    categoryStats,
    categoryList,
    orderCategoryMap,
    filteredProducts,
    filteredCategoryStats,
    
    // KPIs
    kpis: kpisWithLocation,
    
    // Delivery
    deliveryStats,
    orderDetailsMap,
    
    // Filters
    filters,
    setFilters,
    resetFilters,
    filterOptions,
    level1Options,
    level2Options,
    level3Options,
    
    // Connection state
    connected,
    loading,
    error,
    lastUpdated,
    
    // Actions
    refresh,
    
    // New order notification
    newOrder,
    newOrdersQueue,
    clearNewOrder,
    clearAllNewOrders,
  };
}

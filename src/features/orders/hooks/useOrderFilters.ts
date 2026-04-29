import { useMemo } from 'react';
import type { OrderListItem, DashboardFilters } from '../../../types/orders';
import { useFiltersStore, useProductsStore } from '../../../shared/store/store';

/**
 * Hook para filtrar órdenes basado en los filtros activos
 */
export function useOrderFilters(orders: OrderListItem[]) {
  const filters = useFiltersStore((state) => state.filters);
  const productsByOrder = useProductsStore((state) => state.productsByOrder);

  const filteredOrdersWithRevenue = useMemo(() => {
    const hasCategoryFilter = filters.categoryLevel1.length > 0 || filters.categoryLevel2.length > 0 || filters.categoryLevel3.length > 0;
    
    const result = orders.map(o => {
      // Apply non-category filters first
      let passesFilters = true;
      
      // Status filter (array)
      if (filters.status.length > 0 && !filters.status.includes(o.status)) passesFilters = false;
      
      if (filters.origin !== 'all' && o.origin !== filters.origin) passesFilters = false;
      
      // Payment method filter (array)
      if (filters.paymentMethod.length > 0 && !filters.paymentMethod.includes(o.paymentNames)) passesFilters = false;
      
      // Card type filter (array) - solo aplica si el método de pago es Open Pay
      if (filters.cardType.length > 0) {
        if (o.paymentNames === 'Open Pay') {
          if (!o.cardType || !filters.cardType.includes(o.cardType)) passesFilters = false;
        } else {
          // Si se filtra por tipo de tarjeta pero el pago no es Open Pay, excluir
          passesFilters = false;
        }
      }
      
      // Cyber filter
      if (filters.isCyberOrder === 'cyber' && !o.isCyberOrder) passesFilters = false;
      if (filters.isCyberOrder === 'regular' && o.isCyberOrder) passesFilters = false;
      
      if (filters.dateFrom) {
        const from = new Date(filters.dateFrom + 'T00:00:00');
        if (new Date(o.creationDate) < from) passesFilters = false;
      }
      if (filters.dateTo) {
        const to = new Date(filters.dateTo + 'T23:59:59');
        if (new Date(o.creationDate) > to) passesFilters = false;
      }
      
      // Time filter
      if (filters.timeFrom || filters.timeTo) {
        const orderDate = new Date(o.creationDate);
        const orderTime = orderDate.getHours() * 60 + orderDate.getMinutes(); // Convert to minutes
        
        if (filters.timeFrom) {
          const [fromHours, fromMinutes] = filters.timeFrom.split(':').map(Number);
          const fromTime = fromHours * 60 + fromMinutes;
          if (orderTime < fromTime) passesFilters = false;
        }
        
        if (filters.timeTo) {
          const [toHours, toMinutes] = filters.timeTo.split(':').map(Number);
          const toTime = toHours * 60 + toMinutes;
          if (orderTime > toTime) passesFilters = false;
        }
      }
      
      if (!passesFilters) return null;
      
      // If no category filter, include full order
      if (!hasCategoryFilter) {
        return { ...o, filteredValue: o.totalValue };
      }
      
      // Calculate filtered value based on matching products only
      const orderProducts = productsByOrder[o.orderId] || [];
      
      if (orderProducts.length === 0) {
        return null;
      }
      
      let filteredValue = 0;
      let hasMatchingProduct = false;
      
      for (const product of orderProducts) {
        if (!product.category) continue;
        
        const levels = product.category.split(' > ').map(l => l.trim());
        
        let matches = true;
        
        if (filters.categoryLevel1.length > 0) {
          if (!levels[0] || !filters.categoryLevel1.includes(levels[0])) {
            matches = false;
          }
        }
        
        if (matches && filters.categoryLevel2.length > 0) {
          if (!levels[1] || !filters.categoryLevel2.includes(levels[1])) {
            matches = false;
          }
        }
        
        if (matches && filters.categoryLevel3.length > 0) {
          if (!levels[2] || !filters.categoryLevel3.includes(levels[2])) {
            matches = false;
          }
        }
        
        if (matches) {
          filteredValue += product.totalValue;
          hasMatchingProduct = true;
        }
      }
      
      if (!hasMatchingProduct) {
        return null;
      }
      
      return { ...o, filteredValue };
    }).filter((o): o is OrderListItem & { filteredValue: number } => o !== null);
    
    return result;
  }, [orders, filters, productsByOrder]);

  const filteredOrders = useMemo(() => {
    return filteredOrdersWithRevenue.map(({ filteredValue, ...order }) => order);
  }, [filteredOrdersWithRevenue]);

  return { filteredOrders, filteredOrdersWithRevenue };
}

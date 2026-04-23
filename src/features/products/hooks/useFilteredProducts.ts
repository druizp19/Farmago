import { useMemo } from 'react';
import type { OrderListItem, ProductAggregation, CategoryStat } from '../../../types/orders';
import { useFiltersStore, useProductsStore } from '../../../shared/store/store';
import { CHART_CONFIG } from '../../../shared/config/constants';

/**
 * Hook para obtener productos y categorías filtrados
 */
export function useFilteredProducts(filteredOrdersWithRevenue: Array<OrderListItem & { filteredValue: number }>) {
  const filters = useFiltersStore((state) => state.filters);
  const productsByOrder = useProductsStore((state) => state.productsByOrder);

  const filteredProducts = useMemo(() => {
    const productMap: Record<string, ProductAggregation> = {};
    
    filteredOrdersWithRevenue.forEach(order => {
      const orderProducts = productsByOrder[order.orderId] || [];
      
      orderProducts.forEach(product => {
        const levels = product.category ? product.category.split(' > ').map(l => l.trim()) : [];
        
        const l1Match = filters.categoryLevel1.length === 0 || (levels[0] && filters.categoryLevel1.includes(levels[0]));
        const l2Match = filters.categoryLevel2.length === 0 || (levels[1] && filters.categoryLevel2.includes(levels[1]));
        const l3Match = filters.categoryLevel3.length === 0 || (levels[2] && filters.categoryLevel3.includes(levels[2]));
        
        if (!l1Match || !l2Match || !l3Match) return;
        
        const key = product.name.trim();
        
        if (!productMap[key]) {
          productMap[key] = {
            id: product.productId,
            name: product.name.trim(),
            imageUrl: '',
            refId: product.productId,
            totalQuantity: 0,
            totalRevenue: 0,
            orderCount: 0,
            category: product.category || 'Sin categoría',
          };
        }
        
        productMap[key].totalQuantity += product.quantity;
        productMap[key].totalRevenue += product.totalValue;
        productMap[key].orderCount += 1;
      });
    });
    
    return Object.values(productMap)
      .sort((a, b) => b.totalQuantity - a.totalQuantity)
      .slice(0, CHART_CONFIG.TOP_PRODUCTS_LIMIT);
  }, [filteredOrdersWithRevenue, productsByOrder, filters.categoryLevel1, filters.categoryLevel2, filters.categoryLevel3]);

  const filteredCategoryStats = useMemo(() => {
    const categoryMap: Record<string, CategoryStat> = {};
    
    filteredOrdersWithRevenue.forEach(order => {
      const orderProducts = productsByOrder[order.orderId] || [];
      
      orderProducts.forEach(product => {
        const category = product.category || 'Sin categoría';
        const levels = product.category ? product.category.split(' > ').map(l => l.trim()) : [];
        
        const l1Match = filters.categoryLevel1.length === 0 || (levels[0] && filters.categoryLevel1.includes(levels[0]));
        const l2Match = filters.categoryLevel2.length === 0 || (levels[1] && filters.categoryLevel2.includes(levels[1]));
        const l3Match = filters.categoryLevel3.length === 0 || (levels[2] && filters.categoryLevel3.includes(levels[2]));
        
        if (!l1Match || !l2Match || !l3Match) return;
        
        if (!categoryMap[category]) {
          categoryMap[category] = {
            category,
            totalQuantity: 0,
            totalRevenue: 0,
            orderCount: 0,
          };
        }
        
        categoryMap[category].totalQuantity += product.quantity;
        categoryMap[category].totalRevenue += product.totalValue;
        categoryMap[category].orderCount += 1;
      });
    });
    
    return Object.values(categoryMap)
      .sort((a, b) => b.totalQuantity - a.totalQuantity);
  }, [filteredOrdersWithRevenue, productsByOrder, filters.categoryLevel1, filters.categoryLevel2, filters.categoryLevel3]);

  return { filteredProducts, filteredCategoryStats };
}

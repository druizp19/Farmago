import { useMemo } from 'react';
import type { OrderListItem } from '../../types/orders';
import { useFiltersStore, useProductsStore } from '../store/store';

/**
 * Hook para obtener las opciones disponibles para los filtros
 */
export function useFilterOptions(orders: OrderListItem[]) {
  const filters = useFiltersStore((state) => state.filters);
  const { categoryList, topProducts, productsByOrder } = useProductsStore();

  // Opciones de status, origin, payment
  const filterOptions = useMemo(() => {
    const statuses = [...new Set(orders.map(o => o.status))].sort();
    const origins = [...new Set(orders.map(o => o.origin).filter(Boolean))].sort();
    
    // Generar opciones de pago jerárquicas
    const paymentSet = new Set<string>();
    const cardTypesByPayment: Record<string, Set<string>> = {};
    
    orders.forEach(o => {
      const paymentMethod = o.paymentNames;
      if (paymentMethod) {
        paymentSet.add(paymentMethod);
        
        // Si es Open Pay y tiene cardType, agregarlo
        if (paymentMethod === 'Open Pay' && o.cardType) {
          if (!cardTypesByPayment[paymentMethod]) {
            cardTypesByPayment[paymentMethod] = new Set();
          }
          cardTypesByPayment[paymentMethod].add(o.cardType);
        }
      }
    });
    
    const payments = Array.from(paymentSet).sort();
    
    return { statuses, origins, payments, cardTypesByPayment };
  }, [orders]);

  // Opciones de tipos de tarjeta (cuando se selecciona Open Pay)
  const cardTypeOptions = useMemo(() => {
    if (!filters.paymentMethod.includes('Open Pay')) {
      return [];
    }
    
    const cardTypes = new Set<string>();
    orders.forEach(o => {
      if (o.paymentNames === 'Open Pay' && o.cardType) {
        cardTypes.add(o.cardType);
      }
    });
    
    return Array.from(cardTypes).sort();
  }, [orders, filters.paymentMethod]);

  // Level 1 options
  const level1Options = useMemo(() => {
    const opts = new Set<string>();
    
    categoryList.forEach(catPath => {
      const levels = catPath.split(' > ');
      if (levels[0] && levels[0].trim()) opts.add(levels[0].trim());
    });
    
    topProducts.forEach(p => {
      if (p.category) {
        const levels = p.category.split(' > ');
        if (levels[0] && levels[0].trim()) opts.add(levels[0].trim());
      }
    });
    
    Object.values(productsByOrder).forEach(products => {
      products.forEach(p => {
        if (p.category) {
          const levels = p.category.split(' > ');
          if (levels[0] && levels[0].trim()) opts.add(levels[0].trim());
        }
      });
    });
    
    return Array.from(opts).sort();
  }, [categoryList, topProducts, productsByOrder]);

  // Level 2 options
  const level2Options = useMemo(() => {
    const opts = new Set<string>();
    
    categoryList.forEach(catPath => {
      const levels = catPath.split(' > ').map(l => l.trim());
      const l1Match = filters.categoryLevel1.length === 0 || filters.categoryLevel1.includes(levels[0]);
      if (l1Match && levels[1]) opts.add(levels[1]);
    });
    
    topProducts.forEach(p => {
      if (p.category) {
        const levels = p.category.split(' > ').map(l => l.trim());
        const l1Match = filters.categoryLevel1.length === 0 || filters.categoryLevel1.includes(levels[0]);
        if (l1Match && levels[1]) opts.add(levels[1]);
      }
    });
    
    return Array.from(opts).sort();
  }, [categoryList, topProducts, filters.categoryLevel1]);

  // Level 3 options
  const level3Options = useMemo(() => {
    const opts = new Set<string>();
    
    categoryList.forEach(catPath => {
      const levels = catPath.split(' > ').map(l => l.trim());
      const l1Match = filters.categoryLevel1.length === 0 || filters.categoryLevel1.includes(levels[0]);
      const l2Match = filters.categoryLevel2.length === 0 || filters.categoryLevel2.includes(levels[1]);
      if (l1Match && l2Match && levels[2]) opts.add(levels[2]);
    });
    
    topProducts.forEach(p => {
      if (p.category) {
        const levels = p.category.split(' > ').map(l => l.trim());
        const l1Match = filters.categoryLevel1.length === 0 || filters.categoryLevel1.includes(levels[0]);
        const l2Match = filters.categoryLevel2.length === 0 || filters.categoryLevel2.includes(levels[1]);
        if (l1Match && l2Match && levels[2]) opts.add(levels[2]);
      }
    });
    
    return Array.from(opts).sort();
  }, [categoryList, topProducts, filters.categoryLevel1, filters.categoryLevel2]);

  return {
    filterOptions,
    cardTypeOptions,
    level1Options,
    level2Options,
    level3Options,
  };
}

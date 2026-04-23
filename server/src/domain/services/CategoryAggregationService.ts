// ============================================================================
// CATEGORY AGGREGATION SERVICE
// ============================================================================

import type { CategoryStat, ProductsByOrder, OrderCategoryMap } from '../types/Aggregation';

export class CategoryAggregationService {
  /**
   * Aggregate categories from products by order
   */
  aggregate(productsByOrder: ProductsByOrder): {
    categoryStats: CategoryStat[];
    categoryList: string[];
    orderCategoryMap: OrderCategoryMap;
  } {
    const categoryMap: Record<string, CategoryStat> = {};
    const allCategoriesSet = new Set<string>();
    const orderCategoryMap: OrderCategoryMap = {};

    for (const [orderId, products] of Object.entries(productsByOrder)) {
      const orderCategories = new Set<string>();

      for (const product of products) {
        const category = product.category || 'Sin categoría';
        
        // Add to order categories
        orderCategories.add(category);

        // Build category hierarchy
        if (category !== 'Sin categoría') {
          const levels = category.split(' > ');
          for (let i = 1; i <= levels.length; i++) {
            allCategoriesSet.add(levels.slice(0, i).join(' > '));
          }
        }

        // Aggregate category stats
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
      }

      orderCategoryMap[orderId] = Array.from(orderCategories);
    }

    const categoryStats = Object.values(categoryMap)
      .sort((a, b) => b.totalQuantity - a.totalQuantity);

    const categoryList = Array.from(allCategoriesSet).sort();

    return {
      categoryStats,
      categoryList,
      orderCategoryMap,
    };
  }
}

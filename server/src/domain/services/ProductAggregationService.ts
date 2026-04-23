// ============================================================================
// PRODUCT AGGREGATION SERVICE
// ============================================================================

import type { OrderDetail } from '../types/Order';
import type { ProductAggregation, ProductsByOrder } from '../types/Aggregation';

export class ProductAggregationService {
  /**
   * Aggregate products from order details
   */
  aggregate(
    orderDetails: OrderDetail[],
    existingProductsByOrder: ProductsByOrder = {}
  ): {
    products: ProductAggregation[];
    productsByOrder: ProductsByOrder;
  } {
    const productMap: Record<string, ProductAggregation> = {};
    const productsByOrder: ProductsByOrder = { ...existingProductsByOrder };

    for (const detail of orderDetails) {
      if (!detail?.items) continue;

      const orderProducts: ProductsByOrder[string] = [];

      for (const item of detail.items) {
        // Extract category
        let category = 'Sin categoría';
        
        if (item.additionalInfo?.categories && Array.isArray(item.additionalInfo.categories)) {
          const categoryNames = item.additionalInfo.categories
            .map(cat => cat.name)
            .filter(name => name && typeof name === 'string');
          
          if (categoryNames.length > 0) {
            category = categoryNames.reverse().join(' > ');
          }
        } else if (item.productCategories) {
          const categoriesObj = item.productCategories || {};
          const categoryNames = Object.values(categoriesObj)
            .filter(name => typeof name === 'string' && isNaN(Number(name)));
          
          if (categoryNames.length > 0) {
            category = categoryNames.join(' > ');
          }
        }

        const productTotalValue = (item.sellingPrice || item.price) * item.quantity;
        const productId = item.productId || item.id;
        const productName = item.name.trim();

        // Add to order products
        orderProducts.push({
          productId,
          name: productName,
          category,
          quantity: item.quantity,
          price: item.sellingPrice || item.price,
          totalValue: productTotalValue,
        });

        // Aggregate by product name (not ID to handle duplicates)
        const key = productName;
        
        if (!productMap[key]) {
          productMap[key] = {
            id: productId,
            name: productName,
            imageUrl: item.imageUrl || '',
            refId: item.refId || productId,
            totalQuantity: 0,
            totalRevenue: 0,
            orderCount: 0,
            category,
          };
        }

        productMap[key].totalQuantity += item.quantity;
        productMap[key].totalRevenue += productTotalValue;
        productMap[key].orderCount += 1;
      }

      productsByOrder[detail.orderId] = orderProducts;
    }

    const products = Object.values(productMap)
      .sort((a, b) => b.totalQuantity - a.totalQuantity)
      .slice(0, 20);

    return { products, productsByOrder };
  }

  /**
   * Rebuild product aggregation from cached productsByOrder
   */
  rebuildFromCache(productsByOrder: ProductsByOrder): ProductAggregation[] {
    const productMap: Record<string, ProductAggregation> = {};

    for (const [orderId, products] of Object.entries(productsByOrder)) {
      for (const item of products) {
        const key = item.name.trim();

        if (!productMap[key]) {
          productMap[key] = {
            id: item.productId,
            name: item.name.trim(),
            imageUrl: '',
            refId: item.productId,
            totalQuantity: 0,
            totalRevenue: 0,
            orderCount: 0,
            category: item.category || 'Sin categoría',
          };
        }

        productMap[key].totalQuantity += item.quantity;
        productMap[key].totalRevenue += item.totalValue;
        productMap[key].orderCount += 1;
      }
    }

    return Object.values(productMap)
      .sort((a, b) => b.totalQuantity - a.totalQuantity)
      .slice(0, 20);
  }
}

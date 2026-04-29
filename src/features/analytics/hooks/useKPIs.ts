import { useMemo } from 'react';
import type { OrderListItem, DashboardKPIs } from '../../../types/orders';
import { STATUS_LABELS, ORDER_STATUS, CHART_CONFIG } from '../../../shared/config/constants';

/**
 * Hook para calcular KPIs a partir de órdenes
 */
export function useKPIs(orders: OrderListItem[]): DashboardKPIs {
  return useMemo(() => {
    let totalRevenueCents = 0;
    let deliveredOrdersCount = 0;

    const statusCount: Record<string, number> = {};
    const statusRevenue: Record<string, number> = {};
    const paymentCount: Record<string, number> = {};
    const paymentRevenue: Record<string, number> = {};
    const clientMap: Record<string, { orders: number; revenue: number }> = {};
    const hourMap: Record<string, number> = {};
    const dayMap: Record<string, { count: number; revenue: number }> = {};
    const originMap: Record<string, number> = {};
    const promotionMap: Record<string, { orders: number; revenue: number; discount: number }> = {};

    let cyberOrdersCount = 0;
    let cyberRevenueCents = 0;
    let cyberDiscountCents = 0;

    for (const order of orders) {
      const value = order.totalValue || 0;
      totalRevenueCents += value;
      if (order.isAllDelivered) deliveredOrdersCount++;

      const status = order.status || 'unknown';
      statusCount[status] = (statusCount[status] || 0) + 1;
      statusRevenue[status] = (statusRevenue[status] || 0) + (value / 100);

      const pm = order.paymentNames || 'Otro';
      paymentCount[pm] = (paymentCount[pm] || 0) + 1;
      paymentRevenue[pm] = (paymentRevenue[pm] || 0) + (value / 100);
      
      // Si es Open Pay y tiene cardType, también contarlo
      if (pm === 'Open Pay' && order.cardType) {
        const cardKey = `${pm}:${order.cardType}`;
        paymentCount[cardKey] = (paymentCount[cardKey] || 0) + 1;
        paymentRevenue[cardKey] = (paymentRevenue[cardKey] || 0) + (value / 100);
      }

      const client = order.clientName || 'Desconocido';
      if (!clientMap[client]) clientMap[client] = { orders: 0, revenue: 0 };
      clientMap[client].orders += 1;
      clientMap[client].revenue += value / 100;

      const origin = order.origin || 'Desconocido';
      originMap[origin] = (originMap[origin] || 0) + 1;

      // Cyber/Promotion tracking
      if (order.isCyberOrder) {
        cyberOrdersCount++;
        cyberRevenueCents += value;
        cyberDiscountCents += order.discountValue || 0;

        const promoName = order.promotionName || 'Promoción sin nombre';
        if (!promotionMap[promoName]) {
          promotionMap[promoName] = { orders: 0, revenue: 0, discount: 0 };
        }
        promotionMap[promoName].orders += 1;
        promotionMap[promoName].revenue += value / 100;
        promotionMap[promoName].discount += (order.discountValue || 0) / 100;
      }

      if (order.creationDate) {
        // Optimización: extraer día directamente del string (YYYY-MM-DD) sin instanciar Date.toISOString()
        const dayKey = order.creationDate.slice(0, 10);
        if (!dayMap[dayKey]) dayMap[dayKey] = { count: 0, revenue: 0 };
        dayMap[dayKey].count += 1;
        dayMap[dayKey].revenue += value / 100;

        // Instanciar fecha solo 1 vez para obtener hora local
        const date = new Date(order.creationDate);
        const hour = `${date.getHours().toString().padStart(2, '0')}:00`;
        hourMap[hour] = (hourMap[hour] || 0) + 1;
      }
    }

    const totalOrders = orders.length;
    const totalRevenue = totalRevenueCents / 100;
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    // Calculate average time between orders
    let avgTimeBetweenOrders = 0;
    if (totalOrders > 1) {
      const sortedOrders = [...orders].sort((a, b) => 
        new Date(a.creationDate).getTime() - new Date(b.creationDate).getTime()
      );
      
      let totalTimeDiff = 0;
      for (let i = 1; i < sortedOrders.length; i++) {
        const prevTime = new Date(sortedOrders[i - 1].creationDate).getTime();
        const currTime = new Date(sortedOrders[i].creationDate).getTime();
        totalTimeDiff += currTime - prevTime;
      }
      
      // Convert to minutes
      avgTimeBetweenOrders = Math.round(totalTimeDiff / (sortedOrders.length - 1) / 1000 / 60);
    }

    const statusDistribution = Object.entries(statusCount).map(([status, count]) => ({
      status,
      label: STATUS_LABELS[status] || status,
      count,
      value: statusRevenue[status] || 0,
    })).sort((a, b) => b.count - a.count);

    const paymentDistribution = Object.entries(paymentCount).map(([key, count]) => {
      // Separar el método de pago del tipo de tarjeta si existe
      const [name, cardType] = key.includes(':') ? key.split(':') : [key, null];
      
      return {
        name: cardType || name, // Si tiene cardType, mostrar el tipo de tarjeta
        count,
        value: paymentRevenue[key] || 0,
        parentPayment: cardType ? name : null, // Si es un tipo de tarjeta, indicar su padre
      };
    }).sort((a, b) => b.count - a.count);

    const topClients = Object.entries(clientMap)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, CHART_CONFIG.TOP_CLIENTS_LIMIT);

    const ordersByHour = Array.from({ length: 24 }, (_, i) => {
      const hour = `${i.toString().padStart(2, '0')}:00`;
      return { hour, count: hourMap[hour] || 0 };
    });

    const ordersByDay = Object.entries(dayMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, data]) => ({ date, count: data.count, revenue: data.revenue }));

    const originDistribution = Object.entries(originMap).map(([origin, count]) => ({ origin, count }));

    const topPromotions = Object.entries(promotionMap)
      .map(([name, data]) => ({
        name,
        orders: data.orders,
        revenue: data.revenue,
        discount: data.discount,
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    const cyberPercentage = totalOrders > 0 ? Math.round((cyberOrdersCount / totalOrders) * 100) : 0;

    return {
      totalOrders,
      totalRevenue: totalRevenue,
      avgOrderValue: avgOrderValue,
      avgTimeBetweenOrders,
      pendingOrders: statusCount[ORDER_STATUS.PAYMENT_PENDING] || 0,
      cancelledOrders: (statusCount[ORDER_STATUS.CANCELED] || 0) + (statusCount[ORDER_STATUS.CANCELLATION_REQUESTED] || 0),
      invoicedOrders: statusCount[ORDER_STATUS.INVOICED] || 0,
      handlingOrders: statusCount[ORDER_STATUS.HANDLING] || 0,
      readyForHandling: statusCount[ORDER_STATUS.READY_FOR_HANDLING] || 0,
      deliveredOrders: deliveredOrdersCount,
      conversionRate: totalOrders > 0
        ? Math.round(((statusCount[ORDER_STATUS.INVOICED] || 0) / totalOrders) * 100)
        : 0,
      topPaymentMethod: paymentDistribution[0]?.name || 'N/A',
      revenueByStatus: statusRevenue,
      ordersByHour,
      ordersByDay,
      statusDistribution,
      paymentDistribution,
      topClients,
      deliveryChannels: [],
      originDistribution,
      locationDistribution: [],
      // Cyber/Promotion metrics
      cyberOrders: cyberOrdersCount,
      cyberRevenue: cyberRevenueCents / 100,
      cyberDiscountTotal: cyberDiscountCents / 100,
      cyberPercentage,
      topPromotions,
    };
  }, [orders]);
}

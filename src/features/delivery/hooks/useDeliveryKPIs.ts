import { useMemo } from 'react';
import type { OrderListItem } from '../../../types/orders';

export const useDeliveryKPIs = (orders: OrderListItem[], orderDetailsMap: Record<string, any>) => {
  return useMemo(() => {
    const deliveryMap: Record<string, {
      company: string;
      orderCount: number;
      totalCost: number;
      totalRevenue: number;
      processedOrders: Set<string>;
    }> = {};
    
    // Función para normalizar nombres de compañías
    const normalizeCompanyName = (company: string): string => {
      const normalized = company.toLowerCase().trim();
      
      // Normalizar "Regular" y sus variantes
      if (normalized.includes('regular')) {
        return 'Regular';
      }
      
      // Normalizar "Express" y sus variantes
      if (normalized.includes('express')) {
        return 'Express';
      }
      
      // Retornar el nombre original si no coincide con ninguna normalización
      return company;
    };
    
    // Procesar solo las órdenes filtradas
    orders.forEach(order => {
      const detail = orderDetailsMap[order.orderId];
      if (!detail?.shippingData?.logisticsInfo) return;
      
      const logistics = detail.shippingData.logisticsInfo || [];
      
      // Determinar el canal predominante de la orden
      const channelCount = { 'pickup-in-point': 0, 'delivery': 0 };
      const companyCost: Record<string, number> = {};
      
      logistics.forEach((log: any) => {
        const selectedChannel = log.selectedDeliveryChannel;
        const rawDeliveryCompany = log.deliveryCompany || 'Sin especificar';
        const deliveryCompany = normalizeCompanyName(rawDeliveryCompany);
        
        if (selectedChannel === 'pickup-in-point') {
          channelCount['pickup-in-point']++;
        } else {
          channelCount['delivery']++;
        }
        
        // Acumular costos por compañía
        if (!companyCost[deliveryCompany]) {
          companyCost[deliveryCompany] = 0;
        }
        companyCost[deliveryCompany] += log.price || 0;
      });
      
      // Procesar cada compañía de delivery
      Object.entries(companyCost).forEach(([deliveryCompany, cost]) => {
        if (!deliveryMap[deliveryCompany]) {
          deliveryMap[deliveryCompany] = {
            company: deliveryCompany,
            orderCount: 0,
            totalCost: 0,
            totalRevenue: 0,
            processedOrders: new Set(),
          };
        }
        
        // Solo contar una vez por orden
        if (!deliveryMap[deliveryCompany].processedOrders.has(order.orderId)) {
          deliveryMap[deliveryCompany].orderCount += 1;
          deliveryMap[deliveryCompany].processedOrders.add(order.orderId);
        }
        
        // Acumular costos y revenue
        deliveryMap[deliveryCompany].totalCost += cost;
        deliveryMap[deliveryCompany].totalRevenue += detail.value || 0;
      });
    });
    
    const deliveryStats = Object.values(deliveryMap);
    
    const totalDeliveryCost = deliveryStats.reduce((sum, d) => sum + d.totalCost, 0);
    const totalOrders = deliveryStats.reduce((sum, d) => sum + d.orderCount, 0);
    const totalRevenue = deliveryStats.reduce((sum, d) => sum + d.totalRevenue, 0);
    
    const avgDeliveryCostPerOrder = totalOrders > 0 ? totalDeliveryCost / totalOrders : 0;
    const deliveryCostVsRevenue = totalRevenue > 0 ? (totalDeliveryCost / totalRevenue) : 0;
    
    // Contar órdenes por canal
    const orderChannelMap = new Map<string, string>();
    
    orders.forEach(order => {
      const detail = orderDetailsMap[order.orderId];
      if (!detail?.shippingData?.logisticsInfo) return;
      
      const logistics = detail.shippingData.logisticsInfo || [];
      const channelCount = { 'pickup-in-point': 0, 'delivery': 0 };
      
      logistics.forEach((log: any) => {
        const selectedChannel = log.selectedDeliveryChannel;
        if (selectedChannel === 'pickup-in-point') {
          channelCount['pickup-in-point']++;
        } else {
          channelCount['delivery']++;
        }
      });
      
      const predominantChannel = channelCount['pickup-in-point'] > channelCount['delivery'] 
        ? 'Retiro en tienda' 
        : 'Domicilio';
      
      orderChannelMap.set(order.orderId, predominantChannel);
    });
    
    let deliveryOrders = 0;
    let pickupOrders = 0;
    
    orderChannelMap.forEach(channel => {
      if (channel === 'Domicilio') {
        deliveryOrders++;
      } else {
        pickupOrders++;
      }
    });
    
    const topCompany = deliveryStats.length > 0 
      ? deliveryStats.sort((a, b) => b.orderCount - a.orderCount)[0].company 
      : 'N/A';
    
    // Gasto fijo mensual y diario
    const FIXED_MONTHLY_COST = 4500;
    const FIXED_DAILY_COST = 150;
    
    // Calcular diferencia entre gasto fijo y costo de delivery
    const fixedCostDifference = FIXED_MONTHLY_COST - (totalDeliveryCost / 100);
    
    return {
      totalDeliveryCost: totalDeliveryCost / 100,
      avgDeliveryCostPerOrder: avgDeliveryCostPerOrder / 100,
      deliveryCostVsRevenue,
      totalRevenue: totalRevenue / 100,
      totalOrders,
      deliveryOrders,
      pickupOrders,
      topCompany,
      fixedMonthlyCost: FIXED_MONTHLY_COST,
      fixedDailyCost: FIXED_DAILY_COST,
      fixedCostDifference,
    };
  }, [orders, orderDetailsMap]);
};

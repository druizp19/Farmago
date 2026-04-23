// ============================================================================
// DELIVERY AGGREGATION SERVICE
// ============================================================================

import type { OrderDetail } from '../types/Order';
import type { DeliveryStat, LocationData } from '../types/Aggregation';

interface DeliveryMap {
  [company: string]: {
    company: string;
    orderCount: number;
    totalCost: number;
    totalRevenue: number;
    channels: Record<string, number>;
    slas: Record<string, number>;
    cities: Record<string, number>;
    states: Record<string, number>;
    processedOrders: Set<string>;
  };
}

export class DeliveryAggregationService {
  /**
   * Aggregate delivery statistics from order details
   */
  aggregateDelivery(orderDetails: OrderDetail[]): DeliveryStat[] {
    const deliveryMap: DeliveryMap = {};

    for (const detail of orderDetails) {
      if (!detail?.shippingData?.logisticsInfo) continue;

      const logistics = detail.shippingData.logisticsInfo || [];
      const address = detail.shippingData.address || {};

      // Determine predominant channel
      const channelCount = { 'pickup-in-point': 0, 'delivery': 0 };
      const companyCost: Record<string, number> = {};
      const companySlas: Record<string, string[]> = {};

      for (const log of logistics) {
        const selectedChannel = log.selectedDeliveryChannel;
        const deliveryCompany = log.deliveryCompany || 'Sin especificar';

        if (selectedChannel === 'pickup-in-point') {
          channelCount['pickup-in-point']++;
        } else {
          channelCount['delivery']++;
        }

        if (!companyCost[deliveryCompany]) {
          companyCost[deliveryCompany] = 0;
          companySlas[deliveryCompany] = [];
        }
        companyCost[deliveryCompany] += log.price || 0;

        let sla = log.selectedSla || 'Sin especificar';
        if (selectedChannel === 'pickup-in-point' && log.pickupStoreInfo?.friendlyName) {
          sla = `Retiro en tienda - ${log.pickupStoreInfo.friendlyName}`;
        }
        companySlas[deliveryCompany].push(sla);
      }

      const predominantChannel = channelCount['pickup-in-point'] > channelCount['delivery']
        ? 'Retiro en tienda'
        : 'Domicilio';

      // Process each delivery company
      for (const [deliveryCompany, cost] of Object.entries(companyCost)) {
        if (!deliveryMap[deliveryCompany]) {
          deliveryMap[deliveryCompany] = {
            company: deliveryCompany,
            orderCount: 0,
            totalCost: 0,
            totalRevenue: 0,
            channels: {},
            slas: {},
            cities: {},
            states: {},
            processedOrders: new Set(),
          };
        }

        // Count order only once per company
        if (!deliveryMap[deliveryCompany].processedOrders.has(detail.orderId)) {
          deliveryMap[deliveryCompany].orderCount += 1;
          deliveryMap[deliveryCompany].processedOrders.add(detail.orderId);

          deliveryMap[deliveryCompany].channels[predominantChannel] =
            (deliveryMap[deliveryCompany].channels[predominantChannel] || 0) + 1;

          if (address.city) {
            deliveryMap[deliveryCompany].cities[address.city] =
              (deliveryMap[deliveryCompany].cities[address.city] || 0) + 1;
          }
          if (address.state) {
            deliveryMap[deliveryCompany].states[address.state] =
              (deliveryMap[deliveryCompany].states[address.state] || 0) + 1;
          }
        }

        deliveryMap[deliveryCompany].totalCost += cost;
        deliveryMap[deliveryCompany].totalRevenue += detail.value || 0;

        for (const sla of companySlas[deliveryCompany]) {
          deliveryMap[deliveryCompany].slas[sla] =
            (deliveryMap[deliveryCompany].slas[sla] || 0) + 1;
        }
      }
    }

    return Object.values(deliveryMap).map(d => ({
      company: d.company,
      orderCount: d.orderCount,
      totalCost: d.totalCost,
      totalRevenue: d.totalRevenue,
      avgCostPerOrder: d.orderCount > 0 ? d.totalCost / d.orderCount : 0,
      costPercentage: d.totalRevenue > 0 ? (d.totalCost / d.totalRevenue) * 100 : 0,
      channels: Object.entries(d.channels).map(([name, count]) => ({ name, count })),
      slas: Object.entries(d.slas).map(([name, count]) => ({ name, count })),
      topCities: Object.entries(d.cities)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([name, count]) => ({ name, count })),
      topStates: Object.entries(d.states)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([name, count]) => ({ name, count })),
      processedOrders: Array.from(d.processedOrders),
    })).sort((a, b) => b.orderCount - a.orderCount);
  }

  /**
   * Aggregate location data from order details
   */
  aggregateLocations(orderDetails: OrderDetail[]): LocationData[] {
    const locationMap: Record<string, LocationData> = {};

    for (const detail of orderDetails) {
      if (!detail?.shippingData?.address) continue;

      const address = detail.shippingData.address;
      const state = address.state || 'Desconocido';
      const city = address.city || 'Desconocido';
      const geoCoordinates = address.geoCoordinates || null;

      const key = `${state}|${city}`;

      if (!locationMap[key]) {
        locationMap[key] = {
          state,
          city,
          count: 0,
          revenue: 0,
          coordinates: geoCoordinates && Array.isArray(geoCoordinates) && geoCoordinates.length >= 2
            ? [geoCoordinates[0], geoCoordinates[1]]
            : null,
        };
      }

      locationMap[key].count += 1;
      locationMap[key].revenue += detail.value || 0;

      // Update coordinates if not exist
      if (!locationMap[key].coordinates && geoCoordinates && Array.isArray(geoCoordinates) && geoCoordinates.length >= 2) {
        locationMap[key].coordinates = [geoCoordinates[0], geoCoordinates[1]];
      }
    }

    return Object.values(locationMap);
  }
}

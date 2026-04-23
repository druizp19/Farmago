import { useMemo, memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../components/ui/card';
import { Truck } from 'lucide-react';
import { DistrictMap } from './DistrictMap';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import type { OrderListItem } from '../../../types/orders';

const COLORS = ['#6A5CBC', '#8A74E0', '#9E88FD', '#B3B7F2', '#C4BEE4', '#D3E0E0', '#E8D5F2', '#F0E6FF'];

interface DeliveryDashboardProps {
  orders: OrderListItem[];
  orderDetailsMap: Record<string, any>; // Detalles completos de órdenes
  loading?: boolean;
}

export const DeliveryDashboard = memo(({ orders, orderDetailsMap, loading }: DeliveryDashboardProps) => {
  // Calcular deliveryStats basado en las órdenes FILTRADAS
  const deliveryStats = useMemo(() => {
    const deliveryMap: Record<string, {
      company: string;
      orderCount: number;
      totalCost: number;
      totalRevenue: number;
      channels: Record<string, number>;
      slas: Record<string, number>;
      cities: Record<string, number>;
      states: Record<string, number>;
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
      const address = detail.shippingData.address || {};
      
      // Determinar el canal predominante de la orden (el que tiene más items)
      const channelCount = { 'pickup-in-point': 0, 'delivery': 0 };
      const companyCost: Record<string, number> = {};
      const companySlas: Record<string, string[]> = {};
      
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
          companySlas[deliveryCompany] = [];
        }
        companyCost[deliveryCompany] += log.price || 0;
        
        // Guardar SLA
        let sla = log.selectedSla || 'Sin especificar';
        if (selectedChannel === 'pickup-in-point' && log.pickupStoreInfo?.friendlyName) {
          sla = `Retiro en tienda - ${log.pickupStoreInfo.friendlyName}`;
        }
        companySlas[deliveryCompany].push(sla);
      });
      
      // Determinar canal predominante
      const predominantChannel = channelCount['pickup-in-point'] > channelCount['delivery'] 
        ? 'Retiro en tienda' 
        : 'Domicilio';
      
      // Procesar cada compañía de delivery que participó en esta orden
      Object.entries(companyCost).forEach(([deliveryCompany, cost]) => {
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
        
        // Solo contar una vez por orden
        if (!deliveryMap[deliveryCompany].processedOrders.has(order.orderId)) {
          deliveryMap[deliveryCompany].orderCount += 1;
          deliveryMap[deliveryCompany].processedOrders.add(order.orderId);
          
          // Contar canal predominante
          deliveryMap[deliveryCompany].channels[predominantChannel] = 
            (deliveryMap[deliveryCompany].channels[predominantChannel] || 0) + 1;
          
          // Agregar ubicación (usar distrito en lugar de ciudad)
          if (address.neighborhood) {
            // Normalizar nombre (capitalizar primera letra de cada palabra)
            const normalizedDistrict = address.neighborhood
              .toLowerCase()
              .split(' ')
              .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
              .join(' ');
            
            deliveryMap[deliveryCompany].cities[normalizedDistrict] = 
              (deliveryMap[deliveryCompany].cities[normalizedDistrict] || 0) + 1;
          }
          if (address.state) {
            deliveryMap[deliveryCompany].states[address.state] = 
              (deliveryMap[deliveryCompany].states[address.state] || 0) + 1;
          }
        }
        
        // Acumular costos y revenue
        deliveryMap[deliveryCompany].totalCost += cost;
        deliveryMap[deliveryCompany].totalRevenue += detail.value || 0;
        
        // Contar SLAs (por item, ya que cada item puede tener diferente SLA)
        companySlas[deliveryCompany].forEach(sla => {
          deliveryMap[deliveryCompany].slas[sla] = 
            (deliveryMap[deliveryCompany].slas[sla] || 0) + 1;
        });
      });
    });
    
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
    })).sort((a, b) => b.orderCount - a.orderCount);
  }, [orders, orderDetailsMap]);

  // Calcular KPIs de delivery
  const deliveryKPIs = useMemo(() => {
    const totalDeliveryCost = deliveryStats.reduce((sum, d) => sum + d.totalCost, 0);
    const totalOrders = deliveryStats.reduce((sum, d) => sum + d.orderCount, 0);
    const totalRevenue = deliveryStats.reduce((sum, d) => sum + d.totalRevenue, 0);
    
    const avgDeliveryCostPerOrder = totalOrders > 0 ? totalDeliveryCost / totalOrders : 0;
    const deliveryCostPercentage = totalRevenue > 0 ? (totalDeliveryCost / totalRevenue) * 100 : 0;
    
    // Contar órdenes por canal (basado en el canal predominante de cada orden)
    // Necesitamos recalcular esto correctamente desde las órdenes
    const orderChannelMap = new Map<string, string>(); // orderId -> canal predominante
    
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
      
      // Determinar canal predominante
      const predominantChannel = channelCount['pickup-in-point'] > channelCount['delivery'] 
        ? 'Retiro en tienda' 
        : 'Domicilio';
      
      orderChannelMap.set(order.orderId, predominantChannel);
    });
    
    // Contar órdenes por canal
    let deliveryOrders = 0;
    let pickupOrders = 0;
    
    orderChannelMap.forEach(channel => {
      if (channel === 'Domicilio') {
        deliveryOrders++;
      } else {
        pickupOrders++;
      }
    });
    
    const topCompany = deliveryStats.length > 0 ? deliveryStats[0].company : 'N/A';
    
    return {
      totalDeliveryCost: totalDeliveryCost / 100,
      avgDeliveryCostPerOrder: avgDeliveryCostPerOrder / 100,
      deliveryCostPercentage,
      totalOrders,
      deliveryOrders,
      pickupOrders,
      topCompany,
    };
  }, [deliveryStats]);

  // Datos para gráfico de costos por compañía
  const costByCompanyData = useMemo(() => {
    return deliveryStats.map(d => ({
      company: d.company,
      cost: d.totalCost / 100,
      orders: d.orderCount,
      avgCost: d.avgCostPerOrder / 100,
    })).slice(0, 10);
  }, [deliveryStats]);

  // Datos para gráfico de canales
  const channelData = useMemo(() => {
    const channelMap: Record<string, { count: number; cost: number }> = {};
    
    deliveryStats.forEach(stat => {
      stat.channels.forEach(ch => {
        if (!channelMap[ch.name]) {
          channelMap[ch.name] = { count: 0, cost: 0 };
        }
        channelMap[ch.name].count += ch.count;
      });
    });
    
    return Object.entries(channelMap).map(([name, data]) => ({
      name,
      value: data.count,
    }));
  }, [deliveryStats]);

  // Datos para gráfico de SLAs
  const slaData = useMemo(() => {
    const slaMap: Record<string, number> = {};
    
    deliveryStats.forEach(stat => {
      stat.slas.forEach(sla => {
        slaMap[sla.name] = (slaMap[sla.name] || 0) + sla.count;
      });
    });
    
    return Object.entries(slaMap)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);
  }, [deliveryStats]);

  // Datos para gráfico de eficiencia (costo por orden)
  const efficiencyData = useMemo(() => {
    return deliveryStats
      .map(d => ({
        company: d.company,
        costPerOrder: d.avgCostPerOrder / 100,
        orderCount: d.orderCount,
      }))
      .sort((a, b) => a.costPerOrder - b.costPerOrder)
      .slice(0, 10);
  }, [deliveryStats]);

  // Top distritos con más deliveries
  const topCitiesData = useMemo(() => {
    const districtMap: Record<string, number> = {};
    
    deliveryStats.forEach(stat => {
      stat.topCities.forEach(city => {
        districtMap[city.name] = (districtMap[city.name] || 0) + city.count;
      });
    });
    
    return Object.entries(districtMap)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }, [deliveryStats]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-8 w-8 border-4 border-violet-400 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (deliveryStats.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-gray-400">
        <Truck className="h-12 w-12 mb-2" />
        <p>No hay datos de delivery disponibles</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Gráficos principales */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Costo por Compañía */}
        <Card className="border border-gray-100 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-gray-700">
              Costo de Delivery por Compañía
            </CardTitle>
            <CardDescription className="text-xs text-gray-400">
              Top 10 compañías de delivery
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={costByCompanyData} key="cost-by-company">
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis 
                  dataKey="company" 
                  tick={{ fontSize: 11 }}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip 
                  contentStyle={{ fontSize: 12 }}
                  formatter={(value: any) => `S/ ${Number(value).toFixed(2)}`}
                />
                <Bar dataKey="cost" fill={COLORS[0]} name="Costo Total" activeBar={false} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Distribución por Canal */}
        <Card className="border border-gray-100 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-gray-700">
              Distribución por Canal
            </CardTitle>
            <CardDescription className="text-xs text-gray-400">
              Domicilio vs Retiro en tienda
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart key="channel-distribution">
                <Pie
                  data={channelData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${((percent || 0) * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  isAnimationActive={false}
                >
                  {channelData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Eficiencia: Costo por Orden */}
        <Card className="border border-gray-100 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-gray-700">
              Eficiencia: Costo Promedio por Orden
            </CardTitle>
            <CardDescription className="text-xs text-gray-400">
              Compañías más eficientes (menor costo/orden)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={efficiencyData} layout="vertical" key="efficiency-chart">
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis 
                  dataKey="company" 
                  type="category" 
                  tick={{ fontSize: 10 }}
                  width={100}
                />
                <Tooltip 
                  contentStyle={{ fontSize: 12 }}
                  formatter={(value: any) => `S/ ${Number(value).toFixed(2)}`}
                />
                <Bar dataKey="costPerOrder" fill={COLORS[2]} name="Costo/Orden" activeBar={false} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Distribución por SLA */}
        <Card className="border border-gray-100 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-gray-700">
              Distribución por Tipo de Envío (SLA)
            </CardTitle>
            <CardDescription className="text-xs text-gray-400">
              Tipos de servicio más utilizados
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart key="sla-distribution">
                <Pie
                  data={slaData}
                  cx="50%"
                  cy="45%"
                  outerRadius={70}
                  fill="#8884d8"
                  dataKey="count"
                  isAnimationActive={false}
                  label={(entry: any) => `${((entry.percent || 0) * 100).toFixed(0)}%`}
                  labelLine={{ stroke: '#999', strokeWidth: 1 }}
                >
                  {slaData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ fontSize: 11, maxWidth: 250 }}
                  formatter={(value: any, name: any) => [`${value} órdenes`, name]}
                  wrapperStyle={{ zIndex: 1000 }}
                />
                <Legend 
                  verticalAlign="bottom" 
                  height={60}
                  iconType="circle"
                  iconSize={8}
                  wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }}
                  formatter={(value: string) => {
                    return value.length > 30 ? value.substring(0, 30) + '...' : value;
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Tablas de detalle */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Top Compañías */}
        <Card className="border border-gray-100 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-gray-700">
              Top Compañías de Delivery
            </CardTitle>
            <CardDescription className="text-xs text-gray-400">
              Ranking por número de órdenes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {deliveryStats.slice(0, 10).map((stat, index) => (
                <div key={stat.company} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <div 
                      className="h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold text-white"
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    >
                      {index + 1}
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-700">{stat.company}</p>
                      <p className="text-[10px] text-gray-400">
                        {stat.orderCount} órdenes · S/ {(stat.avgCostPerOrder / 100).toFixed(2)}/orden
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-gray-800">
                      S/ {(stat.totalCost / 100).toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                    </p>
                    <p className="text-[10px] text-gray-400">
                      {stat.costPercentage.toFixed(2)}% de ingresos
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <DistrictMap data={topCitiesData} />
      </div>
    </div>
  );
});
DeliveryDashboard.displayName = 'DeliveryDashboard';

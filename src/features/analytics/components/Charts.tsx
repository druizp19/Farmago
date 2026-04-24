import { useState, memo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  AreaChart,
  Area,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../components/ui/card';
import type { DashboardKPIs, ProductAggregation, CategoryStat } from '../../../types/orders';
import { CHART_CONFIG } from '../../../shared/config/constants';
import { formatCurrency, truncateText } from '../../../shared/utils/formatters';

const COLORS = CHART_CONFIG.COLORS;

interface ChartsProps { kpis: DashboardKPIs; }

const CustomTooltip = memo(({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3 text-xs">
      <p className="font-semibold text-gray-700 mb-1">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ color: p.color || p.fill }}>
          {p.name}: {typeof p.value === 'number' && (p.name?.includes('Ingreso') || p.name?.includes('revenue') || p.name?.includes('Revenue'))
            ? formatCurrency(p.value)
            : p.value?.toLocaleString('es-PE')}
        </p>
      ))}
    </div>
  );
});
CustomTooltip.displayName = 'CustomTooltip';

// ── Status Distribution ─────────────────────────────────────────────────────
export const StatusDistributionChart = memo(({ kpis }: ChartsProps) => {
  return (
    <Card className="border border-gray-100 shadow-sm">
      <CardHeader className="pb-1 px-2.5 pt-2">
        <CardTitle className="text-xs font-semibold text-gray-700">Distribución por Estado</CardTitle>
        <CardDescription className="text-[9px] text-gray-400">Cantidad de órdenes por estado</CardDescription>
      </CardHeader>
      <CardContent className="px-2.5 pb-2">
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={kpis.statusDistribution} layout="vertical" margin={{ left: 10, right: 18 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" />
            <XAxis type="number" tick={{ fontSize: 9, fill: '#9ca3af' }} />
            <YAxis type="category" dataKey="label" width={90} tick={{ fontSize: 9, fill: '#6b7280' }} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="count" name="Órdenes" radius={[0, 4, 4, 0]} activeBar={false}>
              {kpis.statusDistribution.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
});
StatusDistributionChart.displayName = 'StatusDistributionChart';

// ── Revenue by Day ──────────────────────────────────────────────────────────
export const RevenueByDayChart = memo(({ kpis }: ChartsProps) => {
  const data = kpis.ordersByDay.map(d => ({ ...d, date: d.date.slice(5) }));
  return (
    <Card className="border border-gray-100 shadow-sm">
      <CardHeader className="pb-1 px-2.5 pt-2">
        <CardTitle className="text-xs font-semibold text-gray-700">Ingresos por Día</CardTitle>
        <CardDescription className="text-[9px] text-gray-400">Evolución diaria de ingresos</CardDescription>
      </CardHeader>
      <CardContent className="px-2.5 pb-2">
        <ResponsiveContainer width="100%" height={180}>
          <AreaChart data={data} margin={{ top: 8, right: 12, left: 8, bottom: 0 }}>
            <defs>
              <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6A5CBC" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#9E88FD" stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="date" tick={{ fontSize: 8, fill: '#9ca3af' }} interval="preserveStartEnd" />
            <YAxis tick={{ fontSize: 8, fill: '#9ca3af' }} tickFormatter={v => `S/${v}`} />
            <Tooltip
              formatter={(v: any) => [formatCurrency(v || 0), 'Ingresos']}
              contentStyle={{ fontSize: 10, borderRadius: 6, border: '1px solid #e5e7eb' }}
            />
            <Area type="monotone" dataKey="revenue" name="Ingresos" stroke="#6A5CBC" strokeWidth={2} fill="url(#revGrad)" />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
});
RevenueByDayChart.displayName = 'RevenueByDayChart';

// ── Payment Methods ─────────────────────────────────────────────────────────
export const PaymentMethodChart = memo(({ kpis }: ChartsProps) => {
  const data = kpis.paymentDistribution.slice(0, 6);
  const total = data.reduce((sum, item) => sum + item.count, 0);

  return (
    <Card className="border border-gray-100 shadow-sm">
      <CardHeader className="pb-1 px-2.5 pt-2">
        <CardTitle className="text-xs font-semibold text-gray-700">Métodos de Pago</CardTitle>
        <CardDescription className="text-[9px] text-gray-400">Distribución por forma de pago</CardDescription>
      </CardHeader>
      <CardContent className="px-2.5 pb-2 pt-2">
        <ResponsiveContainer width="100%" height={240}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="55%"
              innerRadius={50}
              outerRadius={80}
              paddingAngle={2}
              dataKey="count"
              nameKey="name"
              isAnimationActive={false}
              label={false}
            >
              {data.map((_, i) => (
                <Cell 
                  key={`cell-${i}`} 
                  fill={COLORS[i % COLORS.length]}
                  stroke="#fff"
                  strokeWidth={3}
                />
              ))}
            </Pie>
            <Tooltip
              formatter={(v: any, name: any) => {
                const percentage = ((Number(v) / total) * 100).toFixed(1);
                return [`${v} órdenes (${percentage}%)`, name];
              }}
              contentStyle={{ 
                fontSize: 11, 
                borderRadius: 8, 
                border: '1px solid #e5e7eb',
                padding: '10px 14px'
              }}
            />
            <Legend 
              layout="horizontal"
              align="center"
              verticalAlign="top"
              wrapperStyle={{ 
                fontSize: 10,
                paddingBottom: '12px',
                lineHeight: '20px'
              }} 
              iconSize={10}
              iconType="square"
              formatter={(value, entry: any) => {
                const item = data.find(d => d.name === value);
                if (!item) return value;
                const percentage = ((item.count / total) * 100).toFixed(1);
                const displayName = value.length > 12 ? value.slice(0, 12) + '...' : value;
                return `${displayName} ${percentage}%`;
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
});
PaymentMethodChart.displayName = 'PaymentMethodChart';

// ── Orders by Hour ──────────────────────────────────────────────────────────
export const OrdersByHourChart = memo(({ kpis }: ChartsProps) => {
  const peak = kpis.ordersByHour.reduce((m, h) => h.count > m.count ? h : m, kpis.ordersByHour[0]);
  return (
    <Card className="border border-gray-100 shadow-sm">
      <CardHeader className="pb-1 px-2.5 pt-2">
        <CardTitle className="text-xs font-semibold text-gray-700">Órdenes por Hora</CardTitle>
        <CardDescription className="text-[9px] text-gray-400">
          Hora pico: <span className="font-medium text-[#6A5CBC]">{peak?.hour}</span> ({peak?.count} órdenes)
        </CardDescription>
      </CardHeader>
      <CardContent className="px-2.5 pb-2">
        <ResponsiveContainer width="100%" height={130}>
          <BarChart data={kpis.ordersByHour} margin={{ top: 5, right: 8, left: -16, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="hour" tick={{ fontSize: 7, fill: '#9ca3af' }} interval={3} />
            <YAxis tick={{ fontSize: 8, fill: '#9ca3af' }} />
            <Tooltip contentStyle={{ fontSize: 9, borderRadius: 6, border: '1px solid #e5e7eb' }} />
            <Bar dataKey="count" name="Órdenes" radius={[2, 2, 0, 0]} activeBar={false}>
              {kpis.ordersByHour.map((entry, i) => (
                <Cell key={i} fill={entry.count === peak?.count ? '#6A5CBC' : '#C4BEE4'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
});
OrdersByHourChart.displayName = 'OrdersByHourChart';

// ── Top Clients ─────────────────────────────────────────────────────────────
export const TopClientsChart = memo(({ kpis }: ChartsProps) => {
  return (
    <Card className="border border-gray-100 shadow-sm">
      <CardHeader className="pb-1 px-2.5 pt-2">
        <CardTitle className="text-xs font-semibold text-gray-700">Top Clientes</CardTitle>
        <CardDescription className="text-[9px] text-gray-400">Por ingresos generados</CardDescription>
      </CardHeader>
      <CardContent className="px-2.5 pb-2">
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={kpis.topClients.slice(0, 8)} layout="vertical" margin={{ left: 10, right: 22 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" />
            <XAxis type="number" tick={{ fontSize: 8, fill: '#9ca3af' }} tickFormatter={v => `S/${v}`} />
            <YAxis type="category" dataKey="name" width={85}
              tick={{ fontSize: 8, fill: '#6b7280' }}
              tickFormatter={(v: string) => v.length > 13 ? v.slice(0, 13) + '…' : v}
            />
            <Tooltip formatter={(v: any) => [formatCurrency(v || 0), 'Ingresos']} contentStyle={{ fontSize: 10, borderRadius: 6, border: '1px solid #e5e7eb' }} />
            <Bar dataKey="revenue" name="Ingresos" radius={[0, 3, 3, 0]} activeBar={false}>
              {kpis.topClients.slice(0, 8).map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
});
TopClientsChart.displayName = 'TopClientsChart';

// ── Top Products ────────────────────────────────────────────────────────────
interface TopProductsProps {
  products: ProductAggregation[];
  loading?: boolean;
}

export const TopProductsChart = memo(({ products, loading }: TopProductsProps) => {
  const data = products.slice(0, CHART_CONFIG.TOP_PRODUCTS_CHART_LIMIT).map(p => ({
    name: truncateText(p.name, CHART_CONFIG.PRODUCT_NAME_MAX_LENGTH),
    fullName: p.name,
    qty: p.totalQuantity,
    revenue: p.totalRevenue / 100,
    orders: p.orderCount,
    category: p.category,
  }));

  return (
    <Card className="border border-gray-100 shadow-sm">
      <CardHeader className="pb-0.5 px-2 pt-1.5">
        <CardTitle className="text-[10px] font-semibold text-gray-700">
          Productos Más Pedidos
          {loading && <span className="ml-2 text-[9px] font-normal text-gray-400 animate-pulse">Cargando...</span>}
        </CardTitle>
        <CardDescription className="text-[8px] text-gray-400">
          Top 12 productos por unidades vendidas (últimas 100 órdenes)
        </CardDescription>
      </CardHeader>
      <CardContent className="px-2 pb-1.5">
        {loading || data.length === 0 ? (
          <div className="flex items-center justify-center h-40 text-gray-300 text-xs">
            {loading ? (
              <div className="flex flex-col items-center gap-2">
                <div className="animate-spin h-5 w-5 border-2 border-blue-400 border-t-transparent rounded-full" />
                <p className="text-[9px] text-gray-400">Cargando datos de productos...</p>
              </div>
            ) : 'Sin datos de productos'}
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={data} layout="vertical" margin={{ left: 8, right: 28 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" />
              <XAxis type="number" tick={{ fontSize: 7, fill: '#9ca3af' }} />
              <YAxis
                type="category"
                dataKey="name"
                width={140}
                tick={{ fontSize: 7.5, fill: '#374151' }}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const d = payload[0]?.payload;
                  return (
                    <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-2 text-[9px] max-w-[200px]">
                      <p className="font-semibold text-gray-700 mb-0.5 leading-snug">{d.fullName}</p>
                      <p className="text-violet-600 text-[8px] mb-0.5">{d.category}</p>
                      <p className="text-emerald-600">Unidades: <b>{d.qty}</b></p>
                      <p className="text-blue-600">Ingresos: <b>{formatCurrency(d.revenue)}</b></p>
                      <p className="text-gray-500">En órdenes: <b>{d.orders}</b></p>
                    </div>
                  );
                }}
              />
              <Bar dataKey="qty" name="Unidades" radius={[0, 2, 2, 0]} activeBar={false}>
                {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
});
TopProductsChart.displayName = 'TopProductsChart';

// ── Revenue by Status (stacked) ─────────────────────────────────────────────
export const RevenueByStatusChart = memo(({ kpis }: ChartsProps) => {
  const data = kpis.statusDistribution.slice(0, 6).map(s => ({
    label: s.label,
    ingresos: s.value,
    ordenes: s.count,
  }));

  return (
    <Card className="border border-gray-100 shadow-sm">
      <CardHeader className="pb-0.5 px-2 pt-1.5">
        <CardTitle className="text-[10px] font-semibold text-gray-700">Ingresos por Estado</CardTitle>
        <CardDescription className="text-[8px] text-gray-400">Ingresos vs cantidad de órdenes por estado</CardDescription>
      </CardHeader>
      <CardContent className="px-2 pb-1.5">
        <ResponsiveContainer width="100%" height={145}>
          <BarChart data={data} margin={{ top: 6, right: 10, left: 6, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="label" tick={{ fontSize: 7, fill: '#6b7280' }}
              tickFormatter={(v: string) => v.length > 8 ? v.slice(0, 8) + '…' : v}
            />
            <YAxis yAxisId="l" tick={{ fontSize: 7, fill: '#9ca3af' }} tickFormatter={v => `S/${v}`} />
            <YAxis yAxisId="r" orientation="right" tick={{ fontSize: 7, fill: '#9ca3af' }} />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: 8 }} />
            <Bar yAxisId="l" dataKey="ingresos" name="Ingresos" fill="#6A5CBC" radius={[2, 2, 0, 0]} activeBar={false} />
            <Bar yAxisId="r" dataKey="ordenes" name="Órdenes" fill="#8A74E0" radius={[2, 2, 0, 0]} activeBar={false} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
});
RevenueByStatusChart.displayName = 'RevenueByStatusChart';

// ── Monthly Revenue ─────────────────────────────────────────────────────────
export const MonthlyRevenueChart = memo(({ kpis }: ChartsProps) => {
  const monthMap: Record<string, { revenue: number; count: number }> = {};
  
  // Solo procesar los días que realmente están en los datos filtrados
  for (const d of kpis.ordersByDay) {
    const month = d.date.slice(0, 7); // YYYY-MM
    if (!monthMap[month]) monthMap[month] = { revenue: 0, count: 0 };
    monthMap[month].revenue += d.revenue;
    monthMap[month].count += d.count;
  }
  
  const data = Object.entries(monthMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, { revenue, count }]) => {
      // Usar el string directamente para evitar problemas de zona horaria
      const [year, monthNum] = month.split('-');
      const monthDate = new Date(Number(year), Number(monthNum) - 1, 15); // Día 15 para evitar problemas de zona horaria
      return {
        month: monthDate.toLocaleString('es-PE', { month: 'short', year: '2-digit' }),
        fullMonth: month,
        revenue: revenue,
        count,
      };
    });

  // Determinar el rango de fechas para el subtítulo
  const months = Object.keys(monthMap).sort();
  const firstMonth = months[0];
  const lastMonth = months[months.length - 1];
  
  let subtitle = 'Desde noviembre 2025';
  if (firstMonth && lastMonth) {
    if (firstMonth === lastMonth) {
      // Solo un mes
      const [year, monthNum] = firstMonth.split('-');
      const monthDate = new Date(Number(year), Number(monthNum) - 1, 15);
      subtitle = monthDate.toLocaleString('es-PE', { month: 'long', year: 'numeric' });
    } else {
      // Rango de meses
      const [firstYear, firstMonthNum] = firstMonth.split('-');
      const [lastYear, lastMonthNum] = lastMonth.split('-');
      const firstDate = new Date(Number(firstYear), Number(firstMonthNum) - 1, 15);
      const lastDate = new Date(Number(lastYear), Number(lastMonthNum) - 1, 15);
      subtitle = `${firstDate.toLocaleString('es-PE', { month: 'short', year: 'numeric' })} - ${lastDate.toLocaleString('es-PE', { month: 'short', year: 'numeric' })}`;
    }
  }

  return (
    <Card className="border border-gray-100 shadow-sm">
      <CardHeader className="pb-0.5 px-2 pt-1.5">
        <CardTitle className="text-[10px] font-semibold text-gray-700">Ingresos Mensuales</CardTitle>
        <CardDescription className="text-[8px] text-gray-400">{subtitle}</CardDescription>
      </CardHeader>
      <CardContent className="px-2 pb-1.5">
        <ResponsiveContainer width="100%" height={135}>
          <BarChart data={data} margin={{ top: 6, right: 10, left: 6, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="month" tick={{ fontSize: 8, fill: '#6b7280' }} />
            <YAxis tick={{ fontSize: 7, fill: '#9ca3af' }} tickFormatter={v => `S/${v}`} />
            <Tooltip
              formatter={(v: any) => [formatCurrency(v || 0), 'Ingresos']}
              contentStyle={{ fontSize: 9, borderRadius: 6, border: '1px solid #e5e7eb' }}
            />
            <Bar dataKey="revenue" name="Ingresos" radius={[2, 2, 0, 0]} activeBar={false}>
              {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
});
MonthlyRevenueChart.displayName = 'MonthlyRevenueChart';

// ── Category Performance Radar (Normalized 0-100) ──────────────────────────
interface CategoryChartsProps {
  categoryStats: CategoryStat[];
  loading?: boolean;
}

export const CategoryPerformanceRadar = memo(({ categoryStats, loading }: CategoryChartsProps) => {
  const top6 = categoryStats.slice(0, 6);
  
  if (top6.length === 0) {
    return (
      <Card className="border border-gray-100 shadow-sm">
        <CardHeader className="pb-0.5 px-2 pt-1.5">
          <CardTitle className="text-[10px] font-semibold text-gray-700">Rendimiento de Categorías</CardTitle>
          <CardDescription className="text-[8px] text-gray-400">Comparativa normalizada (top 6)</CardDescription>
        </CardHeader>
        <CardContent className="px-2 pb-1.5">
          <div className="flex items-center justify-center h-36 text-gray-300 text-xs">
            {loading
              ? <div className="animate-spin h-5 w-5 border-2 border-violet-400 border-t-transparent rounded-full" />
              : 'Sin datos de categorías'}
          </div>
        </CardContent>
      </Card>
    );
  }

  const maxQty = Math.max(...top6.map(c => c.totalQuantity), 1);
  const maxRev = Math.max(...top6.map(c => c.totalRevenue), 1);
  const maxOrders = Math.max(...top6.map(c => c.orderCount), 1);

  const data = top6.map(c => ({
    subject: c.category.length > 15 ? c.category.slice(0, 15) + '…' : c.category,
    Unidades: Math.round((c.totalQuantity / maxQty) * 100),
    Ingresos: Math.round((c.totalRevenue / maxRev) * 100),
    Órdenes: Math.round((c.orderCount / maxOrders) * 100),
  }));

  return (
    <Card className="border border-gray-100 shadow-sm">
      <CardHeader className="pb-0.5 px-2 pt-1.5">
        <CardTitle className="text-[10px] font-semibold text-gray-700">Rendimiento de Categorías</CardTitle>
        <CardDescription className="text-[8px] text-gray-400">Comparativa normalizada (top 6 categorías)</CardDescription>
      </CardHeader>
      <CardContent className="px-2 pb-1.5">
        {loading ? (
          <div className="flex items-center justify-center h-36">
            <div className="animate-spin h-5 w-5 border-2 border-violet-400 border-t-transparent rounded-full" />
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={180}>
            <RadarChart data={data}>
              <PolarGrid stroke="#e5e7eb" />
              <PolarAngleAxis dataKey="subject" tick={{ fontSize: 7, fill: '#6b7280' }} />
              <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 6, fill: '#d1d5db' }} />
              <Radar name="Unidades" dataKey="Unidades" stroke="#6A5CBC" fill="#6A5CBC" fillOpacity={0.25} />
              <Radar name="Ingresos" dataKey="Ingresos" stroke="#8A74E0" fill="#8A74E0" fillOpacity={0.2} />
              <Radar name="Órdenes" dataKey="Órdenes" stroke="#9E88FD" fill="#9E88FD" fillOpacity={0.15} />
              <Legend wrapperStyle={{ fontSize: 8 }} />
              <Tooltip
                formatter={(v: any, name: any) => [`${v}%`, name]}
                contentStyle={{ fontSize: 9, borderRadius: 6, border: '1px solid #e5e7eb' }}
              />
            </RadarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
});
CategoryPerformanceRadar.displayName = 'CategoryPerformanceRadar';


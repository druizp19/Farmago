import { useCallback, useState } from 'react';
import { useDashboard } from './shared/hooks/useDashboard';
import { useUIStore } from './shared/store/store';
import { KPICards } from './features/analytics/components/KPICards';
import { FilterBar } from './shared/components/FilterBar';
import { Sidebar } from './shared/components/Sidebar';
import {
  StatusDistributionChart,
  RevenueByDayChart,
  PaymentMethodChart,
  OrdersByHourChart,
  TopClientsChart,
  TopProductsChart,
  RevenueByStatusChart,
  MonthlyRevenueChart,
  CategoryPerformanceRadar,
} from './features/analytics/components/Charts';
import { 
  CategorySalesChartImproved,
  CategoryRevenueChartImproved,
  CategoryPieChartImproved,
} from './features/categories/components/CategoryChartsImproved';
import { CategoryTreeTable } from './features/categories/components/CategoryTreeTable';
import { PeruMap } from './features/delivery/components/PeruMap';
import { DeliveryDashboard } from './features/delivery/components/DeliveryDashboard';
import { DeliveryKPICards } from './features/delivery/components/DeliveryKPICards';
import { useDeliveryKPIs } from './features/delivery/hooks/useDeliveryKPIs';
import { OrdersTable } from './features/orders/components/OrdersTable';
import { OrderDetailModal } from './features/orders/components/OrderDetailModal';
import { NewOrderNotification } from './features/orders/components/NewOrderNotification';
import { Button } from './components/ui/button';
import {
  RefreshCw,
  ShoppingBag,
  Wifi,
  WifiOff,
  Clock,
} from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('overview');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const {
    orders,
    filteredOrders,
    filteredProducts,
    filteredCategoryStats,
    kpis,
    topProducts,
    orderDetailsMap,
    level1Options,
    level2Options,
    level3Options,
    connected,
    loading,
    lastUpdated,
    error,
    filters,
    setFilters,
    resetFilters,
    filterOptions,
    refresh,
    newOrder,
    newOrdersQueue,
    clearNewOrder,
    clearAllNewOrders,
  } = useDashboard();

  const { selectedOrderId, setSelectedOrderId, refreshing, setRefreshing } = useUIStore();

  const toggleSidebar = useCallback(() => {
    setSidebarCollapsed(prev => !prev);
  }, []);

  // Calculate delivery KPIs
  const deliveryKPIs = useDeliveryKPIs(filteredOrders, orderDetailsMap);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    refresh();
    setTimeout(() => setRefreshing(false), 3000);
  }, [refresh, setRefreshing]);

  const handleSelectOrder = useCallback((orderId: string) => {
    setSelectedOrderId(orderId);
  }, [setSelectedOrderId]);

  const handleCloseOrderDetail = useCallback(() => {
    setSelectedOrderId(null);
  }, [setSelectedOrderId]);

  return (
    <div className="min-h-screen bg-gray-50 font-sans flex">
      {/* Sidebar */}
      <Sidebar 
        activeTab={activeTab} 
        onTabChange={setActiveTab}
        ordersCount={filteredOrders.length}
        isCollapsed={sidebarCollapsed}
        onToggleCollapse={toggleSidebar}
        connected={connected}
        lastUpdated={lastUpdated}
        onRefresh={handleRefresh}
        refreshing={refreshing}
      />

      {/* Main Content */}
      <main className="flex-1 overflow-x-hidden">
        {/* Error banner */}
        {error && (
          <div className="m-4 bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700 flex items-center gap-2">
            <WifiOff className="h-4 w-4 flex-shrink-0" />
            No se pudo conectar al servidor. Asegúrate de que Express esté corriendo:
            <code className="ml-1 text-xs bg-red-100 px-1 py-0.5 rounded">node server/index.js</code>
          </div>
        )}

        {/* Loading skeleton */}
        {loading && !kpis ? (
          <div className="p-4 space-y-4">
            <div className="h-12 bg-gray-100 rounded-xl animate-pulse" />
            <div className="h-10 bg-gray-100 rounded-xl animate-pulse" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-64 bg-gray-100 rounded-xl animate-pulse" />
              ))}
            </div>
          </div>
        ) : kpis ? (
          <div className="flex flex-col h-screen">
            {/* Filter Bar - Fixed at top */}
            <div className="p-4 bg-white border-b border-gray-200">
              <FilterBar
                filters={filters}
                setFilters={setFilters}
                resetFilters={resetFilters}
                filterOptions={filterOptions}
                level1Options={level1Options}
                level2Options={level2Options}
                level3Options={level3Options}
                totalOrders={orders.length}
                filteredCount={filteredOrders.length}
              />
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto">
              <div className="flex h-full">
                {/* Main Content Area */}
                <div className="flex-1 p-4">
                  {/* Layout: KPIs (left column) + Charts (right area) */}
                  {activeTab === 'overview' && (
                    <div className="flex gap-4">
                      {/* KPIs Column - Sticky */}
                      <div 
                        className="flex-shrink-0 will-change-[width] sticky top-4 self-start kpi-scroll"
                        style={{ 
                          width: sidebarCollapsed ? '288px' : '256px',
                          transition: 'width 200ms cubic-bezier(0.4, 0, 0.2, 1)',
                          maxHeight: 'calc(100vh - 180px)',
                          overflowY: 'auto'
                        }}
                      >
                        <KPICards kpis={kpis} />
                      </div>

                      {/* Charts Area */}
                      <div className="flex-1 space-y-4 min-w-0">
                    {/* Row 1 */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      <RevenueByDayChart kpis={kpis} />
                      <StatusDistributionChart kpis={kpis} />
                    </div>

                    {/* Row 2 */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                      <PaymentMethodChart kpis={kpis} />
                      <div className="lg:col-span-2">
                        <TopClientsChart kpis={kpis} />
                      </div>
                    </div>

                    {/* Row 3 */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      <MonthlyRevenueChart kpis={kpis} />
                      <RevenueByStatusChart kpis={kpis} />
                    </div>

                    {/* Row 4 — hour heatmap */}
                    <OrdersByHourChart kpis={kpis} />

                    {/* Row 5 — Geographic distribution */}
                    <PeruMap 
                      locationData={kpis.locationDistribution} 
                      loading={loading}
                    />

                    {/* Summary chips */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
                        <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Canal Principal de Pago</p>
                        <p className="text-sm font-bold text-gray-800 truncate">{kpis.topPaymentMethod}</p>
                      </div>
                      <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
                        <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Órdenes con Error</p>
                        <p className="text-sm font-bold text-red-600">
                          {filteredOrders.filter((o: any) => o.workflowInErrorState).length}
                        </p>
                      </div>
                      <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
                        <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Entrega Completada</p>
                        <p className="text-sm font-bold text-emerald-600">
                          {filteredOrders.filter((o: any) => o.isAllDelivered).length}
                        </p>
                      </div>
                    </div>
                      </div>
                    </div>
                  )}

                  {/* ── CATEGORIES TAB ── */}
                  {activeTab === 'categories' && (
                <div className="space-y-4">
                  {/* Row 1: Sales + Revenue */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <CategorySalesChartImproved 
                      categoryStats={filteredCategoryStats} 
                      loading={filteredCategoryStats.length === 0}
                      categoryFilter={
                        filters.categoryLevel3.length === 1 
                          ? `${filters.categoryLevel1[0]} > ${filters.categoryLevel2[0]} > ${filters.categoryLevel3[0]}`
                          : filters.categoryLevel2.length === 1
                          ? `${filters.categoryLevel1[0]} > ${filters.categoryLevel2[0]}`
                          : filters.categoryLevel1.length === 1
                          ? filters.categoryLevel1[0]
                          : null
                      }
                    />
                    <CategoryRevenueChartImproved 
                      categoryStats={filteredCategoryStats}
                      loading={filteredCategoryStats.length === 0}
                      categoryFilter={
                        filters.categoryLevel3.length === 1 
                          ? `${filters.categoryLevel1[0]} > ${filters.categoryLevel2[0]} > ${filters.categoryLevel3[0]}`
                          : filters.categoryLevel2.length === 1
                          ? `${filters.categoryLevel1[0]} > ${filters.categoryLevel2[0]}`
                          : filters.categoryLevel1.length === 1
                          ? filters.categoryLevel1[0]
                          : null
                      }
                    />
                  </div>

                  {/* Row 2: Pie + Radar */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <CategoryPieChartImproved 
                      categoryStats={filteredCategoryStats}
                      loading={filteredCategoryStats.length === 0}
                    />
                    <CategoryPerformanceRadar
                      categoryStats={filteredCategoryStats}
                      loading={filteredCategoryStats.length === 0}
                    />
                  </div>

                  {/* Row 3: Summary table */}
                  <CategoryTreeTable 
                    categoryStats={filteredCategoryStats}
                    loading={filteredCategoryStats.length === 0}
                  />
                    </div>
                  )}

                  {/* ── PRODUCTS TAB ── */}
                  {activeTab === 'products' && (
                <div className="space-y-4">
                  <TopProductsChart
                    products={filteredProducts}
                    loading={topProducts.length === 0}
                  />

                  {/* Product list table */}
                  {topProducts.length > 0 && (
                    <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
                      <div className="px-5 py-3 border-b border-gray-100">
                        <h3 className="text-sm font-semibold text-gray-800">Ranking de Productos</h3>
                        <p className="text-xs text-gray-400 mt-0.5">Top 20 productos por unidades — últimas 100 órdenes</p>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="text-left px-4 py-2.5 text-gray-500 font-semibold w-8">#</th>
                              <th className="text-left px-4 py-2.5 text-gray-500 font-semibold">Producto</th>
                              <th className="text-left px-4 py-2.5 text-gray-500 font-semibold">Categoría</th>
                              <th className="text-right px-4 py-2.5 text-gray-500 font-semibold">SKU</th>
                              <th className="text-right px-4 py-2.5 text-gray-500 font-semibold">Unidades</th>
                              <th className="text-right px-4 py-2.5 text-gray-500 font-semibold">Órdenes</th>
                              <th className="text-right px-4 py-2.5 text-gray-500 font-semibold">Ingresos</th>
                            </tr>
                          </thead>
                          <tbody>
                            {topProducts.map((p, i) => (
                              <tr key={p.id} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                                <td className="px-4 py-2.5 text-gray-400 font-medium">{i + 1}</td>
                                <td className="px-4 py-2.5">
                                  <div className="flex items-center gap-2">
                                    {p.imageUrl && (
                                      <img src={p.imageUrl} alt={p.name}
                                        className="w-8 h-8 object-contain rounded bg-white border border-gray-100 flex-shrink-0" />
                                    )}
                                    <span className="text-gray-700 font-medium line-clamp-1">{p.name}</span>
                                  </div>
                                </td>
                                <td className="px-4 py-2.5">
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-violet-50 text-violet-700 border border-violet-100">
                                    {p.category}
                                  </span>
                                </td>
                                <td className="px-4 py-2.5 text-right text-gray-400 font-mono">{p.refId}</td>
                                <td className="px-4 py-2.5 text-right font-bold text-blue-600">{p.totalQuantity.toLocaleString()}</td>
                                <td className="px-4 py-2.5 text-right text-gray-600">{p.orderCount}</td>
                                <td className="px-4 py-2.5 text-right font-semibold text-emerald-600">
                                  S/ {(p.totalRevenue / 100).toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                    </div>
                  )}

                  {/* ── DELIVERY TAB ── */}
                  {activeTab === 'delivery' && (
                    <div className="flex gap-4">
                      {/* Delivery KPIs Column - Sticky */}
                      <div 
                        className="flex-shrink-0 will-change-[width] sticky top-4 self-start kpi-scroll"
                        style={{ 
                          width: sidebarCollapsed ? '288px' : '256px',
                          transition: 'width 200ms cubic-bezier(0.4, 0, 0.2, 1)',
                          maxHeight: 'calc(100vh - 180px)',
                          overflowY: 'auto'
                        }}
                      >
                        <DeliveryKPICards kpis={deliveryKPIs} />
                      </div>

                      {/* Delivery Charts Area */}
                      <div className="flex-1 min-w-0">
                        <DeliveryDashboard 
                          orders={filteredOrders}
                          orderDetailsMap={orderDetailsMap}
                          loading={loading}
                        />
                      </div>
                    </div>
                  )}

                  {/* ── ORDERS TAB ── */}
                  {activeTab === 'orders' && (
                    <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm">
                      <div className="mb-4">
                        <h2 className="text-sm font-semibold text-gray-800">Lista de Órdenes</h2>
                        <p className="text-xs text-gray-400 mt-0.5">
                          Haz clic en una orden para ver el detalle completo · Los filtros de arriba aplican aquí también
                        </p>
                      </div>
                      <OrdersTable orders={filteredOrders} onSelectOrder={handleSelectOrder} />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-24 text-gray-400">
            <ShoppingBag className="h-12 w-12 mb-3 opacity-30" />
            <p className="text-sm">Esperando datos del servidor...</p>
            <p className="text-xs mt-1">Asegúrate de que el servidor Express esté corriendo</p>
          </div>
        )}
      </main>

      <OrderDetailModal orderId={selectedOrderId} onClose={handleCloseOrderDetail} />
      {/* Mostrar notificación con cola de órdenes */}
      <NewOrderNotification 
        orders={newOrder ? [newOrder, ...newOrdersQueue] : newOrdersQueue} 
        onClose={clearAllNewOrders} 
      />
    </div>
  );
}

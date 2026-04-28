import { useCallback, useState } from 'react';
import { useDashboard } from './shared/hooks/useDashboard';
import { useUIStore } from './shared/store/store';
import { useAuth, LoginForm } from './features/auth';
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
import { ProductsRankingTable } from './features/products/components/ProductsRankingTable';
import {
  ShoppingBag,
  WifiOff,
} from 'lucide-react';

export default function App() {
  const { isAuthenticated, isLoading: authLoading, login, logout, currentUser } = useAuth();

  // Mostrar pantalla de login si no está autenticado
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 border-4 border-violet-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-500">Verificando sesión...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginForm onLogin={login} />;
  }

  return <DashboardContent logout={logout} currentUser={currentUser} />;
}

function DashboardContent({ logout, currentUser }: { logout: () => void; currentUser: string | null }) {
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
        onLogout={logout}
        currentUser={currentUser}
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
            <div className="p-1.5 bg-white border-b border-gray-200">
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
                <div className="flex-1 p-1.5">
                  {/* Layout: KPIs (left column) + Charts (right area) */}
                  {activeTab === 'overview' && (
                    <div className="flex gap-2.5">
                      {/* KPIs Column - Sticky */}
                      <div 
                        className="flex-shrink-0 will-change-[width] sticky top-2 self-start kpi-scroll"
                        style={{ 
                          width: sidebarCollapsed ? '195px' : '180px',
                          transition: 'width 200ms cubic-bezier(0.4, 0, 0.2, 1)',
                          maxHeight: 'calc(100vh - 140px)',
                          overflowY: 'auto'
                        }}
                      >
                        <KPICards kpis={kpis} />
                      </div>

                      {/* Charts Area */}
                      <div className="flex-1 space-y-2.5 min-w-0">
                    {/* Row 1 */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-2.5">
                      <RevenueByDayChart kpis={kpis} />
                      <StatusDistributionChart kpis={kpis} />
                    </div>

                    {/* Row 2 */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-2.5">
                      <PaymentMethodChart kpis={kpis} />
                      <div className="lg:col-span-2">
                        <TopClientsChart kpis={kpis} />
                      </div>
                    </div>

                    {/* Row 3 */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-2.5">
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
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      <div className="bg-white border border-gray-100 rounded-lg p-2.5 shadow-sm">
                        <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-1">Canal Principal de Pago</p>
                        <p className="text-sm font-bold text-gray-800 truncate">{kpis.topPaymentMethod}</p>
                      </div>
                      <div className="bg-white border border-gray-100 rounded-lg p-2.5 shadow-sm">
                        <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-1">Órdenes con Error</p>
                        <p className="text-sm font-bold text-red-600">
                          {filteredOrders.filter((o: any) => o.workflowInErrorState).length}
                        </p>
                      </div>
                      <div className="bg-white border border-gray-100 rounded-lg p-2.5 shadow-sm">
                        <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-1">Entrega Completada</p>
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
                <div className="space-y-2.5">
                  {/* Row 1: Sales + Revenue */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-2.5">
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
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-2.5">
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
                <div className="space-y-3">
                  <TopProductsChart
                    products={filteredProducts}
                    loading={topProducts.length === 0}
                  />

                  {/* Product list table */}
                  {topProducts.length > 0 && (
                    <ProductsRankingTable products={topProducts} />
                  )}
                    </div>
                  )}

                  {/* ── DELIVERY TAB ── */}
                  {activeTab === 'delivery' && (
                    <div className="flex gap-2.5">
                      {/* Delivery KPIs Column - Sticky */}
                      <div 
                        className="flex-shrink-0 will-change-[width] sticky top-2 self-start kpi-scroll"
                        style={{ 
                          width: sidebarCollapsed ? '195px' : '180px',
                          transition: 'width 200ms cubic-bezier(0.4, 0, 0.2, 1)',
                          maxHeight: 'calc(100vh - 140px)',
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
                    <div className="bg-white border border-gray-100 rounded-lg p-2.5 shadow-sm">
                      <div className="mb-2.5">
                        <h2 className="text-xs font-semibold text-gray-800">Lista de Órdenes</h2>
                        <p className="text-[10px] text-gray-400 mt-0.5">
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

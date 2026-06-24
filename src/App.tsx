import { useCallback, useState, useMemo } from 'react';
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
import { useStock } from './features/inventory/hooks/useStock';
import { StockAlertNotification } from './features/inventory/components/StockAlertNotification';
import { InventoryDashboard } from './features/inventory/components/InventoryDashboard';
import {
  ShoppingBag,
  WifiOff,
  Bell,
  AlertTriangle,
  X,
  Package,
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
  const [showLowStockDrawer, setShowLowStockDrawer] = useState(false);
  
  const {
    orders,
    filteredOrders,
    filteredProducts,
    filteredCategoryStats,
    kpis,
    topProducts,
    orderDetailsMap,
    productsByOrder,
    level1Options,
    level2Options,
    level3Options,
    cardTypeOptions,
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

  // Stock management
  const {
    stock,
    stockInfo,
    alerts,
    alertCounts,
    loading: stockLoading,
    lastUpdate: stockLastUpdate,
    getProductStock,
    getProductStockByWarehouse,
    refreshStock,
    getAlertsByLevel,
  } = useStock();

  const [dismissedAlerts, setDismissedAlerts] = useState(false);  // Calcular alertas específicas para productos vendidos con stock <= 10
  const lowStockSoldProducts = useMemo(() => {
    if (!orderDetailsMap || !stock) return [];
    
    // 1. Identificar SKUs exactos vendidos en las órdenes (de orderDetailsMap)
    const soldSKUsMap: Record<string, { name: string; soldQty: number }> = {};
    
    Object.values(orderDetailsMap).forEach((order: any) => {
      if (order && order.items) {
        order.items.forEach((item: any) => {
          const sku = item.refId || item.productId;
          if (sku) {
            if (!soldSKUsMap[sku]) {
              soldSKUsMap[sku] = { name: item.name, soldQty: 0 };
            }
            soldSKUsMap[sku].soldQty += item.quantity;
          }
        });
      }
    });

    // 2. Filtrar productos de stock que tengan stock <= 10 y que estén en soldSKUsMap
    const list: Array<{ refId: string; name: string; stock: number; soldQuantity: number }> = [];
    
    Object.entries(soldSKUsMap).forEach(([sku, info]) => {
      // Verificar si el SKU reporta stock en la API antes de validar
      const hasStockReport = Object.values(stock).some((wh: any) => wh[sku] !== undefined);
      if (!hasStockReport) return;

      // Sumar stock de todos los almacenes para este SKU específico
      const totalStock = Object.values(stock).reduce((acc: number, wh: any) => {
        return acc + (wh[sku] ?? 0);
      }, 0);

      if (totalStock > 0 && totalStock <= 10) {
        list.push({
          refId: sku,
          name: info.name,
          stock: totalStock,
          soldQuantity: info.soldQty,
        });
      }
    });

    return list.sort((a, b) => a.stock - b.stock);
  }, [orderDetailsMap, stock]);

  const zeroStockSoldAlerts = useMemo(() => {
    if (!orderDetailsMap || !stock) return [];
    
    const soldSKUsMap: Record<string, string> = {};
    Object.values(orderDetailsMap).forEach((order: any) => {
      if (order && order.items) {
        order.items.forEach((item: any) => {
          const sku = item.refId || item.productId;
          if (sku) soldSKUsMap[sku] = item.name;
        });
      }
    });

    const list: any[] = [];
    Object.entries(soldSKUsMap).forEach(([sku, name]) => {
      const hasStockReport = Object.values(stock).some((wh: any) => wh[sku] !== undefined);
      if (!hasStockReport) return;

      const totalStock = Object.values(stock).reduce((acc: number, wh: any) => {
        return acc + (wh[sku] ?? 0);
      }, 0);

      if (totalStock === 0) {
        list.push({
          refId: sku,
          name: name,
          warehouse: 'Total',
          stock: 0,
          level: 'depleted',
          timestamp: new Date()
        });
      }
    });

    return list;
  }, [orderDetailsMap, stock]);

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
        stockAlertsCount={alertCounts.total}
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
            {activeTab !== 'inventory' && (
              <div className="p-1.5 bg-white border-b border-gray-200">
                <FilterBar
                  filters={filters}
                  setFilters={setFilters}
                  resetFilters={resetFilters}
                  filterOptions={filterOptions}
                  cardTypeOptions={cardTypeOptions}
                  level1Options={level1Options}
                  level2Options={level2Options}
                  level3Options={level3Options}
                  totalOrders={orders.length}
                  filteredCount={filteredOrders.length}
                />
              </div>
            )}

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto">
              <div className="flex h-full">
                {/* Main Content Area */}
                <div className="flex-1 p-1.5">
                  {activeTab === 'overview' && (
                    <div className="flex flex-col gap-2.5 w-full">
                      {/* Cabecera de Resumen con Alerta de Stock */}
                      <div className="bg-white border border-gray-100 rounded-lg p-2 flex items-center justify-between shadow-sm">
                        <div>
                          <h2 className="text-xs font-bold text-gray-800">Resumen de Gestión</h2>
                          <p className="text-[9px] text-gray-400">Indicadores clave de rendimiento y alertas en tiempo real</p>
                        </div>
                        <div className="flex items-center gap-2">
                          {lowStockSoldProducts.length > 0 && (
                            <button
                              onClick={() => setShowLowStockDrawer(true)}
                              className="text-[9px] text-red-600 bg-red-50 border border-red-100 px-2 py-0.5 rounded font-medium animate-pulse hover:bg-red-100 transition-colors"
                            >
                              ¡Alerta! {lowStockSoldProducts.length} producto(s) vendido(s) con stock bajo
                            </button>
                          )}
                          <button
                            onClick={() => setShowLowStockDrawer(prev => !prev)}
                            className={`p-1.5 rounded-full border transition-all relative flex items-center justify-center ${
                              lowStockSoldProducts.length > 0
                                ? 'bg-red-50 border-red-200 text-red-600 hover:bg-red-100 animate-bounce'
                                : 'bg-gray-50 border-gray-200 text-gray-400 hover:bg-gray-100'
                            }`}
                            title="Ver alertas de stock"
                          >
                            <Bell className="h-3.5 w-3.5" />
                            {lowStockSoldProducts.length > 0 && (
                              <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[8px] font-bold rounded-full w-3.5 h-3.5 flex items-center justify-center border border-white">
                                {lowStockSoldProducts.length}
                              </span>
                            )}
                          </button>
                        </div>
                      </div>

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
                    <ProductsRankingTable 
                      products={topProducts}
                    />
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

                  {/* ── INVENTORY TAB ── */}
                  {activeTab === 'inventory' && (
                    <InventoryDashboard products={filteredProducts} />
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

      {/* Slide-over Drawer (Panel Lateral Deslizable de Stock Crítico) */}
      <div 
        className={`fixed inset-0 z-50 overflow-hidden transition-all duration-300 ${
          showLowStockDrawer ? 'visible pointer-events-auto' : 'invisible pointer-events-none'
        }`}
      >
        {/* Backdrop con Blur */}
        <div 
          onClick={() => setShowLowStockDrawer(false)}
          className={`absolute inset-0 bg-black/30 backdrop-blur-xs transition-opacity duration-300 ${
            showLowStockDrawer ? 'opacity-100' : 'opacity-0'
          }`}
        />
        
        {/* Drawer Panel */}
        <div 
          className={`absolute inset-y-0 right-0 max-w-sm w-full bg-white shadow-2xl flex flex-col transform transition-transform duration-300 ease-out border-l border-gray-200 ${
            showLowStockDrawer ? 'translate-x-0' : 'translate-x-full'
          }`}
        >
          {/* Header */}
          <div className="bg-red-600 text-white p-4 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 animate-pulse" />
              <div>
                <h3 className="font-bold text-sm">Alertas de Stock</h3>
                <p className="text-[9px] text-red-100 mt-0.5">Productos con stock bajo de 1 a 10 unidades</p>
              </div>
            </div>
            <button 
              onClick={() => setShowLowStockDrawer(false)}
              className="text-white/80 hover:text-white hover:bg-white/10 p-1.5 rounded-lg transition-colors"
            >
              <X className="h-4.5 w-4.5" />
            </button>
          </div>
          
          {/* Body Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
            {lowStockSoldProducts.length === 0 ? (
              <div className="text-center py-16 text-gray-400">
                <Package className="h-10 w-10 mx-auto mb-3 opacity-20 text-gray-400" />
                <p className="text-xs font-semibold">¡Todo al día!</p>
                <p className="text-[10px] text-gray-400 mt-1">No hay productos vendidos con stock crítico</p>
              </div>
            ) : (
              lowStockSoldProducts.map((p) => {
                const pct = Math.min(100, Math.max(0, (p.stock / 10) * 100));
                const barColor = p.stock <= 5 ? 'bg-red-500' : 'bg-amber-500';
                
                return (
                  <div key={p.refId} className="bg-red-50/20 border border-red-100/50 rounded-xl p-3 hover:bg-red-50/40 transition-colors space-y-2 text-xs">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-bold text-gray-800 break-words">{p.name}</p>
                        <p className="text-[9px] text-gray-400 font-mono mt-0.5">SKU: {p.refId}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <span className="inline-block px-2 py-0.5 bg-red-100 text-red-700 font-bold rounded-md">
                          {p.stock} uds
                        </span>
                        <p className="text-[8px] text-gray-400 mt-1">Vendidos: {p.soldQuantity}</p>
                      </div>
                    </div>
                    
                    {/* Progress Bar */}
                    <div className="space-y-1">
                      <div className="w-full bg-gray-200 h-1.5 rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${barColor} rounded-full transition-all duration-500`} 
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
          
          {/* Footer */}
          <div className="p-3 bg-gray-50 border-t border-gray-100 flex justify-between items-center text-[10px] text-gray-500 font-semibold">
            <span>Total alertas: {lowStockSoldProducts.length}</span>
            <button
              onClick={() => setShowLowStockDrawer(false)}
              className="px-4 py-1.5 bg-gray-800 text-white rounded-lg text-xs font-bold hover:bg-gray-900 transition-colors shadow-sm"
            >
              Entendido
            </button>
          </div>
        </div>
      </div>

      <NewOrderNotification 
        orders={newOrder ? [newOrder, ...newOrdersQueue] : newOrdersQueue} 
        onClose={clearAllNewOrders} 
      />
      {/* Mostrar notificaciones de alertas de stock */}
      {!dismissedAlerts && zeroStockSoldAlerts.length > 0 && (
        <StockAlertNotification 
          alerts={zeroStockSoldAlerts} 
          onDismiss={() => setDismissedAlerts(true)} 
        />
      )}
    </div>
  );
}

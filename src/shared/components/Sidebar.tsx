import { BarChart3, List, Package, Truck, Menu, RefreshCw, Clock, Wifi, WifiOff, LogOut } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Separator } from '../../components/ui/separator';
import { memo, useMemo } from 'react';

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  ordersCount: number;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  connected: boolean;
  lastUpdated: Date | null;
  onRefresh: () => void;
  refreshing: boolean;
  onLogout?: () => void;
  currentUser?: string | null;
}

export const Sidebar = memo(({ 
  activeTab, 
  onTabChange, 
  ordersCount, 
  isCollapsed, 
  onToggleCollapse,
  connected,
  lastUpdated,
  onRefresh,
  refreshing,
  onLogout,
  currentUser
}: SidebarProps) => {
  const tabs = useMemo(() => [
    {
      id: 'overview',
      label: 'Resumen',
      icon: BarChart3,
    },
    {
      id: 'categories',
      label: 'Categorías',
      icon: BarChart3,
    },
    {
      id: 'products',
      label: 'Productos',
      icon: Package,
    },
    {
      id: 'delivery',
      label: 'Delivery',
      icon: Truck,
    },
    {
      id: 'orders',
      label: 'Órdenes',
      icon: List,
      badge: ordersCount,
    },
  ], [ordersCount]);

  return (
    <aside 
      className={`${isCollapsed ? 'w-16' : 'w-52'} bg-white border-r border-gray-200 flex-shrink-0 h-screen overflow-hidden flex flex-col will-change-[width]`}
      style={{ 
        transition: 'width 200ms cubic-bezier(0.4, 0, 0.2, 1)',
        transform: 'translateZ(0)',
        backfaceVisibility: 'hidden'
      }}
    >
      {/* Header with Logo */}
      <div className={`p-2.5 border-b border-gray-200 ${isCollapsed ? 'flex justify-center' : ''}`}>
        {isCollapsed ? (
          <button
            onClick={onToggleCollapse}
            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Menu className="h-4 w-4 text-gray-600" />
          </button>
        ) : (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <img src={`${import.meta.env.BASE_URL}Farma-logo3.svg`} alt="FarmaGo" className="h-8 w-8" />
              <div>
                <h1 className="text-xs font-bold text-gray-900">FarmaGo</h1>
                <p className="text-[9px] text-gray-400">Dashboard</p>
              </div>
            </div>
            <button
              onClick={onToggleCollapse}
              className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Menu className="h-3.5 w-3.5 text-gray-600" />
            </button>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`w-full flex items-center ${isCollapsed ? 'justify-center px-1.5' : 'gap-2 px-2'} py-2 rounded-lg transition-colors duration-150 group ${
                isActive
                  ? 'bg-blue-50 text-blue-700 font-medium'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
              title={isCollapsed ? tab.label : undefined}
            >
              <Icon className={`h-4 w-4 flex-shrink-0 transition-colors duration-150 ${isActive ? 'text-blue-700' : 'text-gray-400 group-hover:text-gray-600'}`} />
              {!isCollapsed && (
                <>
                  <span className="text-xs flex-1 text-left whitespace-nowrap">
                    {tab.label}
                  </span>
                  {tab.badge !== undefined && (
                    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full whitespace-nowrap ${
                      isActive ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {tab.badge.toLocaleString()}
                    </span>
                  )}
                </>
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer with Status and Refresh */}
      {!isCollapsed && (
        <>
          <Separator />
          <div className="p-2 space-y-1.5">
            {/* User Info */}
            {currentUser && (
              <div className="flex items-center gap-1.5 px-2 py-1.5 bg-violet-50 rounded-lg">
                <div className="h-5 w-5 rounded-full bg-violet-200 flex items-center justify-center flex-shrink-0">
                  <span className="text-[9px] font-bold text-violet-700">
                    {currentUser.charAt(0).toUpperCase()}
                  </span>
                </div>
                <span className="text-[10px] font-medium text-violet-700 truncate flex-1">
                  {currentUser}
                </span>
              </div>
            )}

            {/* Connection Status */}
            <div className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-[10px] ${
              connected ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
            }`}>
              {connected ? (
                <>
                  <Wifi className="h-3 w-3" />
                  <span className="font-medium">En línea</span>
                </>
              ) : (
                <>
                  <WifiOff className="h-3 w-3" />
                  <span className="font-medium">Desconectado</span>
                </>
              )}
            </div>

            {/* Last Updated */}
            {lastUpdated && (
              <div className="flex items-center gap-1.5 px-2 py-1 text-[10px] text-gray-500">
                <Clock className="h-3 w-3" />
                <span>{lastUpdated.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
            )}

            {/* Refresh Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={onRefresh}
              disabled={refreshing}
              className="w-full text-[10px] gap-1.5 h-7"
            >
              <RefreshCw className={`h-3 w-3 ${refreshing ? 'animate-spin' : ''}`} />
              Actualizar
            </Button>

            {/* Logout Button */}
            {onLogout && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onLogout}
                className="w-full text-[10px] gap-1.5 h-7 text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <LogOut className="h-3 w-3" />
                Cerrar Sesión
              </Button>
            )}
          </div>
        </>
      )}

      {/* Collapsed Footer */}
      {isCollapsed && (
        <div className="p-2 border-t border-gray-200 flex flex-col items-center gap-1.5">
          {/* User Avatar */}
          {currentUser && (
            <div className="h-6 w-6 rounded-full bg-violet-200 flex items-center justify-center" title={currentUser}>
              <span className="text-[10px] font-bold text-violet-700">
                {currentUser.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
          
          <button
            onClick={onRefresh}
            disabled={refreshing}
            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
            title="Actualizar"
          >
            <RefreshCw className={`h-3.5 w-3.5 text-gray-600 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
          
          <div className={`w-1.5 h-1.5 rounded-full ${connected ? 'bg-emerald-500' : 'bg-red-500'}`} title={connected ? 'En línea' : 'Desconectado'} />
          
          {/* Logout Button */}
          {onLogout && (
            <button
              onClick={onLogout}
              className="p-1.5 hover:bg-red-50 rounded-lg transition-colors"
              title="Cerrar Sesión"
            >
              <LogOut className="h-3.5 w-3.5 text-red-600" />
            </button>
          )}
        </div>
      )}
    </aside>
  );
});

Sidebar.displayName = 'Sidebar';

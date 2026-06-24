// ============================================================================
// COMPONENT - Stock Alert Notification
// ============================================================================

import { useEffect, useState } from 'react';
import { X, AlertTriangle, AlertCircle, XCircle } from 'lucide-react';
import type { StockAlert } from '../../../types/stock';

interface StockAlertNotificationProps {
  alerts: StockAlert[];
  onDismiss: () => void;
}

export function StockAlertNotification({ alerts, onDismiss }: StockAlertNotificationProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (alerts.length > 0) {
      setVisible(true);
    }
  }, [alerts]);

  if (!visible || alerts.length === 0) {
    return null;
  }

  const handleDismiss = () => {
    setVisible(false);
    setTimeout(onDismiss, 300);
  };

  const criticalAlerts = alerts.filter(a => a.level === 'critical');
  const depletedAlerts = alerts.filter(a => a.level === 'depleted');
  const warningAlerts = alerts.filter(a => a.level === 'warning');

  const getIcon = () => {
    if (depletedAlerts.length > 0) return <XCircle className="h-5 w-5 text-red-600" />;
    if (criticalAlerts.length > 0) return <AlertCircle className="h-5 w-5 text-orange-600" />;
    return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
  };

  const getTitle = () => {
    if (depletedAlerts.length > 0) return 'Productos Agotados';
    if (criticalAlerts.length > 0) return 'Stock Crítico';
    return 'Stock Bajo';
  };

  const getBgColor = () => {
    if (depletedAlerts.length > 0) return 'bg-red-50 border-red-200';
    if (criticalAlerts.length > 0) return 'bg-orange-50 border-orange-200';
    return 'bg-yellow-50 border-yellow-200';
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 animate-slide-up">
      <div className={`${getBgColor()} border rounded-lg shadow-lg p-4 max-w-sm`}>
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2">
            {getIcon()}
            <h3 className="font-semibold text-sm text-gray-800">
              {getTitle()}
            </h3>
          </div>
          <button
            onClick={handleDismiss}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-1 mb-3">
          {depletedAlerts.length > 0 && (
            <p className="text-xs text-red-700">
              🔴 {depletedAlerts.length} producto(s) sin stock
            </p>
          )}
          {criticalAlerts.length > 0 && (
            <p className="text-xs text-orange-700">
              ⚠️ {criticalAlerts.length} producto(s) en stock crítico (≤5)
            </p>
          )}
          {warningAlerts.length > 0 && (
            <p className="text-xs text-yellow-700">
              ⚡ {warningAlerts.length} producto(s) con stock bajo (≤10)
            </p>
          )}
        </div>

        <div className="max-h-32 overflow-y-auto space-y-1">
          {alerts.slice(0, 5).map((alert, i) => (
            <div key={i} className="text-xs text-gray-600 flex justify-between">
              <span className="truncate mr-2">{alert.name || alert.refId}</span>
              <span className="font-mono font-semibold whitespace-nowrap">
                {alert.warehouse}: {alert.stock}
              </span>
            </div>
          ))}
          {alerts.length > 5 && (
            <p className="text-xs text-gray-400 italic">
              +{alerts.length - 5} más...
            </p>
          )}
        </div>

        <button
          onClick={handleDismiss}
          className="mt-3 w-full text-xs py-1.5 px-3 rounded bg-white border border-gray-200 hover:bg-gray-50 transition-colors"
        >
          Descartar
        </button>
      </div>
    </div>
  );
}

// ============================================================================
// HOOK - useStock
// ============================================================================

import { useState, useEffect, useCallback } from 'react';
import { socketService } from '../../../shared/services/socketService';
import type {
  StockByWarehouse,
  StockCacheInfo,
  StockUpdate,
  StockAlert,
  Warehouse,
} from '../../../types/stock';

export function useStock() {
  const [stock, setStock] = useState<StockByWarehouse>({});
  const [stockInfo, setStockInfo] = useState<StockCacheInfo | null>(null);
  const [alerts, setAlerts] = useState<StockAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  useEffect(() => {
    // Asegurar que el socket esté conectado ANTES de registrar listeners
    const socket = socketService.getSocket();
    if (!socket || !socket.connected) {
      socketService.connect();
    }

    // ── Stock inicial y actualizaciones completas ──
    socketService.onStockUpdate((data) => {
      setStock(data.stock ?? {});
      setStockInfo(data.info ?? null);
      setLastUpdate(new Date(data.timestamp));
      setLoading(false);
    });

    // ── Sync completo periódico ──
    socketService.onStockSyncComplete((data) => {
      setStock(data.stock ?? {});
      setStockInfo(data.info ?? null);
      setLastUpdate(new Date(data.timestamp));
      setLoading(false);
    });

    // ── Actualización en tiempo real (nueva orden) ──
    socketService.onStockRealtimeUpdate((update: StockUpdate) => {
      setStock((prev) => {
        const newStock = { ...prev };
        if (!newStock[update.warehouse]) {
          newStock[update.warehouse] = {};
        }
        newStock[update.warehouse] = {
          ...newStock[update.warehouse],
          [update.refId]: update.newStock,
        };
        return newStock;
      });
      setLastUpdate(new Date(update.timestamp));
    });

    // ── Alertas ──
    socketService.onStockAlerts((data) => {
      setAlerts(data.alerts ?? []);
    });

    // Si el socket ya está conectado al montar el componente y el servidor ya
    // tiene datos, solicitar un refresh inmediato para no esperar al timer
    const currentSocket = socketService.getSocket();
    if (currentSocket?.connected) {
      // Pequeño delay para que el servidor procese la reconexión
      const timer = setTimeout(() => {
        socketService.emitStockRefresh();
      }, 500);
      return () => clearTimeout(timer);
    }

    return () => {
      // Cleanup: los listeners se gestionan en el ciclo de vida del socketService
    };
  }, []);

  // ── Obtener stock de un producto específico ──
  const getProductStock = useCallback(
    (refId: string, warehouse?: Warehouse): number => {
      if (warehouse && warehouse !== 'Todos') {
        return stock[warehouse]?.[refId] ?? 0;
      }
      // Si no se especifica almacén, sumar todos
      return Object.values(stock).reduce((total, wh) => total + (wh[refId] ?? 0), 0);
    },
    [stock]
  );

  // ── Stock por almacén de un producto ──
  const getProductStockByWarehouse = useCallback(
    (refId: string) => ({
      PT: stock['PT']?.[refId] ?? 0,
      CV: stock['CV']?.[refId] ?? 0,
      '94': stock['94']?.[refId] ?? 0,
      total: getProductStock(refId),
    }),
    [stock, getProductStock]
  );

  // ── Refrescar stock manualmente ──
  const refreshStock = useCallback(() => {
    socketService.emitStockRefresh();
  }, []);

  // ── Filtrar alertas por nivel ──
  const getAlertsByLevel = useCallback(
    (level?: 'warning' | 'critical' | 'depleted') => {
      if (!level) return alerts;
      return alerts.filter((a) => a.level === level);
    },
    [alerts]
  );

  // ── Contadores de alertas ──
  const alertCounts = {
    warning: alerts.filter((a) => a.level === 'warning').length,
    critical: alerts.filter((a) => a.level === 'critical').length,
    depleted: alerts.filter((a) => a.level === 'depleted').length,
    total: alerts.length,
  };

  return {
    stock,
    stockInfo,
    alerts,
    alertCounts,
    loading,
    lastUpdate,
    getProductStock,
    getProductStockByWarehouse,
    refreshStock,
    getAlertsByLevel,
  };
}

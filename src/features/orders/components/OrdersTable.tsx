import { useState, useMemo, useRef, memo } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import type { OrderListItem } from '../../../types/orders';
import { Input } from '../../../components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../components/ui/select';
import { Search } from 'lucide-react';

interface OrdersTableProps {
  orders: OrderListItem[];
  onSelectOrder?: (orderId: string) => void;
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  'payment-pending': { label: 'Pago Pendiente', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
  'payment-approved': { label: 'Pago Aprobado', color: 'bg-blue-100 text-blue-800 border-blue-200' },
  'ready-for-handling': { label: 'Listo', color: 'bg-orange-100 text-orange-800 border-orange-200' },
  'handling': { label: 'En Preparación', color: 'bg-purple-100 text-purple-800 border-purple-200' },
  'invoiced': { label: 'Facturado', color: 'bg-green-100 text-green-800 border-green-200' },
  'canceled': { label: 'Cancelado', color: 'bg-red-100 text-red-800 border-red-200' },
  'cancellation-requested': { label: 'Solic. Cancelación', color: 'bg-red-100 text-red-800 border-red-200' },
  'window-to-cancel': { label: 'V. Cancelación', color: 'bg-red-50 text-red-700 border-red-100' },
  'waiting-ffmt-authorization': { label: 'Esp. Autorización', color: 'bg-gray-100 text-gray-800 border-gray-200' },
  'approve-payment': { label: 'Aprobando Pago', color: 'bg-blue-50 text-blue-700 border-blue-100' },
};

export const OrdersTable = memo(({ orders, onSelectOrder }: OrdersTableProps) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const parentRef = useRef<HTMLDivElement>(null);

  const filtered = useMemo(() => {
    return orders
      .filter(o => {
        const matchStatus = statusFilter === 'all' || o.status === statusFilter;
        const matchSearch = !search ||
          o.orderId.toLowerCase().includes(search.toLowerCase()) ||
          o.clientName?.toLowerCase().includes(search.toLowerCase()) ||
          o.sequence?.includes(search);
        return matchStatus && matchSearch;
      })
      .sort((a, b) => {
        // Optimización: Comparación lexicográfica directa para ISO 8601 (O(N) sin instanciar Objects)
        if (!a.creationDate) return 1;
        if (!b.creationDate) return -1;
        return b.creationDate.localeCompare(a.creationDate);
      });
  }, [orders, search, statusFilter]);

  // Virtualizer
  const rowVirtualizer = useVirtualizer({
    count: filtered.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 52,
    overscan: 5,
  });

  const statuses = useMemo(() => {
    const unique = [...new Set(orders.map(o => o.status))];
    return unique.sort();
  }, [orders]);

  const handleSearchChange = (v: string) => {
    setSearch(v);
  };

  const handleStatusChange = (v: string) => {
    setStatusFilter(v);
  };

  return (
    <div className="flex flex-col gap-2.5">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Buscar por ID, cliente o secuencia..."
            value={search}
            onChange={e => handleSearchChange(e.target.value)}
            className="pl-8 h-9 text-xs border-gray-200"
          />
        </div>
        <Select value={statusFilter} onValueChange={handleStatusChange}>
          <SelectTrigger className="w-full sm:w-48 h-9 text-xs border-gray-200">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los estados</SelectItem>
            {statuses.map(s => (
              <SelectItem key={s} value={s}>
                {STATUS_LABELS[s]?.label || s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <p className="text-[11px] text-gray-400">
        Mostrando {filtered.length} órdenes
        {statusFilter !== 'all' && ` · Estado: ${STATUS_LABELS[statusFilter]?.label || statusFilter}`}
      </p>

      {/* Virtualized Table */}
      <div className="rounded-lg border border-gray-100 overflow-hidden bg-white">
        {/* Header */}
        <div className="grid grid-cols-[180px_1fr_100px_160px_90px_70px_120px_120px] gap-3 px-3 py-2.5 bg-gray-50 border-b border-gray-100 text-[11px] font-semibold text-gray-600">
          <div>ID Orden</div>
          <div>Cliente</div>
          <div className="text-right">Total</div>
          <div>Estado</div>
          <div>Origen</div>
          <div className="text-center hidden md:block">Ítems</div>
          <div className="hidden lg:block">Fecha Creación</div>
          <div className="hidden lg:block">Fecha Estimada</div>
        </div>

        {/* Virtualized Body */}
        <div
          ref={parentRef}
          className="h-[550px] overflow-auto"
          style={{ contain: 'strict' }}
        >
          {filtered.length === 0 ? (
            <div className="flex items-center justify-center h-full text-gray-400 text-sm">
              No se encontraron órdenes
            </div>
          ) : (
            <div
              style={{
                height: `${rowVirtualizer.getTotalSize()}px`,
                width: '100%',
                position: 'relative',
              }}
            >
              {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                const order = filtered[virtualRow.index];
                const statusInfo = STATUS_LABELS[order.status] || { 
                  label: order.status, 
                  color: 'bg-gray-100 text-gray-700 border-gray-200' 
                };

                return (
                  <div
                    key={virtualRow.key}
                    data-index={virtualRow.index}
                    ref={rowVirtualizer.measureElement}
                    className="grid grid-cols-[180px_1fr_100px_160px_90px_70px_120px_120px] gap-3 px-3 py-2.5 border-b border-gray-50 hover:bg-blue-50/40 cursor-pointer transition-colors absolute top-0 left-0 w-full"
                    style={{
                      transform: `translateY(${virtualRow.start}px)`,
                    }}
                    onClick={() => onSelectOrder?.(order.orderId)}
                  >
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-1">
                        <span className="font-mono text-[11px] text-blue-600 font-bold">
                          #{order.sequence || order.orderId.slice(-6)}
                        </span>
                        {order.isCyberOrder && (
                          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-purple-100 text-purple-700 rounded text-[9px] font-bold border border-purple-200">
                            <span>⚡</span>
                            CYBER
                          </span>
                        )}
                      </div>
                      <span className="font-mono text-[9px] text-gray-400 select-all truncate">
                        {order.orderId}
                      </span>
                    </div>
                    <div className="text-sm text-gray-700 truncate">
                      {order.clientName || '—'}
                    </div>
                    <div className="text-right font-semibold text-sm text-gray-800">
                      S/ {((order.totalValue || 0) / 100).toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                    </div>
                    <div>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-[11px] font-medium border ${statusInfo.color}`}>
                        {statusInfo.label}
                      </span>
                    </div>
                    <div className="text-[11px] text-gray-500">{order.origin || '—'}</div>
                    <div className="text-[11px] text-gray-500 hidden md:block text-center">
                      {order.totalItems ?? '—'}
                    </div>
                    <div className="text-[11px] text-gray-400 hidden lg:block">
                      {order.creationDate
                        ? new Date(order.creationDate).toLocaleString('es-PE', {
                            day: '2-digit', month: '2-digit', year: '2-digit',
                            hour: '2-digit', minute: '2-digit',
                          })
                        : '—'}
                    </div>
                    <div className="text-[11px] text-gray-400 hidden lg:block">
                      {order.ShippingEstimatedDate
                        ? new Date(order.ShippingEstimatedDate).toLocaleString('es-PE', {
                            day: '2-digit', month: '2-digit', year: '2-digit',
                            hour: '2-digit', minute: '2-digit',
                          })
                        : '—'}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
});
OrdersTable.displayName = 'OrdersTable';

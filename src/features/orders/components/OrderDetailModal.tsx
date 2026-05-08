import { useState, useEffect, memo } from 'react';
import type { OrderDetail } from '../../../types/orders';
import { Separator } from '../../../components/ui/separator';
import { Package, CreditCard, MapPin, User, FileText, X } from 'lucide-react';
import { API_CONFIG } from '../../../shared/config/constants';

interface OrderDetailModalProps {
  orderId: string | null;
  onClose: () => void;
}

export const OrderDetailModal = memo(({ orderId, onClose }: OrderDetailModalProps) => {
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!orderId) { setOrder(null); return; }
    setLoading(true);
    setError(null);
    fetch(`${API_CONFIG.SERVER_URL}${API_CONFIG.API_BASE_PATH}/orders/${orderId}`)
      .then(r => { if (!r.ok) throw new Error(`Error ${r.status}`); return r.json(); })
      .then(data => { setOrder(data); setLoading(false); })
      .catch(err => { setError(err.message); setLoading(false); });
  }, [orderId]);

  const fmtMoney = (v: number) =>
    `S/ ${(v / 100).toLocaleString('es-PE', { minimumFractionDigits: 2 })}`;

  const fmtDate = (d: string | null) =>
    d ? new Date(d).toLocaleString('es-PE', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    }) : '—';

  const statusColor = (s: string) => {
    if (s === 'invoiced') return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    if (s === 'canceled' || s === 'cancellation-requested') return 'bg-red-100 text-red-700 border-red-200';
    if (s === 'handling') return 'bg-purple-100 text-purple-700 border-purple-200';
    if (s === 'ready-for-handling') return 'bg-orange-100 text-orange-700 border-orange-200';
    return 'bg-blue-100 text-blue-700 border-blue-200';
  };

  const fixStatusDescription = (desc: string) => {
    // Corregir errores de ortografía de VTEX
    if (desc === 'Faturado') return 'Facturado';
    return desc;
  };

  return (
    /* Overlay custom — evita restriccion sm:max-w-sm del componente Dialog */
    orderId ? (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{ background: 'rgba(0,0,0,0.45)' }}
        onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      >
        <div
          className="bg-white rounded-xl shadow-2xl w-full overflow-hidden flex flex-col"
          style={{ maxWidth: 720, maxHeight: '85vh' }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <div className="flex items-center gap-1.5">
              <FileText className="h-3.5 w-3.5 text-blue-600" />
              <span className="font-semibold text-gray-800 text-xs">
                Detalle de Orden
                {order && <span className="font-mono text-blue-600 ml-1">#{order.sequence}</span>}
              </span>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-lg hover:bg-gray-100"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Body — scrollable */}
          <div className="overflow-y-auto flex-1 p-4">
            {loading && (
              <div className="flex items-center justify-center py-20">
                <div className="animate-spin h-8 w-8 border-2 border-blue-600 border-t-transparent rounded-full" />
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700">
                Error: {error}
              </div>
            )}

            {order && !loading && (
              <div className="flex flex-col gap-3.5">
                {/* Status bar */}
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${statusColor(order.status)}`}>
                    {fixStatusDescription(order.statusDescription || order.status)}
                  </span>
                  <span className="text-[10px] text-gray-400">Creado: {fmtDate(order.creationDate)}</span>
                  {order.invoicedDate && (
                    <span className="text-[10px] text-gray-400">Facturado: {fmtDate(order.invoicedDate)}</span>
                  )}
                </div>

                {/* Totals */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {order.totals?.map(t => (
                    <div key={t.id} className="bg-gray-50 rounded-lg p-2 border border-gray-100">
                      <p className="text-[9px] text-gray-400 mb-0.5">{t.name}</p>
                      <p className={`text-xs font-bold ${t.value < 0 ? 'text-red-600' : 'text-gray-800'}`}>
                        {t.value < 0
                          ? `-S/ ${Math.abs(t.value / 100).toLocaleString('es-PE', { minimumFractionDigits: 2 })}`
                          : `S/ ${(t.value / 100).toLocaleString('es-PE', { minimumFractionDigits: 2 })}`}
                      </p>
                    </div>
                  ))}
                </div>

                <Separator />

                {/* Two-column: Client + Shipping | Payment */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Cliente */}
                  {order.clientProfileData && (
                    <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                      <div className="flex items-center gap-1 mb-2">
                        <User className="h-3 w-3 text-blue-500" />
                        <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">Cliente</p>
                      </div>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-400 text-[10px]">Nombre</span>
                          <span className="text-gray-700 font-medium text-[10px]">
                            {order.clientProfileData.firstName} {order.clientProfileData.lastName}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400 text-[10px]">{order.clientProfileData.documentType}</span>
                          <span className="text-gray-700 font-medium text-[10px]">{order.clientProfileData.document}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400 text-[10px]">Teléfono</span>
                          <span className="text-gray-700 font-medium text-[10px]">{order.clientProfileData.phone || '—'}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Envío + Pago apilados */}
                  <div className="flex flex-col gap-2">
                    {order.shippingData?.address && (
                      <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                        <div className="flex items-center gap-1 mb-2">
                          <MapPin className="h-3 w-3 text-emerald-500" />
                          <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">Envío</p>
                        </div>
                        <p className="text-[10px] text-gray-700">
                          {order.shippingData.address.street} {order.shippingData.address.number},&nbsp;
                          {order.shippingData.address.neighborhood}, {order.shippingData.address.city}
                        </p>
                        <p className="text-[9px] text-gray-400 mt-1">
                          {order.shippingData.address.addressType === 'pickup' ? 'Retiro en tienda' : 'Domicilio'}
                          {order.shippingData.logisticsInfo?.[0]?.deliveryCompany &&
                            ` · ${order.shippingData.logisticsInfo[0].deliveryCompany}`}
                        </p>
                      </div>
                    )}

                    {order.paymentData?.transactions?.[0]?.payments?.[0] && (
                      <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                        <div className="flex items-center gap-1 mb-2">
                          <CreditCard className="h-3 w-3 text-violet-500" />
                          <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">Pago</p>
                        </div>
                        {order.paymentData.transactions[0].payments.map((p, i) => (
                          <div key={i} className="space-y-0.5">
                            <div className="flex justify-between">
                              <span className="text-[10px] text-gray-400">Método</span>
                              <span className="text-[10px] font-medium text-gray-700">{p.paymentSystemName}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-[10px] text-gray-400">Monto</span>
                              <span className="text-[10px] font-bold text-gray-800">
                                S/ {(p.value / 100).toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                              </span>
                            </div>
                            {p.installments > 1 && (
                              <div className="flex justify-between">
                                <span className="text-[10px] text-gray-400">Cuotas</span>
                                <span className="text-[10px] text-gray-700">{p.installments}</span>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <Separator />

                {/* Products */}
                {order.items && order.items.length > 0 && (
                  <div>
                    <div className="flex items-center gap-1 mb-2">
                      <Package className="h-3 w-3 text-amber-500" />
                      <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">
                        Productos ({order.items.length})
                      </p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {order.items.map((item, i) => {
                        const meta = order.itemMetadata?.Items?.find(m => m.Id === item.id);
                        return (
                          <div key={item.uniqueId || i}
                            className="flex items-center gap-2 bg-gray-50 rounded-lg p-2 border border-gray-100">
                            {(meta?.ImageUrl || item.imageUrl) && (
                              <img
                                src={meta?.ImageUrl || item.imageUrl}
                                alt={item.name}
                                className="w-10 h-10 object-contain rounded-lg bg-white border border-gray-100 flex-shrink-0"
                              />
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-[10px] font-medium text-gray-700 leading-snug line-clamp-2">{item.name}</p>
                              <p className="text-[9px] text-gray-400 mt-0.5">
                                SKU: {item.refId || item.id} · Qty: {item.quantity}
                              </p>
                            </div>
                            <div className="text-right flex-shrink-0">
                              <p className="text-[10px] font-bold text-gray-800">
                                {fmtMoney(item.sellingPrice)}
                              </p>
                              {item.listPrice !== item.sellingPrice && (
                                <p className="text-[9px] text-gray-400 line-through mt-0.5">
                                  {fmtMoney(item.listPrice)}
                                </p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    ) : null
  );
});
export default OrderDetailModal;

import { useEffect, useState } from 'react';
import { X, ShoppingBag, User, CreditCard, MapPin, Package, Calendar } from 'lucide-react';
import type { OrderListItem } from '../../../types/orders';

interface NewOrderModalProps {
  order: OrderListItem | null;
  onClose: () => void;
}

export function NewOrderModal({ order, onClose }: NewOrderModalProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (order) {
      setIsVisible(true);
      const timer = setTimeout(() => {
        handleClose();
      }, 10000);
      return () => clearTimeout(timer);
    }
  }, [order]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 300);
  };

  if (!order) return null;

  const fixStatusDescription = (desc: string) => {
    // Corregir errores de ortografía de VTEX
    if (desc === 'Faturado') return 'Facturado';
    return desc;
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center transition-all duration-300 ${
        isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <div
        className={`relative bg-gradient-to-br from-emerald-50 to-white rounded-2xl shadow-2xl max-w-2xl w-full mx-4 transform transition-all duration-300 ${
          isVisible ? 'scale-100 translate-y-0' : 'scale-95 translate-y-4'
        }`}
      >
        {/* Header con animación */}
        <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-t-2xl p-6 relative overflow-hidden">
          <div className="absolute inset-0 bg-white/10 animate-pulse" />
          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center animate-bounce">
                <ShoppingBag className="h-6 w-6 text-emerald-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">¡Nueva Orden!</h2>
                <p className="text-emerald-100 text-sm">Orden #{order.sequence}</p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="text-white hover:bg-white/20 rounded-full p-2 transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Monto destacado */}
          <div className="bg-white rounded-xl p-6 shadow-md border-2 border-emerald-200 text-center">
            <p className="text-sm text-gray-500 mb-1">Valor Total</p>
            <p className="text-4xl font-bold text-emerald-600">
              S/ {(order.totalValue / 100).toFixed(2)}
            </p>
          </div>

          {/* Grid de información */}
          <div className="grid grid-cols-2 gap-4">
            {/* Cliente */}
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
              <div className="flex items-center gap-2 mb-2">
                <User className="h-4 w-4 text-blue-600" />
                <span className="text-xs font-semibold text-gray-500 uppercase">Cliente</span>
              </div>
              <p className="text-sm font-medium text-gray-900">{order.clientName}</p>
            </div>

            {/* Método de pago */}
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
              <div className="flex items-center gap-2 mb-2">
                <CreditCard className="h-4 w-4 text-purple-600" />
                <span className="text-xs font-semibold text-gray-500 uppercase">Pago</span>
              </div>
              <p className="text-sm font-medium text-gray-900">{order.paymentNames}</p>
            </div>

            {/* Items */}
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
              <div className="flex items-center gap-2 mb-2">
                <Package className="h-4 w-4 text-orange-600" />
                <span className="text-xs font-semibold text-gray-500 uppercase">Items</span>
              </div>
              <p className="text-sm font-medium text-gray-900">{order.totalItems} productos</p>
            </div>

            {/* Origen */}
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
              <div className="flex items-center gap-2 mb-2">
                <MapPin className="h-4 w-4 text-red-600" />
                <span className="text-xs font-semibold text-gray-500 uppercase">Origen</span>
              </div>
              <p className="text-sm font-medium text-gray-900">{order.origin}</p>
            </div>
          </div>

          {/* Estado y fecha */}
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-gray-400" />
                <span className="text-xs text-gray-500">
                  {new Date(order.creationDate).toLocaleString('es-PE', {
                    dateStyle: 'medium',
                    timeStyle: 'short'
                  })}
                </span>
              </div>
              <span className="px-3 py-1 bg-emerald-100 text-emerald-700 text-xs font-semibold rounded-full">
                {fixStatusDescription(order.statusDescription)}
              </span>
            </div>
          </div>

          {/* Botón de cerrar */}
          <button
            onClick={handleClose}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 rounded-xl transition-colors"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
}

import { useEffect, useState } from 'react';
import { X, ShoppingBag, CheckCircle, Bell, User, CreditCard, Package, MapPin, ChevronLeft, ChevronRight, Zap } from 'lucide-react';
import type { OrderListItem } from '../../../types/orders';

interface NewOrderNotificationProps {
  orders: OrderListItem[];
  onClose: () => void;
}

export function NewOrderNotification({ orders, onClose }: NewOrderNotificationProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isPulsing, setIsPulsing] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [autoAdvance, setAutoAdvance] = useState(true);

  const currentOrder = orders[currentIndex];
  const totalOrders = orders.length;
  const hasMultiple = totalOrders > 1;

  useEffect(() => {
    if (orders.length > 0) {
      setIsVisible(true);
      setIsPulsing(true);
      setCurrentIndex(0);
      setAutoAdvance(true);

      // Reproducir sonido de notificación
      playNotificationSound();

      // Detener la animación de pulso después de 2 segundos
      const pulseTimer = setTimeout(() => {
        setIsPulsing(false);
      }, 2000);

      return () => {
        clearTimeout(pulseTimer);
      };
    }
  }, [orders]);

  // Auto-avance a la siguiente orden
  useEffect(() => {
    if (!autoAdvance || !currentOrder) return;

    const timer = setTimeout(() => {
      if (currentIndex < totalOrders - 1) {
        // Ir a la siguiente orden
        handleNext();
      } else {
        // Última orden, cerrar después de 10 segundos
        handleClose();
      }
    }, 10000);

    return () => clearTimeout(timer);
  }, [currentIndex, totalOrders, autoAdvance, currentOrder]);

  const playNotificationSound = () => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = 800;
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);
    } catch (err) {
      console.log('No se pudo reproducir el sonido de notificación');
    }
  };

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 300);
  };

  const handleNext = () => {
    if (currentIndex < totalOrders - 1) {
      setCurrentIndex(prev => prev + 1);
      setIsPulsing(true);
      setTimeout(() => setIsPulsing(false), 2000);
      setAutoAdvance(true);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
      setIsPulsing(true);
      setTimeout(() => setIsPulsing(false), 2000);
      setAutoAdvance(false); // Desactivar auto-avance si navega manualmente
    }
  };

  const handleManualNavigation = () => {
    setAutoAdvance(false); // Desactivar auto-avance al interactuar
  };

  if (!currentOrder) return null;

  return (
    <>
      {/* Backdrop con blur */}
      <div
        className={`fixed inset-0 z-50 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${
          isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={handleClose}
      />

      {/* Modal centrado */}
      <div
        className={`fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none`}
      >
        <div
          className={`bg-gradient-to-br from-emerald-50 to-white rounded-2xl shadow-2xl w-full max-w-lg pointer-events-auto transform transition-all duration-300 ${
            isVisible ? 'scale-100 opacity-100 translate-y-0' : 'scale-95 opacity-0 translate-y-4'
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header con animación */}
          <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-t-2xl p-6 relative overflow-hidden">
            {/* Animación de fondo */}
            {isPulsing && (
              <div className="absolute inset-0 bg-white/10 animate-pulse" />
            )}
            
            <div className="relative flex items-center justify-between">
              <div className="flex items-center gap-4">
                {/* Icono con animación de pulso */}
                <div className="relative">
                  <div className={`w-14 h-14 bg-white rounded-full flex items-center justify-center ${
                    isPulsing ? 'animate-bounce' : ''
                  }`}>
                    <ShoppingBag className="h-7 w-7 text-emerald-600" />
                  </div>
                  {isPulsing && (
                    <>
                      <div className="absolute inset-0 bg-white rounded-full animate-ping opacity-75" />
                      <div className="absolute inset-0 bg-white rounded-full animate-pulse opacity-50" />
                    </>
                  )}
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-2xl font-bold text-white">
                      {hasMultiple ? '¡Nuevas Órdenes!' : '¡Nueva Orden!'}
                    </h2>
                    <Bell className={`h-5 w-5 text-white ${isPulsing ? 'animate-swing' : ''}`} />
                    {currentOrder.isCyberOrder && (
                      <span className="bg-purple-500 text-white text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                        <Zap className="h-3 w-3" />
                        CYBER
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <p className="text-emerald-100 text-sm">Orden #{currentOrder.sequence}</p>
                    {hasMultiple && (
                      <span className="bg-white/20 text-white text-xs font-semibold px-2 py-0.5 rounded-full">
                        {currentIndex + 1} de {totalOrders}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <button
                onClick={handleClose}
                className="text-white hover:bg-white/20 rounded-full p-2 transition-colors"
                aria-label="Cerrar notificación"
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
                S/ {(currentOrder.totalValue / 100).toFixed(2)}
              </p>
              {currentOrder.isCyberOrder && currentOrder.discountValue && currentOrder.discountValue > 0 && (
                <div className="mt-2 pt-2 border-t border-gray-200">
                  <p className="text-xs text-purple-600 font-semibold flex items-center justify-center gap-1">
                    <Zap className="h-3 w-3" />
                    Descuento Cyber: S/ {(currentOrder.discountValue / 100).toFixed(2)}
                  </p>
                  {currentOrder.promotionName && (
                    <p className="text-[10px] text-gray-400 mt-1">{currentOrder.promotionName}</p>
                  )}
                </div>
              )}
            </div>

            {/* Grid de información */}
            <div className="grid grid-cols-2 gap-3">
              {/* Cliente */}
              <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                <div className="flex items-center gap-2 mb-2">
                  <User className="h-4 w-4 text-blue-600" />
                  <span className="text-xs font-semibold text-gray-500 uppercase">Cliente</span>
                </div>
                <p className="text-sm font-medium text-gray-900 truncate" title={currentOrder.clientName}>
                  {currentOrder.clientName}
                </p>
              </div>

              {/* Método de pago */}
              <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                <div className="flex items-center gap-2 mb-2">
                  <CreditCard className="h-4 w-4 text-purple-600" />
                  <span className="text-xs font-semibold text-gray-500 uppercase">Pago</span>
                </div>
                <p className="text-sm font-medium text-gray-900 truncate" title={currentOrder.paymentNames}>
                  {currentOrder.paymentNames}
                </p>
              </div>

              {/* Items */}
              <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                <div className="flex items-center gap-2 mb-2">
                  <Package className="h-4 w-4 text-orange-600" />
                  <span className="text-xs font-semibold text-gray-500 uppercase">Items</span>
                </div>
                <p className="text-sm font-medium text-gray-900">{currentOrder.totalItems} productos</p>
              </div>

              {/* Origen */}
              <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                <div className="flex items-center gap-2 mb-2">
                  <MapPin className="h-4 w-4 text-red-600" />
                  <span className="text-xs font-semibold text-gray-500 uppercase">Origen</span>
                </div>
                <p className="text-sm font-medium text-gray-900">{currentOrder.origin}</p>
              </div>
            </div>

            {/* Estado y fecha */}
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-emerald-600" />
                  <span className="text-xs text-gray-500">
                    {new Date(currentOrder.creationDate).toLocaleString('es-PE', {
                      dateStyle: 'medium',
                      timeStyle: 'short'
                    })}
                  </span>
                </div>
                <span className="px-3 py-1 bg-emerald-100 text-emerald-700 text-xs font-semibold rounded-full">
                  {currentOrder.statusDescription}
                </span>
              </div>
            </div>

            {/* Navegación entre órdenes (si hay múltiples) */}
            {hasMultiple && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    handlePrevious();
                    handleManualNavigation();
                  }}
                  disabled={currentIndex === 0}
                  className="flex-1 flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 disabled:bg-gray-50 disabled:text-gray-300 text-gray-700 font-semibold py-2 rounded-lg transition-colors"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Anterior
                </button>
                <button
                  onClick={() => {
                    handleNext();
                    handleManualNavigation();
                  }}
                  disabled={currentIndex === totalOrders - 1}
                  className="flex-1 flex items-center justify-center gap-2 bg-emerald-100 hover:bg-emerald-200 disabled:bg-gray-50 disabled:text-gray-300 text-emerald-700 font-semibold py-2 rounded-lg transition-colors"
                >
                  Siguiente
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            )}

            {/* Botón de cerrar */}
            <button
              onClick={handleClose}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 rounded-xl transition-colors shadow-lg hover:shadow-xl"
            >
              {hasMultiple ? 'Cerrar Todas' : 'Entendido'}
            </button>

            {/* Indicador de auto-cierre */}
            <div className="text-center">
              <p className="text-xs text-gray-400">
                {hasMultiple 
                  ? autoAdvance 
                    ? `Siguiente orden en 10 segundos (${currentIndex + 1}/${totalOrders})`
                    : `Navegación manual activada (${currentIndex + 1}/${totalOrders})`
                  : 'Se cerrará automáticamente en 10 segundos'
                }
              </p>
              {autoAdvance && (
                <div className="mt-2 h-1 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    key={currentIndex}
                    className="h-full bg-emerald-500 transition-all duration-[10000ms] ease-linear"
                    style={{ width: isVisible ? '0%' : '100%' }}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Estilos personalizados para la animación de swing */}
      <style>{`
        @keyframes swing {
          0%, 100% { transform: rotate(0deg); }
          10% { transform: rotate(14deg); }
          20% { transform: rotate(-8deg); }
          30% { transform: rotate(14deg); }
          40% { transform: rotate(-4deg); }
          50% { transform: rotate(10deg); }
          60% { transform: rotate(0deg); }
        }
        .animate-swing {
          animation: swing 1s ease-in-out infinite;
        }
      `}</style>
    </>
  );
}

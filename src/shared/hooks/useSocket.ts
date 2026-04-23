import { useEffect, useRef } from 'react';
import { socketService } from '../services/socketService';
import { 
  useOrdersStore, 
  useProductsStore, 
  useDeliveryStore,
  useUIStore 
} from '../store/store';
import type { OrderListItem } from '../../types/orders';

/**
 * Hook para manejar la conexión de Socket.io y sincronizar con los stores
 */
export function useSocket() {
  const previousOrderIdsRef = useRef<Set<string>>(new Set());
  const isFirstLoadRef = useRef(true);
  
  // Store setters
  const setOrders = useOrdersStore((state) => state.setOrders);
  const setLoading = useOrdersStore((state) => state.setLoading);
  const setError = useOrdersStore((state) => state.setError);
  const setLastUpdated = useOrdersStore((state) => state.setLastUpdated);
  const setConnected = useOrdersStore((state) => state.setConnected);
  
  const setTopProducts = useProductsStore((state) => state.setTopProducts);
  const setCategoryStats = useProductsStore((state) => state.setCategoryStats);
  const setCategoryList = useProductsStore((state) => state.setCategoryList);
  const setOrderCategoryMap = useProductsStore((state) => state.setOrderCategoryMap);
  const setProductsByOrder = useProductsStore((state) => state.setProductsByOrder);
  
  const setDeliveryStats = useDeliveryStore((state) => state.setDeliveryStats);
  const setLocationData = useDeliveryStore((state) => state.setLocationData);
  const setOrderDetailsMap = useDeliveryStore((state) => state.setOrderDetailsMap);
  
  const setNewOrder = useUIStore((state) => state.setNewOrder);
  const addNewOrders = useUIStore((state) => state.addNewOrders);

  useEffect(() => {
    socketService.connect();

    // Connection handlers
    socketService.onConnect(() => {
      setConnected(true);
      setError(null);
    });

    socketService.onDisconnect(() => {
      setConnected(false);
    });

    socketService.onError((err) => {
      setError(err.message);
      setLoading(false);
    });

    // Orders update handler
    socketService.onOrdersUpdate((data) => {
      try {
        const newOrders: OrderListItem[] = data.orders;
        
        // Detectar nuevas órdenes (solo después de la primera carga)
        if (!isFirstLoadRef.current && newOrders.length > 0) {
          const currentOrderIds = new Set(newOrders.map(o => o.orderId));
          
          // Encontrar órdenes que no existían antes
          const newOrdersList = newOrders.filter(
            order => !previousOrderIdsRef.current.has(order.orderId)
          );
          
          // Si hay nuevas órdenes, agregarlas a la cola
          if (newOrdersList.length > 0) {
            // Ordenar por fecha de creación (más reciente primero)
            const sortedNewOrders = newOrdersList.sort(
              (a, b) => new Date(b.creationDate).getTime() - new Date(a.creationDate).getTime()
            );
            
            console.log(`🆕 ${sortedNewOrders.length} nueva(s) orden(es) detectada(s):`, 
              sortedNewOrders.map(o => `#${o.sequence}`).join(', '));
            
            // Si solo hay una orden, usar setNewOrder
            // Si hay múltiples, la primera va a newOrder y el resto a la cola
            if (sortedNewOrders.length === 1) {
              setNewOrder(sortedNewOrders[0]);
            } else {
              setNewOrder(sortedNewOrders[0]);
              addNewOrders(sortedNewOrders.slice(1));
            }
          }
          
          // Actualizar el set de IDs previos
          previousOrderIdsRef.current = currentOrderIds;
        } else if (isFirstLoadRef.current) {
          // Primera carga: solo guardar los IDs sin mostrar popup
          previousOrderIdsRef.current = new Set(newOrders.map(o => o.orderId));
          isFirstLoadRef.current = false;
        }
        
        setOrders(newOrders);
        setLastUpdated(new Date(data.timestamp));
        setLoading(false);
        setError(null);
      } catch (err) {
        console.error('Error processing orders:update:', err);
        setError('Error al procesar órdenes');
      }
    });

    // Products update handler
    socketService.onProductsUpdate((data) => {
      try {
        setTopProducts(data.products || []);
        setCategoryStats(data.categoryStats || []);
        setCategoryList(data.categoryList || []);
        setOrderCategoryMap(data.orderCategoryMap || {});
        setProductsByOrder(data.productsByOrder || {});
        setLocationData(data.locationData || []);
        setDeliveryStats(data.deliveryStats || []);
        setOrderDetailsMap(data.orderDetailsMap || {});
      } catch (err) {
        console.error('Error processing products:update:', err);
      }
    });

    // Cleanup
    return () => {
      socketService.disconnect();
    };
  }, [
    setOrders,
    setLoading,
    setError,
    setLastUpdated,
    setConnected,
    setTopProducts,
    setCategoryStats,
    setCategoryList,
    setOrderCategoryMap,
    setProductsByOrder,
    setLocationData,
    setDeliveryStats,
    setOrderDetailsMap,
    setNewOrder,
    addNewOrders,
  ]);

  const refresh = () => {
    socketService.emitRefresh();
  };

  return { refresh };
}

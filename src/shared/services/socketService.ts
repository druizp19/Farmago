import { io, Socket } from 'socket.io-client';
import { API_CONFIG } from '../config/constants';
import type { OrderListItem, ProductAggregation, CategoryStat, DeliveryStat } from '../../types/orders';

export interface OrdersUpdatePayload {
  orders: OrderListItem[];
  timestamp: string;
  newOrdersCount?: number;
  updatedOrdersCount?: number;
}

export interface ProductsUpdatePayload {
  products: ProductAggregation[];
  categoryStats: CategoryStat[];
  categoryList: string[];
  orderCategoryMap: Record<string, string[]>;
  productsByOrder: Record<string, Array<{
    productId: string;
    name: string;
    category: string;
    quantity: number;
    price: number;
    totalValue: number;
  }>>;
  locationData: Array<{
    state: string;
    city: string;
    count: number;
    revenue: number;
    coordinates: [number, number] | null;
  }>;
  deliveryStats: DeliveryStat[];
  orderDetailsMap: Record<string, any>;
  timestamp: string;
}

class SocketService {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;

  connect(): Socket {
    if (this.socket?.connected) {
      return this.socket;
    }

    this.socket = io(API_CONFIG.SERVER_URL, {
      path: `${import.meta.env.BASE_URL}socket.io`,
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: API_CONFIG.SOCKET_RECONNECTION_DELAY,
      reconnectionAttempts: API_CONFIG.SOCKET_RECONNECTION_ATTEMPTS,
    });

    return this.socket;
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  onConnect(callback: () => void): void {
    this.socket?.on('connect', callback);
  }

  onDisconnect(callback: () => void): void {
    this.socket?.on('disconnect', callback);
  }

  onError(callback: (error: { message: string }) => void): void {
    this.socket?.on('error', callback);
    this.socket?.on('connect_error', (err) => {
      callback({ message: `Error de conexión: ${err.message}` });
    });
  }

  onOrdersUpdate(callback: (data: OrdersUpdatePayload) => void): void {
    this.socket?.on('orders:update', callback);
  }

  onProductsUpdate(callback: (data: ProductsUpdatePayload) => void): void {
    this.socket?.on('products:update', callback);
  }

  emitRefresh(): void {
    this.socket?.emit('orders:refresh');
  }

  getSocket(): Socket | null {
    return this.socket;
  }
}

// Singleton instance
export const socketService = new SocketService();

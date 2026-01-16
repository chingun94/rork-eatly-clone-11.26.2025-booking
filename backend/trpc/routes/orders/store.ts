import { Order, OrderStatus } from '@/types/delivery';

class OrderStore {
  private orders: Map<string, Order> = new Map();

  getAll(): Order[] {
    return Array.from(this.orders.values()).sort((a, b) => b.createdAt - a.createdAt);
  }

  getById(id: string): Order | undefined {
    return this.orders.get(id);
  }

  getByUserId(userId: string): Order[] {
    return this.getAll().filter((order) => order.userId === userId);
  }

  getByRestaurantId(restaurantId: string): Order[] {
    return this.getAll().filter((order) => order.restaurantId === restaurantId);
  }

  getByDriverId(driverId: string): Order[] {
    return this.getAll().filter((order) => order.driverId === driverId);
  }

  getActiveOrdersByRestaurant(restaurantId: string): Order[] {
    return this.getAll().filter(
      (order) =>
        order.restaurantId === restaurantId &&
        !['delivered', 'cancelled', 'rejected'].includes(order.status)
    );
  }

  create(order: Order): Order {
    this.orders.set(order.id, order);
    return order;
  }

  update(id: string, updates: Partial<Order>): Order | undefined {
    const order = this.orders.get(id);
    if (!order) return undefined;

    const updatedOrder = {
      ...order,
      ...updates,
      updatedAt: Date.now(),
    };

    this.orders.set(id, updatedOrder);
    return updatedOrder;
  }

  updateStatus(id: string, status: OrderStatus): Order | undefined {
    const order = this.orders.get(id);
    if (!order) return undefined;

    const now = Date.now();
    const updates: Partial<Order> = {
      status,
      updatedAt: now,
    };

    switch (status) {
      case 'confirmed':
        updates.confirmedAt = now;
        break;
      case 'preparing':
        updates.preparingAt = now;
        break;
      case 'ready':
        updates.readyAt = now;
        break;
      case 'picked_up':
        updates.pickedUpAt = now;
        break;
      case 'delivered':
        updates.deliveredAt = now;
        updates.actualDeliveryTime = now;
        break;
      case 'cancelled':
        updates.cancelledAt = now;
        break;
    }

    return this.update(id, updates);
  }

  delete(id: string): boolean {
    return this.orders.delete(id);
  }

  getTodayStats(restaurantId: string): {
    totalOrders: number;
    pendingOrders: number;
    activeOrders: number;
    completedToday: number;
    revenue: number;
  } {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayTimestamp = todayStart.getTime();

    const restaurantOrders = this.getByRestaurantId(restaurantId);
    const todayOrders = restaurantOrders.filter(
      (order) => order.createdAt >= todayTimestamp
    );

    return {
      totalOrders: restaurantOrders.length,
      pendingOrders: restaurantOrders.filter((o) => o.status === 'pending').length,
      activeOrders: restaurantOrders.filter(
        (o) => !['delivered', 'cancelled', 'rejected'].includes(o.status)
      ).length,
      completedToday: todayOrders.filter((o) => o.status === 'delivered').length,
      revenue: todayOrders
        .filter((o) => o.status === 'delivered')
        .reduce((sum, o) => sum + o.total, 0),
    };
  }
}

export const orderStore = new OrderStore();

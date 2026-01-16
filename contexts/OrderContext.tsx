import createContextHook from '@nkzw/create-context-hook';
import { useState } from 'react';
import { Order } from '@/types/delivery';

export const [OrderContext, useOrders] = createContextHook(() => {
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  return {
    selectedOrder,
    setSelectedOrder,
  };
});

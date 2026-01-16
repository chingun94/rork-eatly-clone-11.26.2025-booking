export type OrderStatus = 
  | 'pending'
  | 'confirmed'
  | 'preparing'
  | 'ready'
  | 'picked_up'
  | 'in_transit'
  | 'delivered'
  | 'cancelled'
  | 'rejected';

export type PaymentStatus = 'pending' | 'paid' | 'refunded' | 'failed';

export interface MenuItemCustomization {
  id: string;
  name: string;
  options: {
    id: string;
    name: string;
    price: number;
  }[];
  required: boolean;
  multiSelect: boolean;
}

export interface MenuItem {
  id: string;
  restaurantId: string;
  name: string;
  description: string;
  price: number;
  image?: string;
  category: string;
  available: boolean;
  preparationTime: number;
  customizations?: MenuItemCustomization[];
  tags?: string[];
  createdAt: number;
  updatedAt: number;
}

export interface CartItemCustomization {
  customizationId: string;
  customizationName: string;
  selectedOptions: {
    id: string;
    name: string;
    price: number;
  }[];
}

export interface CartItem {
  menuItem: MenuItem;
  quantity: number;
  specialInstructions?: string;
  customizations?: CartItemCustomization[];
  totalPrice: number;
}

export interface DeliveryAddress {
  id: string;
  userId: string;
  label: string;
  street: string;
  apartment?: string;
  city: string;
  state: string;
  zipCode: string;
  latitude: number;
  longitude: number;
  instructions?: string;
  isDefault: boolean;
}

export interface DeliveryLocation {
  latitude: number;
  longitude: number;
  timestamp: number;
}

export interface Driver {
  id: string;
  name: string;
  phone: string;
  photo?: string;
  vehicleType: string;
  vehicleNumber: string;
  rating: number;
  totalDeliveries: number;
  currentLocation?: DeliveryLocation;
  available: boolean;
}

export interface OrderItem {
  menuItemId: string;
  name: string;
  quantity: number;
  price: number;
  customizations?: CartItemCustomization[];
  specialInstructions?: string;
  subtotal: number;
}

export interface Order {
  id: string;
  orderNumber: string;
  userId: string;
  restaurantId: string;
  restaurantName: string;
  restaurantAddress: string;
  items: OrderItem[];
  subtotal: number;
  deliveryFee: number;
  tax: number;
  tip: number;
  total: number;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  deliveryAddress: DeliveryAddress;
  contactPhone: string;
  orderNotes?: string;
  estimatedPreparationTime: number;
  estimatedDeliveryTime: number;
  actualDeliveryTime?: number;
  driverId?: string;
  driver?: Driver;
  driverLocation?: DeliveryLocation;
  createdAt: number;
  updatedAt: number;
  confirmedAt?: number;
  preparingAt?: number;
  readyAt?: number;
  pickedUpAt?: number;
  deliveredAt?: number;
  cancelledAt?: number;
  rejectionReason?: string;
}

export interface OrderRating {
  orderId: string;
  userId: string;
  restaurantId: string;
  driverId?: string;
  foodRating: number;
  deliveryRating: number;
  comment?: string;
  createdAt: number;
}

export interface ChatMessage {
  id: string;
  orderId: string;
  senderId: string;
  senderType: 'customer' | 'driver' | 'restaurant';
  message: string;
  createdAt: number;
  read: boolean;
}

export interface RestaurantOrderStats {
  totalOrders: number;
  pendingOrders: number;
  activeOrders: number;
  completedToday: number;
  revenue: number;
  averagePreparationTime: number;
}

export interface DeliveryFeeCalculation {
  baseFee: number;
  distanceFee: number;
  surcharge: number;
  discount: number;
  total: number;
}

export interface OrderNotification {
  id: string;
  orderId: string;
  userId: string;
  type: 'order_placed' | 'order_confirmed' | 'preparing' | 'out_for_delivery' | 'delivered' | 'cancelled';
  title: string;
  message: string;
  read: boolean;
  createdAt: number;
}

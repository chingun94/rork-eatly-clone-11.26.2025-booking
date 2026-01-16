export interface TimeSlot {
  time: string;
  available: boolean;
  capacity: number;
  booked: number;
}

export type TableShape = 'square' | 'rectangle' | 'circle' | 'round';

export interface Table {
  id: string;
  name: string;
  capacity: number;
  shape: TableShape;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number;
  isActive: boolean;
}

export interface FloorPlanElement {
  id: string;
  type: 'wall' | 'entrance' | 'bar' | 'kitchen' | 'restroom' | 'decoration';
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number;
  label?: string;
}

export interface FloorPlan {
  id: string;
  restaurantId: string;
  name: string;
  width: number;
  height: number;
  tables: Table[];
  elements: FloorPlanElement[];
  createdAt: string;
  updatedAt: string;
}

export interface DayAvailability {
  date: string;
  isOpen: boolean;
  slots: TimeSlot[];
}

export type ManagementMode = 'guest-count' | 'table-based';

export interface SimpleTable {
  id: string;
  name: string;
  capacity: number;
  isActive: boolean;
}

export interface RestaurantAvailability {
  restaurantId: string;
  managementMode: ManagementMode;
  schedule: {
    [dayOfWeek: string]: {
      isOpen: boolean;
      slots: string[];
      capacityPerSlot: number;
    };
  };
  specialDates: {
    [date: string]: {
      isOpen: boolean;
      slots: string[];
      capacityPerSlot: number;
    };
  };
  defaultCapacityPerSlot: number;
  advanceBookingDays: number;
  tableTurningTime: number;
  tables?: SimpleTable[];
}

export type BookingStatus = 
  | 'pending' 
  | 'confirmed' 
  | 'seated' 
  | 'completed' 
  | 'cancelled' 
  | 'no-show';

export interface Booking {
  id: string;
  restaurantId: string;
  restaurantName: string;
  userId: string;
  userName: string;
  userEmail: string;
  userPhone: string;
  date: string;
  time: string;
  partySize: number;
  status: BookingStatus;
  specialRequests?: string;
  createdAt: string;
  updatedAt: string;
  confirmationCode?: string;
  tableNumber?: string;
  tableId?: string;
}

export interface CreateBookingInput {
  restaurantId: string;
  restaurantName: string;
  date: string;
  time: string;
  partySize: number;
  specialRequests?: string;
  userPhone: string;
}

export interface UpdateBookingInput {
  id: string;
  status?: BookingStatus;
  tableNumber?: string;
  tableId?: string;
  specialRequests?: string;
}

export interface BookingFilters {
  restaurantId?: string;
  userId?: string;
  date?: string;
  status?: BookingStatus[];
}

export interface RestaurantBookingStats {
  totalBookings: number;
  todayBookings: number;
  upcomingBookings: number;
  completedBookings: number;
  cancelledBookings: number;
  noShowRate: number;
  averagePartySize: number;
}

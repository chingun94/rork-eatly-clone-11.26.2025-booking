export type RestaurantStaffRole = 
  | 'owner'
  | 'general_manager' 
  | 'assistant_manager'
  | 'host'
  | 'event_manager';

export interface RestaurantStaffPermissions {
  canAccessFloorPlan: boolean;
  canEditFloorPlan: boolean;
  canAccessSettings: boolean;
  canAccessBilling: boolean;
  canAccessReports: boolean;
  canManageReservations: boolean;
  canSeatGuests: boolean;
  canManageWaitlist: boolean;
  canBlockTables: boolean;
  canViewNotes: boolean;
  canEditNotes: boolean;
  canManageAvailability: boolean;
  canManageStaff: boolean;
}

export const ROLE_PERMISSIONS: Record<RestaurantStaffRole, RestaurantStaffPermissions> = {
  owner: {
    canAccessFloorPlan: true,
    canEditFloorPlan: true,
    canAccessSettings: true,
    canAccessBilling: true,
    canAccessReports: true,
    canManageReservations: true,
    canSeatGuests: true,
    canManageWaitlist: true,
    canBlockTables: true,
    canViewNotes: true,
    canEditNotes: true,
    canManageAvailability: true,
    canManageStaff: true,
  },
  general_manager: {
    canAccessFloorPlan: true,
    canEditFloorPlan: true,
    canAccessSettings: true,
    canAccessBilling: false,
    canAccessReports: true,
    canManageReservations: true,
    canSeatGuests: true,
    canManageWaitlist: true,
    canBlockTables: true,
    canViewNotes: true,
    canEditNotes: true,
    canManageAvailability: true,
    canManageStaff: false,
  },
  assistant_manager: {
    canAccessFloorPlan: true,
    canEditFloorPlan: false,
    canAccessSettings: false,
    canAccessBilling: false,
    canAccessReports: true,
    canManageReservations: true,
    canSeatGuests: true,
    canManageWaitlist: true,
    canBlockTables: true,
    canViewNotes: true,
    canEditNotes: true,
    canManageAvailability: false,
    canManageStaff: false,
  },
  host: {
    canAccessFloorPlan: true,
    canEditFloorPlan: false,
    canAccessSettings: false,
    canAccessBilling: false,
    canAccessReports: false,
    canManageReservations: true,
    canSeatGuests: true,
    canManageWaitlist: true,
    canBlockTables: false,
    canViewNotes: true,
    canEditNotes: false,
    canManageAvailability: false,
    canManageStaff: false,
  },
  event_manager: {
    canAccessFloorPlan: true,
    canEditFloorPlan: false,
    canAccessSettings: false,
    canAccessBilling: false,
    canAccessReports: true,
    canManageReservations: true,
    canSeatGuests: true,
    canManageWaitlist: true,
    canBlockTables: true,
    canViewNotes: true,
    canEditNotes: true,
    canManageAvailability: false,
    canManageStaff: false,
  },
};

export const ROLE_DISPLAY_NAMES: Record<RestaurantStaffRole, string> = {
  owner: 'Owner',
  general_manager: 'General Manager',
  assistant_manager: 'Assistant Manager',
  host: 'Host / Hostess',
  event_manager: 'Event Manager',
};

export interface RestaurantStaff {
  id: string;
  restaurantId: string;
  restaurantName: string;
  email: string;
  name: string;
  role: RestaurantStaffRole;
  phone?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  lastLogin?: string;
  password?: string;
}

export interface CreateStaffInput {
  restaurantId: string;
  restaurantName: string;
  email: string;
  name: string;
  role: RestaurantStaffRole;
  phone?: string;
  password: string;
}

export interface UpdateStaffInput {
  id: string;
  email?: string;
  name?: string;
  role?: RestaurantStaffRole;
  phone?: string;
  isActive?: boolean;
  password?: string;
}

export interface StaffFilters {
  restaurantId?: string;
  role?: RestaurantStaffRole;
  isActive?: boolean;
}

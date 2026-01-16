export type RestaurantStaffRole = 
  | 'owner'
  | 'general_manager' 
  | 'assistant_manager'
  | 'host'
  | 'event_manager';

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

let staffMembers: RestaurantStaff[] = [];

export const staffStore = {
  getAll: (filters?: StaffFilters): RestaurantStaff[] => {
    let result = [...staffMembers];
    
    if (filters?.restaurantId) {
      result = result.filter(staff => staff.restaurantId === filters.restaurantId);
    }
    
    if (filters?.role) {
      result = result.filter(staff => staff.role === filters.role);
    }
    
    if (filters?.isActive !== undefined) {
      result = result.filter(staff => staff.isActive === filters.isActive);
    }
    
    return result.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  },

  getById: (id: string): RestaurantStaff | undefined => {
    return staffMembers.find(staff => staff.id === id);
  },

  getByEmail: (email: string): RestaurantStaff | undefined => {
    return staffMembers.find(staff => staff.email.toLowerCase() === email.toLowerCase());
  },

  getByRestaurant: (restaurantId: string): RestaurantStaff[] => {
    return staffMembers.filter(staff => staff.restaurantId === restaurantId);
  },

  create: (input: CreateStaffInput): RestaurantStaff => {
    const existing = staffMembers.find(
      staff => staff.email.toLowerCase() === input.email.toLowerCase()
    );
    
    if (existing) {
      throw new Error('Staff member with this email already exists');
    }

    const newStaff: RestaurantStaff = {
      id: `staff_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      restaurantId: input.restaurantId,
      restaurantName: input.restaurantName,
      email: input.email,
      name: input.name,
      role: input.role,
      phone: input.phone,
      password: input.password,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    staffMembers.push(newStaff);
    console.log('Staff created:', newStaff.id, newStaff.name, newStaff.role);
    return newStaff;
  },

  update: (input: UpdateStaffInput): RestaurantStaff => {
    const index = staffMembers.findIndex(staff => staff.id === input.id);
    
    if (index === -1) {
      throw new Error('Staff member not found');
    }

    if (input.email) {
      const existing = staffMembers.find(
        staff => staff.id !== input.id && 
        staff.email.toLowerCase() === input.email!.toLowerCase()
      );
      
      if (existing) {
        throw new Error('Another staff member with this email already exists');
      }
    }

    const updatedStaff: RestaurantStaff = {
      ...staffMembers[index],
      ...input,
      updatedAt: new Date().toISOString(),
    };

    staffMembers[index] = updatedStaff;
    console.log('Staff updated:', updatedStaff.id, updatedStaff.name);
    return updatedStaff;
  },

  delete: (id: string): void => {
    const index = staffMembers.findIndex(staff => staff.id === id);
    
    if (index === -1) {
      throw new Error('Staff member not found');
    }

    staffMembers.splice(index, 1);
    console.log('Staff deleted:', id);
  },

  authenticate: (email: string, password: string): RestaurantStaff | null => {
    const staff = staffMembers.find(
      s => s.email.toLowerCase() === email.toLowerCase() && 
      s.password === password &&
      s.isActive
    );

    if (staff) {
      const index = staffMembers.findIndex(s => s.id === staff.id);
      staffMembers[index] = {
        ...staff,
        lastLogin: new Date().toISOString(),
      };
      console.log('Staff authenticated:', staff.id, staff.name, staff.role);
      return staffMembers[index];
    }

    return null;
  },

  updateLastLogin: (id: string): void => {
    const index = staffMembers.findIndex(staff => staff.id === id);
    if (index !== -1) {
      staffMembers[index] = {
        ...staffMembers[index],
        lastLogin: new Date().toISOString(),
      };
    }
  },

  setAll: (staff: RestaurantStaff[]): void => {
    staffMembers = staff;
  },
};

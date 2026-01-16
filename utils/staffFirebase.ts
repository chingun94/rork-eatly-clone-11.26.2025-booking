import { collection, doc, setDoc, getDoc, getDocs, updateDoc, deleteDoc, query, where, orderBy } from 'firebase/firestore';
import { getDb } from '@/config/firebase';
import { RestaurantStaff, CreateStaffInput, UpdateStaffInput, StaffFilters } from '@/types/restaurant-staff';

const STAFF_COLLECTION = 'restaurant_staff';

export const staffFirebase = {
  async getAllStaff(filters?: StaffFilters): Promise<RestaurantStaff[]> {
    try {
      const db = getDb();
      if (!db) throw new Error('Firestore not initialized');
      
      let q = query(collection(db, STAFF_COLLECTION), orderBy('createdAt', 'desc'));

      if (filters?.restaurantId) {
        q = query(collection(db, STAFF_COLLECTION), where('restaurantId', '==', filters.restaurantId), orderBy('createdAt', 'desc'));
      }

      const snapshot = await getDocs(q);
      let results = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as RestaurantStaff));

      if (filters?.role) {
        results = results.filter(staff => staff.role === filters.role);
      }

      if (filters?.isActive !== undefined) {
        results = results.filter(staff => staff.isActive === filters.isActive);
      }

      return results;
    } catch (error) {
      console.error('[staffFirebase] Error getting staff:', error);
      return [];
    }
  },

  async getStaffById(id: string): Promise<RestaurantStaff | null> {
    try {
      const db = getDb();
      if (!db) throw new Error('Firestore not initialized');
      
      const docRef = doc(db, STAFF_COLLECTION, id);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as RestaurantStaff;
      }
      return null;
    } catch (error) {
      console.error('[staffFirebase] Error getting staff by id:', error);
      return null;
    }
  },

  async getStaffByEmail(email: string): Promise<RestaurantStaff | null> {
    try {
      const db = getDb();
      if (!db) throw new Error('Firestore not initialized');
      
      const q = query(collection(db, STAFF_COLLECTION), where('email', '==', email.toLowerCase()));
      const snapshot = await getDocs(q);
      
      if (!snapshot.empty) {
        const doc = snapshot.docs[0];
        return { id: doc.id, ...doc.data() } as RestaurantStaff;
      }
      return null;
    } catch (error) {
      console.error('[staffFirebase] Error getting staff by email:', error);
      return null;
    }
  },

  async createStaff(input: CreateStaffInput): Promise<RestaurantStaff> {
    try {
      const db = getDb();
      if (!db) throw new Error('Firestore not initialized');
      
      const existing = await staffFirebase.getStaffByEmail(input.email);
      if (existing) {
        throw new Error('Staff member with this email already exists');
      }

      const staffId = `staff_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const now = new Date().toISOString();

      const newStaff: RestaurantStaff = {
        id: staffId,
        restaurantId: input.restaurantId,
        restaurantName: input.restaurantName,
        email: input.email.toLowerCase(),
        name: input.name,
        role: input.role,
        phone: input.phone,
        password: input.password,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      };

      await setDoc(doc(db, STAFF_COLLECTION, staffId), newStaff);
      console.log('[staffFirebase] Staff created:', staffId);
      return newStaff;
    } catch (error) {
      console.error('[staffFirebase] Error creating staff:', error);
      throw error;
    }
  },

  async updateStaff(input: UpdateStaffInput): Promise<RestaurantStaff | null> {
    try {
      const db = getDb();
      if (!db) throw new Error('Firestore not initialized');
      
      const existing = await staffFirebase.getStaffById(input.id);
      if (!existing) {
        throw new Error('Staff member not found');
      }

      if (input.email) {
        const emailCheck = await staffFirebase.getStaffByEmail(input.email);
        if (emailCheck && emailCheck.id !== input.id) {
          throw new Error('Another staff member with this email already exists');
        }
      }

      const docRef = doc(db, STAFF_COLLECTION, input.id);
      const updatedData: Partial<RestaurantStaff> = {
        ...input,
        email: input.email ? input.email.toLowerCase() : undefined,
        updatedAt: new Date().toISOString(),
      };

      await updateDoc(docRef, updatedData);
      console.log('[staffFirebase] Staff updated:', input.id);
      
      const updated = await staffFirebase.getStaffById(input.id);
      return updated;
    } catch (error) {
      console.error('[staffFirebase] Error updating staff:', error);
      throw error;
    }
  },

  async deleteStaff(id: string): Promise<void> {
    try {
      const db = getDb();
      if (!db) throw new Error('Firestore not initialized');
      
      await deleteDoc(doc(db, STAFF_COLLECTION, id));
      console.log('[staffFirebase] Staff deleted:', id);
    } catch (error) {
      console.error('[staffFirebase] Error deleting staff:', error);
      throw error;
    }
  },

  async authenticate(email: string, password: string): Promise<RestaurantStaff | null> {
    try {
      const staff = await staffFirebase.getStaffByEmail(email);
      
      if (!staff) {
        throw new Error('Invalid email or password');
      }

      if (!staff.isActive) {
        throw new Error('This account is inactive');
      }

      if (staff.password !== password) {
        throw new Error('Invalid email or password');
      }

      await staffFirebase.updateLastLogin(staff.id);
      
      const updated = await staffFirebase.getStaffById(staff.id);
      console.log('[staffFirebase] Staff authenticated:', staff.id);
      return updated;
    } catch (error) {
      console.error('[staffFirebase] Error authenticating staff:', error);
      throw error;
    }
  },

  async updateLastLogin(id: string): Promise<void> {
    try {
      const db = getDb();
      if (!db) throw new Error('Firestore not initialized');
      
      const docRef = doc(db, STAFF_COLLECTION, id);
      await updateDoc(docRef, {
        lastLogin: new Date().toISOString(),
      });
    } catch (error) {
      console.error('[staffFirebase] Error updating last login:', error);
    }
  },
};

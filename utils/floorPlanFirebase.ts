import { collection, doc, setDoc, getDoc, getDocs, updateDoc, deleteDoc, query, where, orderBy } from 'firebase/firestore';
import { getDb } from '@/config/firebase';
import { FloorPlan } from '@/types/booking';

const FLOORPLANS_COLLECTION = 'floor_plans';

export const floorPlanFirebase = {
  async getAllFloorPlans(restaurantId: string): Promise<FloorPlan[]> {
    try {
      const db = getDb();
      if (!db) throw new Error('Firestore not initialized');
      
      const q = query(
        collection(db, FLOORPLANS_COLLECTION),
        where('restaurantId', '==', restaurantId),
        orderBy('createdAt', 'desc')
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FloorPlan));
    } catch (error) {
      console.error('[floorPlanFirebase] Error getting floor plans:', error);
      return [];
    }
  },

  async getFloorPlan(id: string): Promise<FloorPlan | null> {
    try {
      const db = getDb();
      if (!db) throw new Error('Firestore not initialized');
      
      const docRef = doc(db, FLOORPLANS_COLLECTION, id);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as FloorPlan;
      }
      return null;
    } catch (error) {
      console.error('[floorPlanFirebase] Error getting floor plan:', error);
      return null;
    }
  },

  async createFloorPlan(input: Omit<FloorPlan, 'id' | 'createdAt' | 'updatedAt'>): Promise<FloorPlan> {
    try {
      const db = getDb();
      if (!db) throw new Error('Firestore not initialized');
      
      const floorPlanId = `fp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const now = new Date().toISOString();

      const newFloorPlan: FloorPlan = {
        ...input,
        id: floorPlanId,
        createdAt: now,
        updatedAt: now,
      };

      await setDoc(doc(db, FLOORPLANS_COLLECTION, floorPlanId), newFloorPlan);
      console.log('[floorPlanFirebase] Floor plan created:', floorPlanId);
      return newFloorPlan;
    } catch (error) {
      console.error('[floorPlanFirebase] Error creating floor plan:', error);
      throw error;
    }
  },

  async updateFloorPlan(id: string, updates: Partial<Omit<FloorPlan, 'id' | 'restaurantId' | 'createdAt'>>): Promise<FloorPlan | null> {
    try {
      const db = getDb();
      if (!db) throw new Error('Firestore not initialized');
      
      const docRef = doc(db, FLOORPLANS_COLLECTION, id);
      const updatedData = {
        ...updates,
        updatedAt: new Date().toISOString(),
      };

      await updateDoc(docRef, updatedData);
      console.log('[floorPlanFirebase] Floor plan updated:', id);
      
      const updated = await this.getFloorPlan(id);
      return updated;
    } catch (error) {
      console.error('[floorPlanFirebase] Error updating floor plan:', error);
      throw error;
    }
  },

  async deleteFloorPlan(id: string): Promise<void> {
    try {
      const db = getDb();
      if (!db) throw new Error('Firestore not initialized');
      
      await deleteDoc(doc(db, FLOORPLANS_COLLECTION, id));
      console.log('[floorPlanFirebase] Floor plan deleted:', id);
    } catch (error) {
      console.error('[floorPlanFirebase] Error deleting floor plan:', error);
      throw error;
    }
  },
};

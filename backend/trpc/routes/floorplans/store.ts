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

export const floorPlansStore: { [key: string]: FloorPlan } = {};

export const getAllFloorPlans = (restaurantId: string): FloorPlan[] => {
  return Object.values(floorPlansStore).filter(
    (fp) => fp.restaurantId === restaurantId
  );
};

export const getFloorPlan = (id: string): FloorPlan | undefined => {
  return floorPlansStore[id];
};

export const createFloorPlan = (floorPlan: Omit<FloorPlan, 'id' | 'createdAt' | 'updatedAt'>): FloorPlan => {
  const id = `fp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const now = new Date().toISOString();
  
  const newFloorPlan: FloorPlan = {
    ...floorPlan,
    id,
    createdAt: now,
    updatedAt: now,
  };
  
  floorPlansStore[id] = newFloorPlan;
  return newFloorPlan;
};

export const updateFloorPlan = (
  id: string,
  updates: Partial<Omit<FloorPlan, 'id' | 'restaurantId' | 'createdAt'>>
): FloorPlan | null => {
  const floorPlan = floorPlansStore[id];
  if (!floorPlan) return null;

  const updated: FloorPlan = {
    ...floorPlan,
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  floorPlansStore[id] = updated;
  return updated;
};

export const deleteFloorPlan = (id: string): boolean => {
  if (!floorPlansStore[id]) return false;
  delete floorPlansStore[id];
  return true;
};

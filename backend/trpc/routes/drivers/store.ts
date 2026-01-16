import { Driver } from '@/types/delivery';

class DriverStore {
  private drivers: Map<string, Driver> = new Map();

  getAll(): Driver[] {
    return Array.from(this.drivers.values());
  }

  getById(id: string): Driver | undefined {
    return this.drivers.get(id);
  }

  getAvailable(): Driver[] {
    return this.getAll().filter((driver) => driver.available);
  }

  create(driver: Driver): Driver {
    this.drivers.set(driver.id, driver);
    return driver;
  }

  update(id: string, updates: Partial<Driver>): Driver | undefined {
    const driver = this.drivers.get(id);
    if (!driver) return undefined;

    const updatedDriver = {
      ...driver,
      ...updates,
    };

    this.drivers.set(id, updatedDriver);
    return updatedDriver;
  }

  updateLocation(
    id: string,
    latitude: number,
    longitude: number
  ): Driver | undefined {
    return this.update(id, {
      currentLocation: {
        latitude,
        longitude,
        timestamp: Date.now(),
      },
    });
  }

  delete(id: string): boolean {
    return this.drivers.delete(id);
  }
}

export const driverStore = new DriverStore();

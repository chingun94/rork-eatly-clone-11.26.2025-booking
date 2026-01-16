import { MenuItem } from '@/types/delivery';

class MenuStore {
  private items: Map<string, MenuItem> = new Map();

  getAll(): MenuItem[] {
    return Array.from(this.items.values()).sort((a, b) => a.name.localeCompare(b.name));
  }

  getById(id: string): MenuItem | undefined {
    return this.items.get(id);
  }

  getByRestaurantId(restaurantId: string): MenuItem[] {
    return this.getAll().filter((item) => item.restaurantId === restaurantId);
  }

  getAvailableByRestaurant(restaurantId: string): MenuItem[] {
    return this.getByRestaurantId(restaurantId).filter((item) => item.available);
  }

  getByCategory(restaurantId: string, category: string): MenuItem[] {
    return this.getByRestaurantId(restaurantId).filter(
      (item) => item.category === category
    );
  }

  getCategories(restaurantId: string): string[] {
    const items = this.getByRestaurantId(restaurantId);
    const categories = new Set(items.map((item) => item.category));
    return Array.from(categories).sort();
  }

  create(item: MenuItem): MenuItem {
    this.items.set(item.id, item);
    return item;
  }

  update(id: string, updates: Partial<MenuItem>): MenuItem | undefined {
    const item = this.items.get(id);
    if (!item) return undefined;

    const updatedItem = {
      ...item,
      ...updates,
      updatedAt: Date.now(),
    };

    this.items.set(id, updatedItem);
    return updatedItem;
  }

  delete(id: string): boolean {
    return this.items.delete(id);
  }

  toggleAvailability(id: string): MenuItem | undefined {
    const item = this.items.get(id);
    if (!item) return undefined;

    return this.update(id, { available: !item.available });
  }
}

export const menuStore = new MenuStore();

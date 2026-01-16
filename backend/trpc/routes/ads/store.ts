export type AdType = 'banner' | 'featured_listing' | 'category_spotlight' | 'popup';
export type AdStatus = 'pending' | 'active' | 'paused' | 'completed' | 'rejected';

export interface AdCampaign {
  id: string;
  restaurantId: string;
  restaurantName: string;
  type: AdType;
  status: AdStatus;
  startDate: string;
  endDate: string;
  budget: number;
  spent: number;
  impressions: number;
  clicks: number;
  conversions: number;
  createdAt: string;
  imageUrl?: string;
}

class AdStore {
  private ads: AdCampaign[] = [];
  private lastUpdate: number = 0;

  getAll(): AdCampaign[] {
    console.log('AdStore: Getting all ads. Count:', this.ads.length);
    return this.ads;
  }

  setAll(ads: AdCampaign[]): void {
    const now = Date.now();
    console.log('AdStore: Setting all ads. Incoming count:', ads.length, 'Current count:', this.ads.length);
    
    if (ads.length === 0 && this.ads.length === 0) {
      console.log('AdStore: Both incoming and current data are empty, nothing to do');
      return;
    }
    
    if (ads.length > 0) {
      if (ads[0]?.imageUrl) {
        console.log('AdStore: First ad imageUrl length:', ads[0].imageUrl.length);
        console.log('AdStore: First ad has base64:', ads[0].imageUrl.startsWith('data:image'));
      }
      
      console.log('AdStore: Merging incoming data with existing data');
      const mergedMap = new Map<string, AdCampaign>();
      
      this.ads.forEach(ad => mergedMap.set(ad.id, ad));
      
      ads.forEach(ad => {
        const existing = mergedMap.get(ad.id);
        if (existing) {
          const existingTime = new Date(existing.createdAt).getTime();
          const incomingTime = new Date(ad.createdAt).getTime();
          
          if (incomingTime >= existingTime) {
            console.log(`AdStore: Updating ad ${ad.id} (incoming is newer or same)`);
            if (ad.imageUrl) {
              console.log(`AdStore: Ad ${ad.id} imageUrl length:`, ad.imageUrl.length);
            }
            mergedMap.set(ad.id, ad);
          } else {
            console.log(`AdStore: Keeping existing ad ${ad.id} (existing is newer)`);
          }
        } else {
          console.log(`AdStore: Adding new ad ${ad.id}`);
          if (ad.imageUrl) {
            console.log(`AdStore: New ad ${ad.id} imageUrl length:`, ad.imageUrl.length);
          }
          mergedMap.set(ad.id, ad);
        }
      });
      
      this.ads = Array.from(mergedMap.values()).sort((a, b) => {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
      
      this.lastUpdate = now;
      console.log('AdStore: Merge complete. Final count:', this.ads.length);
    } else {
      console.log('AdStore: Empty sync request received, keeping existing backend data');
    }
  }

  add(ad: AdCampaign): void {
    this.ads = [ad, ...this.ads];
    this.lastUpdate = Date.now();
  }

  update(id: string, updates: Partial<AdCampaign>): void {
    this.ads = this.ads.map((ad) =>
      ad.id === id ? { ...ad, ...updates } : ad
    );
    this.lastUpdate = Date.now();
  }

  delete(id: string): void {
    this.ads = this.ads.filter((ad) => ad.id !== id);
    this.lastUpdate = Date.now();
  }
}

export const adStore = new AdStore();

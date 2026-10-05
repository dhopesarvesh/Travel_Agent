import { api } from './api';
import { Destination, Place, SavedPlace, WeatherForecast, AdminUser, AdminTrip } from '../types';

export const placesService = {
  async getDestinations(): Promise<Destination[]> {
    const res = await api.get<Destination[]>('/destinations');
    return res.data;
  },

  async getDestination(destinationId: number): Promise<Destination> {
    const res = await api.get<Destination>(`/destinations/${destinationId}`);
    return res.data;
  },

  async getPlaces(destination?: string, search?: string, category?: string): Promise<Place[]> {
    const params = new URLSearchParams();
    if (destination) params.append('destination', destination);
    if (search) params.append('q', search);
    if (category && category !== 'all') params.append('category', category);
    const res = await api.get<Place[]>(`/places?${params.toString()}`);
    return res.data;
  },

  async getPlace(placeId: number): Promise<Place> {
    const res = await api.get<Place>(`/places/${placeId}`);
    return res.data;
  },

  async getSavedPlaces(): Promise<SavedPlace[]> {
    const res = await api.get<SavedPlace[]>('/saved-places');
    return res.data;
  },

  async savePlace(placeId: number, notes: string = ''): Promise<SavedPlace> {
    const res = await api.post<SavedPlace>('/saved-places', {
      place_id: placeId,
      notes,
    });
    return res.data;
  },

  async unsavePlace(savedId: number): Promise<void> {
    await api.delete(`/saved-places/${savedId}`);
  },

  async getWeather(destination: string): Promise<WeatherForecast> {
    try {
      const res = await api.get<WeatherForecast>(`/weather?destination=${encodeURIComponent(destination)}`);
      return res.data;
    } catch {
      return { daily: [], source: 'fallback' };
    }
  },

  async getAdminDestinations(): Promise<Destination[]> {
    const res = await api.get<Destination[]>('/admin/destinations');
    return res.data;
  },

  async getAdminStats(): Promise<{ total_users: number; total_trips: number; total_destinations: number; total_places: number; total_expenses: number }> {
    const res = await api.get('/admin/stats');
    return res.data;
  },

  async getAdminUsers(): Promise<AdminUser[]> {
    const res = await api.get<AdminUser[]>('/admin/users');
    return res.data;
  },

  async toggleUserActive(userId: number): Promise<{ id: number; is_active: boolean }> {
    const res = await api.patch(`/admin/users/${userId}/toggle-active`);
    return res.data;
  },

  async getAdminTrips(): Promise<AdminTrip[]> {
    const res = await api.get<AdminTrip[]>('/admin/trips');
    return res.data;
  },

  async createDestination(data: { name: string; country?: string; description?: string; best_season?: string; average_daily_budget?: number }): Promise<Destination> {
    const res = await api.post<Destination>('/admin/destinations', data);
    return res.data;
  },

  async createPlace(data: { destination_id: number; name: string; category: string; description?: string; average_cost?: number; duration_minutes?: number; tags?: string; rating?: number }): Promise<Place> {
    const res = await api.post<Place>('/admin/places', data);
    return res.data;
  },

  async deletePlace(placeId: number): Promise<void> {
    await api.delete(`/admin/places/${placeId}`);
  },

  async deleteDestination(destinationId: number): Promise<void> {
    await api.delete(`/admin/destinations/${destinationId}`);
  },
};


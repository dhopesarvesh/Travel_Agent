import { api } from './api';
import {
  BudgetSummary,
  Expense,
  ExpenseCreateInput,
  ItineraryDay,
  ItineraryItem,
  Trip,
  TripCreateInput,
  TripSummary,
  TripUpdateInput,
} from '../types';

export const tripService = {
  async listTrips(): Promise<TripSummary[]> {
    const res = await api.get<TripSummary[]>('/trips');
    return res.data;
  },

  async getTrip(tripId: number): Promise<Trip> {
    const res = await api.get<Trip>(`/trips/${tripId}`);
    return res.data;
  },

  async createTrip(data: TripCreateInput): Promise<Trip> {
    const res = await api.post<Trip>('/trips', data);
    return res.data;
  },

  async updateTrip(tripId: number, data: TripUpdateInput): Promise<Trip> {
    const res = await api.put<Trip>(`/trips/${tripId}`, data);
    return res.data;
  },

  async deleteTrip(tripId: number): Promise<void> {
    await api.delete(`/trips/${tripId}`);
  },

  async duplicateTrip(tripId: number): Promise<Trip> {
    const res = await api.post<Trip>(`/trips/${tripId}/duplicate`);
    return res.data;
  },

  // Itinerary
  async getItinerary(tripId: number): Promise<ItineraryDay[]> {
    const res = await api.get<ItineraryDay[]>(`/trips/${tripId}/itinerary`);
    return res.data;
  },

  async addItineraryItem(
    tripId: number,
    dayNumber: number,
    item: {
      title: string;
      item_type: string;
      start_time: string;
      duration_minutes: number;
      estimated_cost: number;
      notes?: string;
      sort_order?: number;
      place_id?: number | null;
      latitude?: number | null;
      longitude?: number | null;
    }
  ): Promise<ItineraryItem> {
    const res = await api.post<ItineraryItem>(
      `/trips/${tripId}/itinerary/days/${dayNumber}/items`,
      item
    );
    return res.data;
  },

  async updateItineraryItem(
    itemId: number,
    data: Partial<ItineraryItem>
  ): Promise<ItineraryItem> {
    const res = await api.put<ItineraryItem>(`/itinerary/items/${itemId}`, data);
    return res.data;
  },

  async deleteItineraryItem(itemId: number): Promise<void> {
    await api.delete(`/itinerary/items/${itemId}`);
  },

  async reorderItems(dayId: number, itemIds: number[]): Promise<ItineraryItem[]> {
    const res = await api.put<ItineraryItem[]>(`/itinerary/days/${dayId}/reorder`, {
      item_ids: itemIds,
    });
    return res.data;
  },

  // Expenses & Budget
  async getExpenses(tripId: number): Promise<Expense[]> {
    const res = await api.get<Expense[]>(`/trips/${tripId}/expenses`);
    return res.data;
  },

  async addExpense(tripId: number, data: ExpenseCreateInput): Promise<Expense> {
    const res = await api.post<Expense>(`/trips/${tripId}/expenses`, data);
    return res.data;
  },

  async deleteExpense(expenseId: number): Promise<void> {
    await api.delete(`/expenses/${expenseId}`);
  },

  async getBudgetSummary(tripId: number): Promise<BudgetSummary> {
    const res = await api.get<BudgetSummary>(`/trips/${tripId}/budget`);
    return res.data;
  },
};

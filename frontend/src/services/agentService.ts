import { api } from './api';
import { AgentResponse, Trip } from '../types';

export const agentService = {
  async chat(message: string, tripId?: number): Promise<AgentResponse> {
    const res = await api.post<AgentResponse>('/agent/chat', {
      message,
      trip_id: tripId,
    });
    return res.data;
  },

  async planTrip(tripId: number, preferencesText?: string): Promise<AgentResponse> {
    const res = await api.post<AgentResponse>('/agent/plan-trip', {
      trip_id: tripId,
      preferences_text: preferencesText,
    });
    return res.data;
  },

  async optimizeTrip(tripId: number): Promise<AgentResponse> {
    const res = await api.post<AgentResponse>('/agent/optimize-trip', {
      trip_id: tripId,
    });
    return res.data;
  },

  async applyItinerary(tripId: number, proposedItinerary: any[]): Promise<Trip> {
    const res = await api.post<Trip>(
      `/agent/apply-itinerary/${tripId}`,
      proposedItinerary
    );
    return res.data;
  },
};

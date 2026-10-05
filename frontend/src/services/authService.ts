import { api } from './api';
import { TokenPair, User, UserPreference } from '../types';

export const authService = {
  async register(data: { email: string; full_name: string; password: string }): Promise<User> {
    const res = await api.post<User>('/auth/register', data);
    return res.data;
  },

  async login(data: { email: string; password: string }): Promise<TokenPair> {
    const res = await api.post<TokenPair>('/auth/login', data);
    return res.data;
  },

  async getMe(): Promise<User> {
    const res = await api.get<User>('/users/me');
    return res.data;
  },

  async getPreferences(): Promise<UserPreference> {
    const res = await api.get<UserPreference>('/users/me/preferences');
    return res.data;
  },

  async updatePreferences(data: Partial<UserPreference>): Promise<UserPreference> {
    const res = await api.put<UserPreference>('/users/me/preferences', data);
    return res.data;
  },
};

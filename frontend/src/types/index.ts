export interface UserPreference {
  favorite_activities: string;
  travel_style: string;
  budget_range: string;
  food_preferences: string;
  preferred_accommodation: string;
  preferred_transportation: string;
  preferred_destinations: string;
}

export interface User {
  id: number;
  email: string;
  full_name: string;
  role: 'USER' | 'ADMIN';
  is_active: boolean;
  created_at: string;
  preferences?: UserPreference;
}

export interface TokenPair {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export interface Traveler {
  id?: number;
  name: string;
  age?: number | null;
  notes?: string;
}

export interface ItineraryItem {
  id: number;
  title: string;
  item_type: 'activity' | 'restaurant' | 'hotel' | 'transport';
  start_time: string;
  duration_minutes: number;
  estimated_cost: number;
  notes: string;
  sort_order: number;
  place_id?: number | null;
  latitude?: number | null;
  longitude?: number | null;
}

export interface ItineraryDay {
  id: number;
  day_number: number;
  date?: string | null;
  theme: string;
  notes: string;
  items: ItineraryItem[];
}

export interface Trip {
  id: number;
  title: string;
  destination: string;
  start_date: string;
  end_date: string;
  travelers: number;
  budget: number;
  status: 'draft' | 'planned' | 'active' | 'completed';
  notes: string;
  created_at: string;
  updated_at: string;
  trip_travelers: Traveler[];
  itinerary_days: ItineraryDay[];
  expenses?: Expense[];
}

export interface TripSummary {
  id: number;
  title: string;
  destination: string;
  start_date: string;
  end_date: string;
  travelers: number;
  budget: number;
  status: string;
  created_at: string;
}

export interface TripCreateInput {
  title: string;
  destination: string;
  start_date: string;
  end_date: string;
  travelers: number;
  budget: number;
  notes?: string;
  trip_travelers?: { name: string; age?: number; notes?: string }[];
}

export interface TripUpdateInput {
  title?: string;
  destination?: string;
  start_date?: string;
  end_date?: string;
  travelers?: number;
  budget?: number;
  status?: string;
  notes?: string;
}

export interface Expense {
  id: number;
  category: 'accommodation' | 'food' | 'transport' | 'activities' | 'miscellaneous';
  title: string;
  amount: number;
  is_estimated: boolean;
  spent_on?: string | null;
  notes?: string;
  created_at: string;
}

export interface ExpenseCreateInput {
  category: 'accommodation' | 'food' | 'transport' | 'activities' | 'miscellaneous';
  title: string;
  amount: number;
  is_estimated?: boolean;
  spent_on?: string;
  notes?: string;
}

export interface CategoryBudget {
  estimated: number;
  actual: number;
}

export interface BudgetSummary {
  trip_budget: number;
  estimated_total: number;
  actual_total: number;
  remaining: number;
  by_category: Record<string, CategoryBudget>;
  is_over_budget: boolean;
}

export interface Place {
  id: number;
  destination_id: number;
  name: string;
  category: 'attraction' | 'restaurant' | 'hotel' | 'activity';
  description: string;
  latitude?: number;
  longitude?: number;
  average_cost: number;
  duration_minutes: number;
  tags: string;
  rating: number;
}

export interface Destination {
  id: number;
  name: string;
  country: string;
  description: string;
  latitude?: number;
  longitude?: number;
  best_season: string;
  average_daily_budget: number;
  places: Place[];
}

export interface SavedPlace {
  id: number;
  place_id: number;
  notes: string;
  place: Place;
}

export interface WeatherDay {
  date: string;
  weather_code: number;
  temp_max: number;
  temp_min: number;
  precipitation_mm: number;
  condition: string;
  is_rainy: boolean;
}

export interface WeatherForecast {
  daily: WeatherDay[];
  source: string;
  error?: string;
}

export interface AgentToolCall {
  name: string;
  arguments: Record<string, any>;
  result: any;
}

export interface OptimizationMetrics {
  distance_km: number;
  estimated_cost: number;
  activities_per_day: number;
}

export interface OptimizationData {
  before: OptimizationMetrics;
  after: OptimizationMetrics;
  summary?: string;
}

export interface AgentResponse {
  reply: string;
  tool_calls: AgentToolCall[];
  proposed_itinerary?: any[] | null;
  optimization?: OptimizationData | null;
  requires_approval: boolean;
}

export interface AdminUser {
  id: number;
  email: string;
  full_name: string;
  role: 'USER' | 'ADMIN';
  is_active: boolean;
  created_at: string;
  trip_count: number;
}

export interface AdminTrip {
  id: number;
  title: string;
  destination: string;
  start_date: string;
  end_date: string;
  travelers: number;
  budget: number;
  status: string;
  created_at: string;
  user_email: string;
  user_name: string;
  total_expenses: number;
}


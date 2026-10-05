import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { User as UserIcon, Heart, Compass, DollarSign, Utensils, Hotel, Car, Check, RefreshCw } from 'lucide-react';
import { authService } from '../services/authService';
import { useAuth } from '../context/AuthContext';
import { UserPreference } from '../types';

export const ProfilePage: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const queryClient = useQueryClient();

  const [savedSuccess, setSavedSuccess] = useState(false);
  const [favoriteActivities, setFavoriteActivities] = useState('');
  const [travelStyle, setTravelStyle] = useState('balanced');
  const [budgetRange, setBudgetRange] = useState('medium');
  const [foodPreferences, setFoodPreferences] = useState('');
  const [preferredAccommodation, setPreferredAccommodation] = useState('hotel');
  const [preferredTransportation, setPreferredTransportation] = useState('mixed');
  const [preferredDestinations, setPreferredDestinations] = useState('');

  const { data: preferences, isLoading } = useQuery({
    queryKey: ['preferences'],
    queryFn: () => authService.getPreferences(),
  });

  useEffect(() => {
    if (preferences) {
      setFavoriteActivities(preferences.favorite_activities || '');
      setTravelStyle(preferences.travel_style || 'balanced');
      setBudgetRange(preferences.budget_range || 'medium');
      setFoodPreferences(preferences.food_preferences || '');
      setPreferredAccommodation(preferences.preferred_accommodation || 'hotel');
      setPreferredTransportation(preferences.preferred_transportation || 'mixed');
      setPreferredDestinations(preferences.preferred_destinations || '');
    }
  }, [preferences]);

  const updateMutation = useMutation({
    mutationFn: (data: Partial<UserPreference>) => authService.updatePreferences(data),
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ['preferences'] });
      await refreshUser();
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate({
      favorite_activities: favoriteActivities,
      travel_style: travelStyle,
      budget_range: budgetRange,
      food_preferences: foodPreferences,
      preferred_accommodation: preferredAccommodation,
      preferred_transportation: preferredTransportation,
      preferred_destinations: preferredDestinations,
    });
  };

  const activityPills = ['beaches', 'nightlife', 'food', 'heritage', 'adventure', 'nature', 'shopping', 'relaxation', 'photography'];

  const toggleActivityPill = (pill: string) => {
    const current = favoriteActivities ? favoriteActivities.split(',').map((s) => s.trim().toLowerCase()) : [];
    let updated: string[];
    if (current.includes(pill)) {
      updated = current.filter((p) => p !== pill);
    } else {
      updated = [...current, pill];
    }
    setFavoriteActivities(updated.join(', '));
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-16">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          User Profile & AI Travel Preferences
        </h1>
        <p className="text-xs sm:text-sm text-slate-400">
          The AI Travel Agent uses these preferences as base guidelines to generate personalized itineraries, budget envelopes and activity schedules.
        </p>
      </div>

      {/* Profile Overview Card */}
      <div className="glass-card rounded-2xl p-6 border border-slate-800 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 to-cyan-400 p-0.5 shadow-lg shadow-indigo-600/20">
            <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center text-xl font-bold text-white">
              {user?.full_name?.charAt(0).toUpperCase() || 'U'}
            </div>
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">{user?.full_name}</h3>
            <p className="text-xs text-slate-400">{user?.email}</p>
            <span className="inline-block mt-1 text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-300 font-semibold border border-indigo-500/30">
              Role: {user?.role}
            </span>
          </div>
        </div>
      </div>

      {/* Preferences Form */}
      <form onSubmit={handleSubmit} className="glass-card rounded-3xl p-6 sm:p-8 border border-slate-800 space-y-6">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div>
            <h3 className="text-base font-bold text-white">Travel Personality Settings</h3>
            <p className="text-xs text-slate-400">Customized parameters for the Agentic planner</p>
          </div>
          {savedSuccess && (
            <span className="px-3 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-semibold flex items-center space-x-1">
              <Check className="w-3.5 h-3.5" />
              <span>Preferences Saved</span>
            </span>
          )}
        </div>

        {/* Favorite Activities Multi-Tags */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2 flex items-center space-x-1.5">
            <Heart className="w-3.5 h-3.5 text-rose-400" />
            <span>Favorite Activities & Themes</span>
          </label>

          <div className="flex flex-wrap gap-2 mb-3">
            {activityPills.map((pill) => {
              const active = favoriteActivities.toLowerCase().includes(pill);
              return (
                <button
                  key={pill}
                  type="button"
                  onClick={() => toggleActivityPill(pill)}
                  className={`px-3 py-1 rounded-xl text-xs font-medium transition-all ${
                    active
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                      : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  #{pill}
                </button>
              );
            })}
          </div>

          <input
            type="text"
            value={favoriteActivities}
            onChange={(e) => setFavoriteActivities(e.target.value)}
            placeholder="Comma-separated activities (e.g. beaches, nightlife, seafood, heritage)"
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-indigo-500"
          />
        </div>

        {/* Travel Style & Budget Tier */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5 flex items-center space-x-1.5">
              <Compass className="w-3.5 h-3.5 text-indigo-400" />
              <span>Travel Style</span>
            </label>
            <select
              value={travelStyle}
              onChange={(e) => setTravelStyle(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-indigo-500"
            >
              <option value="relaxed">Relaxed & Leisurely (Fewer stops/day)</option>
              <option value="balanced">Balanced Exploration (3–4 activities/day)</option>
              <option value="fast-paced">Fast-Paced & Intensive (Maximum highlights)</option>
              <option value="luxury">Luxury & Experiential</option>
              <option value="adventure">Adventure & Trekking</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5 flex items-center space-x-1.5">
              <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
              <span>Budget Tier Range</span>
            </label>
            <select
              value={budgetRange}
              onChange={(e) => setBudgetRange(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-indigo-500"
            >
              <option value="budget">Backpacker / Budget-conscious (Hostels, street food)</option>
              <option value="medium">Medium / Comfortable (3-4 star hotels, cafes)</option>
              <option value="luxury">High-End / Luxury (Resorts, fine dining)</option>
            </select>
          </div>
        </div>

        {/* Food & Accommodation Preferences */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5 flex items-center space-x-1.5">
              <Utensils className="w-3.5 h-3.5 text-amber-400" />
              <span>Food & Dining Preferences</span>
            </label>
            <input
              type="text"
              value={foodPreferences}
              onChange={(e) => setFoodPreferences(e.target.value)}
              placeholder="e.g. Seafood, vegetarian, beach shacks, thali"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5 flex items-center space-x-1.5">
              <Hotel className="w-3.5 h-3.5 text-cyan-400" />
              <span>Preferred Accommodation</span>
            </label>
            <select
              value={preferredAccommodation}
              onChange={(e) => setPreferredAccommodation(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-indigo-500"
            >
              <option value="hotel">Boutique Hotel</option>
              <option value="resort">Beachfront / Luxury Resort</option>
              <option value="hostel">Hostel / Dorm (e.g. Zostel)</option>
              <option value="homestay">Homestay / Villa</option>
            </select>
          </div>
        </div>

        {/* Transportation & Preferred Destinations */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5 flex items-center space-x-1.5">
              <Car className="w-3.5 h-3.5 text-emerald-400" />
              <span>Preferred Transportation</span>
            </label>
            <select
              value={preferredTransportation}
              onChange={(e) => setPreferredTransportation(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-indigo-500"
            >
              <option value="mixed">Mixed (Cab + Walking)</option>
              <option value="scooter">Rental Scooter / Bike</option>
              <option value="cab">Private Taxi / Cab</option>
              <option value="transit">Public Transit & Bus</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5 flex items-center space-x-1.5">
              <Compass className="w-3.5 h-3.5 text-indigo-400" />
              <span>Dream Destinations</span>
            </label>
            <input
              type="text"
              value={preferredDestinations}
              onChange={(e) => setPreferredDestinations(e.target.value)}
              placeholder="e.g. Goa, Manali, Jaipur, Kerala, Ladakh"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        {/* Submit Button */}
        <div className="pt-4 border-t border-slate-800 flex justify-end">
          <button
            type="submit"
            disabled={updateMutation.isPending}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-500 hover:opacity-95 text-white text-xs sm:text-sm font-semibold shadow-lg shadow-indigo-600/20 transition-all flex items-center space-x-2 disabled:opacity-50"
          >
            {updateMutation.isPending ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Check className="w-4 h-4" />
            )}
            <span>Save Preferences</span>
          </button>
        </div>
      </form>
    </div>
  );
};

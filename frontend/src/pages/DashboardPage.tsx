import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { 
  Sparkles, 
  MapPin, 
  Calendar, 
  DollarSign, 
  Plus, 
  ArrowRight, 
  Compass, 
  TrendingUp, 
  ShieldCheck, 
  Zap, 
  Bookmark,
  CheckCircle2
} from 'lucide-react';
import { tripService } from '../services/tripService';
import { placesService } from '../services/placesService';
import { useAuth } from '../context/AuthContext';
import { TripCard } from '../components/trip/TripCard';
import { TripFormModal } from '../components/trip/TripFormModal';

interface DashboardPageProps {
  onOpenAgent: (tripId?: number) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ onOpenAgent }) => {
  const { user } = useAuth();
  const [isNewTripModalOpen, setIsNewTripModalOpen] = useState(false);

  const { data: trips = [], refetch: refetchTrips } = useQuery({
    queryKey: ['trips'],
    queryFn: () => tripService.listTrips(),
  });

  const { data: destinations = [] } = useQuery({
    queryKey: ['destinations'],
    queryFn: () => placesService.getDestinations(),
  });

  const { data: savedPlaces = [] } = useQuery({
    queryKey: ['savedPlaces'],
    queryFn: () => placesService.getSavedPlaces(),
  });

  const activeOrPlannedTrips = trips.filter((t) => t.status === 'active' || t.status === 'planned');
  const totalBudgetPlanned = trips.reduce((sum, t) => sum + (t.budget || 0), 0);

  return (
    <div className="space-y-8 pb-12">
      {/* Hero Section */}
      <div className="relative rounded-3xl overflow-hidden glass-panel border border-slate-800 p-6 sm:p-10 bg-gradient-to-br from-indigo-950/40 via-slate-900 to-slate-950">
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Travel Agent with Multi-Step Tool Calling</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight">
            Plan, Optimize & Experience Your Next Adventure.
          </h1>

          <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-2xl">
            Synthesize smart day-by-day itineraries tailored to your budget and travel style. Our AI Agent checks live weather forecasts, calculates distances, and optimizes your schedule with one click.
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-3">
            <button
              onClick={() => setIsNewTripModalOpen(true)}
              className="flex items-center space-x-2 px-5 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-500 hover:opacity-95 text-white text-xs sm:text-sm font-bold shadow-lg shadow-indigo-600/25 hover:scale-[1.02] transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Create New Trip</span>
            </button>

            <button
              onClick={() => onOpenAgent()}
              className="flex items-center space-x-2 px-5 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs sm:text-sm font-semibold transition-colors"
            >
              <Sparkles className="w-4 h-4 text-indigo-400" />
              <span>Launch AI Assistant</span>
            </button>
          </div>
        </div>
      </div>

      {/* Stats Quick Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card rounded-2xl p-5 border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 font-medium block">Total Trips</span>
            <span className="text-2xl font-extrabold text-white mt-1 block">{trips.length}</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
            <Compass className="w-5 h-5" />
          </div>
        </div>

        <div className="glass-card rounded-2xl p-5 border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 font-medium block">Planned Trips</span>
            <span className="text-2xl font-extrabold text-emerald-400 mt-1 block">
              {activeOrPlannedTrips.length}
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="glass-card rounded-2xl p-5 border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 font-medium block">Saved Places</span>
            <span className="text-2xl font-extrabold text-cyan-400 mt-1 block">
              {savedPlaces.length}
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center">
            <Bookmark className="w-5 h-5" />
          </div>
        </div>

        <div className="glass-card rounded-2xl p-5 border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 font-medium block">Total Planned Budget</span>
            <span className="text-2xl font-extrabold text-white mt-1 block">
              ₹{totalBudgetPlanned.toLocaleString()}
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Recent Trips Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">Your Trips</h2>
            <p className="text-xs text-slate-400">Manage itineraries, budgets, and daily routes</p>
          </div>

          <Link
            to="/trips"
            className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center space-x-1"
          >
            <span>View All</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {trips.length === 0 ? (
          <div className="glass-card rounded-3xl p-10 text-center border border-slate-800">
            <Compass className="w-12 h-12 text-slate-500 mx-auto mb-3" />
            <h3 className="text-base font-bold text-white mb-1">No trips created yet</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto mb-4">
              Get started by creating your first trip and letting the AI agent plan an optimized itinerary.
            </p>
            <button
              onClick={() => setIsNewTripModalOpen(true)}
              className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/20"
            >
              <Plus className="w-4 h-4" />
              <span>Create Your First Trip</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {trips.slice(0, 3).map((t) => (
              <TripCard
                key={t.id}
                trip={t}
                onDuplicate={async (id) => {
                  await tripService.duplicateTrip(id);
                  refetchTrips();
                }}
                onDelete={async (id) => {
                  await tripService.deleteTrip(id);
                  refetchTrips();
                }}
                onOpenAgent={(id) => onOpenAgent(id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Featured Destinations */}
      <div className="space-y-4 pt-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">Popular Destinations</h2>
            <p className="text-xs text-slate-400">Explore curated hotspots with pre-calculated attractions</p>
          </div>

          <Link
            to="/explore"
            className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center space-x-1"
          >
            <span>Explore All</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {destinations.map((dest) => (
            <div
              key={dest.id}
              className="glass-card rounded-2xl p-5 border border-slate-800 flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-indigo-400 uppercase tracking-wider flex items-center space-x-1">
                    <MapPin className="w-3.5 h-3.5" />
                    <span>{dest.country}</span>
                  </span>
                  <span className="text-[11px] text-slate-400">
                    Best: {dest.best_season}
                  </span>
                </div>

                <h3 className="text-lg font-bold text-white group-hover:text-indigo-300 transition-colors mb-1.5">
                  {dest.name}
                </h3>
                <p className="text-xs text-slate-400 line-clamp-2 mb-3">
                  {dest.description}
                </p>

                <div className="flex items-center justify-between text-xs text-slate-300 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800 mb-3">
                  <span>Avg Daily Budget:</span>
                  <span className="font-bold text-emerald-400">₹{dest.average_daily_budget?.toLocaleString()}</span>
                </div>
              </div>

              <Link
                to={`/explore?destination=${dest.name}`}
                className="w-full py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-center text-xs font-semibold text-slate-200 border border-slate-800 transition-colors flex items-center justify-center space-x-1"
              >
                <span>View {dest.places?.length || 0} Places</span>
                <ArrowRight className="w-3.5 h-3.5 text-indigo-400" />
              </Link>
            </div>
          ))}
        </div>
      </div>

      {/* Modal */}
      <TripFormModal
        isOpen={isNewTripModalOpen}
        onClose={() => setIsNewTripModalOpen(false)}
        onSubmit={async (data) => {
          await tripService.createTrip(data);
          refetchTrips();
        }}
      />
    </div>
  );
};

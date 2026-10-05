import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Sparkles, 
  MapPin, 
  Calendar, 
  Users, 
  DollarSign, 
  Plus, 
  ArrowLeft, 
  Zap, 
  CheckCircle2, 
  TrendingDown, 
  CloudSun, 
  FileText, 
  Trash2, 
  Copy, 
  Edit3,
  RefreshCw,
  Clock,
  Compass
} from 'lucide-react';
import { tripService } from '../services/tripService';
import { placesService } from '../services/placesService';
import { agentService } from '../services/agentService';
import { DayTimeline } from '../components/itinerary/DayTimeline';
import { AddItemModal } from '../components/itinerary/AddItemModal';
import { BudgetTracker } from '../components/budget/BudgetTracker';
import { WeatherCard } from '../components/weather/WeatherCard';
import { TripFormModal } from '../components/trip/TripFormModal';
import { AgentResponse, Place, Trip } from '../types';

interface TripDetailPageProps {
  onOpenAgent: (tripId?: number) => void;
}

export const TripDetailPage: React.FC<TripDetailPageProps> = ({ onOpenAgent }) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const tripId = Number(id);

  const [activeTab, setActiveTab] = useState<'itinerary' | 'budget' | 'weather' | 'travelers'>('itinerary');
  const [selectedDayNumber, setSelectedDayNumber] = useState<number | null>(null);
  const [isAddItemModalOpen, setIsAddItemModalOpen] = useState(false);
  const [isEditTripModalOpen, setIsEditTripModalOpen] = useState(false);
  const [optimizationProposal, setOptimizationProposal] = useState<AgentResponse | null>(null);
  const [optimizing, setOptimizing] = useState(false);
  const [planning, setPlanning] = useState(false);
  const [applyingProposal, setApplyingProposal] = useState(false);

  // Fetch Trip Details
  const { data: trip, isLoading, error } = useQuery({
    queryKey: ['trip', tripId],
    queryFn: () => tripService.getTrip(tripId),
    enabled: !!tripId,
  });

  // Fetch Budget Summary
  const { data: budget } = useQuery({
    queryKey: ['budget', tripId],
    queryFn: () => tripService.getBudgetSummary(tripId),
    enabled: !!tripId,
  });

  // Fetch Destination Places for Autocomplete
  const { data: places = [] } = useQuery({
    queryKey: ['places', trip?.destination],
    queryFn: () => placesService.getPlaces(trip?.destination),
    enabled: !!trip?.destination,
  });

  // Fetch Weather Forecast
  const { data: weather } = useQuery({
    queryKey: ['weather', trip?.destination],
    queryFn: () => placesService.getWeather(trip!.destination),
    enabled: !!trip?.destination,
  });

  const handleOptimizeTrip = async () => {
    if (!tripId) return;
    setOptimizing(true);
    try {
      const res = await agentService.optimizeTrip(tripId);
      setOptimizationProposal(res);
    } catch (err) {
      console.error('Optimization failed', err);
    } finally {
      setOptimizing(false);
    }
  };

  const handlePlanWithAI = async () => {
    if (!tripId) return;
    setPlanning(true);
    try {
      const res = await agentService.planTrip(tripId, trip?.notes);
      setOptimizationProposal(res);
    } catch (err) {
      console.error('Planning failed', err);
    } finally {
      setPlanning(false);
    }
  };

  const handleApplyOptimization = async () => {
    if (!tripId || !optimizationProposal?.proposed_itinerary) return;
    setApplyingProposal(true);
    try {
      await agentService.applyItinerary(tripId, optimizationProposal.proposed_itinerary);
      setOptimizationProposal(null);
      queryClient.invalidateQueries({ queryKey: ['trip', tripId] });
      queryClient.invalidateQueries({ queryKey: ['budget', tripId] });
    } catch (err) {
      console.error('Failed to apply itinerary', err);
    } finally {
      setApplyingProposal(false);
    }
  };

  const handleAddItem = async (itemData: any) => {
    if (!selectedDayNumber) return;
    await tripService.addItineraryItem(tripId, selectedDayNumber, itemData);
    queryClient.invalidateQueries({ queryKey: ['trip', tripId] });
    queryClient.invalidateQueries({ queryKey: ['budget', tripId] });
  };

  const handleDeleteItem = async (itemId: number) => {
    await tripService.deleteItineraryItem(itemId);
    queryClient.invalidateQueries({ queryKey: ['trip', tripId] });
    queryClient.invalidateQueries({ queryKey: ['budget', tripId] });
  };

  const handleReorderItems = async (dayId: number, itemIds: number[]) => {
    await tripService.reorderItems(dayId, itemIds);
    queryClient.invalidateQueries({ queryKey: ['trip', tripId] });
  };

  if (isLoading) {
    return (
      <div className="p-12 text-center text-slate-400 text-sm">
        Loading trip details & synthesized itinerary...
      </div>
    );
  }

  if (error || !trip) {
    return (
      <div className="p-12 text-center">
        <h2 className="text-lg font-bold text-white mb-2">Trip not found</h2>
        <button
          onClick={() => navigate('/trips')}
          className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold"
        >
          Back to Trips
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-16">
      {/* Back & Breadcrumb Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/trips')}
          className="flex items-center space-x-1.5 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>All Trips</span>
        </button>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => onOpenAgent(trip.id)}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 text-xs font-semibold border border-indigo-500/30 transition-all"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>Chat With Agent</span>
          </button>

          <button
            onClick={() => setIsEditTripModalOpen(true)}
            className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition-colors"
            title="Edit trip details"
          >
            <Edit3 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Hero Trip Banner */}
      <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-slate-800 bg-gradient-to-r from-slate-900 via-slate-900/90 to-indigo-950/40 relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center space-x-1">
                <MapPin className="w-3.5 h-3.5" />
                <span>{trip.destination}</span>
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-800 text-slate-300 capitalize">
                {trip.status}
              </span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
              {trip.title}
            </h1>

            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-300">
              <div className="flex items-center space-x-1.5 bg-slate-950/60 px-3 py-1.5 rounded-xl border border-slate-800">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>{trip.start_date} → {trip.end_date}</span>
              </div>

              <div className="flex items-center space-x-1.5 bg-slate-950/60 px-3 py-1.5 rounded-xl border border-slate-800">
                <Users className="w-3.5 h-3.5 text-slate-400" />
                <span>{trip.travelers} {trip.travelers === 1 ? 'Traveler' : 'Travelers'}</span>
              </div>

              <div className="flex items-center space-x-1.5 bg-slate-950/60 px-3 py-1.5 rounded-xl border border-slate-800">
                <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                <span>Budget: ₹{trip.budget?.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Quick AI Action Cockpit Buttons */}
          <div className="flex flex-wrap lg:flex-col items-stretch sm:items-center gap-2.5 w-full lg:w-auto lg:flex-shrink-0">
            <button
              onClick={handleOptimizeTrip}
              disabled={optimizing}
              className="flex-1 lg:flex-none flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-500 hover:opacity-95 text-white text-xs font-bold shadow-lg shadow-indigo-600/25 transition-all hover:scale-[1.02] disabled:opacity-50"
            >
              {optimizing ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Zap className="w-4 h-4 text-cyan-200" />
              )}
              <span>✨ Optimize Trip</span>
            </button>

            <button
              onClick={handlePlanWithAI}
              disabled={planning}
              className="flex-1 lg:flex-none flex items-center justify-center space-x-1.5 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors disabled:opacity-50"
            >
              {planning ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-400" />
              ) : (
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              )}
              <span>Auto-Plan Days</span>
            </button>
          </div>
        </div>
      </div>

      {/* Optimization Proposal Banner */}
      {optimizationProposal && (
        <div className="p-5 rounded-2xl bg-gradient-to-r from-indigo-950/80 via-slate-900 to-slate-900 border border-indigo-500/40 space-y-3 shadow-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-5 h-5 text-indigo-400" />
              <h3 className="font-bold text-white text-sm">
                AI Optimization Proposal Ready
              </h3>
            </div>
            <button
              onClick={() => setOptimizationProposal(null)}
              className="text-xs text-slate-400 hover:text-white"
            >
              Dismiss
            </button>
          </div>

          <p className="text-xs text-slate-300 whitespace-pre-line leading-relaxed">
            {optimizationProposal.reply}
          </p>

          {/* Comparison Cards if available */}
          {optimizationProposal.optimization && (
            <div className="grid grid-cols-2 gap-3 max-w-md text-center py-1">
              <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs">
                <span className="text-[10px] text-slate-400 uppercase font-semibold block">Before</span>
                <div className="mt-1 space-y-0.5 text-slate-300">
                  <div>📍 {optimizationProposal.optimization.before.distance_km} km</div>
                  <div>💰 ₹{optimizationProposal.optimization.before.estimated_cost?.toLocaleString()}</div>
                  <div>⚡ {optimizationProposal.optimization.before.activities_per_day}/day</div>
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-indigo-950/40 border border-indigo-500/40 text-xs">
                <span className="text-[10px] text-indigo-400 uppercase font-semibold block">After (Optimized)</span>
                <div className="mt-1 space-y-0.5 text-emerald-400 font-bold">
                  <div>📍 {optimizationProposal.optimization.after.distance_km} km</div>
                  <div>💰 ₹{optimizationProposal.optimization.after.estimated_cost?.toLocaleString()}</div>
                  <div>⚡ {optimizationProposal.optimization.after.activities_per_day}/day</div>
                </div>
              </div>
            </div>
          )}

          <div className="pt-2 flex justify-end space-x-2">
            <button
              onClick={() => setOptimizationProposal(null)}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300"
            >
              Keep Current
            </button>
            <button
              onClick={handleApplyOptimization}
              disabled={applyingProposal}
              className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-sm flex items-center space-x-1.5 disabled:opacity-50"
            >
              {applyingProposal ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <CheckCircle2 className="w-3.5 h-3.5" />
              )}
              <span>Apply Changes</span>
            </button>
          </div>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-800 gap-4 sm:gap-8 overflow-x-auto">
        <button
          onClick={() => setActiveTab('itinerary')}
          className={`pb-3 text-xs sm:text-sm font-semibold transition-colors flex items-center space-x-1.5 border-b-2 whitespace-nowrap flex-shrink-0 ${
            activeTab === 'itinerary'
              ? 'text-indigo-400 border-indigo-500'
              : 'text-slate-400 hover:text-white border-transparent'
          }`}
        >
          <Compass className="w-4 h-4" />
          <span>Itinerary ({trip.itinerary_days?.length || 0} Days)</span>
        </button>

        <button
          onClick={() => setActiveTab('budget')}
          className={`pb-3 text-xs sm:text-sm font-semibold transition-colors flex items-center space-x-1.5 border-b-2 whitespace-nowrap flex-shrink-0 ${
            activeTab === 'budget'
              ? 'text-indigo-400 border-indigo-500'
              : 'text-slate-400 hover:text-white border-transparent'
          }`}
        >
          <DollarSign className="w-4 h-4" />
          <span>Budget & Expenses</span>
        </button>

        <button
          onClick={() => setActiveTab('weather')}
          className={`pb-3 text-xs sm:text-sm font-semibold transition-colors flex items-center space-x-1.5 border-b-2 whitespace-nowrap flex-shrink-0 ${
            activeTab === 'weather'
              ? 'text-indigo-400 border-indigo-500'
              : 'text-slate-400 hover:text-white border-transparent'
          }`}
        >
          <CloudSun className="w-4 h-4" />
          <span>Weather & Forecast</span>
        </button>

        <button
          onClick={() => setActiveTab('travelers')}
          className={`pb-3 text-xs sm:text-sm font-semibold transition-colors flex items-center space-x-1.5 border-b-2 whitespace-nowrap flex-shrink-0 ${
            activeTab === 'travelers'
              ? 'text-indigo-400 border-indigo-500'
              : 'text-slate-400 hover:text-white border-transparent'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Travelers & Notes</span>
        </button>
      </div>

      {/* Tab Contents */}
      {activeTab === 'itinerary' && (
        <div className="space-y-4">
          {trip.itinerary_days?.map((day) => (
            <DayTimeline
              key={day.id}
              day={day}
              onAddItem={(dayNum) => {
                setSelectedDayNumber(dayNum);
                setIsAddItemModalOpen(true);
              }}
              onDeleteItem={handleDeleteItem}
              onReorderItems={handleReorderItems}
            />
          ))}
        </div>
      )}

      {activeTab === 'budget' && budget && (
        <BudgetTracker
          budget={budget}
          expenses={trip.expenses || []}
          onAddExpense={async (data) => {
            await tripService.addExpense(tripId, data);
            queryClient.invalidateQueries({ queryKey: ['trip', tripId] });
            queryClient.invalidateQueries({ queryKey: ['budget', tripId] });
          }}
          onDeleteExpense={async (expId) => {
            await tripService.deleteExpense(expId);
            queryClient.invalidateQueries({ queryKey: ['trip', tripId] });
            queryClient.invalidateQueries({ queryKey: ['budget', tripId] });
          }}
          onAskAgentBudget={() => onOpenAgent(trip.id)}
        />
      )}

      {activeTab === 'weather' && (
        <WeatherCard
          destination={trip.destination}
          weather={weather || null}
          onAskIndoorActivities={() => onOpenAgent(trip.id)}
        />
      )}

      {activeTab === 'travelers' && (
        <div className="glass-card rounded-2xl p-6 border border-slate-800 space-y-6">
          <div>
            <h3 className="text-base font-bold text-white mb-3">Travel Companion Roster</h3>
            {trip.trip_travelers && trip.trip_travelers.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {trip.trip_travelers.map((t, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center space-x-3"
                  >
                    <div className="w-8 h-8 rounded-full bg-indigo-600/20 text-indigo-400 font-bold flex items-center justify-center text-xs">
                      {t.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white">{t.name}</h4>
                      <p className="text-[11px] text-slate-400">
                        {t.age ? `Age: ${t.age}` : 'Companion'} {t.notes && `· ${t.notes}`}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400">No companion travelers registered for this trip.</p>
            )}
          </div>

          <div>
            <h3 className="text-base font-bold text-white mb-2">Trip Notes & Highlights</h3>
            <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 text-xs text-slate-300 leading-relaxed">
              {trip.notes || 'No specific trip notes added yet.'}
            </div>
          </div>
        </div>
      )}

      {/* Add Item Modal */}
      <AddItemModal
        isOpen={isAddItemModalOpen}
        dayNumber={selectedDayNumber || 1}
        onClose={() => setIsAddItemModalOpen(false)}
        onSubmit={handleAddItem}
        suggestedPlaces={places}
      />

      {/* Edit Trip Modal */}
      <TripFormModal
        isOpen={isEditTripModalOpen}
        initialTrip={trip}
        onClose={() => setIsEditTripModalOpen(false)}
        onSubmit={async (data) => {
          await tripService.updateTrip(tripId, data);
          queryClient.invalidateQueries({ queryKey: ['trip', tripId] });
        }}
      />
    </div>
  );
};

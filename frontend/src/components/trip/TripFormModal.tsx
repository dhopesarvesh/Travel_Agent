import React, { useState, useEffect } from 'react';
import { X, MapPin, Calendar, Users, DollarSign, Plus, Trash2, Sparkles } from 'lucide-react';
import { Trip, TripCreateInput } from '../../types';

interface TripFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: TripCreateInput) => Promise<void>;
  initialTrip?: Trip | null;
  destinations?: string[];
}

export const TripFormModal: React.FC<TripFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialTrip,
  destinations = ['Goa', 'Manali', 'Jaipur', 'Kerala', 'Varanasi'],
}) => {
  const [title, setTitle] = useState('');
  const [destination, setDestination] = useState('Goa');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [travelersCount, setTravelersCount] = useState(1);
  const [budget, setBudget] = useState(25000);
  const [notes, setNotes] = useState('');
  const [travelerList, setTravelerList] = useState<{ name: string; age?: number; notes?: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (initialTrip) {
      setTitle(initialTrip.title);
      setDestination(initialTrip.destination);
      setStartDate(initialTrip.start_date);
      setEndDate(initialTrip.end_date);
      setTravelersCount(initialTrip.travelers);
      setBudget(initialTrip.budget);
      setNotes(initialTrip.notes || '');
      setTravelerList(
        initialTrip.trip_travelers.map((t) => ({
          name: t.name,
          age: t.age || undefined,
          notes: t.notes || '',
        }))
      );
    } else {
      // Defaults for smooth quick creation
      const today = new Date();
      const nextWeek = new Date(today);
      nextWeek.setDate(today.getDate() + 7);
      const afterFourDays = new Date(nextWeek);
      afterFourDays.setDate(nextWeek.getDate() + 4);

      setTitle('Goa Beach & Nightlife Escape');
      setDestination('Goa');
      setStartDate(nextWeek.toISOString().split('T')[0]);
      setEndDate(afterFourDays.toISOString().split('T')[0]);
      setTravelersCount(2);
      setBudget(25000);
      setNotes('Looking forward to coastal seafood, water sports, and relaxed sunsets.');
      setTravelerList([{ name: 'Alex', age: 28 }, { name: 'Sam', age: 27 }]);
    }
  }, [initialTrip, isOpen]);

  const addTraveler = () => {
    setTravelerList([...travelerList, { name: '', age: undefined }]);
  };

  const removeTraveler = (idx: number) => {
    setTravelerList(travelerList.filter((_, i) => i !== idx));
  };

  const updateTraveler = (idx: number, field: string, value: any) => {
    const updated = [...travelerList];
    updated[idx] = { ...updated[idx], [field]: value };
    setTravelerList(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!title.trim() || !destination.trim() || !startDate || !endDate) {
      setError('Please fill in all required fields.');
      return;
    }
    if (new Date(endDate) < new Date(startDate)) {
      setError('End date cannot be before start date.');
      return;
    }

    setLoading(true);
    try {
      await onSubmit({
        title,
        destination,
        start_date: startDate,
        end_date: endDate,
        travelers: travelersCount,
        budget: Number(budget),
        notes,
        trip_travelers: travelerList.filter((t) => t.name.trim().length > 0),
      });
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Failed to save trip. Please verify inputs.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">
                {initialTrip ? 'Edit Trip Details' : 'Create New Trip'}
              </h2>
              <p className="text-xs text-slate-400">
                Setup destination, dates, budget and companion travelers
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1">
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300">
              {error}
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Trip Title *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. 4-Day Goa Beach & Nightlife Retreat"
              className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Destination & Budget */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center space-x-1">
                <MapPin className="w-3.5 h-3.5 text-indigo-400" />
                <span>Destination *</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  list="destinations-list"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  placeholder="e.g. Goa, Manali, Jaipur"
                  className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
                <datalist id="destinations-list">
                  {destinations.map((d) => (
                    <option key={d} value={d} />
                  ))}
                </datalist>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center space-x-1">
                <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                <span>Total Budget (₹) *</span>
              </label>
              <input
                type="number"
                min="0"
                step="500"
                required
                value={budget}
                onChange={(e) => setBudget(Number(e.target.value))}
                placeholder="25000"
                className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Dates & Travelers Count */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center space-x-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>Start Date *</span>
              </label>
              <input
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center space-x-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>End Date *</span>
              </label>
              <input
                type="date"
                required
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center space-x-1">
                <Users className="w-3.5 h-3.5 text-slate-400" />
                <span>Travelers</span>
              </label>
              <input
                type="number"
                min="1"
                max="50"
                value={travelersCount}
                onChange={(e) => setTravelersCount(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Multiple Travelers Details */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Companion Travelers (Optional)
              </label>
              <button
                type="button"
                onClick={addTraveler}
                className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center space-x-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Person</span>
              </button>
            </div>

            {travelerList.length > 0 ? (
              <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                {travelerList.map((t, idx) => (
                  <div key={idx} className="flex flex-col sm:flex-row sm:items-center gap-2">
                    <input
                      type="text"
                      placeholder="Traveler name"
                      value={t.name}
                      onChange={(e) => updateTraveler(idx, 'name', e.target.value)}
                      className="w-full sm:flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                    />
                    <input
                      type="number"
                      placeholder="Age"
                      value={t.age ?? ''}
                      onChange={(e) => updateTraveler(idx, 'age', e.target.value ? Number(e.target.value) : undefined)}
                      className="w-full sm:w-20 bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                    />
                    <button
                      type="button"
                      onClick={() => removeTraveler(idx)}
                      className="p-1.5 text-slate-400 hover:text-rose-400"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic">No companions added yet.</p>
            )}
          </div>

          {/* Notes & Preferences */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Trip Preferences & Notes
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Prefer beach shacks, sunset views, relaxed pace, avoid heavy rush."
              className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Footer Submit */}
          <div className="pt-4 border-t border-slate-800 flex flex-wrap justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-500 hover:opacity-95 text-xs font-semibold text-white shadow-md shadow-indigo-600/20 transition-all flex items-center space-x-1.5 disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4" />
              <span>{loading ? 'Creating...' : initialTrip ? 'Save Changes' : 'Create & Generate Itinerary'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

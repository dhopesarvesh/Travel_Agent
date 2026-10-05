import React, { useState } from 'react';
import { X, Plus, Clock, DollarSign, MapPin, Sparkles } from 'lucide-react';
import { Place } from '../../types';

interface AddItemModalProps {
  isOpen: boolean;
  dayNumber: number;
  onClose: () => void;
  onSubmit: (item: {
    title: string;
    item_type: string;
    start_time: string;
    duration_minutes: number;
    estimated_cost: number;
    notes?: string;
    place_id?: number | null;
    latitude?: number | null;
    longitude?: number | null;
  }) => Promise<void>;
  suggestedPlaces?: Place[];
}

export const AddItemModal: React.FC<AddItemModalProps> = ({
  isOpen,
  dayNumber,
  onClose,
  onSubmit,
  suggestedPlaces = [],
}) => {
  const [title, setTitle] = useState('');
  const [itemType, setItemType] = useState('activity');
  const [startTime, setStartTime] = useState('10:00');
  const [durationMinutes, setDurationMinutes] = useState(90);
  const [estimatedCost, setEstimatedCost] = useState(500);
  const [notes, setNotes] = useState('');
  const [selectedPlaceId, setSelectedPlaceId] = useState<number | null>(null);
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSelectPlace = (place: Place) => {
    setTitle(place.name);
    setItemType(place.category === 'restaurant' ? 'restaurant' : place.category === 'hotel' ? 'hotel' : 'activity');
    setEstimatedCost(place.average_cost);
    setDurationMinutes(place.duration_minutes || 90);
    setNotes(place.description);
    setSelectedPlaceId(place.id);
    setLatitude(place.latitude || null);
    setLongitude(place.longitude || null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setLoading(true);
    try {
      await onSubmit({
        title,
        item_type: itemType,
        start_time: startTime,
        duration_minutes: Number(durationMinutes),
        estimated_cost: Number(estimatedCost),
        notes,
        place_id: selectedPlaceId,
        latitude,
        longitude,
      });
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-600/20 text-indigo-400 flex items-center justify-center">
              <Plus className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">Add Itinerary Item</h3>
              <p className="text-xs text-slate-400">Scheduling for Day {dayNumber}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Place Autocomplete Suggestions */}
        {suggestedPlaces.length > 0 && (
          <div className="p-4 bg-slate-950/40 border-b border-slate-800">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-2">
              Quick Add From Known Places:
            </span>
            <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
              {suggestedPlaces.slice(0, 8).map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handleSelectPlace(p)}
                  className="px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-indigo-600/20 hover:border-indigo-500/40 text-xs text-slate-200 border border-slate-700/60 transition-colors flex items-center space-x-1"
                >
                  <span>{p.name}</span>
                  <span className="text-[10px] text-emerald-400">₹{p.average_cost}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 overflow-y-auto">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
              Title / Place Name *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Sunset Boat Cruise at Palolem"
              className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Item Type
              </label>
              <select
                value={itemType}
                onChange={(e) => setItemType(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="activity">Attraction / Activity</option>
                <option value="restaurant">Restaurant / Dining</option>
                <option value="hotel">Accommodation / Hotel</option>
                <option value="transport">Transit / Travel</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Start Time
              </label>
              <input
                type="text"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                placeholder="10:00"
                className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Duration (Minutes)
              </label>
              <input
                type="number"
                min="10"
                step="15"
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Estimated Cost (₹)
              </label>
              <input
                type="number"
                min="0"
                step="50"
                value={estimatedCost}
                onChange={(e) => setEstimatedCost(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
              Notes & Highlights
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="What to see, ticket details, reservation notes..."
              className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

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
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white shadow-md shadow-indigo-600/20 transition-all disabled:opacity-50"
            >
              {loading ? 'Adding...' : 'Add Activity'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

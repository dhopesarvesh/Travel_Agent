import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, MapPin, Filter, Sparkles, Bookmark } from 'lucide-react';
import { placesService } from '../services/placesService';
import { PlaceCard } from '../components/places/PlaceCard';
import { Place } from '../types';

export const ExplorePage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialDest = searchParams.get('destination') || '';

  const [selectedDestination, setSelectedDestination] = useState(initialDest);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const queryClient = useQueryClient();

  const { data: destinations = [] } = useQuery({
    queryKey: ['destinations'],
    queryFn: () => placesService.getDestinations(),
  });

  const { data: places = [], isLoading } = useQuery({
    queryKey: ['places', selectedDestination, searchTerm],
    queryFn: () => placesService.getPlaces(selectedDestination || undefined, searchTerm || undefined),
  });

  const { data: savedPlaces = [] } = useQuery({
    queryKey: ['savedPlaces'],
    queryFn: () => placesService.getSavedPlaces(),
  });

  const savedPlaceIds = new Set(savedPlaces.map((s) => s.place_id));

  const handleToggleSave = async (placeId: number) => {
    if (savedPlaceIds.has(placeId)) {
      const match = savedPlaces.find((s) => s.place_id === placeId);
      if (match) {
        await placesService.unsavePlace(match.id);
      }
    } else {
      await placesService.savePlace(placeId);
    }
    queryClient.invalidateQueries({ queryKey: ['savedPlaces'] });
  };

  const filteredPlaces = places.filter((p) => {
    if (selectedCategory !== 'all' && p.category !== selectedCategory) return false;
    return true;
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Explore Destinations & Attractions
        </h1>
        <p className="text-xs sm:text-sm text-slate-400">
          Discover handpicked spots across Goa, Manali, Jaipur, and more. Bookmark favorites for the AI Agent to incorporate.
        </p>
      </div>

      {/* Destination Selector Pills */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => {
            setSelectedDestination('');
            setSearchParams({});
          }}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
            selectedDestination === ''
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          All Regions
        </button>

        {destinations.map((dest) => (
          <button
            key={dest.id}
            onClick={() => {
              setSelectedDestination(dest.name);
              setSearchParams({ destination: dest.name });
            }}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center space-x-1.5 ${
              selectedDestination.toLowerCase() === dest.name.toLowerCase()
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <MapPin className="w-3.5 h-3.5" />
            <span>{dest.name}</span>
          </button>
        ))}
      </div>

      {/* Search & Category Filter Bar */}
      <div className="glass-card rounded-2xl p-4 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search attractions, food, hotels..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3.5 py-2 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
          {['all', 'attraction', 'restaurant', 'hotel', 'activity'].map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium capitalize transition-colors ${
                selectedCategory === cat
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Places Grid */}
      {isLoading ? (
        <div className="p-12 text-center text-slate-400 text-sm">
          Loading places catalog...
        </div>
      ) : filteredPlaces.length === 0 ? (
        <div className="glass-card rounded-3xl p-12 text-center border border-slate-800 text-slate-400 text-xs">
          No places matched your filters.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredPlaces.map((place) => (
            <PlaceCard
              key={place.id}
              place={place}
              isSaved={savedPlaceIds.has(place.id)}
              onToggleSave={handleToggleSave}
            />
          ))}
        </div>
      )}
    </div>
  );
};

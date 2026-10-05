import React from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Bookmark, Compass, Trash2, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { placesService } from '../services/placesService';
import { PlaceCard } from '../components/places/PlaceCard';

export const SavedPlacesPage: React.FC = () => {
  const queryClient = useQueryClient();

  const { data: savedPlaces = [], isLoading } = useQuery({
    queryKey: ['savedPlaces'],
    queryFn: () => placesService.getSavedPlaces(),
  });

  const handleUnsave = async (placeId: number) => {
    const match = savedPlaces.find((s) => s.place_id === placeId);
    if (match) {
      await placesService.unsavePlace(match.id);
      queryClient.invalidateQueries({ queryKey: ['savedPlaces'] });
    }
  };

  return (
    <div className="space-y-6 pb-12">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center space-x-2">
          <Bookmark className="w-6 h-6 text-indigo-400" />
          <span>Saved Places & Wishlist</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-400">
          Your bookmarked hotels, attractions and dining spots. The AI Travel Agent prioritizes these when generating new itineraries.
        </p>
      </div>

      {isLoading ? (
        <div className="p-12 text-center text-slate-400 text-sm">
          Loading your saved wishlist...
        </div>
      ) : savedPlaces.length === 0 ? (
        <div className="glass-card rounded-3xl p-12 text-center border border-slate-800">
          <Bookmark className="w-12 h-12 text-slate-500 mx-auto mb-3" />
          <h3 className="text-base font-bold text-white mb-1">No places saved yet</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto mb-4">
            Explore curated spots in Goa, Manali, Jaipur, etc., and bookmark them to inspire your upcoming plans.
          </p>
          <Link
            to="/explore"
            className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold"
          >
            <span>Explore Destinations</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {savedPlaces.map((saved) => (
            <PlaceCard
              key={saved.id}
              place={saved.place}
              isSaved={true}
              onToggleSave={handleUnsave}
            />
          ))}
        </div>
      )}
    </div>
  );
};

import React from 'react';
import { Star, MapPin, Clock, DollarSign, Bookmark, Utensils, Hotel, Camera, Compass } from 'lucide-react';
import { Place } from '../../types';

interface PlaceCardProps {
  place: Place;
  isSaved?: boolean;
  onToggleSave?: (placeId: number) => void;
  onAddToTrip?: (place: Place) => void;
}

export const PlaceCard: React.FC<PlaceCardProps> = ({
  place,
  isSaved = false,
  onToggleSave,
  onAddToTrip,
}) => {
  const getCategoryIcon = (cat: string) => {
    switch (cat) {
      case 'restaurant':
        return <Utensils className="w-3.5 h-3.5 text-amber-400" />;
      case 'hotel':
        return <Hotel className="w-3.5 h-3.5 text-cyan-400" />;
      case 'activity':
        return <Compass className="w-3.5 h-3.5 text-emerald-400" />;
      default:
        return <Camera className="w-3.5 h-3.5 text-indigo-400" />;
    }
  };

  return (
    <div className="glass-card rounded-2xl p-4 sm:p-5 flex flex-col justify-between border border-slate-800 hover:border-indigo-500/40 transition-all group">
      <div>
        {/* Header Badges */}
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center space-x-1.5 px-2 py-0.5 rounded-full bg-slate-900 border border-slate-800 text-[11px] font-semibold text-slate-300 capitalize">
            {getCategoryIcon(place.category)}
            <span>{place.category}</span>
          </div>

          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-1 text-xs font-bold text-amber-400">
              <Star className="w-3.5 h-3.5 fill-amber-400" />
              <span>{place.rating}</span>
            </div>

            {onToggleSave && (
              <button
                onClick={() => onToggleSave(place.id)}
                title={isSaved ? 'Remove from saved' : 'Save place'}
                className={`p-1.5 rounded-lg border transition-colors ${
                  isSaved
                    ? 'bg-indigo-600/20 text-indigo-400 border-indigo-500/40'
                    : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                }`}
              >
                <Bookmark className="w-3.5 h-3.5 fill-current" />
              </button>
            )}
          </div>
        </div>

        {/* Place Title */}
        <h4 className="text-base font-bold text-white group-hover:text-indigo-300 transition-colors line-clamp-1 mb-1.5">
          {place.name}
        </h4>

        {/* Description */}
        <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed mb-3">
          {place.description}
        </p>

        {/* Tags */}
        {place.tags && (
          <div className="flex flex-wrap gap-1 mb-3">
            {place.tags.split(',').map((tag, idx) => (
              <span
                key={idx}
                className="text-[10px] px-2 py-0.5 rounded-md bg-slate-950/80 text-slate-400 border border-slate-800/80"
              >
                #{tag.trim()}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Footer Metrics */}
      <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-300">
        <div className="flex items-center space-x-3">
          <span className="flex items-center space-x-1 text-emerald-400 font-semibold">
            <DollarSign className="w-3.5 h-3.5" />
            <span>₹{place.average_cost.toLocaleString()}</span>
          </span>

          {place.duration_minutes > 0 && (
            <span className="flex items-center space-x-1 text-slate-400">
              <Clock className="w-3.5 h-3.5" />
              <span>{place.duration_minutes}m</span>
            </span>
          )}
        </div>

        {onAddToTrip && (
          <button
            onClick={() => onAddToTrip(place)}
            className="px-2.5 py-1 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 text-[11px] font-semibold border border-indigo-500/30 transition-colors"
          >
            + Add to Day
          </button>
        )}
      </div>
    </div>
  );
};

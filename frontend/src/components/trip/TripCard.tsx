import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Calendar, 
  MapPin, 
  Users, 
  DollarSign, 
  ArrowRight, 
  Copy, 
  Trash2, 
  Sparkles,
  CheckCircle2
} from 'lucide-react';
import { TripSummary } from '../../types';

interface TripCardProps {
  trip: TripSummary;
  onDuplicate?: (id: number) => void;
  onDelete?: (id: number) => void;
  onOpenAgent?: (tripId: number) => void;
}

export const TripCard: React.FC<TripCardProps> = ({
  trip,
  onDuplicate,
  onDelete,
  onOpenAgent,
}) => {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'planned':
        return (
          <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center space-x-1">
            <CheckCircle2 className="w-3 h-3" />
            <span>Planned</span>
          </span>
        );
      case 'active':
        return (
          <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            Active
          </span>
        );
      case 'completed':
        return (
          <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-700/50 text-slate-400 border border-slate-700">
            Completed
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
            Draft
          </span>
        );
    }
  };

  return (
    <div className="glass-card rounded-2xl p-4 sm:p-5 flex flex-col justify-between group min-w-0">
      <div>
        {/* Top Destination & Status */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex items-center space-x-1.5 text-xs text-indigo-400 font-semibold uppercase tracking-wider min-w-0">
            <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="truncate">{trip.destination}</span>
          </div>
          {getStatusBadge(trip.status)}
        </div>

        {/* Title */}
        <Link to={`/trips/${trip.id}`} className="block group-hover:text-indigo-300 transition-colors">
          <h3 className="text-lg font-bold text-white tracking-tight mb-2 line-clamp-1">
            {trip.title}
          </h3>
        </Link>

        {/* Metadata Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-300 mb-4">
          <div className="flex items-center space-x-1.5 bg-slate-900/60 p-2 rounded-xl border border-slate-800">
            <Calendar className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
            <span className="truncate">{trip.start_date} → {trip.end_date}</span>
          </div>

          <div className="flex items-center space-x-1.5 bg-slate-900/60 p-2 rounded-xl border border-slate-800">
            <Users className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
            <span>{trip.travelers} {trip.travelers === 1 ? 'Traveler' : 'Travelers'}</span>
          </div>

          <div className="sm:col-span-2 flex items-center justify-between gap-2 bg-slate-900/60 p-2 rounded-xl border border-slate-800">
            <span className="text-slate-400 flex items-center space-x-1">
              <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
              <span>Trip Budget:</span>
            </span>
            <span className="font-semibold text-white text-right">₹{trip.budget?.toLocaleString() || '0'}</span>
          </div>
        </div>
      </div>

      {/* Action Footer */}
      <div className="pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center space-x-1">
          {onOpenAgent && (
            <button
              onClick={() => onOpenAgent(trip.id)}
              title="Optimize or Plan with AI Agent"
              className="p-2 rounded-lg bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-400 border border-indigo-500/20 transition-colors"
            >
              <Sparkles className="w-4 h-4" />
            </button>
          )}

          {onDuplicate && (
            <button
              onClick={() => onDuplicate(trip.id)}
              title="Duplicate trip"
              className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition-colors"
            >
              <Copy className="w-4 h-4" />
            </button>
          )}

          {onDelete && (
            <button
              onClick={() => onDelete(trip.id)}
              title="Delete trip"
              className="p-2 rounded-lg bg-slate-900 hover:bg-rose-950/40 text-slate-400 hover:text-rose-400 border border-slate-800 hover:border-rose-800/40 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>

        <Link
          to={`/trips/${trip.id}`}
          className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 text-xs font-semibold border border-indigo-500/30 transition-all hover:translate-x-0.5"
        >
          <span>Open Plan</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
};

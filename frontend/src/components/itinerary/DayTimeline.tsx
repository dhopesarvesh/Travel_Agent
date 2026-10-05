import React, { useState } from 'react';
import { 
  Clock, 
  DollarSign, 
  MapPin, 
  Utensils, 
  Camera, 
  Hotel, 
  Compass, 
  Plus, 
  Trash2, 
  Edit3, 
  ArrowUp, 
  ArrowDown, 
  CloudRain, 
  Sparkles 
} from 'lucide-react';
import { ItineraryDay, ItineraryItem } from '../../types';

interface DayTimelineProps {
  day: ItineraryDay;
  onAddItem: (dayNumber: number) => void;
  onEditItem?: (item: ItineraryItem) => void;
  onDeleteItem: (itemId: number) => void;
  onReorderItems?: (dayId: number, itemIds: number[]) => void;
}

export const DayTimeline: React.FC<DayTimelineProps> = ({
  day,
  onAddItem,
  onEditItem,
  onDeleteItem,
  onReorderItems,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);

  const getItemIcon = (type: string) => {
    switch (type) {
      case 'restaurant':
        return <Utensils className="w-4 h-4 text-amber-400" />;
      case 'hotel':
        return <Hotel className="w-4 h-4 text-cyan-400" />;
      case 'transport':
        return <Compass className="w-4 h-4 text-emerald-400" />;
      default:
        return <Camera className="w-4 h-4 text-indigo-400" />;
    }
  };

  const getItemBadgeClass = (type: string) => {
    switch (type) {
      case 'restaurant':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'hotel':
        return 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20';
      case 'transport':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      default:
        return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20';
    }
  };

  const moveItem = (index: number, direction: 'up' | 'down') => {
    if (!onReorderItems) return;
    const items = [...day.items];
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= items.length) return;
    const temp = items[index];
    items[index] = items[targetIdx];
    items[targetIdx] = temp;
    onReorderItems(day.id, items.map((i) => i.id));
  };

  const totalDayCost = day.items.reduce((sum, item) => sum + (item.estimated_cost || 0), 0);

  return (
    <div className="glass-card rounded-2xl overflow-hidden border border-slate-800/80 mb-6">
      {/* Day Header */}
      <div className="p-4 sm:p-5 bg-slate-900/90 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-cyan-500 p-0.5 flex items-center justify-center font-bold text-white shadow-md shadow-indigo-600/20">
            D{day.day_number}
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-base font-bold text-white">
                {day.theme || `Day ${day.day_number}`}
              </h3>
              {day.notes?.toLowerCase().includes('rain') && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 flex items-center space-x-1">
                  <CloudRain className="w-3 h-3" />
                  <span>Rain-adapted</span>
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400">
              {day.date || `Day ${day.day_number}`} · {day.items.length} Activities
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <div className="px-3 py-1 rounded-lg bg-slate-950 border border-slate-800 text-xs font-semibold text-slate-200">
            Est: <span className="text-emerald-400">₹{totalDayCost.toLocaleString()}</span>
          </div>

          <button
            onClick={() => onAddItem(day.day_number)}
            className="flex items-center space-x-1 px-3 py-1 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 text-xs font-semibold border border-indigo-500/30 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Item</span>
          </button>
        </div>
      </div>

      {/* Day Items List */}
      {day.items.length === 0 ? (
        <div className="p-8 text-center bg-slate-950/30">
          <p className="text-xs text-slate-400 mb-3">
            No activities scheduled for this day yet.
          </p>
          <button
            onClick={() => onAddItem(day.day_number)}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 border border-slate-700 transition-colors"
          >
            <Plus className="w-3.5 h-3.5 text-indigo-400" />
            <span>Add First Activity</span>
          </button>
        </div>
      ) : (
        <div className="p-4 sm:p-5 space-y-3 bg-slate-950/40">
          {day.items.map((item, idx) => (
            <div
              key={item.id}
              className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800/80 hover:border-indigo-500/40 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
            >
              {/* Left Info */}
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700/60 flex items-center justify-center flex-shrink-0 mt-0.5">
                  {getItemIcon(item.item_type)}
                </div>

                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h4 className="text-sm font-bold text-white group-hover:text-indigo-300 transition-colors">
                      {item.title}
                    </h4>
                    <span
                      className={`text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full border ${getItemBadgeClass(
                        item.item_type
                      )}`}
                    >
                      {item.item_type}
                    </span>
                  </div>

                  {item.notes && (
                    <p className="text-xs text-slate-400 line-clamp-1 max-w-xl">
                      {item.notes}
                    </p>
                  )}

                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 pt-0.5">
                    <span className="flex items-center space-x-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>{item.start_time} ({item.duration_minutes}m)</span>
                    </span>

                    {item.estimated_cost > 0 && (
                      <span className="flex items-center space-x-1 text-emerald-400 font-medium">
                        <DollarSign className="w-3.5 h-3.5" />
                        <span>₹{item.estimated_cost.toLocaleString()}</span>
                      </span>
                    )}

                    {item.latitude && item.longitude && (
                      <span className="flex items-center space-x-1 text-slate-400">
                        <MapPin className="w-3 h-3 text-indigo-400" />
                        <span>Mapped</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Right actions: Reorder & Delete */}
              <div className="flex items-center space-x-1 self-end sm:self-center">
                {onReorderItems && (
                  <div className="flex items-center space-x-0.5">
                    <button
                      disabled={idx === 0}
                      onClick={() => moveItem(idx, 'up')}
                      className="p-1 rounded text-slate-400 hover:text-white disabled:opacity-20 hover:bg-slate-800"
                      title="Move up"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      disabled={idx === day.items.length - 1}
                      onClick={() => moveItem(idx, 'down')}
                      className="p-1 rounded text-slate-400 hover:text-white disabled:opacity-20 hover:bg-slate-800"
                      title="Move down"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                {onEditItem && (
                  <button
                    onClick={() => onEditItem(item)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-300 hover:bg-slate-800"
                    title="Edit item"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                )}

                <button
                  onClick={() => onDeleteItem(item.id)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-950/30"
                  title="Remove item"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

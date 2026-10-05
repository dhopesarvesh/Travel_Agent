import React from 'react';
import { CloudSun, CloudRain, Sun, Snowflake, Cloud, AlertCircle, Sparkles } from 'lucide-react';
import { WeatherForecast } from '../../types';

interface WeatherCardProps {
  destination: string;
  weather: WeatherForecast | null;
  onAskIndoorActivities?: () => void;
}

export const WeatherCard: React.FC<WeatherCardProps> = ({
  destination,
  weather,
  onAskIndoorActivities,
}) => {
  if (!weather || !weather.daily || weather.daily.length === 0) {
    return (
      <div className="glass-card rounded-2xl p-6 border border-slate-800 text-center">
        <CloudSun className="w-8 h-8 text-indigo-400 mx-auto mb-2 opacity-60" />
        <h4 className="text-sm font-bold text-white mb-1">Weather Forecast</h4>
        <p className="text-xs text-slate-400">
          Live weather forecast data is syncing for {destination}...
        </p>
      </div>
    );
  }

  const rainyDays = weather.daily.filter((d) => d.is_rainy);

  const getWeatherIcon = (condition: string, isRainy: boolean) => {
    if (condition.includes('Snow')) return <Snowflake className="w-5 h-5 text-cyan-300" />;
    if (isRainy || condition.includes('Rain')) return <CloudRain className="w-5 h-5 text-cyan-400" />;
    if (condition.includes('Cloudy')) return <Cloud className="w-5 h-5 text-slate-300" />;
    return <Sun className="w-5 h-5 text-amber-400" />;
  };

  return (
    <div className="glass-card rounded-2xl p-6 border border-slate-800 space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center space-x-2">
          <CloudSun className="w-5 h-5 text-indigo-400" />
          <h3 className="text-base font-bold text-white">
            Live Weather Forecast · {destination}
          </h3>
        </div>
        <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-900 text-slate-400 border border-slate-800">
          Source: Open-Meteo
        </span>
      </div>

      {/* Rain Alert Banner */}
      {rainyDays.length > 0 && (
        <div className="p-3.5 rounded-xl bg-cyan-950/40 border border-cyan-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center space-x-2 text-cyan-200">
            <AlertCircle className="w-4 h-4 text-cyan-400 flex-shrink-0" />
            <span>
              Rain detected on {rainyDays.map((d) => d.date).join(', ')}. Outdoor activities can be swapped automatically.
            </span>
          </div>

          {onAskIndoorActivities && (
            <button
              onClick={onAskIndoorActivities}
              className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 font-semibold border border-cyan-500/30 transition-colors flex-shrink-0 self-start sm:self-auto"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Swap Indoor Picks</span>
            </button>
          )}
        </div>
      )}

      {/* Daily Forecast Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-3">
        {weather.daily.slice(0, 5).map((d) => (
          <div
            key={d.date}
            className={`p-3 rounded-xl border text-center transition-all ${
              d.is_rainy
                ? 'bg-cyan-950/30 border-cyan-500/40 text-cyan-100'
                : 'bg-slate-950/60 border-slate-800/80 text-slate-200'
            }`}
          >
            <span className="text-[11px] font-semibold text-slate-400 block mb-1">
              {new Date(d.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
            </span>
            <div className="my-2 flex justify-center">
              {getWeatherIcon(d.condition, d.is_rainy)}
            </div>
            <div className="text-sm font-bold text-white">
              {d.temp_max !== null ? `${Math.round(d.temp_max)}°` : '--'} / {d.temp_min !== null ? `${Math.round(d.temp_min)}°` : '--'}
            </div>
            <span className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">
              {d.condition}
            </span>
            {d.precipitation_mm > 0 && (
              <span className="text-[10px] text-cyan-400 font-medium block mt-0.5">
                {d.precipitation_mm}mm rain
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

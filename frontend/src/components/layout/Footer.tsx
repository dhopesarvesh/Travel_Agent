import React from 'react';
import { Compass, Sparkles, Cpu, Database, Server, Layers } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-slate-800/80 bg-slate-950/60 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center space-x-2">
              <Compass className="w-5 h-5 text-indigo-400" />
              <span className="font-bold text-lg text-white">VoyageAI</span>
            </div>
            <p className="text-xs text-slate-400 max-w-md leading-relaxed">
              An intelligent full-stack travel planning platform designed to synthesize personalized itineraries, optimize routes and budgets, adapt to real-time weather forecasts, and execute multi-step tool calls.
            </p>
            <div className="flex flex-wrap gap-2 pt-2">
              <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[11px] bg-slate-900 border border-slate-800 text-slate-300">
                <Server className="w-3 h-3 text-indigo-400" />
                <span>FastAPI</span>
              </span>
              <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[11px] bg-slate-900 border border-slate-800 text-slate-300">
                <Database className="w-3 h-3 text-cyan-400" />
                <span>PostgreSQL & SQLAlchemy</span>
              </span>
              <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[11px] bg-slate-900 border border-slate-800 text-slate-300">
                <Layers className="w-3 h-3 text-blue-400" />
                <span>React 19 & TypeScript</span>
              </span>
              <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[11px] bg-slate-900 border border-slate-800 text-slate-300">
                <Cpu className="w-3 h-3 text-emerald-400" />
                <span>Gemini Agent Tool-Calling</span>
              </span>
            </div>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-slate-200 uppercase tracking-wider mb-3">
              Core Capabilities
            </h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li>✨ AI Itinerary Generation</li>
              <li>⚡ Multi-variable Optimization</li>
              <li>🌦️ Open-Meteo Weather Aware</li>
              <li>💰 Budget & Expense Ledger</li>
              <li>📍 Distance & Route Metrics</li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-slate-200 uppercase tracking-wider mb-3">
              Developer & System
            </h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li>Local Development Environment</li>
              <li>Swagger OpenAPI: <a href="http://127.0.0.1:8000/docs" target="_blank" rel="noreferrer" className="text-indigo-400 hover:underline">/docs</a></li>
              <li>JWT Authentication + RBAC</li>
              <li>Strict Deterministic Fallbacks</li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-slate-900 flex flex-col sm:flex-row justify-between items-center text-xs text-slate-400 gap-2">
          <div>© {new Date().getFullYear()} VoyageAI Platform. Built for modern traveler autonomy.</div>
          <div className="flex items-center space-x-1 text-slate-400">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>Agent-Augmented Travel Engineering</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

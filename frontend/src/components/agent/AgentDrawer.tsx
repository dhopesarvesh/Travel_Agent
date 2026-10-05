import React, { useState, useEffect, useRef } from 'react';
import { 
  Sparkles, 
  X, 
  Send, 
  Bot, 
  User, 
  Wrench, 
  CheckCircle2, 
  ArrowRight, 
  RefreshCw, 
  Zap, 
  DollarSign, 
  CloudSun, 
  Compass,
  Check,
  ChevronDown,
  Info
} from 'lucide-react';
import { agentService } from '../../services/agentService';
import { AgentResponse, AgentToolCall, Trip, TripSummary } from '../../types';

interface AgentDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  currentTrip?: Trip | null;
  trips?: TripSummary[];
  onTripUpdated?: () => void;
}

interface MessageItem {
  id: string;
  sender: 'user' | 'agent';
  text: string;
  timestamp: string;
  toolCalls?: AgentToolCall[];
  proposedItinerary?: any[] | null;
  optimization?: any | null;
  requiresApproval?: boolean;
  applied?: boolean;
}

export const AgentDrawer: React.FC<AgentDrawerProps> = ({
  isOpen,
  onClose,
  currentTrip,
  trips = [],
  onTripUpdated,
}) => {
  const [selectedTripId, setSelectedTripId] = useState<number | undefined>(currentTrip?.id);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [applying, setApplying] = useState(false);
  const [messages, setMessages] = useState<MessageItem[]>([
    {
      id: 'welcome',
      sender: 'agent',
      text: "Hello! I am your AI Travel Planning Agent. I can search destinations, analyze weather, compute route distances, keep track of budgets, and synthesize optimized day-by-day itineraries with tool calling. What would you like to do?",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (currentTrip) {
      setSelectedTripId(currentTrip.id);
    }
  }, [currentTrip]);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const handleSendMessage = async (customPrompt?: string) => {
    const textToSend = customPrompt || inputMessage;
    if (!textToSend.trim() || loading) return;

    const userMsg: MessageItem = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!customPrompt) setInputMessage('');
    setLoading(true);

    try {
      let res: AgentResponse;
      const lower = textToSend.toLowerCase();

      if (selectedTripId && (lower.includes('optimize') || lower.includes('less hectic'))) {
        res = await agentService.optimizeTrip(selectedTripId);
      } else if (selectedTripId && (lower.includes('plan') || lower.includes('itinerary'))) {
        res = await agentService.planTrip(selectedTripId, textToSend);
      } else {
        res = await agentService.chat(textToSend, selectedTripId);
      }

      const agentMsg: MessageItem = {
        id: `agent-${Date.now()}`,
        sender: 'agent',
        text: res.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        toolCalls: res.tool_calls,
        proposedItinerary: res.proposed_itinerary,
        optimization: res.optimization,
        requiresApproval: res.requires_approval,
      };

      setMessages((prev) => [...prev, agentMsg]);
    } catch (err: any) {
      const errMsg: MessageItem = {
        id: `agent-${Date.now()}`,
        sender: 'agent',
        text: err?.response?.data?.detail || "Sorry, I ran into an error while processing that request. Please verify backend connection.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleApplyProposal = async (msgId: string, proposedItinerary: any[]) => {
    if (!selectedTripId || !proposedItinerary) return;
    setApplying(true);
    try {
      await agentService.applyItinerary(selectedTripId, proposedItinerary);
      setMessages((prev) =>
        prev.map((m) => (m.id === msgId ? { ...m, applied: true } : m))
      );
      if (onTripUpdated) onTripUpdated();
    } catch (err) {
      console.error('Failed to apply itinerary', err);
    } finally {
      setApplying(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950/60 backdrop-blur-sm flex justify-end">
      <div 
        className="w-full max-w-xl h-full bg-slate-900 border-l border-slate-800 shadow-2xl flex flex-col transform transition-transform duration-300"
      >
        {/* Drawer Header */}
        <div className="p-4 border-b border-slate-800 bg-slate-950/80 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-cyan-500 p-0.5 flex items-center justify-center shadow-md shadow-indigo-500/20">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-bold text-white text-sm">Voyage AI Agent</h3>
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                  Tool-Calling Active
                </span>
              </div>
              <p className="text-xs text-slate-400">Multi-step autonomous travel assistant</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Trip Context Selector Bar */}
        <div className="px-4 py-2.5 bg-slate-950/40 border-b border-slate-800/80 flex items-center justify-between gap-2">
          <div className="flex items-center space-x-2 text-xs text-slate-400">
            <Compass className="w-3.5 h-3.5 text-indigo-400" />
            <span>Trip Context:</span>
          </div>
          <div className="relative flex-1 max-w-xs">
            <select
              value={selectedTripId || ''}
              onChange={(e) => setSelectedTripId(e.target.value ? Number(e.target.value) : undefined)}
              className="w-full bg-slate-900 border border-slate-700/80 rounded-lg text-xs text-slate-200 px-2.5 py-1.5 focus:outline-none focus:border-indigo-500 appearance-none cursor-pointer pr-7"
            >
              <option value="">(No specific trip / General queries)</option>
              {trips.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.title} ({t.destination})
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 top-2.5 pointer-events-none" />
          </div>
        </div>

        {/* Chat Messages Feed */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.sender === 'agent' && (
                <div className="w-7 h-7 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center flex-shrink-0 mt-0.5 text-indigo-400">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              <div className={`max-w-[85%] space-y-2.5 ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
                {/* Bubble */}
                <div
                  className={`p-3.5 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                    msg.sender === 'user'
                      ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white rounded-br-none shadow-md shadow-indigo-600/10'
                      : 'bg-slate-800/90 text-slate-200 rounded-bl-none border border-slate-700/60 shadow-md'
                  }`}
                >
                  <p className="whitespace-pre-line">{msg.text}</p>
                </div>

                {/* Tool Calling Execution Traces */}
                {msg.toolCalls && msg.toolCalls.length > 0 && (
                  <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800 text-xs space-y-1.5">
                    <div className="flex items-center space-x-1.5 text-indigo-400 font-semibold text-[11px]">
                      <Wrench className="w-3.5 h-3.5" />
                      <span>Tools Executed ({msg.toolCalls.length})</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {msg.toolCalls.map((t, idx) => (
                        <div
                          key={idx}
                          className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-[11px] text-slate-300 flex items-center space-x-1 font-mono"
                        >
                          <span className="text-emerald-400">✔</span>
                          <span>{t.name}()</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Optimization Comparison Card */}
                {msg.optimization && (
                  <div className="p-3 rounded-xl bg-gradient-to-br from-slate-950 to-slate-900 border border-indigo-500/30 text-xs space-y-2.5">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                      <span className="font-bold text-white flex items-center space-x-1">
                        <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                        <span>Optimization Metrics</span>
                      </span>
                      <span className="text-[10px] text-emerald-400 font-medium">Efficiency Boost</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-center">
                      <div className="p-2 rounded-lg bg-slate-900/80 border border-slate-800">
                        <span className="text-[10px] text-slate-400 uppercase font-semibold block">Before</span>
                        <div className="mt-1 space-y-0.5 text-xs text-slate-300">
                          <div>📍 {msg.optimization.before.distance_km} km</div>
                          <div>💰 ₹{msg.optimization.before.estimated_cost?.toLocaleString()}</div>
                          <div>⚡ {msg.optimization.before.activities_per_day}/day</div>
                        </div>
                      </div>

                      <div className="p-2 rounded-lg bg-indigo-950/30 border border-indigo-500/30">
                        <span className="text-[10px] text-indigo-400 uppercase font-semibold block">Optimized (After)</span>
                        <div className="mt-1 space-y-0.5 text-xs font-semibold text-white">
                          <div className="text-emerald-400">📍 {msg.optimization.after.distance_km} km</div>
                          <div className="text-emerald-400">💰 ₹{msg.optimization.after.estimated_cost?.toLocaleString()}</div>
                          <div className="text-indigo-300">⚡ {msg.optimization.after.activities_per_day}/day</div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Proposal Apply Button */}
                {msg.proposedItinerary && msg.requiresApproval && (
                  <div className="p-2.5 rounded-xl bg-indigo-950/40 border border-indigo-500/40 flex items-center justify-between gap-2">
                    <div className="text-xs text-indigo-200 flex items-center space-x-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                      <span>Proposed itinerary ready ({msg.proposedItinerary.length} days)</span>
                    </div>
                    {msg.applied ? (
                      <span className="px-2.5 py-1 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-medium flex items-center space-x-1">
                        <Check className="w-3.5 h-3.5" />
                        <span>Applied</span>
                      </span>
                    ) : (
                      <button
                        disabled={applying}
                        onClick={() => handleApplyProposal(msg.id, msg.proposedItinerary)}
                        className="px-3 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-sm transition-colors flex items-center space-x-1 disabled:opacity-50"
                      >
                        {applying ? (
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <>
                            <span>Apply Changes</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </>
                        )}
                      </button>
                    )}
                  </div>
                )}

                <span className="text-[10px] text-slate-400 px-1 block">
                  {msg.timestamp}
                </span>
              </div>

              {msg.sender === 'user' && (
                <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center flex-shrink-0 mt-0.5 text-white shadow-sm">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex gap-3 items-center text-xs text-indigo-400 p-3 bg-slate-950/40 rounded-xl border border-slate-800">
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Agent is inspecting preferences, querying tools, calculating metrics...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Suggestion Chips */}
        <div className="p-2.5 bg-slate-950/60 border-t border-slate-800/80 flex flex-wrap gap-1.5">
          <button
            onClick={() => handleSendMessage("Plan a 4-day Goa trip under ₹25,000 with beaches, food and nightlife")}
            className="px-2.5 py-1 rounded-full bg-slate-800 hover:bg-slate-700 text-[11px] text-slate-300 border border-slate-700/80 flex items-center space-x-1 transition-colors"
          >
            <Sparkles className="w-3 h-3 text-indigo-400" />
            <span>Plan 4-day Goa trip</span>
          </button>
          <button
            onClick={() => handleSendMessage("✨ Optimize my trip schedule, reduce hectic travel and minimize costs")}
            className="px-2.5 py-1 rounded-full bg-indigo-950/50 hover:bg-indigo-900/60 text-[11px] text-indigo-300 border border-indigo-700/50 flex items-center space-x-1 transition-colors"
          >
            <Zap className="w-3 h-3 text-cyan-400" />
            <span>✨ Optimize Trip</span>
          </button>
          <button
            onClick={() => handleSendMessage("Am I spending too much? How can I reduce remaining trip cost?")}
            className="px-2.5 py-1 rounded-full bg-slate-800 hover:bg-slate-700 text-[11px] text-slate-300 border border-slate-700/80 flex items-center space-x-1 transition-colors"
          >
            <DollarSign className="w-3 h-3 text-emerald-400" />
            <span>Budget Analysis</span>
          </button>
          <button
            onClick={() => handleSendMessage("What is the weather forecast and are any outdoor plans at rain risk?")}
            className="px-2.5 py-1 rounded-full bg-slate-800 hover:bg-slate-700 text-[11px] text-slate-300 border border-slate-700/80 flex items-center space-x-1 transition-colors"
          >
            <CloudSun className="w-3 h-3 text-amber-400" />
            <span>Weather Check</span>
          </button>
        </div>

        {/* Input Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="p-3 bg-slate-950 border-t border-slate-800 flex items-center space-x-2"
        >
          <input
            type="text"
            placeholder={
              selectedTripId
                ? "Ask agent to optimize trip, add places, adjust budget..."
                : "Ask anything or create/select a trip to plan..."
            }
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            disabled={loading}
            className="flex-1 bg-slate-900 border border-slate-700/80 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
          />
          <button
            type="submit"
            disabled={loading || !inputMessage.trim()}
            className="p-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white shadow-md shadow-indigo-600/20 transition-all flex-shrink-0"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { 
  DollarSign, 
  AlertTriangle, 
  CheckCircle2, 
  Plus, 
  Trash2, 
  TrendingUp, 
  Hotel, 
  Utensils, 
  Compass, 
  Camera, 
  MoreHorizontal,
  Sparkles
} from 'lucide-react';
import { BudgetSummary, Expense, ExpenseCreateInput } from '../../types';

interface BudgetTrackerProps {
  budget: BudgetSummary;
  expenses: Expense[];
  onAddExpense: (data: ExpenseCreateInput) => Promise<void>;
  onDeleteExpense: (id: number) => Promise<void>;
  onAskAgentBudget?: () => void;
}

export const BudgetTracker: React.FC<BudgetTrackerProps> = ({
  budget,
  expenses,
  onAddExpense,
  onDeleteExpense,
  onAskAgentBudget,
}) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [category, setCategory] = useState<'accommodation' | 'food' | 'transport' | 'activities' | 'miscellaneous'>('food');
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState<number>(500);
  const [isEstimated, setIsEstimated] = useState(false);
  const [spentOn, setSpentOn] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const spentOrPlanned = budget.actual_total > 0 ? budget.actual_total : budget.estimated_total;
  const percentUsed = budget.trip_budget > 0 ? Math.min(Math.round((spentOrPlanned / budget.trip_budget) * 100), 100) : 0;

  const categoryIcons: Record<string, any> = {
    accommodation: <Hotel className="w-4 h-4 text-cyan-400" />,
    food: <Utensils className="w-4 h-4 text-amber-400" />,
    transport: <Compass className="w-4 h-4 text-emerald-400" />,
    activities: <Camera className="w-4 h-4 text-indigo-400" />,
    miscellaneous: <MoreHorizontal className="w-4 h-4 text-purple-400" />,
  };

  const handleCreateExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || amount <= 0) return;
    setSubmitting(true);
    try {
      await onAddExpense({
        category,
        title,
        amount: Number(amount),
        is_estimated: isEstimated,
        spent_on: spentOn,
        notes,
      });
      setTitle('');
      setAmount(500);
      setNotes('');
      setShowAddForm(false);
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Overview Card */}
      <div className="glass-card rounded-2xl p-6 border border-slate-800">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-5">
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-lg font-bold text-white">Trip Budget & Expenses</h3>
              {budget.is_over_budget ? (
                <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/30 flex items-center space-x-1">
                  <AlertTriangle className="w-3 h-3" />
                  <span>Budget Exceeded</span>
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center space-x-1">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>On Track</span>
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Live estimated vs actual expenditure ledger
            </p>
          </div>

          <div className="flex items-center space-x-2">
            {onAskAgentBudget && (
              <button
                onClick={onAskAgentBudget}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 text-xs font-semibold transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>AI Budget Advisor</span>
              </button>
            )}

            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/20 transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Log Expense</span>
            </button>
          </div>
        </div>

        {/* Progress bar */}
        <div className="space-y-2 mb-6">
          <div className="flex justify-between text-xs text-slate-300 font-medium">
            <span>Spent / Planned: ₹{spentOrPlanned.toLocaleString()}</span>
            <span>Target Budget: ₹{budget.trip_budget.toLocaleString()}</span>
          </div>

          <div className="w-full h-3 bg-slate-950 rounded-full overflow-hidden border border-slate-800 p-0.5">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                budget.is_over_budget
                  ? 'bg-gradient-to-r from-amber-500 to-rose-500'
                  : 'bg-gradient-to-r from-indigo-500 to-emerald-400'
              }`}
              style={{ width: `${Math.min(percentUsed, 100)}%` }}
            />
          </div>

          <div className="flex justify-between text-[11px] text-slate-400">
            <span>{percentUsed}% allocated</span>
            <span className={budget.remaining < 0 ? 'text-rose-400 font-semibold' : 'text-emerald-400 font-semibold'}>
              {budget.remaining < 0
                ? `Exceeded by ₹${Math.abs(budget.remaining).toLocaleString()}`
                : `₹${budget.remaining.toLocaleString()} remaining`}
            </span>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-3">
          <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 text-center">
            <span className="text-[10px] text-slate-400 font-semibold uppercase block">Trip Budget</span>
            <span className="text-base font-bold text-white mt-1 block">
              ₹{budget.trip_budget.toLocaleString()}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 text-center">
            <span className="text-[10px] text-slate-400 font-semibold uppercase block">Estimated Plan</span>
            <span className="text-base font-bold text-indigo-300 mt-1 block">
              ₹{budget.estimated_total.toLocaleString()}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 text-center">
            <span className="text-[10px] text-slate-400 font-semibold uppercase block">Actual Spent</span>
            <span className="text-base font-bold text-emerald-400 mt-1 block">
              ₹{budget.actual_total.toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* Log Expense Form Modal / Collapsible */}
      {showAddForm && (
        <form
          onSubmit={handleCreateExpense}
          className="p-5 rounded-2xl bg-slate-900 border border-indigo-500/30 space-y-4 shadow-xl"
        >
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-white text-sm">Log New Trip Expense</h4>
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="text-slate-400 hover:text-white text-xs"
            >
              Cancel
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 uppercase mb-1">
                Category
              </label>
              <select
                value={category}
                onChange={(e: any) => setCategory(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
              >
                <option value="accommodation">Accommodation</option>
                <option value="food">Food & Dining</option>
                <option value="transport">Transportation</option>
                <option value="activities">Activities & Entry</option>
                <option value="miscellaneous">Miscellaneous</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-400 uppercase mb-1">
                Amount (₹) *
              </label>
              <input
                type="number"
                required
                min="1"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 uppercase mb-1">
                Title / Vendor *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Scuba diving pass / Beach dinner"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-400 uppercase mb-1">
                Date Spent
              </label>
              <input
                type="date"
                value={spentOn}
                onChange={(e) => setSpentOn(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
              />
            </div>
          </div>

          <div className="flex items-center space-x-2 pt-1">
            <input
              type="checkbox"
              id="is_estimated"
              checked={isEstimated}
              onChange={(e) => setIsEstimated(e.target.checked)}
              className="rounded bg-slate-950 border-slate-700 text-indigo-600 focus:ring-0"
            />
            <label htmlFor="is_estimated" className="text-xs text-slate-300">
              Mark as estimated budget reservation (not actual paid charge yet)
            </label>
          </div>

          <div className="flex justify-end space-x-2 pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-colors disabled:opacity-50"
            >
              {submitting ? 'Saving...' : 'Save Expense'}
            </button>
          </div>
        </form>
      )}

      {/* Category Breakdown Cards */}
      <div>
        <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
          Category Allocation Breakdown
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {Object.entries(budget.by_category).map(([catKey, catVal]) => {
            const catTotal = (catVal.actual || 0) + (catVal.estimated || 0);
            return (
              <div
                key={catKey}
                className="p-4 rounded-xl bg-slate-900/80 border border-slate-800/80 flex items-center justify-between"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-center">
                    {categoryIcons[catKey] || <DollarSign className="w-4 h-4 text-slate-400" />}
                  </div>
                  <div>
                    <span className="text-xs font-bold text-white capitalize">{catKey}</span>
                    <div className="text-[11px] text-slate-400">
                      Actual: ₹{catVal.actual?.toLocaleString() || 0}
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-xs font-bold text-emerald-400">
                    ₹{catTotal.toLocaleString()}
                  </span>
                  <span className="text-[10px] text-slate-400 block">Total allocated</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recorded Expenses List */}
      <div>
        <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
          Logged Transactions ({expenses.length})
        </h4>

        {expenses.length === 0 ? (
          <div className="p-6 text-center rounded-xl bg-slate-950/40 border border-slate-800/80 text-xs text-slate-400">
            No expenses logged yet. Add your accommodation, food, transit or entry tickets above.
          </div>
        ) : (
          <div className="space-y-2">
            {expenses.map((exp) => (
              <div
                key={exp.id}
                className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 hover:border-slate-700 flex items-center justify-between gap-3"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-7 h-7 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-center">
                    {categoryIcons[exp.category] || <DollarSign className="w-3.5 h-3.5 text-slate-400" />}
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <h5 className="text-xs font-bold text-white">{exp.title}</h5>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 capitalize">
                        {exp.category}
                      </span>
                      {exp.is_estimated && (
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20">
                          Estimated
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-slate-400">
                      {exp.spent_on || 'Trip date'} {exp.notes && `· ${exp.notes}`}
                    </span>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <span className="text-xs font-bold text-white">
                    ₹{exp.amount.toLocaleString()}
                  </span>
                  <button
                    onClick={() => onDeleteExpense(exp.id)}
                    className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

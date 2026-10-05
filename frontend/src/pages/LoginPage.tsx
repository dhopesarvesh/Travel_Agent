import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Compass, Sparkles, Lock, Mail, ArrowRight, Check } from 'lucide-react';
import { authService } from '../services/authService';
import { useAuth } from '../context/AuthContext';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('traveler@example.com');
  const [password, setPassword] = useState('securepassword123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const tokenData = await authService.login({ email, password });
      await login(tokenData);
      const currentUser = await authService.getMe();
      navigate(currentUser.role === 'ADMIN' ? '/admin' : '/trips', { replace: true });
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  const fillQuickDemo = (role: 'user' | 'admin') => {
    if (role === 'admin') {
      setEmail('admin@travel.com');
      setPassword('adminpassword123');
    } else {
      setEmail('traveler@example.com');
      setPassword('securepassword123');
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <div className="w-full max-w-md glass-card rounded-3xl p-8 border border-slate-800 space-y-6 shadow-2xl relative overflow-hidden">
        {/* Glow */}
        <div className="absolute -top-20 -right-20 w-48 h-48 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />

        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 p-0.5 mx-auto shadow-lg shadow-indigo-600/25">
            <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
              <Compass className="w-6 h-6 text-indigo-400" />
            </div>
          </div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight">
            Welcome to VoyageAI
          </h2>
          <p className="text-xs text-slate-400">
            Sign in to access your itineraries and AI Agent tools
          </p>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300 text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center space-x-1">
              <Mail className="w-3.5 h-3.5 text-slate-400" />
              <span>Email Address</span>
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="traveler@example.com"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center space-x-1">
              <Lock className="w-3.5 h-3.5 text-slate-400" />
              <span>Password</span>
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-500 hover:opacity-95 text-white text-xs sm:text-sm font-bold shadow-lg shadow-indigo-600/25 transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
          >
            <span>{loading ? 'Authenticating...' : 'Sign In'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Quick Demo Fill Buttons */}
        <div className="pt-2 border-t border-slate-800/80">
          <span className="text-[11px] text-slate-400 block text-center mb-2 font-medium">
            ⚡ Quick Test Credentials:
          </span>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => fillQuickDemo('user')}
              className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-[11px] text-slate-300 border border-slate-800 text-center"
            >
              Demo User
            </button>
            <button
              type="button"
              onClick={() => fillQuickDemo('admin')}
              className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-[11px] text-amber-300 border border-slate-800 text-center"
            >
              Demo Admin
            </button>
          </div>
        </div>

        <div className="text-center text-xs text-slate-400">
          Don't have an account?{' '}
          <Link to="/register" className="text-indigo-400 hover:underline font-semibold">
            Create an account
          </Link>
        </div>
      </div>
    </div>
  );
};

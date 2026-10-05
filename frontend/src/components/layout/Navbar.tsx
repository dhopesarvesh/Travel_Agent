import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  Compass, 
  MapPin, 
  Sparkles, 
  User as UserIcon, 
  LogOut, 
  Plus, 
  Bookmark,
  Menu,
  X,
  ShieldCheck
} from 'lucide-react';

interface NavbarProps {
  onOpenNewTrip?: () => void;
  onOpenAgent?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenNewTrip, onOpenAgent }) => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 min-w-0">
          {/* Logo */}
          <div className="flex items-center space-x-3 min-w-0">
            <Link to="/" className="flex items-center space-x-2.5 group min-w-0">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 p-[1px] shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform">
                <div className="w-full h-full bg-slate-950 rounded-[11px] flex items-center justify-center">
                  <Compass className="w-5 h-5 text-indigo-400 group-hover:rotate-45 transition-transform duration-300" />
                </div>
              </div>
              <div className="min-w-0">
                <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-white via-slate-100 to-indigo-200 bg-clip-text text-transparent">
                  Voyage<span className="text-indigo-400 font-extrabold">AI</span>
                </span>
                <span className="hidden sm:inline-block ml-2 text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  Agentic Travel
                </span>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation */}
          {isAuthenticated && (
            <div className="hidden md:flex items-center space-x-1 lg:space-x-2 min-w-0">
              <Link
                to="/trips"
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive('/trips')
                    ? 'bg-indigo-600/15 text-indigo-400 border border-indigo-500/30'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                My Trips
              </Link>
              <Link
                to="/explore"
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center space-x-1.5 ${
                  isActive('/explore')
                    ? 'bg-indigo-600/15 text-indigo-400 border border-indigo-500/30'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <MapPin className="w-4 h-4" />
                <span>Explore</span>
              </Link>
              <Link
                to="/saved"
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center space-x-1.5 ${
                  isActive('/saved')
                    ? 'bg-indigo-600/15 text-indigo-400 border border-indigo-500/30'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <Bookmark className="w-4 h-4" />
                <span>Saved Places</span>
              </Link>

              {user?.role === 'ADMIN' && (
                <Link
                  to="/admin"
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center space-x-1.5 ${
                    isActive('/admin')
                      ? 'bg-amber-600/15 text-amber-400 border border-amber-500/30'
                      : 'text-amber-400/80 hover:text-amber-300 hover:bg-slate-800/60'
                  }`}
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Admin</span>
                </Link>
              )}
            </div>
          )}

          {/* Right Action buttons */}
          <div className="hidden sm:flex items-center space-x-3 min-w-0">
            {isAuthenticated ? (
              <>
                {onOpenAgent && (
                  <button
                    onClick={onOpenAgent}
                    className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-indigo-600 to-cyan-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/20 hover:opacity-95 transition-all hover:scale-[1.02]"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>AI Travel Agent</span>
                  </button>
                )}

                {onOpenNewTrip && (
                  <button
                    onClick={onOpenNewTrip}
                    className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>New Trip</span>
                  </button>
                )}

                <div className="h-5 w-[1px] bg-slate-800" />

                <Link
                  to="/profile"
                  className="flex items-center space-x-2 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs text-slate-300 transition-colors"
                >
                  <div className="w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold">
                    {user?.full_name.charAt(0).toUpperCase()}
                  </div>
                  <span className="font-medium max-w-20 truncate">{user?.full_name.split(' ')[0]}</span>
                </Link>

                <button
                  onClick={() => {
                    logout();
                    navigate('/login');
                  }}
                  title="Logout"
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-900 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </>
            ) : (
              <div className="flex items-center space-x-2">
                <Link
                  to="/login"
                  className="px-4 py-1.5 text-xs font-medium text-slate-300 hover:text-white transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm transition-colors"
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu trigger */}
          <div className="flex sm:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-900"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu dropdown */}
      {mobileMenuOpen && (
        <div className="sm:hidden border-b border-slate-800 bg-slate-950 px-4 pt-2 pb-4 space-y-2">
          {isAuthenticated ? (
            <>
              <Link
                to="/trips"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-md text-sm font-medium text-slate-200 hover:bg-slate-900"
              >
                My Trips
              </Link>
              <Link
                to="/explore"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-md text-sm font-medium text-slate-200 hover:bg-slate-900"
              >
                Explore Destinations
              </Link>
              <Link
                to="/saved"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-md text-sm font-medium text-slate-200 hover:bg-slate-900"
              >
                Saved Places
              </Link>
              <Link
                to="/profile"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-md text-sm font-medium text-slate-200 hover:bg-slate-900"
              >
                Profile & Preferences
              </Link>
              {user?.role === 'ADMIN' && (
                <Link
                  to="/admin"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2 rounded-md text-sm font-medium text-amber-400 hover:bg-slate-900"
                >
                  Admin Panel
                </Link>
              )}
              <div className="pt-2 border-t border-slate-800 flex justify-between items-center gap-3">
                <span className="text-xs text-slate-400 truncate">{user?.email}</span>
                <button
                  onClick={() => {
                    logout();
                    navigate('/login');
                  }}
                  className="text-xs text-rose-400 hover:underline flex items-center space-x-1"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Logout</span>
                </button>
              </div>
            </>
          ) : (
            <div className="space-y-2">
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-center px-4 py-2 rounded-lg bg-slate-900 text-sm font-medium text-white"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-center px-4 py-2 rounded-lg bg-indigo-600 text-sm font-semibold text-white"
              >
                Get Started Free
              </Link>
            </div>
          )}
        </div>
      )}
    </nav>
  );
};

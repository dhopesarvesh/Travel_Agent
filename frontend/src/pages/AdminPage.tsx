import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ShieldCheck,
  MapPin,
  Star,
  Users,
  Plus,
  Trash2,
  Compass,
  BarChart3,
  Globe,
  UserCheck,
  UserX,
  Calendar,
  DollarSign,
  TrendingUp,
  Search,
  ChevronDown,
  ChevronRight,
  LayoutDashboard,
  Map,
  Route,
  Eye,
  Activity,
  Database,
  LogOut,
  ClipboardCheck,
  ShieldAlert,
} from 'lucide-react';
import { placesService } from '../services/placesService';
import { useAuth } from '../context/AuthContext';
import { Navigate, useNavigate } from 'react-router-dom';
import type { AdminUser, AdminTrip } from '../types';

type AdminSection = 'dashboard' | 'users' | 'destinations' | 'trips';

export const AdminPage: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeSection, setActiveSection] = useState<AdminSection>('dashboard');
  const [userSearch, setUserSearch] = useState('');
  const [tripSearch, setTripSearch] = useState('');
  const [tripStatusFilter, setTripStatusFilter] = useState('all');

  // Modals
  const [isAddDestOpen, setIsAddDestOpen] = useState(false);
  const [isAddPlaceOpen, setIsAddPlaceOpen] = useState(false);
  const [selectedDestId, setSelectedDestId] = useState<number | null>(null);
  const [expandedDest, setExpandedDest] = useState<number | null>(null);

  // New Destination Form State
  const [destName, setDestName] = useState('');
  const [destCountry, setDestCountry] = useState('India');
  const [destDesc, setDestDesc] = useState('');
  const [destSeason, setDestSeason] = useState('');
  const [destBudget, setDestBudget] = useState(3000);

  // New Place Form State
  const [placeName, setPlaceName] = useState('');
  const [placeCategory, setPlaceCategory] = useState('attraction');
  const [placeDesc, setPlaceDesc] = useState('');
  const [placeCost, setPlaceCost] = useState(500);
  const [placeDuration, setPlaceDuration] = useState(90);
  const [placeTags, setPlaceTags] = useState('');
  const [placeRating, setPlaceRating] = useState(4.5);

  if (user?.role !== 'ADMIN') {
    return <Navigate to="/" replace />;
  }

  // Queries
  const { data: stats } = useQuery({
    queryKey: ['adminStats'],
    queryFn: () => placesService.getAdminStats(),
  });

  const { data: destinations = [], isLoading: loadingDestinations } = useQuery({
    queryKey: ['adminDestinations'],
    queryFn: () => placesService.getAdminDestinations(),
  });

  const { data: adminUsers = [], isLoading: loadingUsers } = useQuery({
    queryKey: ['adminUsers'],
    queryFn: () => placesService.getAdminUsers(),
  });

  const { data: adminTrips = [], isLoading: loadingTrips } = useQuery({
    queryKey: ['adminTrips'],
    queryFn: () => placesService.getAdminTrips(),
  });

  const totalPlaces = destinations.reduce((sum, d) => sum + (d.places?.length || 0), 0);
  const activeUsers = adminUsers.filter((adminUser) => adminUser.is_active).length;
  const inactiveUsers = Math.max(adminUsers.length - activeUsers, 0);
  const plannedTrips = adminTrips.filter((trip) => trip.status === 'planned').length;
  const activeTrips = adminTrips.filter((trip) => trip.status === 'active').length;
  const completedTrips = adminTrips.filter((trip) => trip.status === 'completed').length;
  const totalBudget = adminTrips.reduce((sum, trip) => sum + trip.budget, 0);
  const totalExpenses = adminTrips.reduce((sum, trip) => sum + trip.total_expenses, 0);
  const catalogCoverage = destinations.length ? Math.round(totalPlaces / destinations.length) : 0;

  // Filtered data
  const filteredUsers = adminUsers.filter(
    (u) =>
      u.full_name.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.email.toLowerCase().includes(userSearch.toLowerCase())
  );

  const filteredTrips = adminTrips.filter((t) => {
    const matchesSearch =
      t.title.toLowerCase().includes(tripSearch.toLowerCase()) ||
      t.destination.toLowerCase().includes(tripSearch.toLowerCase()) ||
      t.user_name.toLowerCase().includes(tripSearch.toLowerCase());
    const matchesStatus = tripStatusFilter === 'all' || t.status === tripStatusFilter;
    return matchesSearch && matchesStatus;
  });

  // Handlers
  const handleToggleUserActive = async (userId: number) => {
    try {
      await placesService.toggleUserActive(userId);
      queryClient.invalidateQueries({ queryKey: ['adminUsers'] });
      queryClient.invalidateQueries({ queryKey: ['adminStats'] });
    } catch (err) {
      console.error('Failed to toggle user status', err);
    }
  };

  const handleCreateDestination = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!destName.trim()) return;
    try {
      await placesService.createDestination({
        name: destName,
        country: destCountry,
        description: destDesc,
        best_season: destSeason,
        average_daily_budget: Number(destBudget),
      });
      setIsAddDestOpen(false);
      setDestName('');
      setDestDesc('');
      setDestSeason('');
      queryClient.invalidateQueries({ queryKey: ['adminDestinations'] });
      queryClient.invalidateQueries({ queryKey: ['adminStats'] });
      queryClient.invalidateQueries({ queryKey: ['destinations'] });
    } catch (err) {
      console.error('Failed to create destination', err);
    }
  };

  const handleCreatePlace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDestId || !placeName.trim()) return;
    try {
      await placesService.createPlace({
        destination_id: selectedDestId,
        name: placeName,
        category: placeCategory,
        description: placeDesc,
        average_cost: Number(placeCost),
        duration_minutes: Number(placeDuration),
        tags: placeTags,
        rating: Number(placeRating),
      });
      setIsAddPlaceOpen(false);
      setPlaceName('');
      setPlaceDesc('');
      setPlaceTags('');
      queryClient.invalidateQueries({ queryKey: ['adminDestinations'] });
      queryClient.invalidateQueries({ queryKey: ['adminStats'] });
      queryClient.invalidateQueries({ queryKey: ['places'] });
    } catch (err) {
      console.error('Failed to create place', err);
    }
  };

  const handleDeletePlace = async (placeId: number) => {
    if (!window.confirm('Are you sure you want to delete this place?')) return;
    try {
      await placesService.deletePlace(placeId);
      queryClient.invalidateQueries({ queryKey: ['adminDestinations'] });
      queryClient.invalidateQueries({ queryKey: ['adminStats'] });
    } catch (err) {
      console.error('Failed to delete place', err);
    }
  };

  const handleDeleteDestination = async (destId: number) => {
    if (!window.confirm('Are you sure you want to delete this destination and all its places?')) return;
    try {
      await placesService.deleteDestination(destId);
      queryClient.invalidateQueries({ queryKey: ['adminDestinations'] });
      queryClient.invalidateQueries({ queryKey: ['adminStats'] });
      queryClient.invalidateQueries({ queryKey: ['destinations'] });
    } catch (err) {
      console.error('Failed to delete destination', err);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      draft: 'bg-slate-500/15 text-slate-400 border-slate-500/30',
      planned: 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30',
      active: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
      completed: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    };
    return (
      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${styles[status] || styles.draft}`}>
        {status}
      </span>
    );
  };

  const sidebarItems: { key: AdminSection; label: string; icon: React.ReactNode }[] = [
    { key: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
    { key: 'users', label: 'User Management', icon: <Users className="w-4 h-4" /> },
    { key: 'destinations', label: 'Destinations & Places', icon: <Globe className="w-4 h-4" /> },
    { key: 'trips', label: 'Trip Overview', icon: <Route className="w-4 h-4" /> },
  ];

  // ───────── DASHBOARD SECTION ─────────
  const renderDashboard = () => (
    <div className="space-y-6">
      <div className="border border-slate-800 bg-slate-900/70 rounded-2xl p-5 shadow-xl shadow-slate-950/20">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-[11px] font-bold uppercase text-amber-300">
              <ShieldCheck className="h-3.5 w-3.5" />
              Admin Workspace
            </div>
            <h2 className="mt-3 text-2xl font-extrabold text-white tracking-tight">Platform Control Center</h2>
            <p className="text-sm text-slate-400 mt-1">Manage users, catalog data, trips, and operating health without traveler-facing AI planning tools.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 w-full lg:w-auto lg:min-w-[360px]">
            <button
              onClick={() => setActiveSection('users')}
              className="rounded-xl border border-slate-700 bg-slate-950/70 px-3 py-3 text-left hover:border-indigo-500/50 transition-colors"
            >
              <Users className="h-4 w-4 text-indigo-400 mb-2" />
              <div className="text-[11px] font-bold text-white">Users</div>
              <div className="text-[10px] text-slate-500">{inactiveUsers} inactive</div>
            </button>
            <button
              onClick={() => setActiveSection('destinations')}
              className="rounded-xl border border-slate-700 bg-slate-950/70 px-3 py-3 text-left hover:border-emerald-500/50 transition-colors"
            >
              <Database className="h-4 w-4 text-emerald-400 mb-2" />
              <div className="text-[11px] font-bold text-white">Catalog</div>
              <div className="text-[10px] text-slate-500">{catalogCoverage} avg places</div>
            </button>
            <button
              onClick={() => setActiveSection('trips')}
              className="rounded-xl border border-slate-700 bg-slate-950/70 px-3 py-3 text-left hover:border-cyan-500/50 transition-colors"
            >
              <ClipboardCheck className="h-4 w-4 text-cyan-400 mb-2" />
              <div className="text-[11px] font-bold text-white">Trips</div>
              <div className="text-[10px] text-slate-500">{activeTrips} active</div>
            </button>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="glass-card rounded-2xl p-5 border border-slate-800 group hover:border-indigo-500/40 transition-colors">
          <div className="flex items-center justify-between mb-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
              <Users className="w-4.5 h-4.5" />
            </div>
            <TrendingUp className="w-3.5 h-3.5 text-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          <span className="text-2xl font-extrabold text-white block">{stats?.total_users ?? 0}</span>
          <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">Total Users</span>
        </div>

        <div className="glass-card rounded-2xl p-5 border border-slate-800 group hover:border-cyan-500/40 transition-colors">
          <div className="flex items-center justify-between mb-3">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center">
              <Route className="w-4.5 h-4.5" />
            </div>
            <TrendingUp className="w-3.5 h-3.5 text-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          <span className="text-2xl font-extrabold text-white block">{stats?.total_trips ?? 0}</span>
          <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">Total Trips</span>
        </div>

        <div className="glass-card rounded-2xl p-5 border border-slate-800 group hover:border-emerald-500/40 transition-colors">
          <div className="flex items-center justify-between mb-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <Globe className="w-4.5 h-4.5" />
            </div>
          </div>
          <span className="text-2xl font-extrabold text-white block">{stats?.total_destinations ?? 0}</span>
          <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">Destinations</span>
        </div>

        <div className="glass-card rounded-2xl p-5 border border-slate-800 group hover:border-amber-500/40 transition-colors">
          <div className="flex items-center justify-between mb-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
              <MapPin className="w-4.5 h-4.5" />
            </div>
          </div>
          <span className="text-2xl font-extrabold text-white block">{stats?.total_places ?? 0}</span>
          <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">Seeded Places</span>
        </div>

        <div className="glass-card rounded-2xl p-5 border border-slate-800 col-span-2 lg:col-span-1 group hover:border-rose-500/40 transition-colors">
          <div className="flex items-center justify-between mb-3">
            <div className="w-9 h-9 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center">
              <DollarSign className="w-4.5 h-4.5" />
            </div>
          </div>
          <span className="text-2xl font-extrabold text-white block">{stats?.total_expenses ?? 0}</span>
          <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">Expense Records</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white">User Operations</h3>
            <ShieldAlert className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-slate-950/70 border border-slate-800 p-3">
              <div className="text-2xl font-extrabold text-emerald-400">{activeUsers}</div>
              <div className="text-[10px] uppercase text-slate-500 font-bold">Active</div>
            </div>
            <div className="rounded-xl bg-slate-950/70 border border-slate-800 p-3">
              <div className="text-2xl font-extrabold text-rose-400">{inactiveUsers}</div>
              <div className="text-[10px] uppercase text-slate-500 font-bold">Inactive</div>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white">Trip Pipeline</h3>
            <Activity className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="mt-4 space-y-3">
            {[
              ['Planned', plannedTrips, 'bg-indigo-400'],
              ['Active', activeTrips, 'bg-emerald-400'],
              ['Completed', completedTrips, 'bg-amber-400'],
            ].map(([label, value, color]) => (
              <div key={label} className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-2 text-slate-300"><span className={`h-2 w-2 rounded-full ${color}`} />{label}</span>
                <span className="font-bold text-white">{value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white">Budget Visibility</h3>
            <BarChart3 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-4 space-y-3">
            <div>
              <div className="text-[10px] uppercase text-slate-500 font-bold">Total Trip Budgets</div>
              <div className="text-xl font-extrabold text-white">₹{totalBudget.toLocaleString()}</div>
            </div>
            <div>
              <div className="text-[10px] uppercase text-slate-500 font-bold">Logged Expenses</div>
              <div className="text-xl font-extrabold text-amber-400">₹{totalExpenses.toLocaleString()}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Overview Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Recent Users */}
        <div className="glass-card rounded-2xl p-5 border border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-white flex items-center space-x-2">
              <Users className="w-4 h-4 text-indigo-400" />
              <span>Recent Users</span>
            </h3>
            <button
              onClick={() => setActiveSection('users')}
              className="text-[11px] text-indigo-400 hover:text-indigo-300 font-semibold"
            >
              View All →
            </button>
          </div>
          <div className="space-y-2">
            {adminUsers.slice(0, 5).map((u) => (
              <div key={u.id} className="flex items-center justify-between gap-3 py-2 px-3 rounded-xl bg-slate-950/60 border border-slate-800/60">
                <div className="flex items-center space-x-3 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-indigo-500/15 text-indigo-400 flex items-center justify-center text-xs font-bold">
                    {u.full_name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-white truncate">{u.full_name}</div>
                    <div className="text-[10px] text-slate-400 truncate">{u.email}</div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-[10px] text-slate-400">{u.trip_count} trips</span>
                  <span className={`w-2 h-2 rounded-full ${u.is_active ? 'bg-emerald-400' : 'bg-rose-400'}`} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Trips */}
        <div className="glass-card rounded-2xl p-5 border border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-white flex items-center space-x-2">
              <Route className="w-4 h-4 text-cyan-400" />
              <span>Recent Trips</span>
            </h3>
            <button
              onClick={() => setActiveSection('trips')}
              className="text-[11px] text-indigo-400 hover:text-indigo-300 font-semibold"
            >
              View All →
            </button>
          </div>
          <div className="space-y-2">
            {adminTrips.slice(0, 5).map((t) => (
              <div key={t.id} className="flex items-center justify-between gap-3 py-2 px-3 rounded-xl bg-slate-950/60 border border-slate-800/60">
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-white truncate">{t.title}</div>
                  <div className="text-[10px] text-slate-400 truncate">{t.destination} · by {t.user_name}</div>
                </div>
                <div className="flex items-center space-x-2">
                  {getStatusBadge(t.status)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Destination Summary */}
      <div className="glass-card rounded-2xl p-5 border border-slate-800">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-white flex items-center space-x-2">
            <Globe className="w-4 h-4 text-emerald-400" />
            <span>Destination Catalog Summary</span>
          </h3>
          <button
            onClick={() => setActiveSection('destinations')}
            className="text-[11px] text-indigo-400 hover:text-indigo-300 font-semibold"
          >
            Manage →
          </button>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {destinations.slice(0, 8).map((dest) => (
            <div key={dest.id} className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/60 text-center">
              <div className="text-xs font-bold text-white">{dest.name}</div>
              <div className="text-[10px] text-slate-400 mt-0.5">{dest.country}</div>
              <div className="text-lg font-extrabold text-indigo-400 mt-1">{dest.places?.length || 0}</div>
              <div className="text-[10px] text-slate-400">places</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // ───────── USER MANAGEMENT SECTION ─────────
  const renderUsers = () => (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight">User Management</h2>
          <p className="text-sm text-slate-400 mt-1">View and manage platform users</p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            value={userSearch}
            onChange={(e) => setUserSearch(e.target.value)}
            placeholder="Search users..."
            className="pl-9 pr-4 py-2 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white focus:outline-none focus:border-indigo-500 w-full sm:w-64"
          />
        </div>
      </div>

      {loadingUsers ? (
        <div className="p-8 text-center text-slate-400 text-xs">Loading users...</div>
      ) : (
        <div className="glass-card rounded-2xl border border-slate-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="responsive-table w-full text-left">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/50">
                  <th className="py-3 px-4 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">User</th>
                  <th className="py-3 px-4 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Email</th>
                  <th className="py-3 px-4 text-[11px] font-semibold text-slate-400 uppercase tracking-wider text-center">Role</th>
                  <th className="py-3 px-4 text-[11px] font-semibold text-slate-400 uppercase tracking-wider text-center">Trips</th>
                  <th className="py-3 px-4 text-[11px] font-semibold text-slate-400 uppercase tracking-wider text-center">Status</th>
                  <th className="py-3 px-4 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Joined</th>
                  <th className="py-3 px-4 text-[11px] font-semibold text-slate-400 uppercase tracking-wider text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((u) => (
                  <tr key={u.id} className="border-b border-slate-800/50 hover:bg-slate-900/40 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-full bg-indigo-500/15 text-indigo-400 flex items-center justify-center text-xs font-bold flex-shrink-0">
                          {u.full_name.charAt(0).toUpperCase()}
                        </div>
	                        <span className="text-sm font-semibold text-white">{u.full_name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-300">{u.email}</td>
                    <td className="py-3 px-4 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${
                        u.role === 'ADMIN'
                          ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                          : 'bg-slate-500/15 text-slate-300 border-slate-500/30'
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center text-xs font-bold text-indigo-400">{u.trip_count}</td>
                    <td className="py-3 px-4 text-center">
                      <span className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                        u.is_active
                          ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                          : 'bg-rose-500/15 text-rose-400 border-rose-500/30'
                      }`}>
                        {u.is_active ? <UserCheck className="w-3 h-3" /> : <UserX className="w-3 h-3" />}
                        <span>{u.is_active ? 'Active' : 'Inactive'}</span>
                      </span>
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-400 whitespace-nowrap">
                      {new Date(u.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {u.role !== 'ADMIN' && (
                        <button
                          onClick={() => handleToggleUserActive(u.id)}
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-colors ${
                            u.is_active
                              ? 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border-rose-500/30'
                              : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                          }`}
                          title={u.is_active ? 'Deactivate user' : 'Activate user'}
                        >
                          {u.is_active ? 'Deactivate' : 'Activate'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filteredUsers.length === 0 && (
            <div className="p-8 text-center text-slate-400 text-xs">No users match your search.</div>
          )}
        </div>
      )}
    </div>
  );

  // ───────── DESTINATIONS & PLACES SECTION ─────────
  const renderDestinations = () => (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight">Destinations & Places</h2>
          <p className="text-sm text-slate-400 mt-1">Manage the destination catalog and attractions</p>
        </div>
        <button
          onClick={() => setIsAddDestOpen(true)}
          className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:opacity-95 text-white text-xs font-bold shadow-lg shadow-amber-600/20 self-start sm:self-auto transition-all hover:scale-[1.02]"
        >
          <Plus className="w-4 h-4" />
          <span>Add Destination</span>
        </button>
      </div>

      {loadingDestinations ? (
        <div className="p-8 text-center text-slate-400 text-xs">Loading destinations...</div>
      ) : (
        <div className="space-y-3">
          {destinations.map((dest) => (
            <div key={dest.id} className="glass-card rounded-2xl border border-slate-800 overflow-hidden">
              {/* Destination Header (Accordion) */}
              <button
                onClick={() => setExpandedDest(expandedDest === dest.id ? null : dest.id)}
                className="w-full flex items-center justify-between p-5 hover:bg-slate-900/30 transition-colors text-left"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-base font-bold text-white">{dest.name}, {dest.country}</div>
                    <div className="text-xs text-slate-400 mt-0.5 line-clamp-1">{dest.description || 'No description'}</div>
                  </div>
                </div>
                <div className="flex items-center space-x-4 flex-shrink-0">
                  <div className="text-right hidden sm:block">
                    <div className="text-xs text-slate-400">Daily Budget</div>
                    <div className="text-sm font-bold text-emerald-400">₹{dest.average_daily_budget?.toLocaleString()}</div>
                  </div>
                  <div className="text-right hidden sm:block">
                    <div className="text-xs text-slate-400">Best Season</div>
                    <div className="text-xs font-semibold text-amber-400">{dest.best_season || '—'}</div>
                  </div>
                  <div className="flex items-center space-x-1 px-2.5 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30">
                    <span className="text-xs font-bold text-indigo-400">{dest.places?.length || 0}</span>
                    <span className="text-[10px] text-indigo-300">places</span>
                  </div>
                  {expandedDest === dest.id ? (
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  )}
                </div>
              </button>

              {/* Expanded Places */}
              {expandedDest === dest.id && (
                <div className="border-t border-slate-800 p-5 space-y-4 bg-slate-950/40">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Places & Attractions</span>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => {
                          setSelectedDestId(dest.id);
                          setIsAddPlaceOpen(true);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 text-xs font-semibold flex items-center space-x-1 transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add Place</span>
                      </button>
                      <button
                        onClick={() => handleDeleteDestination(dest.id)}
                        className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 transition-colors"
                        title="Delete Destination"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {dest.places && dest.places.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {dest.places.map((p) => (
                        <div
                          key={p.id}
                          className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between text-xs group hover:border-slate-700 transition-colors"
                        >
                          <div className="pr-2 min-w-0">
                            <div className="font-bold text-white line-clamp-1">{p.name}</div>
                            <span className="text-[10px] text-slate-400 capitalize">{p.category} · {p.duration_minutes}m</span>
                            {p.tags && (
                              <div className="flex flex-wrap gap-1 mt-1.5">
                                {p.tags.split(',').slice(0, 3).map((tag, i) => (
                                  <span key={i} className="px-1.5 py-0.5 rounded bg-slate-800 text-[9px] text-slate-400">
                                    {tag.trim()}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                          <div className="text-right flex-shrink-0 flex items-center space-x-2">
                            <div>
                              <span className="text-emerald-400 font-bold">₹{p.average_cost}</span>
                              <div className="text-[10px] text-amber-400 font-semibold">★ {p.rating}</div>
                            </div>
                            <button
                              onClick={() => handleDeletePlace(p.id)}
                              className="opacity-0 group-hover:opacity-100 p-1 rounded text-slate-500 hover:text-rose-400 transition-opacity"
                              title="Delete Place"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6 text-xs text-slate-500">
                      No places added yet. Click "Add Place" to get started.
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}

          {destinations.length === 0 && (
            <div className="glass-card rounded-2xl border border-slate-800 p-10 text-center">
              <Globe className="w-10 h-10 text-slate-500 mx-auto mb-3" />
              <h3 className="text-sm font-bold text-white mb-1">No destinations yet</h3>
              <p className="text-xs text-slate-400">Add your first destination to build the catalog.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );

  // ───────── TRIPS OVERVIEW SECTION ─────────
  const renderTrips = () => (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight">Platform Trip Overview</h2>
          <p className="text-sm text-slate-400 mt-1">Read-only view of all user trips across the platform</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            value={tripSearch}
            onChange={(e) => setTripSearch(e.target.value)}
            placeholder="Search by title, destination, or user..."
            className="pl-9 pr-4 py-2 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white focus:outline-none focus:border-indigo-500 w-full"
          />
        </div>
        <select
          value={tripStatusFilter}
          onChange={(e) => setTripStatusFilter(e.target.value)}
          className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-indigo-500"
        >
          <option value="all">All Statuses</option>
          <option value="draft">Draft</option>
          <option value="planned">Planned</option>
          <option value="active">Active</option>
          <option value="completed">Completed</option>
        </select>
      </div>

      {loadingTrips ? (
        <div className="p-8 text-center text-slate-400 text-xs">Loading trips...</div>
      ) : (
        <div className="glass-card rounded-2xl border border-slate-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="responsive-table w-full text-left">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/50">
                  <th className="py-3 px-4 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Trip</th>
                  <th className="py-3 px-4 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Destination</th>
                  <th className="py-3 px-4 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Owner</th>
                  <th className="py-3 px-4 text-[11px] font-semibold text-slate-400 uppercase tracking-wider text-center">Status</th>
                  <th className="py-3 px-4 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Dates</th>
                  <th className="py-3 px-4 text-[11px] font-semibold text-slate-400 uppercase tracking-wider text-center">Travelers</th>
                  <th className="py-3 px-4 text-[11px] font-semibold text-slate-400 uppercase tracking-wider text-right">Budget</th>
                  <th className="py-3 px-4 text-[11px] font-semibold text-slate-400 uppercase tracking-wider text-right">Expenses</th>
                </tr>
              </thead>
              <tbody>
                {filteredTrips.map((t) => (
                  <tr key={t.id} className="border-b border-slate-800/50 hover:bg-slate-900/40 transition-colors">
                    <td className="py-3 px-4">
                      <span className="text-sm font-semibold text-white">{t.title}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-xs text-slate-300 flex items-center space-x-1">
                        <MapPin className="w-3 h-3 text-indigo-400 flex-shrink-0" />
                        <span>{t.destination}</span>
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div>
                        <div className="text-xs font-semibold text-white">{t.user_name}</div>
                        <div className="text-[10px] text-slate-400">{t.user_email}</div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      {getStatusBadge(t.status)}
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-300 whitespace-nowrap">
                      <div className="flex items-center space-x-1">
                        <Calendar className="w-3 h-3 text-slate-500 flex-shrink-0" />
                        <span>{t.start_date} → {t.end_date}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center text-xs font-bold text-white">{t.travelers}</td>
                    <td className="py-3 px-4 text-right text-xs font-bold text-emerald-400">₹{t.budget.toLocaleString()}</td>
                    <td className="py-3 px-4 text-right text-xs font-bold text-amber-400">₹{t.total_expenses.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filteredTrips.length === 0 && (
            <div className="p-8 text-center text-slate-400 text-xs">No trips match your filters.</div>
          )}
        </div>
      )}
    </div>
  );

  const renderContent = () => {
    switch (activeSection) {
      case 'dashboard':
        return renderDashboard();
      case 'users':
        return renderUsers();
      case 'destinations':
        return renderDestinations();
      case 'trips':
        return renderTrips();
      default:
        return renderDashboard();
    }
  };

  return (
    <div className="flex min-h-screen w-full min-w-0">
      {/* Sidebar */}
      <aside className="w-60 flex-shrink-0 border-r border-slate-800 bg-slate-950/60 hidden lg:flex flex-col">
        {/* Sidebar Header */}
        <div className="p-5 border-b border-slate-800">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-600 to-amber-400 p-[1px] shadow-lg shadow-amber-500/20">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <ShieldCheck className="w-4.5 h-4.5 text-amber-400" />
              </div>
            </div>
            <div>
              <div className="text-sm font-bold text-white">Admin Panel</div>
              <div className="text-[10px] text-slate-400">VoyageAI Platform</div>
            </div>
          </div>
        </div>

        {/* Nav Items */}
        <nav className="flex-1 p-3 space-y-1">
          {sidebarItems.map((item) => (
            <button
              key={item.key}
              onClick={() => setActiveSection(item.key)}
              className={`w-full flex items-center space-x-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                activeSection === item.key
                  ? 'bg-indigo-600/15 text-indigo-400 border border-indigo-500/30 shadow-sm shadow-indigo-500/10'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900/60'
              }`}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-slate-800">
          <div className="flex items-center space-x-2.5 px-2 mb-3">
            <div className="w-8 h-8 rounded-full bg-amber-500/15 text-amber-400 flex items-center justify-center text-xs font-bold">
              {user?.full_name?.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <div className="text-xs font-semibold text-white truncate">{user?.full_name}</div>
              <div className="text-[10px] text-slate-400 truncate">{user?.email}</div>
            </div>
          </div>
          <button
            onClick={() => {
              logout();
              navigate('/login');
            }}
            className="w-full flex items-center justify-center space-x-1.5 px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs text-slate-400 hover:text-rose-400 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Mobile Tab Bar (visible < lg) */}
      <div className="fixed bottom-0 left-0 right-0 z-40 lg:hidden bg-slate-950/95 backdrop-blur-xl border-t border-slate-800">
        <div className="flex justify-around py-2 px-2">
          {sidebarItems.map((item) => (
            <button
              key={item.key}
              onClick={() => setActiveSection(item.key)}
              className={`flex flex-col items-center space-y-0.5 px-3 py-1.5 rounded-lg transition-colors ${
                activeSection === item.key
                  ? 'text-indigo-400'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              {item.icon}
              <span className="text-[9px] font-semibold">{item.label.split(' ')[0]}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 min-w-0 overflow-y-auto p-4 sm:p-6 pb-24 lg:pb-6">
        {renderContent()}
      </main>

      {/* ───────── MODALS ───────── */}

      {/* Add Destination Modal */}
      {isAddDestOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden p-6 space-y-4">
            <h3 className="text-lg font-bold text-white">Add New Destination</h3>
            <form onSubmit={handleCreateDestination} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Destination Name *</label>
                <input
                  type="text"
                  required
                  value={destName}
                  onChange={(e) => setDestName(e.target.value)}
                  placeholder="e.g. Kerala"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Country</label>
                <input
                  type="text"
                  value={destCountry}
                  onChange={(e) => setDestCountry(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Description</label>
                <textarea
                  rows={2}
                  value={destDesc}
                  onChange={(e) => setDestDesc(e.target.value)}
                  placeholder="Backwaters, beaches and Ayurveda..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Best Season</label>
                  <input
                    type="text"
                    value={destSeason}
                    onChange={(e) => setDestSeason(e.target.value)}
                    placeholder="Sep–Mar"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Avg Daily Budget (₹)</label>
                  <input
                    type="number"
                    value={destBudget}
                    onChange={(e) => setDestBudget(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
              <div className="pt-3 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsAddDestOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold shadow-md shadow-amber-600/20"
                >
                  Save Destination
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Place Modal */}
      {isAddPlaceOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden p-6 space-y-4">
            <h3 className="text-lg font-bold text-white">Add Place / Attraction</h3>
            <form onSubmit={handleCreatePlace} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Place Name *</label>
                <input
                  type="text"
                  required
                  value={placeName}
                  onChange={(e) => setPlaceName(e.target.value)}
                  placeholder="e.g. Alleppey Houseboat Cruise"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Category</label>
                  <select
                    value={placeCategory}
                    onChange={(e) => setPlaceCategory(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="attraction">Attraction</option>
                    <option value="activity">Activity</option>
                    <option value="restaurant">Restaurant</option>
                    <option value="hotel">Hotel</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Avg Cost (₹)</label>
                  <input
                    type="number"
                    value={placeCost}
                    onChange={(e) => setPlaceCost(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Duration (Mins)</label>
                  <input
                    type="number"
                    value={placeDuration}
                    onChange={(e) => setPlaceDuration(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Rating (1-5)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="1"
                    max="5"
                    value={placeRating}
                    onChange={(e) => setPlaceRating(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Tags (Comma-separated)</label>
                <input
                  type="text"
                  value={placeTags}
                  onChange={(e) => setPlaceTags(e.target.value)}
                  placeholder="nature, adventure, relaxed"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div className="pt-3 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsAddPlaceOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-600/20"
                >
                  Save Place
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

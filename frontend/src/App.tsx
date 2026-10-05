import React, { Suspense, lazy, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import { AgentDrawer } from './components/agent/AgentDrawer';
import { TripFormModal } from './components/trip/TripFormModal';
import { tripService } from './services/tripService';

const DashboardPage = lazy(() => import('./pages/DashboardPage').then((module) => ({ default: module.DashboardPage })));
const TripsPage = lazy(() => import('./pages/TripsPage').then((module) => ({ default: module.TripsPage })));
const TripDetailPage = lazy(() => import('./pages/TripDetailPage').then((module) => ({ default: module.TripDetailPage })));
const ExplorePage = lazy(() => import('./pages/ExplorePage').then((module) => ({ default: module.ExplorePage })));
const SavedPlacesPage = lazy(() => import('./pages/SavedPlacesPage').then((module) => ({ default: module.SavedPlacesPage })));
const ProfilePage = lazy(() => import('./pages/ProfilePage').then((module) => ({ default: module.ProfilePage })));
const LoginPage = lazy(() => import('./pages/LoginPage').then((module) => ({ default: module.LoginPage })));
const RegisterPage = lazy(() => import('./pages/RegisterPage').then((module) => ({ default: module.RegisterPage })));
const AdminPage = lazy(() => import('./pages/AdminPage').then((module) => ({ default: module.AdminPage })));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 2, // 2 minutes
    },
  },
});

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-400 text-sm">
        Authenticating session...
      </div>
    );
  }
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

const PageLoader: React.FC = () => (
  <div className="min-h-[60vh] flex items-center justify-center text-slate-400 text-sm">
    Loading workspace...
  </div>
);

const AppContent: React.FC = () => {
  const { isAuthenticated, user } = useAuth();
  const [isAgentOpen, setIsAgentOpen] = useState(false);
  const [agentTripId, setAgentTripId] = useState<number | undefined>(undefined);
  const [isNewTripOpen, setIsNewTripOpen] = useState(false);
  const location = useLocation();

  const handleOpenAgent = (tripId?: number) => {
    setAgentTripId(tripId);
    setIsAgentOpen(true);
  };

  const isAdminRoute = location.pathname.startsWith('/admin');

  // Admin gets a fully dedicated layout (no user Navbar, Footer, Agent, TripModal)
  if (isAdminRoute && isAuthenticated && user?.role === 'ADMIN') {
    return (
      <div className="app-shell min-h-screen flex flex-col bg-slate-950 text-slate-100 selection:bg-indigo-500/30 selection:text-indigo-200">
        <main className="flex-1 w-full min-w-0">
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route
                path="/admin"
                element={
                  <ProtectedRoute>
                    <AdminPage />
                  </ProtectedRoute>
                }
              />
              <Route path="*" element={<Navigate to="/admin" replace />} />
            </Routes>
          </Suspense>
        </main>
      </div>
    );
  }

  if (isAuthenticated && user?.role === 'ADMIN') {
    return <Navigate to="/admin" replace />;
  }

  return (
    <div className="app-shell min-h-screen flex flex-col bg-slate-950 text-slate-100 selection:bg-indigo-500/30 selection:text-indigo-200">
      <Navbar
        onOpenNewTrip={() => setIsNewTripOpen(true)}
        onOpenAgent={() => handleOpenAgent()}
      />

      <main className="page-frame flex-1">
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route
              path="/"
              element={
                isAuthenticated ? (
                  <DashboardPage onOpenAgent={handleOpenAgent} />
                ) : (
                  <LoginPage />
                )
              }
            />
            <Route
              path="/trips"
              element={
                <ProtectedRoute>
                  <TripsPage onOpenAgent={handleOpenAgent} />
                </ProtectedRoute>
              }
            />
            <Route
              path="/trips/:id"
              element={
                <ProtectedRoute>
                  <TripDetailPage onOpenAgent={handleOpenAgent} />
                </ProtectedRoute>
              }
            />
            <Route
              path="/explore"
              element={
                <ProtectedRoute>
                  <ExplorePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/saved"
              element={
                <ProtectedRoute>
                  <SavedPlacesPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <ProfilePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin"
              element={
                <ProtectedRoute>
                  <AdminPage />
                </ProtectedRoute>
              }
            />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </main>

      <Footer />

      {/* Global AI Agent Drawer */}
      {isAuthenticated && (
        <AgentDrawer
          isOpen={isAgentOpen}
          onClose={() => setIsAgentOpen(false)}
          currentTrip={agentTripId ? { id: agentTripId } as any : null}
          onTripUpdated={() => {
            queryClient.invalidateQueries({ queryKey: ['trips'] });
            if (agentTripId) {
              queryClient.invalidateQueries({ queryKey: ['trip', agentTripId] });
              queryClient.invalidateQueries({ queryKey: ['budget', agentTripId] });
            }
          }}
        />
      )}

      {/* Quick Global New Trip Modal */}
      {isAuthenticated && (
        <TripFormModal
          isOpen={isNewTripOpen}
          onClose={() => setIsNewTripOpen(false)}
          onSubmit={async (data) => {
            await tripService.createTrip(data);
            queryClient.invalidateQueries({ queryKey: ['trips'] });
          }}
        />
      )}
    </div>
  );
};

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;

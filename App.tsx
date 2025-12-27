
import React, { Suspense } from 'react';
import { HashRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { CRMProvider } from './context/CRMContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import Layout from './components/Layout';
import { Loader2 } from 'lucide-react';
import Login from './pages/Login'; // Import the new Login page

// Lazy Load Pages
const Dashboard = React.lazy(() => import('./pages/Dashboard'));
const Leads = React.lazy(() => import('./pages/Leads'));
const LeadDetail = React.lazy(() => import('./pages/LeadDetail'));
const AdminSettings = React.lazy(() => import('./pages/AdminSettings'));
const TeamPerformance = React.lazy(() => import('./pages/TeamPerformance'));

// Loading Fallback Component
const PageLoader = () => (
  <div className="flex items-center justify-center h-screen w-full bg-background text-brand-500">
    <Loader2 size={40} className="animate-spin" />
  </div>
);

// --- Route Protection ---
const ProtectedRoute = () => {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return <PageLoader />;
  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
};

const ManagerRoute = () => {
    const { isManager } = useAuth();
    // This component assumes it's inside a ProtectedRoute, so we don't need to check isLoading or isAuthenticated again.
    return isManager ? <Outlet /> : <Navigate to="/" replace />;
}

const App: React.FC = () => {
  return (
    <AuthProvider>
      <NotificationProvider>
        <CRMProvider>
          <HashRouter>
            <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route path="/login" element={<Login />} />
                
                <Route element={<ProtectedRoute />}>
                  <Route path="/" element={<Layout />}>
                    <Route index element={<Dashboard />} />
                    <Route path="leads" element={<Leads />} />
                    <Route path="leads/:id" element={<LeadDetail />} />
                    
                    <Route element={<ManagerRoute />}>
                       <Route path="admin" element={<AdminSettings />} />
                       <Route path="performance" element={<TeamPerformance />} />
                    </Route>

                  </Route>
                </Route>

                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Suspense>
          </HashRouter>
        </CRMProvider>
      </NotificationProvider>
    </AuthProvider>
  );
};

export default App;

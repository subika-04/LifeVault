import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import Welcome from './pages/Welcome';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import VaultPage from './pages/Vault';
import Documents from './pages/Documents';
import Assets from './pages/Assets';
import Expenses from './pages/Expenses';
import Reminders from './pages/Reminders';
import Timeline from './pages/Timeline';
import AI from './pages/AI';
import Profile from './pages/Profile';

const GuestRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner" />
        <p>Loading LifeVault...</p>
      </div>
    );
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

const NotFoundRedirect = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner" />
        <p>Loading LifeVault...</p>
      </div>
    );
  }

  return <Navigate to={user ? '/dashboard' : '/'} replace />;
};

const AppRoutes = () => (
  <Routes>
    {/* Public landing page. Authenticated users may still view it (e.g. via
        a bookmark) — it offers a "Go to Dashboard" action instead of
        force-redirecting, so there's no redirect loop. */}
    <Route path="/" element={<Welcome />} />

    <Route
      path="/login"
      element={
        <GuestRoute>
          <Login />
        </GuestRoute>
      }
    />
    <Route
      path="/register"
      element={
        <GuestRoute>
          <Register />
        </GuestRoute>
      }
    />
    {/* Alias so links written as /signup (marketing copy, docs, etc.)
        resolve to the same signup flow without duplicating logic. */}
    <Route
      path="/signup"
      element={
        <GuestRoute>
          <Register />
        </GuestRoute>
      }
    />

    <Route element={<ProtectedRoute />}>
      <Route element={<Layout />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/vault" element={<VaultPage />} />
        <Route path="/documents" element={<Documents />} />
        <Route path="/assets" element={<Assets />} />
        <Route path="/expenses" element={<Expenses />} />
        <Route path="/reminders" element={<Reminders />} />
        <Route path="/timeline" element={<Timeline />} />
        <Route path="/ai" element={<AI />} />
        <Route path="/profile" element={<Profile />} />
      </Route>
    </Route>

    <Route path="*" element={<NotFoundRedirect />} />
  </Routes>
);

const App = () => (
  <AuthProvider>
    <ToastProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </ToastProvider>
  </AuthProvider>
);

export default App;

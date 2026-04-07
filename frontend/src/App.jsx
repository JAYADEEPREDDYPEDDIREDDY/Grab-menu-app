import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider } from './context/CartContext';

import Menu from './pages/customer/Menu';
import OrderTracking from './pages/customer/OrderTracking';
import Landing from './pages/Landing';

import AdminLogin from './pages/admin/AdminLogin';
import Dashboard from './pages/admin/Dashboard';
import Analytics from './pages/admin/Analytics';
import MenuManager from './pages/admin/MenuManager';
import CategoryManager from './pages/admin/CategoryManager';
import MenuImport from './pages/admin/MenuImport';
import TableManager from './pages/admin/TableManager';
import Billing from './pages/admin/Billing';
import RestaurantSettings from './pages/admin/RestaurantSettings';
import SuperAdminLogin from './pages/admin/SuperAdminLogin';
import SuperAdminDashboard from './pages/admin/SuperAdminDashboard';
import AdminLayout from './components/AdminLayout';
import SuperAdminLayout from './components/SuperAdminLayout';

const ProtectedRoute = ({ children, allowedRoles, loginPath }) => {
  const { isAuthenticated, role } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to={loginPath} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(role)) {
    return <Navigate to={role === 'SUPER_ADMIN' ? '/super-admin' : '/admin'} replace />;
  }

  return children;
};

function App() {
  const AppShell = () => {
    const location = useLocation();
    const isLanding = location.pathname === "/";

    return (
      <div
        className={`min-h-screen relative overflow-x-hidden ${
          isLanding
            ? "bg-surface text-on-background"
            : "text-[hsl(var(--hue,250),10%,95%)] bg-[hsl(var(--hue,250),20%,8%)]"
        }`}
      >
        {!isLanding ? (
          <>
            <div className="bg-glow blob-1 fixed w-[400px] h-[400px] rounded-full blur-[100px] bg-accent/30 top-[-100px] left-[-100px] z-0 animate-[pulseGlow_8s_infinite_alternate_ease-in-out]" />
            <div className="bg-glow blob-2 fixed w-[300px] h-[300px] rounded-full blur-[100px] bg-[hsla(280,80%,60%,0.2)] bottom-[-50px] right-[-50px] z-0 animate-[pulseGlow_8s_infinite_alternate_ease-in-out] [animation-delay:-4s]" />
          </>
        ) : null}

        <div className="relative z-10 w-full">
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/menu" element={<Menu />} />
            <Route path="/order/:id" element={<OrderTracking />} />

            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/super-admin/login" element={<SuperAdminLogin />} />

            <Route
              path="/admin"
              element={
                <ProtectedRoute allowedRoles={['RESTAURANT_ADMIN']} loginPath="/admin/login">
                  <AdminLayout>
                    <Dashboard />
                  </AdminLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/analytics"
              element={
                <ProtectedRoute allowedRoles={['RESTAURANT_ADMIN']} loginPath="/admin/login">
                  <AdminLayout>
                    <Analytics />
                  </AdminLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/menu"
              element={
                <ProtectedRoute allowedRoles={['RESTAURANT_ADMIN']} loginPath="/admin/login">
                  <AdminLayout>
                    <MenuManager />
                  </AdminLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/categories"
              element={
                <ProtectedRoute allowedRoles={['RESTAURANT_ADMIN']} loginPath="/admin/login">
                  <AdminLayout>
                    <CategoryManager />
                  </AdminLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/menu/import"
              element={
                <ProtectedRoute allowedRoles={['RESTAURANT_ADMIN']} loginPath="/admin/login">
                  <AdminLayout>
                    <MenuImport />
                  </AdminLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/tables"
              element={
                <ProtectedRoute allowedRoles={['RESTAURANT_ADMIN']} loginPath="/admin/login">
                  <AdminLayout>
                    <TableManager />
                  </AdminLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/settings"
              element={
                <ProtectedRoute allowedRoles={['RESTAURANT_ADMIN']} loginPath="/admin/login">
                  <AdminLayout>
                    <RestaurantSettings />
                  </AdminLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/billing"
              element={
                <ProtectedRoute allowedRoles={['RESTAURANT_ADMIN']} loginPath="/admin/login">
                  <AdminLayout>
                    <Billing />
                  </AdminLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/super-admin"
              element={
                <ProtectedRoute allowedRoles={['SUPER_ADMIN']} loginPath="/super-admin/login">
                  <SuperAdminLayout>
                    <SuperAdminDashboard />
                  </SuperAdminLayout>
                </ProtectedRoute>
              }
            />
          </Routes>
        </div>
      </div>
    );
  };

  return (
    <Router>
      <AuthProvider>
        <CartProvider>
          <AppShell />
        </CartProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;

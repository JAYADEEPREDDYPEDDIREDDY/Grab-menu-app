import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider } from './context/CartContext';

// Customer Pages
import Menu from './pages/customer/Menu';
import OrderTracking from './pages/customer/OrderTracking';

// Admin Pages
import AdminLogin from './pages/admin/AdminLogin';
import Dashboard from './pages/admin/Dashboard';
import MenuManager from './pages/admin/MenuManager';
import TableManager from './pages/admin/TableManager';
import AdminPlaceholder from './pages/admin/AdminPlaceholder';
import AdminLayout from './components/AdminLayout';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? children : <Navigate to="/admin/login" />;
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <CartProvider>
          <div className="min-h-screen relative overflow-hidden text-[hsl(var(--hue,250),10%,95%)] bg-[hsl(var(--hue,250),20%,8%)]">
            <div className="bg-glow blob-1 fixed w-[400px] h-[400px] rounded-full blur-[100px] bg-accent/30 top-[-100px] left-[-100px] z-0 animate-[pulseGlow_8s_infinite_alternate_ease-in-out]" />
            <div className="bg-glow blob-2 fixed w-[300px] h-[300px] rounded-full blur-[100px] bg-[hsla(280,80%,60%,0.2)] bottom-[-50px] right-[-50px] z-0 animate-[pulseGlow_8s_infinite_alternate_ease-in-out] [animation-delay:-4s]" />
            
            <div className="relative z-10 w-full">
              <Routes>
                {/* Customer Routes */}
                <Route path="/" element={<Navigate to="/menu" />} />
                <Route path="/menu" element={<Menu />} />
                <Route path="/order/:id" element={<OrderTracking />} />

                {/* Admin Routes */}
                <Route path="/admin/login" element={<AdminLogin />} />
                <Route path="/admin" element={
                  <ProtectedRoute><AdminLayout><Dashboard /></AdminLayout></ProtectedRoute>
                } />
                <Route path="/admin/menu" element={
                  <ProtectedRoute><AdminLayout><MenuManager /></AdminLayout></ProtectedRoute>
                } />
                <Route path="/admin/tables" element={
                  <ProtectedRoute><AdminLayout><TableManager /></AdminLayout></ProtectedRoute>
                } />
                <Route path="/admin/categories" element={
                  <ProtectedRoute>
                    <AdminLayout>
                      <AdminPlaceholder
                        title="Categories"
                        description="Organize sections and prepare smarter menu grouping."
                        label="Coming next"
                        tone="soon"
                      />
                    </AdminLayout>
                  </ProtectedRoute>
                } />
                <Route path="/admin/billing" element={
                  <ProtectedRoute>
                    <AdminLayout>
                      <AdminPlaceholder
                        title="Billing"
                        description="Complete handoff from completed orders into billing workflows."
                        label="Live-ready shell"
                        tone="live"
                      />
                    </AdminLayout>
                  </ProtectedRoute>
                } />
              </Routes>
            </div>
          </div>
        </CartProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;

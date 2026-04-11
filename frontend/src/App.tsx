import { Routes, Route, Navigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import useAuthStore from './store/useAuthStore';

// Temporary lazy-loaded component placeholders mapped to real pages.
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import AdminDashboard from './pages/AdminDashboard';
import UserDashboard from './pages/UserDashboard';
import Builder from './pages/Builder';

// Protect Admin Pages Route Guard
const AdminRoute = ({ children }: { children: JSX.Element }) => {
  const user = useAuthStore((state) => state.user);
  if (!user) return <Navigate to="/login" />;
  if (user.role !== 'ADMIN') return <Navigate to="/dashboard" />;
  return children;
};

// Protect Private User Pages Route Guard
const PrivateRoute = ({ children }: { children: JSX.Element }) => {
  const user = useAuthStore((state) => state.user);
  return user ? children : <Navigate to="/login" />;
};

function App() {
  return (
    <div className="min-h-screen w-full flex flex-col font-sans transition-all duration-300">
      <AnimatePresence mode="wait">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          {/* User Routes */}
          <Route path="/dashboard" element={
            <PrivateRoute>
              <UserDashboard />
            </PrivateRoute>
          } />
          
           <Route path="/builder/:id?" element={
            <PrivateRoute>
              <Builder />
            </PrivateRoute>
          } />

          {/* Admin Routes */}
          <Route path="/admin" element={
            <AdminRoute>
              <AdminDashboard />
            </AdminRoute>
          } />
        </Routes>
      </AnimatePresence>
    </div>
  );
}

export default App;

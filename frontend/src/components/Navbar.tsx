import { Link, useNavigate } from 'react-router-dom';
import { Layout, LogOut, User, ShieldCheck } from 'lucide-react';
import useAuthStore from '../store/useAuthStore';
import { motion } from 'framer-motion';

const Navbar = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 px-6 py-4">
      <div className="max-w-7xl mx-auto glass flex items-center justify-between px-8 py-3 bg-white/10 border-white/20">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="bg-blue-600 p-2 rounded-lg group-hover:rotate-12 transition-transform">
            <Layout className="text-white w-5 h-5" />
          </div>
          <span className="font-bold text-xl tracking-tight text-slate-800">
            Resume<span className="text-blue-600">Draft</span>
          </span>
        </Link>

        <div className="flex items-center gap-6 font-medium text-slate-600">
          {user ? (
            <>
              {user.role === 'ADMIN' && (
                <Link to="/admin" className="hover:text-blue-600 flex items-center gap-1">
                  <ShieldCheck size={18} /> Admin
                </Link>
              )}
              <Link to="/dashboard" className="hover:text-blue-600 flex items-center gap-1">
                <User size={18} /> Dashboard
              </Link>
              <button 
                onClick={handleLogout}
                className="flex items-center gap-1 bg-red-50 text-red-600 px-4 py-2 rounded-xl hover:bg-red-100 transition-colors"
              >
                <LogOut size={18} /> Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="hover:text-blue-600">Login</Link>
              <Link to="/register" className="bg-blue-600 text-white px-6 py-2 rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-200">
                Get Started
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;

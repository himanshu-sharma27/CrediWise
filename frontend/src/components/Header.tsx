import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { ShieldCheck, Scale, LogIn, LogOut, ArrowRight, LayoutDashboard } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export const Header: React.FC = () => {
  const { isAuthenticated, logout, isAdmin } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = () => {
    logout();
    navigate("/login");
  };

  const dashboardPath = isAdmin ? "/admin/dashboard" : "/dashboard";

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-cream-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        {/* Brand Logo */}
        <Link to="/" className="flex items-center space-x-3 group">
          <div className="w-11 h-11 rounded-xl bg-teal-850 flex items-center justify-center text-white shadow-sm transition-transform group-hover:scale-105">
            <ShieldCheck className="w-6 h-6 text-teal-100" />
          </div>
          <div className="flex flex-col">
            <span className="text-2xl font-extrabold tracking-tight text-teal-850 leading-none">
              Credi<span className="text-coral-500">Wise</span>
            </span>
            <span className="text-[10px] font-bold tracking-widest text-slate-500 uppercase mt-0.5">
              LOAN INTELLIGENCE
            </span>
          </div>
        </Link>

        {/* Right Navigation */}
        <nav className="flex items-center space-x-3 sm:space-x-6">
          <Link
            to="/rules"
            className="flex items-center space-x-1.5 text-sm font-medium text-slate-600 hover:text-teal-850 transition-colors"
          >
            <Scale className="w-4 h-4 text-slate-500" />
            <span className="hidden sm:inline">Rules &amp; Policies</span>
          </Link>

          {isAuthenticated ? (
            <div className="flex items-center space-x-4">
              <Link
                to={dashboardPath}
                className="flex items-center space-x-2 px-4 py-2 rounded-full bg-teal-100 text-teal-850 text-sm font-semibold hover:bg-teal-200 transition-colors"
              >
                <LayoutDashboard className="w-4 h-4 text-teal-700" />
                <span>Go to Dashboard</span>
              </Link>
              <button
                onClick={handleSignOut}
                className="flex items-center space-x-1.5 text-sm font-medium text-slate-600 hover:text-coral-600 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center space-x-3">
              <Link
                to="/login"
                className="flex items-center space-x-1.5 text-sm font-medium text-slate-700 hover:text-teal-850 px-3 py-2 transition-colors"
              >
                <LogIn className="w-4 h-4" />
                <span>Sign In</span>
              </Link>
              <Link
                to="/register"
                className="hidden sm:flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-teal-850 text-white text-sm font-semibold hover:bg-teal-800 transition-colors shadow-sm"
              >
                <span>Register</span>
                <ArrowRight className="w-4 h-4 text-teal-200" />
              </Link>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
};

export default Header;

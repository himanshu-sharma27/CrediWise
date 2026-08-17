import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { Scale, LogIn, LogOut, ArrowRight, LayoutDashboard } from "lucide-react";
import { useAuth } from "../context/AuthContext";

import CrediWiseLogo from "./CrediWiseLogo";

export const Header: React.FC = () => {
  const { isAuthenticated, logout, isAdmin } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = () => {
    logout();
    navigate("/login");
  };

  const dashboardPath = isAdmin ? "/admin/dashboard" : "/dashboard";

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-[#E2E5E9]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        {/* Brand Logo */}
        <Link to="/" className="flex items-center group" aria-label="CrediWise Home">
          <CrediWiseLogo height="44px" className="transition-transform group-hover:scale-102" />
        </Link>

        {/* Right Navigation */}
        <nav className="flex items-center space-x-3 sm:space-x-6">
          <Link
            to="/rules"
            className="flex items-center space-x-1.5 text-sm font-medium text-[#1A2B4C] hover:text-[#D4A373] transition-colors"
          >
            <Scale className="w-4 h-4 text-[#D4A373]" />
            <span className="hidden sm:inline">Rules &amp; Policies</span>
          </Link>

          {isAuthenticated ? (
            <div className="flex items-center space-x-4">
              <Link
                to={dashboardPath}
                className="flex items-center space-x-2 px-4 py-2 rounded-full bg-[#1A2B4C] text-white text-sm font-semibold hover:bg-[#243A61] transition-colors"
              >
                <LayoutDashboard className="w-4 h-4 text-[#D4A373]" />
                <span>Go to Dashboard</span>
              </Link>
              <button
                onClick={handleSignOut}
                className="flex items-center space-x-1.5 text-sm font-medium text-[#718096] hover:text-[#A6534A] transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center space-x-3">
              <Link
                to="/login"
                className="flex items-center space-x-1.5 text-sm font-medium text-[#1A2B4C] hover:text-[#D4A373] px-3 py-2 transition-colors"
              >
                <LogIn className="w-4 h-4 text-[#D4A373]" />
                <span>Sign In</span>
              </Link>
              <Link
                to="/register"
                className="hidden sm:flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-[#1A2B4C] text-white text-sm font-semibold hover:bg-[#243A61] transition-colors shadow-sm"
              >
                <span>Register</span>
                <ArrowRight className="w-4 h-4 text-[#D4A373]" />
              </Link>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
};

export default Header;


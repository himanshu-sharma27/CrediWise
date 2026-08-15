import React from "react";
import { Link } from "react-router-dom";
import { Home, LogOut } from "lucide-react";
import Header from "./Header";
import Footer from "./Footer";
import Sidebar from "./Sidebar";
import { useAuth } from "../context/AuthContext";

interface LayoutProps {
  children: React.ReactNode;
  variant?: "public" | "app";
  showFooterBanner?: boolean;
}

export const Layout: React.FC<LayoutProps> = ({
  children,
  variant = "public",
  showFooterBanner = true,
}) => {
  const { user, logout, isAdmin } = useAuth();

  if (variant === "public") {
    return (
      <div className="min-h-screen flex flex-col bg-cream-100 font-sans">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer showBanner={showFooterBanner} />
      </div>
    );
  }

  // Application Layout with Sidebar + Topbar
  const getInitials = (name?: string) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="min-h-screen bg-cream-100 flex font-sans">
      {/* Left Sidebar */}
      <Sidebar />

      {/* Main Workspace Area */}
      <div className="flex-1 flex flex-col pl-20 sm:pl-64 transition-all duration-300 min-w-0">
        {/* Topbar matching Screenshot 5 */}
        <header className="h-16 bg-white border-b border-cream-300 px-6 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center space-x-2 text-sm font-medium text-slate-600">
            <Home className="w-4 h-4 text-slate-400" />
            <Link to="/" className="hover:text-teal-850 transition-colors">
              CrediWise Home
            </Link>
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3">
              {/* User Avatar Circle */}
              <div className="w-9 h-9 rounded-full bg-teal-100 border border-teal-200 text-teal-850 flex items-center justify-center font-bold text-sm">
                {getInitials(user?.name)}
              </div>
              <div className="hidden sm:flex flex-col text-left">
                <span className="text-sm font-bold text-slate-800 leading-tight">
                  {user?.name || "User"}
                </span>
                <span className="text-[10px] font-extrabold tracking-wider text-coral-600 uppercase">
                  {isAdmin ? "ADMINISTRATOR" : "APPLICANT"}
                </span>
              </div>
            </div>

            <button
              onClick={logout}
              className="p-1.5 text-slate-400 hover:text-coral-600 rounded-lg hover:bg-slate-50 transition-colors"
              title="Log Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Content Body */}
        <main className="flex-1 p-6 sm:p-10 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;

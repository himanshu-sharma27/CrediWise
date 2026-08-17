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
      <div className="min-h-screen flex flex-col bg-[#F8F9FA] font-sans text-[#1A2B4C]">
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
    <div className="min-h-screen bg-[#F8F9FA] flex font-sans text-[#1A2B4C]">
      {/* Left Sidebar */}
      <Sidebar />

      {/* Main Workspace Area */}
      <div className="flex-1 flex flex-col pl-20 sm:pl-64 transition-all duration-300 min-w-0">
        {/* Topbar */}
        <header className="h-16 bg-white border-b border-[#E2E5E9] px-6 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center space-x-2 text-sm font-medium text-[#1A2B4C]">
            <Home className="w-4 h-4 text-[#D4A373]" />
            <Link to="/" className="hover:text-[#D4A373] transition-colors">
              CrediWise Home
            </Link>
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3">
              {/* User Avatar Circle */}
              <div className="w-9 h-9 rounded-full bg-[#FBF4EC] border border-[#D4A373] text-[#1A2B4C] flex items-center justify-center font-bold text-sm">
                {getInitials(user?.name)}
              </div>
              <div className="hidden sm:flex flex-col text-left">
                <span className="text-sm font-bold text-[#1A2B4C] leading-tight">
                  {user?.name || "User"}
                </span>
                <span className="text-[10px] font-extrabold tracking-wider text-[#D4A373] uppercase">
                  {isAdmin ? "ADMINISTRATOR" : "APPLICANT"}
                </span>
              </div>
            </div>

            <button
              onClick={logout}
              className="p-1.5 text-[#718096] hover:text-[#A6534A] rounded-lg hover:bg-[#F3F4F6] transition-colors"
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


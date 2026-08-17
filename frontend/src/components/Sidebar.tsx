import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  FileCheck2,
  LayoutGrid,
  FilePlus,
  Sliders,
  Scale,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Files,
  Users,
  BarChart3,
  Activity,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

import CrediWiseLogo from "./CrediWiseLogo";

interface NavItem {
  name: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
}

export const Sidebar: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, isAdmin } = useAuth();

  const handleSignOut = () => {
    logout();
    navigate("/login");
  };

  const userNavItems: NavItem[] = [
    { name: "Dashboard", path: "/dashboard", icon: LayoutGrid },
    { name: "Eligibility Check", path: "/eligibility", icon: FileCheck2 },
    { name: "New Assessment", path: "/applications/new", icon: FilePlus },
    { name: "What-If Simulator", path: "/simulator", icon: Sliders },
    { name: "Rules & Policies", path: "/rules", icon: Scale },
  ];

  const adminNavItems: NavItem[] = [
    { name: "Admin Dashboard", path: "/admin/dashboard", icon: LayoutGrid },
    { name: "Applications Queue", path: "/admin/applications", icon: Files },
    { name: "User Management", path: "/admin/users", icon: Users },
    { name: "Portfolio Analytics", path: "/admin/analytics", icon: BarChart3 },
    { name: "Model Monitoring", path: "/admin/monitoring", icon: Activity },
    { name: "Rules & Guidelines", path: "/rules", icon: Scale },
  ];

  const navItems = isAdmin ? adminNavItems : userNavItems;

  return (
    <aside
      className={`fixed top-0 left-0 bottom-0 z-40 bg-[#1A2B4C] text-white flex flex-col transition-all duration-300 ${
        collapsed ? "w-20" : "w-64"
      }`}
    >
      {/* Brand Header */}
      <div className="h-20 px-3.5 flex items-center justify-between border-b border-[#2D4160]">
        <Link to="/" className="flex items-center overflow-hidden min-w-0" aria-label="CrediWise Home">
          {collapsed ? (
            <div className="w-10 h-10 rounded-xl bg-[#243A61] border border-[#2D4160] flex items-center justify-center p-1.5 shadow-sm mx-auto">
              <CrediWiseLogo variant="icon-white" height="24px" />
            </div>
          ) : (
            <CrediWiseLogo variant="white" height="38px" className="max-w-[175px]" />
          )}
        </Link>

        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1.5 rounded-lg text-[#DCE3EC] hover:text-white hover:bg-[#243A61] transition-colors"
          title={collapsed ? "Expand Sidebar" : "Collapse Sidebar"}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Navigation Items */}
      <div className="flex-1 py-6 px-3 space-y-1.5 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path || (item.path !== "/" && location.pathname.startsWith(item.path + "/"));

          return (
            <Link
              key={item.name}
              to={item.path}
              className={`flex items-center space-x-3 px-3.5 py-3 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? "bg-[#243A61] text-white shadow-sm font-semibold border-l-2 border-[#D4A373]"
                  : "text-[#DCE3EC] hover:text-white hover:bg-[#243A61]"
              } ${collapsed ? "justify-center px-0" : ""}`}
              title={collapsed ? item.name : undefined}
            >
              <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? "text-[#D4A373]" : "text-[#DCE3EC]"}`} />
              {!collapsed && <span className="truncate">{item.name}</span>}
            </Link>
          );
        })}
      </div>

      {/* Bottom User & Sign Out */}
      <div className="p-3 border-t border-[#2D4160]">
        <button
          onClick={handleSignOut}
          className={`w-full flex items-center space-x-3 px-3.5 py-3 rounded-xl text-sm font-medium text-[#DCE3EC] hover:text-white hover:bg-[#243A61] transition-colors ${
            collapsed ? "justify-center px-0" : ""
          }`}
          title="Sign Out"
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          {!collapsed && <span>Sign Out</span>}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;


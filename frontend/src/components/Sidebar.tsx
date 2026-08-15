import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  ShieldCheck,
  LayoutGrid,
  FilePlus,
  Sliders,
  Scale,
  Cpu,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Files,
  Users,
  BarChart3,
  Activity,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

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
    { name: "Eligibility Check", path: "/eligibility", icon: ShieldCheck },
    { name: "New Assessment", path: "/applications/new", icon: FilePlus },
    { name: "What-If Simulator", path: "/simulator", icon: Sliders },
    { name: "Rules & Policies", path: "/rules", icon: Scale },
    { name: "Model Performance", path: "/admin/monitoring", icon: Cpu },
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
      className={`fixed top-0 left-0 bottom-0 z-40 bg-teal-850 text-white flex flex-col transition-all duration-300 ${
        collapsed ? "w-20" : "w-64"
      }`}
    >
      {/* Brand Header */}
      <div className="h-20 px-4 flex items-center justify-between border-b border-teal-800/80">
        <Link to="/" className="flex items-center space-x-3 overflow-hidden">
          <div className="w-10 h-10 rounded-xl bg-coral-500 flex-shrink-0 flex items-center justify-center text-white shadow-sm">
            <ShieldCheck className="w-6 h-6" />
          </div>
          {!collapsed && (
            <div className="flex flex-col min-w-0">
              <span className="text-xl font-bold tracking-tight text-white truncate">
                Credi<span className="text-coral-400">Wise</span>
              </span>
              <span className="text-[9px] font-bold tracking-widest text-teal-200 uppercase truncate">
                {isAdmin ? "ADMIN PORTAL" : "APPLICANT PORTAL"}
              </span>
            </div>
          )}
        </Link>

        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1.5 rounded-lg text-teal-200 hover:text-white hover:bg-teal-800/60 transition-colors"
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
                  ? "bg-coral-500 text-white shadow-sm font-semibold"
                  : "text-teal-100/80 hover:text-white hover:bg-teal-800/60"
              } ${collapsed ? "justify-center px-0" : ""}`}
              title={collapsed ? item.name : undefined}
            >
              <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? "text-white" : "text-teal-200/90"}`} />
              {!collapsed && <span className="truncate">{item.name}</span>}
            </Link>
          );
        })}
      </div>

      {/* Bottom User & Sign Out */}
      <div className="p-3 border-t border-teal-800/80">
        <button
          onClick={handleSignOut}
          className={`w-full flex items-center space-x-3 px-3.5 py-3 rounded-xl text-sm font-medium text-teal-200 hover:text-white hover:bg-teal-800/60 transition-colors ${
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

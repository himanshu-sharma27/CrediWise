import React, { useEffect, useState } from "react";
import {
  Users,
  Search,
  UserCheck,
  RefreshCw,
  Lock,
  ShieldAlert,
} from "lucide-react";
import Layout from "../components/Layout";
import api from "../services/api";
import { AdminUserSummary } from "../types/api";
import { formatDate } from "../utils/formatters";

export const AdminUsers: React.FC = () => {
  const [users, setUsers] = useState<AdminUserSummary[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>("");

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.admin.getUsers();
      setUsers(res.users || []);
    } catch (err: any) {
      setError(err.message || "Failed to load user directory.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const filteredUsers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalUsers = users.length;
  const adminCount = users.filter((u) => u.role === "admin").length;
  const applicantCount = users.filter((u) => u.role === "user").length;

  return (
    <Layout variant="app">
      <div className="space-y-8 max-w-6xl pb-16">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-teal-100 border border-teal-200 text-teal-850 text-[11px] font-extrabold uppercase tracking-wider mb-1">
              <Users className="w-3.5 h-3.5 text-coral-500" />
              <span>ACCESS CONTROL &amp; DIRECTORY</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-teal-900 tracking-tight">
              User Directory
            </h1>
            <p className="text-sm text-slate-600">
              Overview of registered platform applicants and system administrators.
            </p>
          </div>

          <button
            onClick={loadUsers}
            disabled={loading}
            className="flex items-center space-x-2 px-4 py-2.5 rounded-xl border border-cream-300 bg-white text-slate-700 font-bold text-xs hover:bg-cream-50 transition-colors shadow-2xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Refresh Directory</span>
          </button>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-sm">
            {error}
          </div>
        )}

        {/* Quick KPI Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <div className="crediwise-card p-5 space-y-1">
            <span className="text-xs font-extrabold text-slate-500 uppercase tracking-wider block">
              Total Accounts
            </span>
            <span className="text-3xl font-extrabold text-teal-900">{totalUsers}</span>
            <p className="text-[11px] text-slate-500">Registered platform users</p>
          </div>

          <div className="crediwise-card p-5 space-y-1">
            <span className="text-xs font-extrabold text-slate-500 uppercase tracking-wider block">
              Applicant Accounts
            </span>
            <span className="text-3xl font-extrabold text-teal-800">{applicantCount}</span>
            <p className="text-[11px] text-slate-500">Standard user role (RBAC)</p>
          </div>

          <div className="crediwise-card p-5 space-y-1">
            <span className="text-xs font-extrabold text-slate-500 uppercase tracking-wider block">
              Administrator Accounts
            </span>
            <span className="text-3xl font-extrabold text-coral-600">{adminCount}</span>
            <p className="text-[11px] text-slate-500">Executive reviewer privilege</p>
          </div>
        </div>

        {/* Search Bar */}
        <div className="crediwise-card p-4 sm:p-6">
          <div className="relative w-full">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
              <Search className="w-4 h-4 text-slate-400" />
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search user by name or email address..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-cream-300 bg-cream-50/50 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-700 focus:bg-white"
            />
          </div>
        </div>

        {/* User Table */}
        <div className="crediwise-card p-6 sm:p-8 space-y-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="w-10 h-10 rounded-full border-4 border-teal-850 border-t-transparent animate-spin mb-4" />
              <p className="text-slate-600 text-sm font-medium">Loading User Records...</p>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="p-12 text-center space-y-3 border-dashed border-2 border-cream-300 rounded-2xl bg-cream-50/40">
              <Users className="w-10 h-10 text-slate-400 mx-auto" />
              <h3 className="text-base font-bold text-teal-900">No Users Found</h3>
              <p className="text-xs text-slate-500">No user accounts matched your search query.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-cream-300 text-xs font-bold uppercase text-slate-400">
                  <tr>
                    <th className="pb-3 pr-4">User</th>
                    <th className="pb-3 px-4">Email</th>
                    <th className="pb-3 px-4">Role</th>
                    <th className="pb-3 px-4">Status</th>
                    <th className="pb-3 px-4">Applications</th>
                    <th className="pb-3 pl-4 text-right">Joined</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-cream-200 text-slate-700">
                  {filteredUsers.map((u) => {
                    const isAdmin = u.role === "admin";
                    return (
                      <tr key={u.id} className="hover:bg-cream-50/60 transition-colors">
                        <td className="py-4 pr-4">
                          <div className="flex items-center space-x-3">
                            <div
                              className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                                isAdmin
                                  ? "bg-coral-100 text-coral-800"
                                  : "bg-teal-100 text-teal-850"
                              }`}
                            >
                              {u.name.slice(0, 2).toUpperCase()}
                            </div>
                            <span className="font-bold text-teal-900">{u.name}</span>
                          </div>
                        </td>
                        <td className="py-4 px-4 font-mono text-xs text-slate-600">
                          {u.email}
                        </td>
                        <td className="py-4 px-4">
                          <span
                            className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-md text-[11px] font-extrabold uppercase tracking-wider border ${
                              isAdmin
                                ? "bg-coral-50 text-coral-800 border-coral-200"
                                : "bg-teal-50 text-teal-850 border-teal-200"
                            }`}
                          >
                            {isAdmin ? <ShieldAlert className="w-3 h-3 text-coral-600" /> : <UserCheck className="w-3 h-3 text-teal-600" />}
                            <span>{u.role}</span>
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <span className="inline-flex items-center space-x-1 text-xs font-bold text-emerald-700">
                            <span className="w-2 h-2 rounded-full bg-emerald-500" />
                            <span>{u.is_active ? "Active" : "Inactive"}</span>
                          </span>
                        </td>
                        <td className="py-4 px-4 font-bold text-slate-900">
                          {u.application_count} {u.application_count === 1 ? "App" : "Apps"}
                        </td>
                        <td className="py-4 pl-4 text-right text-xs text-slate-500">
                          {formatDate(u.created_at)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Security & Audit Notice */}
        <div className="p-5 rounded-2xl bg-teal-50/60 border border-teal-100 flex items-start space-x-3 text-teal-900 text-xs">
          <Lock className="w-4 h-4 text-teal-700 flex-shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <strong>Security &amp; Data Privacy:</strong> User credentials are protected using salted PBKDF2 password hashing. Passwords, JWT secrets, and private session tokens are never transmitted to or cached by this directory interface.
          </p>
        </div>
      </div>
    </Layout>
  );
};

export default AdminUsers;

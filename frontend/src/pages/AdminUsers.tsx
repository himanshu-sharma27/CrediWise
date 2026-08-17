import React, { useEffect, useState } from "react";
import {
  Users,
  Search,
  UserCheck,
  RefreshCw,
  Lock,
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
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-[#FBF4EC] border border-[#E2E5E9] text-[#1A2B4C] text-[11px] font-extrabold uppercase tracking-wider mb-1">
              <Users className="w-3.5 h-3.5 text-[#D4A373]" />
              <span>ACCESS CONTROL &amp; DIRECTORY</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-[#1A2B4C] tracking-tight">
              User Directory
            </h1>
            <p className="text-sm text-[#4A5568]">
              Overview of registered platform applicants and system administrators.
            </p>
          </div>

          <button
            onClick={loadUsers}
            disabled={loading}
            className="flex items-center space-x-2 px-4 py-2.5 rounded-xl border border-[#E2E5E9] bg-white text-[#1A2B4C] font-bold text-xs hover:bg-[#F8F9FA] transition-colors shadow-2xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Refresh Directory</span>
          </button>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-[#F8EEEE] border border-[#E5B8B3] text-[#7A332D] text-sm">
            {error}
          </div>
        )}

        {/* Quick KPI Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <div className="crediwise-card p-5 space-y-1">
            <span className="text-xs font-extrabold text-[#4A5568] uppercase tracking-wider block">
              Total Accounts
            </span>
            <span className="text-3xl font-extrabold text-[#1A2B4C]">{totalUsers}</span>
            <p className="text-[11px] text-[#4A5568]">Registered platform users</p>
          </div>

          <div className="crediwise-card p-5 space-y-1">
            <span className="text-xs font-extrabold text-[#4A5568] uppercase tracking-wider block">
              Applicant Accounts
            </span>
            <span className="text-3xl font-extrabold text-[#1A2B4C]">{applicantCount}</span>
            <p className="text-[11px] text-[#4A5568]">Standard user role (RBAC)</p>
          </div>

          <div className="crediwise-card p-5 space-y-1">
            <span className="text-xs font-extrabold text-[#4A5568] uppercase tracking-wider block">
              Administrator Accounts
            </span>
            <span className="text-3xl font-extrabold text-[#D4A373]">{adminCount}</span>
            <p className="text-[11px] text-[#4A5568]">Executive reviewer privilege</p>
          </div>
        </div>

        {/* Search Bar */}
        <div className="crediwise-card p-4 sm:p-6">
          <div className="relative w-full">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
              <Search className="w-4 h-4 text-[#4A5568]" />
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search user by name or email address..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#E2E5E9] bg-white text-sm text-[#1A2B4C] focus:outline-none focus:border-[#D4A373]"
            />
          </div>
        </div>

        {/* User Table */}
        <div className="crediwise-card overflow-hidden">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="w-10 h-10 rounded-full border-4 border-[#1A2B4C] border-t-transparent animate-spin mb-4" />
              <p className="text-[#4A5568] text-sm font-medium">Loading User Records...</p>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <Users className="w-10 h-10 text-[#4A5568] mx-auto" />
              <h3 className="text-base font-bold text-[#1A2B4C]">No Users Found</h3>
              <p className="text-xs text-[#4A5568]">No user accounts matched your search query.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-[#1A2B4C] text-white text-xs font-bold uppercase tracking-wider">
                  <tr>
                    <th className="py-3.5 px-6">User</th>
                    <th className="py-3.5 px-6">Email</th>
                    <th className="py-3.5 px-6">Role</th>
                    <th className="py-3.5 px-6">Status</th>
                    <th className="py-3.5 px-6">Applications</th>
                    <th className="py-3.5 px-6 text-right">Joined</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E5E9] text-[#1A2B4C]">
                  {filteredUsers.map((u) => {
                    const isAdmin = u.role === "admin";
                    return (
                      <tr key={u.id} className="hover:bg-[#FBF4EC]/20 transition-colors">
                        <td className="py-4 px-6">
                          <div className="flex items-center space-x-3">
                            <div
                              className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                                isAdmin
                                  ? "bg-[#FBF4EC] text-[#1A2B4C] border border-[#D4A373]"
                                  : "bg-[#FBF4EC] text-[#1A2B4C]"
                              }`}
                            >
                              {u.name.slice(0, 2).toUpperCase()}
                            </div>
                            <span className="font-bold text-[#1A2B4C]">{u.name}</span>
                          </div>
                        </td>
                        <td className="py-4 px-6 font-mono text-xs text-[#4A5568]">
                          {u.email}
                        </td>
                        <td className="py-4 px-6">
                          <span
                            className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-md text-[11px] font-extrabold uppercase tracking-wider border ${
                              isAdmin
                                ? "bg-[#FBF4EC] text-[#1A2B4C] border-[#D4A373]"
                                : "bg-[#F8F9FA] text-[#1A2B4C] border-[#E2E5E9]"
                            }`}
                          >
                            {isAdmin ? <Lock className="w-3 h-3 text-[#D4A373]" /> : <UserCheck className="w-3 h-3 text-[#D4A373]" />}
                            <span>{u.role}</span>
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          <span className="inline-flex items-center space-x-1 text-xs font-bold text-[#1A2B4C]">
                            <span className="w-2 h-2 rounded-full bg-[#D4A373]" />
                            <span>{u.is_active ? "Active" : "Inactive"}</span>
                          </span>
                        </td>
                        <td className="py-4 px-6 font-bold text-[#1A2B4C]">
                          {u.application_count} {u.application_count === 1 ? "App" : "Apps"}
                        </td>
                        <td className="py-4 px-6 text-right text-xs text-[#4A5568]">
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
        <div className="p-5 rounded-2xl bg-[#FBF4EC]/30 border border-[#E2E5E9] flex items-start space-x-3 text-[#1A2B4C] text-xs">
          <Lock className="w-4 h-4 text-[#D4A373] flex-shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <strong>Security &amp; Data Privacy:</strong> User credentials are protected using salted PBKDF2 password hashing. Passwords, JWT secrets, and private session tokens are never transmitted to or cached by this directory interface.
          </p>
        </div>
      </div>
    </Layout>
  );
};

export default AdminUsers;


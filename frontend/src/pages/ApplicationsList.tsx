import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Files,
  Search,
  Filter,
  ArrowRight,
  RefreshCw,
  FileText,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import Layout from "../components/Layout";
import DecisionBadge from "../components/DecisionBadge";
import api from "../services/api";
import { LoanApplication } from "../types/api";
import { formatINR, formatPercent, formatDate } from "../utils/formatters";

export const ApplicationsList: React.FC = () => {
  const [applications, setApplications] = useState<LoanApplication[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 10;

  const loadApplications = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.applications.getAllApplicationsAdmin();
      setApplications(res.applications || []);
    } catch (err: any) {
      setError(err.message || "Failed to load application queue.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadApplications();
  }, []);

  // Filter & Search Logic
  const filteredApps = applications.filter((app) => {
    const matchesSearch =
      app.applicant_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.application_number.toLowerCase().includes(searchTerm.toLowerCase());

    const appStatus = app.latest_prediction?.recommendation || app.status || "UNDER_REVIEW";
    const matchesStatus =
      statusFilter === "ALL" || appStatus.toUpperCase() === statusFilter.toUpperCase();

    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.ceil(filteredApps.length / itemsPerPage) || 1;
  const paginatedApps = filteredApps.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <Layout variant="app">
      <div className="space-y-8 max-w-6xl pb-16">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-teal-100 border border-teal-200 text-teal-850 text-[11px] font-extrabold uppercase tracking-wider mb-1">
              <Files className="w-3.5 h-3.5 text-coral-500" />
              <span>PORTFOLIO APPLICATION QUEUE</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-teal-900 tracking-tight">
              Application Queue
            </h1>
            <p className="text-sm text-slate-600">
              Complete intake list of all loan applications submitted across the platform.
            </p>
          </div>

          <button
            onClick={loadApplications}
            disabled={loading}
            className="flex items-center space-x-2 px-4 py-2.5 rounded-xl border border-cream-300 bg-white text-slate-700 font-bold text-xs hover:bg-cream-50 transition-colors shadow-2xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Refresh Queue</span>
          </button>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-sm">
            {error}
          </div>
        )}

        {/* Filter & Search Bar */}
        <div className="crediwise-card p-4 sm:p-6 space-y-4">
          <div className="flex flex-col sm:flex-row items-center gap-4">
            {/* Search Input */}
            <div className="relative flex-1 w-full">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                <Search className="w-4 h-4 text-slate-400" />
              </div>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Search by applicant name or application number..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-cream-300 bg-cream-50/50 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-700 focus:bg-white"
              />
            </div>

            {/* Status Filter */}
            <div className="flex items-center space-x-2 w-full sm:w-auto">
              <Filter className="w-4 h-4 text-slate-400 flex-shrink-0" />
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="px-3 py-2.5 rounded-xl border border-cream-300 bg-cream-50/50 text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-700 focus:bg-white"
              >
                <option value="ALL">All Statuses ({applications.length})</option>
                <option value="APPROVED">Approved</option>
                <option value="REJECTED">Rejected</option>
                <option value="UNDER_REVIEW">Under Review</option>
              </select>
            </div>
          </div>
        </div>

        {/* Table Content */}
        <div className="crediwise-card p-6 sm:p-8 space-y-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="w-10 h-10 rounded-full border-4 border-teal-850 border-t-transparent animate-spin mb-4" />
              <p className="text-slate-600 text-sm font-medium">Loading Application Records...</p>
            </div>
          ) : filteredApps.length === 0 ? (
            <div className="p-12 text-center space-y-3 border-dashed border-2 border-cream-300 rounded-2xl bg-cream-50/40">
              <FileText className="w-10 h-10 text-slate-400 mx-auto" />
              <h3 className="text-base font-bold text-teal-900">No Applications Found</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                No application records match your current search or filter criteria.
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-cream-300 text-xs font-bold uppercase text-slate-400">
                    <tr>
                      <th className="pb-3 pr-4">App ID</th>
                      <th className="pb-3 px-4">Applicant</th>
                      <th className="pb-3 px-4">Date</th>
                      <th className="pb-3 px-4">Requested Loan</th>
                      <th className="pb-3 px-4">CIBIL</th>
                      <th className="pb-3 px-4">Status</th>
                      <th className="pb-3 px-4">Odds</th>
                      <th className="pb-3 pl-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-cream-200 text-slate-700">
                    {paginatedApps.map((app) => {
                      const pred = app.latest_prediction;
                      return (
                        <tr key={app.id} className="hover:bg-cream-50/60 transition-colors">
                          <td className="py-4 pr-4 font-bold text-teal-900">
                            {app.application_number}
                          </td>
                          <td className="py-4 px-4 font-medium text-slate-900">
                            {app.applicant_name}
                          </td>
                          <td className="py-4 px-4 text-xs text-slate-500">
                            {formatDate(app.created_at)}
                          </td>
                          <td className="py-4 px-4 font-bold text-slate-900">
                            {formatINR(app.loan_amount)}
                            <span className="text-[10px] text-slate-400 block font-normal">
                              {app.loan_term} Yrs • {formatINR(app.income_annum)} Income
                            </span>
                          </td>
                          <td className="py-4 px-4 font-bold text-slate-800">
                            {app.cibil_score}
                          </td>
                          <td className="py-4 px-4">
                            <DecisionBadge status={pred?.recommendation || app.status} size="sm" />
                          </td>
                          <td className="py-4 px-4">
                            {pred ? (
                              <span className="text-xs font-extrabold text-teal-900">
                                {formatPercent(pred.approval_probability)}
                              </span>
                            ) : (
                              <span className="text-xs text-slate-400">—</span>
                            )}
                          </td>
                          <td className="py-4 pl-4 text-right">
                            <Link
                              to={`/applications/${app.id}/result`}
                              className="inline-flex items-center space-x-1 text-xs font-bold text-teal-850 hover:text-coral-600 transition-colors"
                            >
                              <span>Inspect</span>
                              <ArrowRight className="w-3.5 h-3.5" />
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between pt-4 border-t border-cream-300 text-xs">
                  <span className="text-slate-500 font-medium">
                    Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
                    {Math.min(currentPage * itemsPerPage, filteredApps.length)} of {filteredApps.length} entries
                  </span>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="p-2 rounded-lg border border-cream-300 bg-white text-slate-700 hover:bg-cream-50 disabled:opacity-40 transition-colors"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="px-3 py-1 font-bold text-teal-900">
                      Page {currentPage} of {totalPages}
                    </span>
                    <button
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="p-2 rounded-lg border border-cream-300 bg-white text-slate-700 hover:bg-cream-50 disabled:opacity-40 transition-colors"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default ApplicationsList;

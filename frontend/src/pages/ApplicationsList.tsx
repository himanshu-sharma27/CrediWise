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
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-[#FBF4EC] border border-[#E2E5E9] text-[#1A2B4C] text-[11px] font-extrabold uppercase tracking-wider mb-1">
              <Files className="w-3.5 h-3.5 text-[#D4A373]" />
              <span>PORTFOLIO APPLICATION QUEUE</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-[#1A2B4C] tracking-tight">
              Application Queue
            </h1>
            <p className="text-sm text-[#4A5568]">
              Complete intake list of all loan applications submitted across the platform.
            </p>
          </div>

          <button
            onClick={loadApplications}
            disabled={loading}
            className="flex items-center space-x-2 px-4 py-2.5 rounded-xl border border-[#E2E5E9] bg-white text-[#1A2B4C] font-bold text-xs hover:bg-[#F8F9FA] transition-colors shadow-2xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Refresh Queue</span>
          </button>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-[#F8EEEE] border border-[#E5B8B3] text-[#7A332D] text-sm">
            {error}
          </div>
        )}

        {/* Filter & Search Bar */}
        <div className="crediwise-card p-4 sm:p-6 space-y-4">
          <div className="flex flex-col sm:flex-row items-center gap-4">
            {/* Search Input */}
            <div className="relative flex-1 w-full">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                <Search className="w-4 h-4 text-[#4A5568]" />
              </div>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Search by applicant name or application number..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#E2E5E9] bg-white text-sm text-[#1A2B4C] focus:outline-none focus:border-[#D4A373]"
              />
            </div>

            {/* Status Filter */}
            <div className="flex items-center space-x-2 w-full sm:w-auto">
              <Filter className="w-4 h-4 text-[#4A5568] flex-shrink-0" />
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="px-3 py-2.5 rounded-xl border border-[#E2E5E9] bg-white text-xs font-bold text-[#1A2B4C] focus:outline-none focus:border-[#D4A373]"
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
        <div className="crediwise-card overflow-hidden">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="w-10 h-10 rounded-full border-4 border-[#1A2B4C] border-t-transparent animate-spin mb-4" />
              <p className="text-[#4A5568] text-sm font-medium">Loading Application Records...</p>
            </div>
          ) : filteredApps.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <FileText className="w-10 h-10 text-[#4A5568] mx-auto" />
              <h3 className="text-base font-bold text-[#1A2B4C]">No Applications Found</h3>
              <p className="text-xs text-[#4A5568] max-w-sm mx-auto">
                No application records match your current search or filter criteria.
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-[#1A2B4C] text-white text-xs font-bold uppercase tracking-wider">
                    <tr>
                      <th className="py-3.5 px-6">App ID</th>
                      <th className="py-3.5 px-6">Applicant</th>
                      <th className="py-3.5 px-6">Date</th>
                      <th className="py-3.5 px-6">Requested Loan</th>
                      <th className="py-3.5 px-6">CIBIL</th>
                      <th className="py-3.5 px-6">Status</th>
                      <th className="py-3.5 px-6">Odds</th>
                      <th className="py-3.5 px-6 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E2E5E9] text-[#1A2B4C]">
                    {paginatedApps.map((app) => {
                      const pred = app.latest_prediction;
                      return (
                        <tr key={app.id} className="hover:bg-[#FBF4EC]/20 transition-colors">
                          <td className="py-4 px-6 font-bold text-[#1A2B4C]">
                            {app.application_number}
                          </td>
                          <td className="py-4 px-6 font-medium text-[#1A2B4C]">
                            {app.applicant_name}
                          </td>
                          <td className="py-4 px-6 text-xs text-[#4A5568]">
                            {formatDate(app.created_at)}
                          </td>
                          <td className="py-4 px-6 font-bold text-[#1A2B4C]">
                            {formatINR(app.loan_amount)}
                            <span className="text-[10px] text-[#4A5568] block font-normal">
                              {app.loan_term} Yrs • {formatINR(app.income_annum)} Income
                            </span>
                          </td>
                          <td className="py-4 px-6 font-bold text-[#1A2B4C]">
                            {app.cibil_score}
                          </td>
                          <td className="py-4 px-6">
                            <DecisionBadge status={pred?.recommendation || app.status} size="sm" />
                          </td>
                          <td className="py-4 px-6">
                            {pred ? (
                              <span className="text-xs font-extrabold text-[#1A2B4C]">
                                {formatPercent(pred.approval_probability)}
                              </span>
                            ) : (
                              <span className="text-xs text-[#4A5568]">—</span>
                            )}
                          </td>
                          <td className="py-4 px-6 text-right">
                            <Link
                              to={`/applications/${app.id}/result`}
                              className="inline-flex items-center space-x-1 text-xs font-bold text-[#D4A373] hover:text-[#1A2B4C] transition-colors"
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
                <div className="flex items-center justify-between p-6 border-t border-[#E2E5E9] text-xs">
                  <span className="text-[#4A5568] font-medium">
                    Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
                    {Math.min(currentPage * itemsPerPage, filteredApps.length)} of {filteredApps.length} entries
                  </span>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="p-2 rounded-lg border border-[#E2E5E9] bg-white text-[#1A2B4C] hover:bg-[#F8F9FA] disabled:opacity-40 transition-colors"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="px-3 py-1 font-bold text-[#1A2B4C]">
                      Page {currentPage} of {totalPages}
                    </span>
                    <button
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="p-2 rounded-lg border border-[#E2E5E9] bg-white text-[#1A2B4C] hover:bg-[#F8F9FA] disabled:opacity-40 transition-colors"
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


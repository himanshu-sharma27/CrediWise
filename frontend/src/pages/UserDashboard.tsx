import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  LayoutGrid,
  FilePlus,
  Sliders,
  CheckCircle2,
  ArrowRight,
  FileText,
  RefreshCw,
} from "lucide-react";
import Layout from "../components/Layout";
import DecisionBadge from "../components/DecisionBadge";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import { LoanApplication } from "../types/api";
import { formatINR, formatPercent, formatDate, getCibilTier } from "../utils/formatters";

export const UserDashboard: React.FC = () => {
  const { user } = useAuth();
  const [applications, setApplications] = useState<LoanApplication[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.applications.getMyApplications();
      setApplications(res.applications || []);
    } catch (err: any) {
      setError(err.message || "Failed to load applications history.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  // Compute Statistics
  const totalApps = applications.length;
  const approvedApps = applications.filter(
    (app) => app.status === "APPROVED" || app.latest_prediction?.recommendation === "APPROVED"
  ).length;
  const latestApp = applications[0];
  const latestProbability = latestApp?.latest_prediction?.approval_probability ?? null;
  const latestCibilTier = latestApp ? getCibilTier(latestApp.cibil_score) : null;

  return (
    <Layout variant="app">
      <div className="space-y-8 max-w-6xl pb-16">
        {/* Welcome Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-[#FBF4EC] border border-[#E7CBB0] text-[#79552F] text-[11px] font-extrabold uppercase tracking-wider mb-1">
              <LayoutGrid className="w-3.5 h-3.5 text-[#D4A373]" />
              <span>APPLICANT WORKSPACE</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-[#1A2B4C] tracking-tight">
              Welcome back, {user?.name || "Applicant"}
            </h1>
            <p className="text-sm text-[#4A5568]">
              Overview of your loan assessments, underwriting decisions, and financial simulation tools.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={loadDashboardData}
              disabled={loading}
              className="p-2.5 rounded-xl border border-[#CBD2DA] bg-white text-[#1A2B4C] hover:text-[#243A61] hover:bg-[#F3F4F6] transition-colors shadow-2xs"
              title="Refresh Dashboard"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </button>
            <Link
              to="/applications/new"
              className="flex items-center space-x-2 px-5 py-3 rounded-xl bg-[#1A2B4C] text-white font-bold text-sm hover:bg-[#243A61] transition-colors shadow-sm"
            >
              <FilePlus className="w-4 h-4 text-[#D4A373]" />
              <span>New Assessment</span>
            </Link>
          </div>
        </div>

        {/* Quick KPI Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="crediwise-card p-5 space-y-2">
            <span className="text-xs font-extrabold text-[#718096] uppercase tracking-wider block">
              Total Assessments
            </span>
            <div className="flex items-baseline space-x-2">
              <span className="text-3xl font-extrabold text-[#1A2B4C]">{totalApps}</span>
              <span className="text-xs text-[#718096]">Applications</span>
            </div>
            <p className="text-[11px] text-[#718096]">Submitted under your account</p>
          </div>

          <div className="crediwise-card p-5 space-y-2">
            <span className="text-xs font-extrabold text-[#718096] uppercase tracking-wider block">
              Approved Applications
            </span>
            <div className="flex items-baseline space-x-2">
              <span className="text-3xl font-extrabold text-[#1A2B4C]">{approvedApps}</span>
              <span className="text-xs text-[#4F6F52] font-bold">
                ({totalApps > 0 ? ((approvedApps / totalApps) * 100).toFixed(0) : 0}%)
              </span>
            </div>
            <p className="text-[11px] text-[#718096]">Qualified for sanction</p>
          </div>

          <div className="crediwise-card p-5 space-y-2">
            <span className="text-xs font-extrabold text-[#718096] uppercase tracking-wider block">
              Latest Approval Odds
            </span>
            <div className="flex items-baseline space-x-2">
              <span className="text-3xl font-extrabold text-[#1A2B4C]">
                {latestProbability !== null ? formatPercent(latestProbability) : "—"}
              </span>
            </div>
            <p className="text-[11px] text-[#718096]">
              {latestApp ? `Ref: ${latestApp.application_number.slice(0, 14)}...` : "No assessment yet"}
            </p>
          </div>

          <div className="crediwise-card p-5 space-y-2">
            <span className="text-xs font-extrabold text-[#718096] uppercase tracking-wider block">
              Credit Tier Rating
            </span>
            <div className="flex items-baseline space-x-2">
              <span className="text-2xl font-extrabold text-[#1A2B4C]">
                {latestApp ? `${latestApp.cibil_score} CIBIL` : "—"}
              </span>
            </div>
            <p className="text-[11px] text-[#718096] font-medium">
              {latestCibilTier ? latestCibilTier.label : "Awaiting Assessment"}
            </p>
          </div>
        </div>

        {/* Action Shortcuts */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link
            to="/applications/new"
            className="crediwise-card p-6 flex flex-col justify-between hover:border-[#D4A373] transition-all group"
          >
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-xl bg-[#FBF4EC] border border-[#E7CBB0] flex items-center justify-center text-[#1A2B4C] group-hover:scale-105 transition-transform">
                <FilePlus className="w-6 h-6 text-[#D4A373]" />
              </div>
              <h3 className="text-lg font-bold text-[#1A2B4C]">New Assessment</h3>
              <p className="text-xs text-[#4A5568] leading-relaxed">
                Submit an application with the 11 verified Kaggle INR parameters for calibrated ML risk scoring.
              </p>
            </div>
            <div className="pt-4 flex items-center space-x-1.5 text-xs font-bold text-[#1A2B4C] group-hover:text-[#D4A373] group-hover:translate-x-1 transition-all">
              <span>Start Assessment</span>
              <ArrowRight className="w-4 h-4 text-[#D4A373]" />
            </div>
          </Link>

          <Link
            to="/simulator"
            className="crediwise-card p-6 flex flex-col justify-between hover:border-[#D4A373] transition-all group"
          >
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-xl bg-[#FBF4EC] border border-[#E7CBB0] flex items-center justify-center text-[#1A2B4C] group-hover:scale-105 transition-transform">
                <Sliders className="w-6 h-6 text-[#D4A373]" />
              </div>
              <h3 className="text-lg font-bold text-[#1A2B4C]">What-If Simulator</h3>
              <p className="text-xs text-[#4A5568] leading-relaxed">
                Test adjustments to requested principal, tenure, and assets under identical ML inference rules.
              </p>
            </div>
            <div className="pt-4 flex items-center space-x-1.5 text-xs font-bold text-[#1A2B4C] group-hover:text-[#D4A373] group-hover:translate-x-1 transition-all">
              <span>Launch Simulator</span>
              <ArrowRight className="w-4 h-4 text-[#D4A373]" />
            </div>
          </Link>

          <Link
            to="/eligibility"
            className="crediwise-card p-6 flex flex-col justify-between hover:border-[#D4A373] transition-all group"
          >
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-xl bg-[#FBF4EC] border border-[#E7CBB0] flex items-center justify-center text-[#1A2B4C] group-hover:scale-105 transition-transform">
                <CheckCircle2 className="w-6 h-6 text-[#D4A373]" />
              </div>
              <h3 className="text-lg font-bold text-[#1A2B4C]">Eligibility Guide</h3>
              <p className="text-xs text-[#4A5568] leading-relaxed">
                Review official underwriting criteria, benchmarks, and CIBIL score distribution guides.
              </p>
            </div>
            <div className="pt-4 flex items-center space-x-1.5 text-xs font-bold text-[#1A2B4C] group-hover:text-[#D4A373] group-hover:translate-x-1 transition-all">
              <span>View Requirements</span>
              <ArrowRight className="w-4 h-4 text-[#D4A373]" />
            </div>
          </Link>
        </div>

        {/* Application History Table */}
        <div className="crediwise-card p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-[#1A2B4C]">Recent Loan Assessments</h2>
              <p className="text-xs text-[#718096] mt-0.5">
                Past applications evaluated under certified Gradient Boosting inference.
              </p>
            </div>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="w-8 h-8 rounded-full border-4 border-[#1A2B4C] border-t-transparent animate-spin mb-4" />
              <p className="text-[#718096] text-sm font-medium">Loading Assessment History...</p>
            </div>
          ) : error ? (
            <div className="p-4 rounded-xl bg-[#F8EEEE] border border-[#E5B8B3] text-[#7A332D] text-sm">
              {error}
            </div>
          ) : applications.length === 0 ? (
            /* Empty State */
            <div className="p-12 text-center space-y-4 border-dashed border-2 border-[#E2E5E9] rounded-2xl bg-[#F8F9FA]">
              <FileText className="w-12 h-12 text-[#718096] mx-auto" />
              <h3 className="text-lg font-bold text-[#1A2B4C]">No Assessments Yet</h3>
              <p className="text-xs sm:text-sm text-[#718096] max-w-md mx-auto leading-relaxed">
                You haven't submitted any loan applications yet. Complete the 11 verified parameters to receive instant ML risk insights.
              </p>
              <div className="pt-2">
                <Link
                  to="/applications/new"
                  className="inline-flex items-center space-x-2 px-6 py-3 rounded-xl bg-[#1A2B4C] text-white font-bold text-xs hover:bg-[#243A61] shadow-sm"
                >
                  <FilePlus className="w-4 h-4 text-[#D4A373]" />
                  <span>Start Your First Assessment</span>
                </Link>
              </div>
            </div>
          ) : (
            /* Applications Data List */
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-[#1A2B4C] text-white text-xs font-bold uppercase">
                  <tr>
                    <th className="py-3 px-4 rounded-l-lg">App Number</th>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Requested Loan</th>
                    <th className="py-3 px-4">CIBIL</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Odds</th>
                    <th className="py-3 px-4 text-right rounded-r-lg">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E5E9] text-[#4A5568]">
                  {applications.map((app) => {
                    const pred = app.latest_prediction;
                    return (
                      <tr key={app.id} className="hover:bg-[#F8F9FA] transition-colors">
                        <td className="py-4 px-4 font-bold text-[#1A2B4C]">
                          {app.application_number}
                        </td>
                        <td className="py-4 px-4 text-xs text-[#718096]">
                          {formatDate(app.created_at)}
                        </td>
                        <td className="py-4 px-4 font-bold text-[#1A2B4C]">
                          {formatINR(app.loan_amount)}
                          <span className="text-[10px] text-[#718096] block font-normal">
                            {app.loan_term} Years ({formatINR(app.income_annum)} Income)
                          </span>
                        </td>
                        <td className="py-4 px-4 font-bold text-[#1A2B4C]">
                          {app.cibil_score}
                        </td>
                        <td className="py-4 px-4">
                          <DecisionBadge status={pred?.recommendation || app.status} size="sm" />
                        </td>
                        <td className="py-4 px-4">
                          {pred ? (
                            <span className="text-xs font-extrabold text-[#1A2B4C]">
                              {formatPercent(pred.approval_probability)}
                            </span>
                          ) : (
                            <span className="text-xs text-[#718096]">—</span>
                          )}
                        </td>
                        <td className="py-4 px-4 text-right">
                          <Link
                            to={`/applications/${app.id}/result`}
                            className="inline-flex items-center space-x-1 text-xs font-bold text-[#1A2B4C] hover:text-[#D4A373] transition-colors"
                          >
                            <span>View Breakdown</span>
                            <ArrowRight className="w-3.5 h-3.5 text-[#D4A373]" />
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default UserDashboard;


import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ShieldAlert,
  ShieldCheck,
  Files,
  Users,
  BarChart3,
  Activity,
  ArrowRight,
  RefreshCw,
  Banknote,
  Percent,
} from "lucide-react";
import Layout from "../components/Layout";
import DecisionBadge from "../components/DecisionBadge";
import api from "../services/api";
import { AdminDashboardResponse } from "../types/api";
import { formatINR, formatPercent, formatLakhsCrores } from "../utils/formatters";

export const AdminDashboard: React.FC = () => {
  const [data, setData] = useState<AdminDashboardResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.admin.getDashboard();
      setData(res);
    } catch (err: any) {
      setError(err.message || "Failed to load administrative dashboard.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  return (
    <Layout variant="app">
      <div className="space-y-8 max-w-6xl pb-16">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-teal-100 border border-teal-200 text-teal-850 text-[11px] font-extrabold uppercase tracking-wider mb-1">
              <ShieldAlert className="w-3.5 h-3.5 text-coral-500" />
              <span>EXECUTIVE CONTROL CENTER</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-teal-900 tracking-tight">
              Administrative Command Center
            </h1>
            <p className="text-sm text-slate-600">
              Real-time loan portfolio monitoring, risk distribution, and ML model performance metrics.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={loadDashboard}
              disabled={loading}
              className="flex items-center space-x-2 px-4 py-2.5 rounded-xl border border-cream-300 bg-white text-slate-700 font-bold text-xs hover:bg-cream-50 transition-colors shadow-2xs"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              <span>Refresh Metrics</span>
            </button>
          </div>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-sm">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-10 h-10 rounded-full border-4 border-teal-850 border-t-transparent animate-spin mb-4" />
            <p className="text-slate-600 text-sm font-medium">Aggregating Portfolio Telemetry...</p>
          </div>
        ) : data ? (
          <>
            {/* Top KPI Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              <div className="crediwise-card p-5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">
                    Total Applications
                  </span>
                  <Files className="w-4 h-4 text-teal-750" />
                </div>
                <div className="text-3xl font-extrabold text-teal-900">
                  {data.total_applications}
                </div>
                <p className="text-[11px] text-slate-500">Total pipeline intake</p>
              </div>

              <div className="crediwise-card p-5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">
                    Approval Rate
                  </span>
                  <Percent className="w-4 h-4 text-teal-700" />
                </div>
                <div className="flex items-baseline space-x-2">
                  <span className="text-3xl font-extrabold text-teal-800">
                    {data.approval_rate}%
                  </span>
                  <span className="text-xs text-slate-400 font-medium">
                    ({data.approved_applications} Approved)
                  </span>
                </div>
                <p className="text-[11px] text-slate-500">Kaggle benchmark calibrated</p>
              </div>

              <div className="crediwise-card p-5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">
                    Requested Volume
                  </span>
                  <Banknote className="w-4 h-4 text-teal-750" />
                </div>
                <div className="text-2xl sm:text-3xl font-extrabold text-teal-900">
                  {formatLakhsCrores(data.total_requested_loan_amount)}
                </div>
                <p className="text-[11px] text-slate-500">
                  Avg Loan: {formatLakhsCrores(data.average_loan_amount)}
                </p>
              </div>

              <div className="crediwise-card p-5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">
                    Average CIBIL
                  </span>
                  <ShieldCheck className="w-4 h-4 text-teal-750" />
                </div>
                <div className="text-3xl font-extrabold text-teal-900">
                  {data.average_cibil_score}
                </div>
                <p className="text-[11px] text-slate-500">Portfolio credit benchmark</p>
              </div>
            </div>

            {/* Middle Section: Risk Distribution & Quick Navigation */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Risk Distribution Card */}
              <div className="lg:col-span-6 crediwise-card p-6 sm:p-8 space-y-6">
                <div className="flex items-center justify-between pb-3 border-b border-cream-300">
                  <div>
                    <h2 className="text-lg font-bold text-teal-900">Underwriting Risk Tiers</h2>
                    <p className="text-xs text-slate-500">Distribution across active ML assessments</p>
                  </div>
                  <BarChart3 className="w-5 h-5 text-teal-750" />
                </div>

                <div className="space-y-4">
                  {/* Low Risk */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs font-bold">
                      <span className="text-emerald-800">Low Risk (Prime Approval)</span>
                      <span className="text-teal-900">{data.risk_distribution.LOW || 0} Apps</span>
                    </div>
                    <div className="w-full bg-cream-200 rounded-full h-2.5 overflow-hidden">
                      <div
                        className="bg-emerald-600 h-full rounded-full"
                        style={{
                          width: `${data.total_applications > 0 ? ((data.risk_distribution.LOW || 0) / data.total_applications) * 100 : 0}%`,
                        }}
                      />
                    </div>
                  </div>

                  {/* Medium Risk */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs font-bold">
                      <span className="text-amber-800">Moderate Risk (Conditional)</span>
                      <span className="text-teal-900">{data.risk_distribution.MEDIUM || 0} Apps</span>
                    </div>
                    <div className="w-full bg-cream-200 rounded-full h-2.5 overflow-hidden">
                      <div
                        className="bg-amber-500 h-full rounded-full"
                        style={{
                          width: `${data.total_applications > 0 ? ((data.risk_distribution.MEDIUM || 0) / data.total_applications) * 100 : 0}%`,
                        }}
                      />
                    </div>
                  </div>

                  {/* High Risk */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs font-bold">
                      <span className="text-rose-800">High Risk (Subprime Threshold)</span>
                      <span className="text-teal-900">{data.risk_distribution.HIGH || 0} Apps</span>
                    </div>
                    <div className="w-full bg-cream-200 rounded-full h-2.5 overflow-hidden">
                      <div
                        className="bg-rose-600 h-full rounded-full"
                        style={{
                          width: `${data.total_applications > 0 ? ((data.risk_distribution.HIGH || 0) / data.total_applications) * 100 : 0}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Administrative Shortcuts */}
              <div className="lg:col-span-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Link
                  to="/admin/applications"
                  className="crediwise-card p-5 space-y-3 hover:border-teal-300 transition-all group"
                >
                  <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-800 group-hover:scale-105 transition-transform">
                    <Files className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-teal-900 text-base">Application Queue</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Review and search all submitted applicant portfolios across the platform.
                  </p>
                  <div className="flex items-center space-x-1 text-xs font-bold text-teal-850 group-hover:translate-x-1 transition-transform pt-1">
                    <span>Inspect Queue</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </Link>

                <Link
                  to="/admin/users"
                  className="crediwise-card p-5 space-y-3 hover:border-teal-300 transition-all group"
                >
                  <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-800 group-hover:scale-105 transition-transform">
                    <Users className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-teal-900 text-base">User Directory</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Manage registered platform applicants and access privilege roles.
                  </p>
                  <div className="flex items-center space-x-1 text-xs font-bold text-teal-850 group-hover:translate-x-1 transition-transform pt-1">
                    <span>Manage Users</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </Link>

                <Link
                  to="/admin/analytics"
                  className="crediwise-card p-5 space-y-3 hover:border-teal-300 transition-all group"
                >
                  <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-800 group-hover:scale-105 transition-transform">
                    <BarChart3 className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-teal-900 text-base">Portfolio Analytics</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Examine CIBIL bands, loan size distribution, and demographic breakdowns.
                  </p>
                  <div className="flex items-center space-x-1 text-xs font-bold text-teal-850 group-hover:translate-x-1 transition-transform pt-1">
                    <span>View Analytics</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </Link>

                <Link
                  to="/admin/monitoring"
                  className="crediwise-card p-5 space-y-3 hover:border-teal-300 transition-all group"
                >
                  <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-800 group-hover:scale-105 transition-transform">
                    <Activity className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-teal-900 text-base">Model Telemetry</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Track Gradient Boosting ML latency, test metrics, and feature importances.
                  </p>
                  <div className="flex items-center space-x-1 text-xs font-bold text-teal-850 group-hover:translate-x-1 transition-transform pt-1">
                    <span>View Telemetry</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </Link>
              </div>
            </div>

            {/* Recent Applications Table */}
            <div className="crediwise-card p-6 sm:p-8 space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-teal-900">Recent Applications Intake</h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Latest submissions received across the platform.
                  </p>
                </div>
                <Link
                  to="/admin/applications"
                  className="text-xs font-bold text-teal-850 hover:text-coral-600 transition-colors"
                >
                  View All ({data.total_applications}) →
                </Link>
              </div>

              {data.recent_applications.length === 0 ? (
                <p className="text-xs text-slate-500 py-6 text-center italic">
                  No applications recorded in the database yet.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="border-b border-cream-300 text-xs font-bold uppercase text-slate-400">
                      <tr>
                        <th className="pb-3 pr-4">App ID</th>
                        <th className="pb-3 px-4">Applicant</th>
                        <th className="pb-3 px-4">Requested Loan</th>
                        <th className="pb-3 px-4">CIBIL</th>
                        <th className="pb-3 px-4">Status</th>
                        <th className="pb-3 px-4">Odds</th>
                        <th className="pb-3 pl-4 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-cream-200 text-slate-700">
                      {data.recent_applications.map((app) => {
                        const pred = app.latest_prediction;
                        return (
                          <tr key={app.id} className="hover:bg-cream-50/60 transition-colors">
                            <td className="py-4 pr-4 font-bold text-teal-900">
                              {app.application_number}
                            </td>
                            <td className="py-4 px-4 font-medium text-slate-900">
                              {app.applicant_name}
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
              )}
            </div>
          </>
        ) : null}
      </div>
    </Layout>
  );
};

export default AdminDashboard;

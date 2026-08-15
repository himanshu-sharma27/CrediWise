import React, { useEffect, useState } from "react";
import {
  BarChart3,
  RefreshCw,
  Banknote,
  Briefcase,
  ShieldCheck,
  PieChart,
} from "lucide-react";
import Layout from "../components/Layout";
import api from "../services/api";
import { AdminAnalyticsResponse } from "../types/api";
import { formatLakhsCrores } from "../utils/formatters";

export const Analytics: React.FC = () => {
  const [analytics, setAnalytics] = useState<AdminAnalyticsResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.admin.getAnalytics();
      setAnalytics(res);
    } catch (err: any) {
      setError(err.message || "Failed to load analytics data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnalytics();
  }, []);

  const renderDistributionBar = (
    label: string,
    count: number,
    total: number,
    colorClass: string
  ) => {
    const percentage = total > 0 ? (count / total) * 100 : 0;
    return (
      <div className="space-y-1.5" key={label}>
        <div className="flex justify-between text-xs font-bold">
          <span className="text-slate-700">{label}</span>
          <span className="text-teal-900 font-extrabold">
            {count} ({percentage.toFixed(1)}%)
          </span>
        </div>
        <div className="w-full bg-cream-200 rounded-full h-2.5 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-700 ${colorClass}`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
    );
  };

  return (
    <Layout variant="app">
      <div className="space-y-8 max-w-6xl pb-16">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-teal-100 border border-teal-200 text-teal-850 text-[11px] font-extrabold uppercase tracking-wider mb-1">
              <BarChart3 className="w-3.5 h-3.5 text-coral-500" />
              <span>PORTFOLIO INTELLIGENCE &amp; ANALYTICS</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-teal-900 tracking-tight">
              Portfolio Risk Analytics
            </h1>
            <p className="text-sm text-slate-600">
              Aggregated distribution patterns, credit tiers, and collateral coverage across submitted loans.
            </p>
          </div>

          <button
            onClick={loadAnalytics}
            disabled={loading}
            className="flex items-center space-x-2 px-4 py-2.5 rounded-xl border border-cream-300 bg-white text-slate-700 font-bold text-xs hover:bg-cream-50 transition-colors shadow-2xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Refresh Analytics</span>
          </button>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-sm">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-10 h-10 rounded-full border-4 border-teal-850 border-t-transparent animate-spin mb-4" />
            <p className="text-slate-600 text-sm font-medium">Aggregating Risk Distributions...</p>
          </div>
        ) : analytics ? (
          <>
            {/* Top KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              <div className="crediwise-card p-5 space-y-1">
                <span className="text-xs font-extrabold text-slate-500 uppercase tracking-wider block">
                  Total Intake Volume
                </span>
                <span className="text-3xl font-extrabold text-teal-900">
                  {formatLakhsCrores(analytics.total_loan_volume)}
                </span>
                <p className="text-[11px] text-slate-500">Across {analytics.total_applications} applications</p>
              </div>

              <div className="crediwise-card p-5 space-y-1">
                <span className="text-xs font-extrabold text-slate-500 uppercase tracking-wider block">
                  Collateral Backing
                </span>
                <span className="text-3xl font-extrabold text-teal-800">
                  {formatLakhsCrores(analytics.total_asset_volume)}
                </span>
                <p className="text-[11px] text-slate-500">Total pledgeable assets</p>
              </div>

              <div className="crediwise-card p-5 space-y-1">
                <span className="text-xs font-extrabold text-slate-500 uppercase tracking-wider block">
                  Approval Rate
                </span>
                <span className="text-3xl font-extrabold text-teal-700">
                  {analytics.approval_rate}%
                </span>
                <p className="text-[11px] text-slate-500">{analytics.approved_count} approvals recorded</p>
              </div>

              <div className="crediwise-card p-5 space-y-1">
                <span className="text-xs font-extrabold text-slate-500 uppercase tracking-wider block">
                  Rejection Rate
                </span>
                <span className="text-3xl font-extrabold text-coral-600">
                  {analytics.rejection_rate}%
                </span>
                <p className="text-[11px] text-slate-500">{analytics.rejected_count} high risk rejections</p>
              </div>
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* CIBIL Score Distribution */}
              <div className="crediwise-card p-6 sm:p-8 space-y-6">
                <div className="flex items-center space-x-3 pb-3 border-b border-cream-300">
                  <div className="w-8 h-8 rounded-lg bg-teal-100 text-teal-850 flex items-center justify-center">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-teal-900">CIBIL Score Bands</h2>
                    <p className="text-xs text-slate-500">Credit bureau score stratification</p>
                  </div>
                </div>

                <div className="space-y-4">
                  {Object.entries(analytics.cibil_bands).map(([band, count]) => {
                    const color =
                      band.includes("Prime")
                        ? "bg-emerald-600"
                        : band.includes("Good")
                        ? "bg-teal-600"
                        : band.includes("Fair")
                        ? "bg-amber-500"
                        : "bg-rose-600";
                    return renderDistributionBar(
                      band,
                      count,
                      analytics.total_applications,
                      color
                    );
                  })}
                </div>
              </div>

              {/* Loan Amount Distribution */}
              <div className="crediwise-card p-6 sm:p-8 space-y-6">
                <div className="flex items-center space-x-3 pb-3 border-b border-cream-300">
                  <div className="w-8 h-8 rounded-lg bg-teal-100 text-teal-850 flex items-center justify-center">
                    <Banknote className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-teal-900">Loan Principal Tiers</h2>
                    <p className="text-xs text-slate-500">Requested amount brackets (INR)</p>
                  </div>
                </div>

                <div className="space-y-4">
                  {Object.entries(analytics.loan_amount_bands).map(([tier, count]) =>
                    renderDistributionBar(
                      tier,
                      count,
                      analytics.total_applications,
                      "bg-teal-750"
                    )
                  )}
                </div>
              </div>

              {/* Risk Classification Distribution */}
              <div className="crediwise-card p-6 sm:p-8 space-y-6">
                <div className="flex items-center space-x-3 pb-3 border-b border-cream-300">
                  <div className="w-8 h-8 rounded-lg bg-coral-100 text-coral-700 flex items-center justify-center">
                    <PieChart className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-teal-900">Underwriting Risk Tiers</h2>
                    <p className="text-xs text-slate-500">Model-calibrated risk level breakdown</p>
                  </div>
                </div>

                <div className="space-y-4">
                  {renderDistributionBar(
                    "Low Risk",
                    analytics.risk_distribution.LOW || 0,
                    analytics.total_applications,
                    "bg-emerald-600"
                  )}
                  {renderDistributionBar(
                    "Moderate Risk",
                    analytics.risk_distribution.MEDIUM || 0,
                    analytics.total_applications,
                    "bg-amber-500"
                  )}
                  {renderDistributionBar(
                    "High Risk",
                    analytics.risk_distribution.HIGH || 0,
                    analytics.total_applications,
                    "bg-rose-600"
                  )}
                </div>
              </div>

              {/* Demographics: Education & Employment */}
              <div className="crediwise-card p-6 sm:p-8 space-y-6">
                <div className="flex items-center space-x-3 pb-3 border-b border-cream-300">
                  <div className="w-8 h-8 rounded-lg bg-teal-100 text-teal-850 flex items-center justify-center">
                    <Briefcase className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-teal-900">Applicant Demographics</h2>
                    <p className="text-xs text-slate-500">Education and employment splits</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <span className="text-[11px] font-bold uppercase text-slate-400 block">Education</span>
                  {Object.entries(analytics.education_distribution).map(([ed, count]) =>
                    renderDistributionBar(
                      ed,
                      count,
                      analytics.total_applications,
                      "bg-teal-800"
                    )
                  )}

                  <span className="text-[11px] font-bold uppercase text-slate-400 block pt-2">Employment</span>
                  {Object.entries(analytics.employment_distribution).map(([emp, count]) =>
                    renderDistributionBar(
                      emp,
                      count,
                      analytics.total_applications,
                      "bg-coral-600"
                    )
                  )}
                </div>
              </div>
            </div>
          </>
        ) : null}
      </div>
    </Layout>
  );
};

export default Analytics;

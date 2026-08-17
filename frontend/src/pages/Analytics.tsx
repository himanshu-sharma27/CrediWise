import React, { useEffect, useState } from "react";
import {
  BarChart3,
  RefreshCw,
  Banknote,
  Briefcase,
  Award,
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
          <span className="text-[#1A2B4C]">{label}</span>
          <span className="text-[#1A2B4C] font-extrabold">
            {count} ({percentage.toFixed(1)}%)
          </span>
        </div>
        <div className="w-full bg-[#E2E5E9] rounded-full h-2.5 overflow-hidden">
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
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-[#FBF4EC] border border-[#E2E5E9] text-[#1A2B4C] text-[11px] font-extrabold uppercase tracking-wider mb-1">
              <BarChart3 className="w-3.5 h-3.5 text-[#D4A373]" />
              <span>PORTFOLIO INTELLIGENCE &amp; ANALYTICS</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-[#1A2B4C] tracking-tight">
              Portfolio Risk Analytics
            </h1>
            <p className="text-sm text-[#4A5568]">
              Aggregated distribution patterns, credit tiers, and collateral coverage across submitted loans.
            </p>
          </div>

          <button
            onClick={loadAnalytics}
            disabled={loading}
            className="flex items-center space-x-2 px-4 py-2.5 rounded-xl border border-[#E2E5E9] bg-white text-[#1A2B4C] font-bold text-xs hover:bg-[#F8F9FA] transition-colors shadow-2xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Refresh Analytics</span>
          </button>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-[#F8EEEE] border border-[#E5B8B3] text-[#7A332D] text-sm">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-10 h-10 rounded-full border-4 border-[#1A2B4C] border-t-transparent animate-spin mb-4" />
            <p className="text-[#4A5568] text-sm font-medium">Aggregating Risk Distributions...</p>
          </div>
        ) : analytics ? (
          <>
            {/* Top KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              <div className="crediwise-card p-5 space-y-1">
                <span className="text-xs font-extrabold text-[#4A5568] uppercase tracking-wider block">
                  Total Intake Volume
                </span>
                <span className="text-3xl font-extrabold text-[#1A2B4C]">
                  {formatLakhsCrores(analytics.total_loan_volume)}
                </span>
                <p className="text-[11px] text-[#4A5568]">Across {analytics.total_applications} applications</p>
              </div>

              <div className="crediwise-card p-5 space-y-1">
                <span className="text-xs font-extrabold text-[#4A5568] uppercase tracking-wider block">
                  Collateral Backing
                </span>
                <span className="text-3xl font-extrabold text-[#1A2B4C]">
                  {formatLakhsCrores(analytics.total_asset_volume)}
                </span>
                <p className="text-[11px] text-[#4A5568]">Total pledgeable assets</p>
              </div>

              <div className="crediwise-card p-5 space-y-1">
                <span className="text-xs font-extrabold text-[#4A5568] uppercase tracking-wider block">
                  Approval Rate
                </span>
                <span className="text-3xl font-extrabold text-[#D4A373]">
                  {analytics.approval_rate}%
                </span>
                <p className="text-[11px] text-[#4A5568]">{analytics.approved_count} approvals recorded</p>
              </div>

              <div className="crediwise-card p-5 space-y-1">
                <span className="text-xs font-extrabold text-[#4A5568] uppercase tracking-wider block">
                  Rejection Rate
                </span>
                <span className="text-3xl font-extrabold text-[#A6534A]">
                  {analytics.rejection_rate}%
                </span>
                <p className="text-[11px] text-[#4A5568]">{analytics.rejected_count} high risk rejections</p>
              </div>
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* CIBIL Score Distribution */}
              <div className="crediwise-card p-6 sm:p-8 space-y-6">
                <div className="flex items-center space-x-3 pb-3 border-b border-[#E2E5E9]">
                  <div className="w-8 h-8 rounded-lg bg-[#FBF4EC] text-[#1A2B4C] flex items-center justify-center">
                    <Award className="w-4 h-4 text-[#D4A373]" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-[#1A2B4C]">CIBIL Score Bands</h2>
                    <p className="text-xs text-[#4A5568]">Credit bureau score stratification</p>
                  </div>
                </div>

                <div className="space-y-4">
                  {Object.entries(analytics.cibil_bands).map(([band, count]) => {
                    const color =
                      band.includes("Prime")
                        ? "bg-[#D4A373]"
                        : band.includes("Good")
                        ? "bg-[#1A2B4C]"
                        : band.includes("Fair")
                        ? "bg-[#D4A373]"
                        : "bg-[#A6534A]";
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
                <div className="flex items-center space-x-3 pb-3 border-b border-[#E2E5E9]">
                  <div className="w-8 h-8 rounded-lg bg-[#FBF4EC] text-[#1A2B4C] flex items-center justify-center">
                    <Banknote className="w-4 h-4 text-[#D4A373]" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-[#1A2B4C]">Loan Principal Tiers</h2>
                    <p className="text-xs text-[#4A5568]">Requested amount brackets (INR)</p>
                  </div>
                </div>

                <div className="space-y-4">
                  {Object.entries(analytics.loan_amount_bands).map(([tier, count]) =>
                    renderDistributionBar(
                      tier,
                      count,
                      analytics.total_applications,
                      "bg-[#D4A373]"
                    )
                  )}
                </div>
              </div>

              {/* Risk Classification Distribution */}
              <div className="crediwise-card p-6 sm:p-8 space-y-6">
                <div className="flex items-center space-x-3 pb-3 border-b border-[#E2E5E9]">
                  <div className="w-8 h-8 rounded-lg bg-[#FBF4EC] text-[#1A2B4C] flex items-center justify-center">
                    <PieChart className="w-4 h-4 text-[#D4A373]" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-[#1A2B4C]">Underwriting Risk Tiers</h2>
                    <p className="text-xs text-[#4A5568]">Model-calibrated risk level breakdown</p>
                  </div>
                </div>

                <div className="space-y-4">
                  {renderDistributionBar(
                    "Low Risk",
                    analytics.risk_distribution.LOW || 0,
                    analytics.total_applications,
                    "bg-[#D4A373]"
                  )}
                  {renderDistributionBar(
                    "Moderate Risk",
                    analytics.risk_distribution.MEDIUM || 0,
                    analytics.total_applications,
                    "bg-[#D4A373]"
                  )}
                  {renderDistributionBar(
                    "High Risk",
                    analytics.risk_distribution.HIGH || 0,
                    analytics.total_applications,
                    "bg-[#A6534A]"
                  )}
                </div>
              </div>

              {/* Demographics: Education & Employment */}
              <div className="crediwise-card p-6 sm:p-8 space-y-6">
                <div className="flex items-center space-x-3 pb-3 border-b border-[#E2E5E9]">
                  <div className="w-8 h-8 rounded-lg bg-[#FBF4EC] text-[#1A2B4C] flex items-center justify-center">
                    <Briefcase className="w-4 h-4 text-[#D4A373]" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-[#1A2B4C]">Applicant Demographics</h2>
                    <p className="text-xs text-[#4A5568]">Education and employment splits</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <span className="text-[11px] font-bold uppercase text-[#4A5568] block">Education</span>
                  {Object.entries(analytics.education_distribution).map(([ed, count]) =>
                    renderDistributionBar(
                      ed,
                      count,
                      analytics.total_applications,
                      "bg-[#1A2B4C]"
                    )
                  )}

                  <span className="text-[11px] font-bold uppercase text-[#4A5568] block pt-2">Employment</span>
                  {Object.entries(analytics.employment_distribution).map(([emp, count]) =>
                    renderDistributionBar(
                      emp,
                      count,
                      analytics.total_applications,
                      "bg-[#D4A373]"
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


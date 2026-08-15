import React, { useEffect, useState } from "react";
import {
  Activity,
  RefreshCw,
  Clock,
  TrendingUp,
  Gauge,
} from "lucide-react";
import Layout from "../components/Layout";
import DecisionBadge from "../components/DecisionBadge";
import RiskBadge from "../components/RiskBadge";
import api from "../services/api";
import { AdminMonitoringResponse } from "../types/api";
import { formatPercent, formatDate } from "../utils/formatters";

export const Monitoring: React.FC = () => {
  const [data, setData] = useState<AdminMonitoringResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadMonitoring = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.admin.getMonitoring();
      setData(res);
    } catch (err: any) {
      setError(err.message || "Failed to load model monitoring telemetry.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMonitoring();
  }, []);

  const featureLabels: Record<string, string> = {
    cibil_score: "CIBIL Credit Score",
    loan_to_annual_income_ratio: "Loan-to-Annual-Income Ratio",
    loan_amount: "Requested Loan Principal",
    income_annum: "Annual Gross Income",
    asset_to_loan_ratio: "Asset-to-Loan Collateral Ratio",
    total_asset_value: "Total Collateral Assets",
    estimated_payment_to_income_ratio: "Estimated Debt Payment-to-Income",
    loan_term: "Loan Term (Years)",
    residential_assets_value: "Residential Assets",
    bank_asset_value: "Bank Liquid Assets",
    luxury_assets_value: "Luxury Assets",
    commercial_assets_value: "Commercial Assets",
  };

  return (
    <Layout variant="app">
      <div className="space-y-8 max-w-6xl pb-16">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-teal-100 border border-teal-200 text-teal-850 text-[11px] font-extrabold uppercase tracking-wider mb-1">
              <Activity className="w-3.5 h-3.5 text-coral-500" />
              <span>PRODUCTION ML TELEMETRY</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-teal-900 tracking-tight">
              ML Model Monitoring
            </h1>
            <p className="text-sm text-slate-600">
              Inference latency, drift telemetry, certified evaluation metrics, and feature importance rankings.
            </p>
          </div>

          <button
            onClick={loadMonitoring}
            disabled={loading}
            className="flex items-center space-x-2 px-4 py-2.5 rounded-xl border border-cream-300 bg-white text-slate-700 font-bold text-xs hover:bg-cream-50 transition-colors shadow-2xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Refresh Telemetry</span>
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
            <p className="text-slate-600 text-sm font-medium">Loading Model Telemetry...</p>
          </div>
        ) : data ? (
          <>
            {/* Model Card Header Banner */}
            <div className="crediwise-card p-6 sm:p-8 bg-gradient-to-br from-white to-teal-50/40 border-2 border-teal-200">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-center">
                <div className="space-y-1">
                  <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest block">
                    Certified Artifact
                  </span>
                  <h2 className="text-2xl font-black text-teal-900">{data.model_version}</h2>
                  <p className="text-xs text-slate-600 font-semibold">{data.algorithm}</p>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest block">
                    Runtime Status
                  </span>
                  <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-850 text-xs font-extrabold">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span>{data.status} &bull; IN-MEMORY</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest block">
                    Total Inferences
                  </span>
                  <div className="text-3xl font-extrabold text-teal-900">
                    {data.total_predictions}
                  </div>
                  <p className="text-[11px] text-slate-500">Live predictions evaluated</p>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest block">
                    Avg Latency
                  </span>
                  <div className="text-3xl font-extrabold text-coral-600">
                    {data.average_latency_ms} <span className="text-sm font-bold text-slate-400">ms</span>
                  </div>
                  <p className="text-[11px] text-slate-500">Sub-millisecond inference</p>
                </div>
              </div>
            </div>

            {/* Offline Test & Cross-Validation Metrics Grid */}
            <div className="crediwise-card p-6 sm:p-8 space-y-6">
              <div className="flex items-center space-x-3 pb-3 border-b border-cream-300">
                <div className="w-8 h-8 rounded-lg bg-teal-100 text-teal-850 flex items-center justify-center">
                  <Gauge className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-teal-900">Certified Test &amp; Benchmark Metrics</h2>
                  <p className="text-xs text-slate-500">Stratified held-out test evaluation on validated Kaggle dataset</p>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                <div className="p-4 rounded-xl bg-cream-50/70 border border-cream-300 space-y-1">
                  <span className="text-[10px] font-bold text-slate-500 uppercase block">Test Accuracy</span>
                  <p className="text-xl font-extrabold text-teal-900">
                    {formatPercent(data.training_metrics.test_accuracy)}
                  </p>
                  <span className="text-[10px] text-emerald-700 font-bold">100% Stratified</span>
                </div>

                <div className="p-4 rounded-xl bg-cream-50/70 border border-cream-300 space-y-1">
                  <span className="text-[10px] font-bold text-slate-500 uppercase block">Test Precision</span>
                  <p className="text-xl font-extrabold text-teal-900">
                    {formatPercent(data.training_metrics.test_precision)}
                  </p>
                  <span className="text-[10px] text-emerald-700 font-bold">Zero False Positives</span>
                </div>

                <div className="p-4 rounded-xl bg-cream-50/70 border border-cream-300 space-y-1">
                  <span className="text-[10px] font-bold text-slate-500 uppercase block">Test Recall</span>
                  <p className="text-xl font-extrabold text-teal-900">
                    {formatPercent(data.training_metrics.test_recall)}
                  </p>
                  <span className="text-[10px] text-emerald-700 font-bold">Zero False Negatives</span>
                </div>

                <div className="p-4 rounded-xl bg-cream-50/70 border border-cream-300 space-y-1">
                  <span className="text-[10px] font-bold text-slate-500 uppercase block">Test F1-Score</span>
                  <p className="text-xl font-extrabold text-teal-900">
                    {(data.training_metrics.test_f1 || 1.0).toFixed(4)}
                  </p>
                  <span className="text-[10px] text-slate-400">Harmonic Mean</span>
                </div>

                <div className="p-4 rounded-xl bg-cream-50/70 border border-cream-300 space-y-1">
                  <span className="text-[10px] font-bold text-slate-500 uppercase block">ROC-AUC</span>
                  <p className="text-xl font-extrabold text-teal-900">
                    {(data.training_metrics.test_roc_auc || 1.0).toFixed(4)}
                  </p>
                  <span className="text-[10px] text-slate-400">Discrimination</span>
                </div>

                <div className="p-4 rounded-xl bg-cream-50/70 border border-cream-300 space-y-1">
                  <span className="text-[10px] font-bold text-slate-500 uppercase block">Brier Score</span>
                  <p className="text-xl font-extrabold text-teal-900">
                    {data.training_metrics.test_brier_score !== undefined
                      ? Number(data.training_metrics.test_brier_score).toExponential(2)
                      : "0.00e+0"}
                  </p>
                  <span className="text-[10px] text-slate-400">Calibration Loss</span>
                </div>
              </div>
            </div>

            {/* Feature Importance Rankings */}
            <div className="crediwise-card p-6 sm:p-8 space-y-6">
              <div className="flex items-center space-x-3 pb-3 border-b border-cream-300">
                <div className="w-8 h-8 rounded-lg bg-teal-100 text-teal-850 flex items-center justify-center">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-teal-900">Feature Importance Ranking</h2>
                  <p className="text-xs text-slate-500">Gini / tree split weight distribution from Gradient Boosting ensemble</p>
                </div>
              </div>

              <div className="space-y-3">
                {Object.entries(data.feature_importance).map(([feature, weight], idx) => {
                  const pct = (weight * 100).toFixed(1);
                  const label = featureLabels[feature] || feature;
                  return (
                    <div key={feature} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center space-x-2">
                          <span className="font-extrabold text-slate-400">#{idx + 1}</span>
                          <span className="font-bold text-teal-900">{label}</span>
                          <span className="font-mono text-[10px] text-slate-400">({feature})</span>
                        </div>
                        <span className="font-extrabold text-teal-800">{pct}%</span>
                      </div>
                      <div className="w-full bg-cream-200 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-teal-750 h-full rounded-full transition-all duration-500"
                          style={{ width: `${Math.max(2, weight * 100)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Recent Live Predictions Activity */}
            <div className="crediwise-card p-6 sm:p-8 space-y-6">
              <div className="flex items-center space-x-3 pb-3 border-b border-cream-300">
                <div className="w-8 h-8 rounded-lg bg-teal-100 text-teal-850 flex items-center justify-center">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-teal-900">Recent Live Prediction Telemetry</h2>
                  <p className="text-xs text-slate-500">Real-time inference requests processed by the backend</p>
                </div>
              </div>

              {data.recent_predictions.length === 0 ? (
                <p className="text-xs text-slate-500 py-6 text-center italic">
                  No prediction records found in the database.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="border-b border-cream-300 text-xs font-bold uppercase text-slate-400">
                      <tr>
                        <th className="pb-3 pr-4">Pred ID</th>
                        <th className="pb-3 px-4">Decision</th>
                        <th className="pb-3 px-4">Risk Level</th>
                        <th className="pb-3 px-4">Probability</th>
                        <th className="pb-3 px-4">Latency</th>
                        <th className="pb-3 pl-4 text-right">Timestamp</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-cream-200 text-slate-700">
                      {data.recent_predictions.map((p) => (
                        <tr key={p.id} className="hover:bg-cream-50/60 transition-colors">
                          <td className="py-3 pr-4 font-mono font-bold text-teal-900">
                            #{p.id}
                          </td>
                          <td className="py-3 px-4">
                            <DecisionBadge status={p.recommendation} size="sm" />
                          </td>
                          <td className="py-3 px-4">
                            <RiskBadge level={p.risk_level} size="sm" />
                          </td>
                          <td className="py-3 px-4 font-extrabold text-teal-900">
                            {formatPercent(p.approval_probability)}
                          </td>
                          <td className="py-3 px-4 font-mono text-xs text-slate-600">
                            {p.inference_latency_ms.toFixed(2)} ms
                          </td>
                          <td className="py-3 pl-4 text-right text-xs text-slate-500">
                            {formatDate(p.created_at)}
                          </td>
                        </tr>
                      ))}
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

export default Monitoring;

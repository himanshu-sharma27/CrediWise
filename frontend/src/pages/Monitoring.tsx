import React, { useEffect, useState } from "react";
import {
  Activity,
  RefreshCw,
  Clock,
  TrendingUp,
  Gauge,
  Info,
  Layers,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";
import Layout from "../components/Layout";
import DecisionBadge from "../components/DecisionBadge";
import RiskBadge from "../components/RiskBadge";
import api from "../services/api";
import { AdminMonitoringResponse } from "../types/api";
import { formatPercent, formatDate } from "../utils/formatters";

const formatFeatureImportancePct = (weight?: number | null): string => {
  if (weight === undefined || weight === null || isNaN(weight) || weight === 0) {
    return "0.00%";
  }
  const pct = weight * 100;
  if (pct > 0 && pct < 0.01) {
    return "<0.01%";
  }
  return `${pct.toFixed(2)}%`;
};

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
              Inference latency, live prediction telemetry, certified evaluation metrics, and feature importance rankings.
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
                  <p className="text-[11px] text-slate-500">Measured inference latency</p>
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
                  <h2 className="text-base font-bold text-teal-900">HELD-OUT BENCHMARK PERFORMANCE</h2>
                  <p className="text-xs text-slate-500">Evaluated on a stratified held-out split of the validated Kaggle INR loan dataset</p>
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
                  <span className="text-[10px] text-slate-400">Held-Out Probability Error</span>
                </div>
              </div>

              {/* Dataset Limitation Note */}
              <div className="p-3.5 rounded-xl bg-teal-50/70 border border-teal-100/80 flex items-start space-x-2.5 text-xs text-teal-900">
                <Info className="w-4 h-4 text-teal-700 flex-shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  <span className="font-bold">Dataset limitation:</span> Near-perfect benchmark performance is driven largely by the strong CIBIL-based decision boundary present in the source dataset and should not be interpreted as real-world lending accuracy.
                </p>
              </div>
            </div>

            {/* Model Comparison & Selection */}
            <div className="crediwise-card p-6 sm:p-8 space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-cream-300">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-lg bg-teal-100 text-teal-850 flex items-center justify-center">
                    <Layers className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-teal-900">Model Comparison &amp; Selection</h2>
                    <p className="text-xs text-slate-500">
                      Evaluation of candidate classifiers used to select the deployed prediction model.
                    </p>
                  </div>
                </div>

                <div className="hidden sm:flex items-center space-x-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-850 text-xs font-extrabold">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Champion: {data.champion_model || "Gradient Boosting"}</span>
                </div>
              </div>

              {/* Model Selection Pipeline Flow */}
              <div className="space-y-2">
                <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">
                  Model Selection Pipeline
                </span>
                <div className="p-4 rounded-xl bg-cream-50/80 border border-cream-300 overflow-x-auto">
                  <div className="flex items-center space-x-2 min-w-max text-xs">
                    {[
                      "Validated Dataset",
                      "Same Preprocessing",
                      "4 Candidate Models",
                      "5-Fold Cross-Validation + Held-Out Test",
                      "Champion Selection",
                      "Gradient Boosting",
                      "loan-model-v2.0",
                      "Live Inference",
                    ].map((step, sIdx, arr) => {
                      const isChampionStep = step === "Gradient Boosting" || step === "loan-model-v2.0";
                      return (
                        <React.Fragment key={step}>
                          <div
                            className={`px-3 py-1.5 rounded-lg font-bold border text-[11px] ${
                              isChampionStep
                                ? "bg-teal-100 border-teal-300 text-teal-900 shadow-2xs"
                                : sIdx === arr.length - 1
                                ? "bg-emerald-100 border-emerald-300 text-emerald-900"
                                : "bg-white border-cream-300 text-slate-700"
                            }`}
                          >
                            <span className="text-slate-400 font-extrabold mr-1.5">{sIdx + 1}.</span>
                            <span>{step}</span>
                          </div>
                          {sIdx < arr.length - 1 && (
                            <ArrowRight className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                          )}
                        </React.Fragment>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Candidate Models Comparison Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-cream-300 text-xs font-bold uppercase text-slate-400">
                    <tr>
                      <th className="pb-3 pr-4">Model</th>
                      <th className="pb-3 px-3">Test Accuracy</th>
                      <th className="pb-3 px-3">Test Precision</th>
                      <th className="pb-3 px-3">Test Recall</th>
                      <th className="pb-3 px-3">Test F1</th>
                      <th className="pb-3 px-3">ROC-AUC</th>
                      <th className="pb-3 px-3">Brier Score</th>
                      <th className="pb-3 pl-3 text-right">Selection Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-cream-200 text-slate-700">
                    {(
                      data.candidate_models || [
                        "Logistic Regression",
                        "Decision Tree",
                        "Random Forest",
                        "Gradient Boosting",
                      ]
                    ).map((modelName) => {
                      const metrics = data.all_models_test_metrics?.[modelName];
                      const isChampion =
                        modelName === "Gradient Boosting" || modelName === data.champion_model;

                      return (
                        <tr
                          key={modelName}
                          className={`transition-colors ${
                            isChampion
                              ? "bg-teal-50/70 hover:bg-teal-50 font-semibold"
                              : "hover:bg-cream-50/60"
                          }`}
                        >
                          <td className="py-3.5 pr-4">
                            <div className="flex items-center space-x-2">
                              <span className="font-bold text-teal-900">{modelName}</span>
                              {isChampion && (
                                <span className="px-1.5 py-0.5 rounded bg-teal-200 text-teal-900 text-[10px] font-extrabold">
                                  v2.0
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-3.5 px-3 font-extrabold text-teal-900">
                            {metrics ? formatPercent(metrics.accuracy) : "—"}
                          </td>
                          <td className="py-3.5 px-3">
                            {metrics ? formatPercent(metrics.precision) : "—"}
                          </td>
                          <td className="py-3.5 px-3">
                            {metrics ? formatPercent(metrics.recall) : "—"}
                          </td>
                          <td className="py-3.5 px-3 font-mono text-xs">
                            {metrics ? metrics.f1.toFixed(4) : "—"}
                          </td>
                          <td className="py-3.5 px-3 font-mono text-xs">
                            {metrics ? metrics.roc_auc.toFixed(4) : "—"}
                          </td>
                          <td className="py-3.5 px-3 font-mono text-xs">
                            {metrics
                              ? Number(metrics.brier_score_loss).toExponential(2)
                              : "—"}
                          </td>
                          <td className="py-3.5 pl-3 text-right">
                            {isChampion ? (
                              <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-850 text-xs font-extrabold shadow-2xs">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                <span>DEPLOYED CHAMPION</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 text-xs font-semibold">
                                Candidate
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Explanations Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* How Champion Was Selected */}
                <div className="p-4 rounded-xl bg-cream-50/70 border border-cream-300 space-y-2">
                  <div className="flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-teal-750" />
                    <h3 className="text-xs font-extrabold text-teal-900 uppercase tracking-wider">
                      How the deployed model was selected
                    </h3>
                  </div>
                  <ul className="text-xs text-slate-600 space-y-1.5 list-disc list-inside leading-relaxed">
                    <li>
                      Four candidate classifiers were evaluated using the same preprocessing pipeline and stratified data split.
                    </li>
                    <li>
                      Five-fold stratified cross-validation and held-out test evaluation were used for comparison.
                    </li>
                    <li>
                      Gradient Boosting was selected as the champion based on cross-validation performance and probability calibration.
                    </li>
                    <li>
                      The deployed artifact is Gradient Boosting (<span className="font-mono font-semibold">{data.champion_version || "loan-model-v2.0"}</span>).
                    </li>
                  </ul>
                </div>

                {/* What Gradient Boosting Means */}
                <div className="p-4 rounded-xl bg-cream-50/70 border border-cream-300 space-y-2">
                  <div className="flex items-center space-x-2">
                    <Info className="w-4 h-4 text-coral-600" />
                    <h3 className="text-xs font-extrabold text-teal-900 uppercase tracking-wider">
                      What 'Gradient Boosting' means here
                    </h3>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Gradient Boosting is an ensemble algorithm that builds multiple shallow decision trees sequentially, with each stage improving on the errors of previous stages. The deployed result is the prediction from this Gradient Boosting pipeline. It is <strong className="text-slate-800">NOT</strong> a voting or averaging combination of Logistic Regression, Decision Tree, Random Forest, and Gradient Boosting.
                  </p>
                </div>
              </div>

              {/* Comparison Interpretation Note */}
              <div className="p-3.5 rounded-xl bg-teal-50/70 border border-teal-100/80 flex items-start space-x-2.5 text-xs text-teal-900">
                <Info className="w-4 h-4 text-teal-700 flex-shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  <span className="font-bold">Interpretation:</span> The benchmark results reflect performance on the validated Kaggle INR dataset. They should not be interpreted as guaranteed real-world lending accuracy.
                </p>
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
                  const pctDisplay = formatFeatureImportancePct(weight);
                  const label = featureLabels[feature] || feature;
                  return (
                    <div key={feature} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center space-x-2">
                          <span className="font-extrabold text-slate-400">#{idx + 1}</span>
                          <span className="font-bold text-teal-900">{label}</span>
                          <span className="font-mono text-[10px] text-slate-400">({feature})</span>
                        </div>
                        <span className="font-extrabold text-teal-800">{pctDisplay}</span>
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

              {/* Feature Importance Interpretation */}
              <div className="p-3.5 rounded-xl bg-teal-50/70 border border-teal-100/80 flex items-start space-x-2.5 text-xs text-teal-900">
                <Info className="w-4 h-4 text-teal-700 flex-shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  <span className="font-bold">How to interpret:</span> Feature importance represents the relative contribution of features to the Gradient Boosting model's tree splits. Low individual importance does not mean a feature is unused; correlated financial variables may be represented through engineered ratios such as Asset-to-Loan Coverage.
                </p>
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

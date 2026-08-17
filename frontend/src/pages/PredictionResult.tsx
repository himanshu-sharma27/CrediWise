import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  TrendingUp,
  Sliders,
  FilePlus,
  ArrowLeft,
  AlertCircle,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Download,
} from "lucide-react";
import Layout from "../components/Layout";
import RiskBadge from "../components/RiskBadge";
import DecisionBadge from "../components/DecisionBadge";
import FactorCard from "../components/FactorCard";
import api from "../services/api";
import { LoanApplication, PredictionResult as PredictionResultType } from "../types/api";
import { formatINR, formatPercent, formatDate, formatLakhsCrores } from "../utils/formatters";

export const PredictionResult: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const appId = id ? parseInt(id, 10) : 0;

  const [application, setApplication] = useState<LoanApplication | null>(null);
  const [prediction, setPrediction] = useState<PredictionResultType | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState<boolean>(false);

  const handleDownloadReport = async () => {
    if (!appId || isDownloading) return;
    try {
      setIsDownloading(true);
      const blob = await api.predictions.downloadAssessmentReport(appId);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `CrediWise_Assessment_${application?.application_number || appId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      console.error("Failed to download assessment report:", err);
    } finally {
      setIsDownloading(false);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      if (!appId || isNaN(appId)) {
        setError("Invalid application ID.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        // Load application details and prediction in parallel
        const [appData, predData] = await Promise.all([
          api.applications.getApplicationById(appId),
          api.predictions.getPredictionForApp(appId).catch(() => null),
        ]);

        setApplication(appData);

        if (predData) {
          setPrediction(predData);
        } else if (appData.latest_prediction) {
          setPrediction(appData.latest_prediction);
        } else {
          // Trigger prediction if not yet generated
          const generated = await api.predictions.generatePrediction(appId);
          setPrediction(generated);
        }
      } catch (err: any) {
        setError(err.message || "Failed to load prediction assessment.");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [appId]);

  if (loading) {
    return (
      <Layout variant="app">
        <div className="min-h-[400px] flex flex-col items-center justify-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-[#1A2B4C] flex items-center justify-center text-white shadow-md animate-pulse">
            <Sparkles className="w-6 h-6 text-[#D4A373]" />
          </div>
          <p className="text-[#1A2B4C] font-bold text-base animate-pulse">
            Retrieving Calibrated Underwriting Assessment...
          </p>
        </div>
      </Layout>
    );
  }

  if (error || !application || !prediction) {
    return (
      <Layout variant="app">
        <div className="space-y-6">
          <Link
            to="/dashboard"
            className="inline-flex items-center space-x-1.5 text-xs font-bold text-[#4A5568] hover:text-[#1A2B4C]"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Dashboard</span>
          </Link>

          <div className="p-8 rounded-2xl bg-[#F8EEEE] border border-[#E5B8B3] text-[#7A332D] space-y-4 max-w-2xl">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-6 h-6 text-[#A6534A]" />
              <h2 className="text-lg font-bold">Assessment Not Found</h2>
            </div>
            <p className="text-sm text-[#7A332D] leading-relaxed">
              {error || "Unable to load prediction decision records for this application."}
            </p>
            <Link
              to="/dashboard"
              className="inline-block px-5 py-2.5 rounded-xl bg-[#1A2B4C] text-white font-bold text-xs hover:bg-[#243A61]"
            >
              Return to Dashboard
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  const isApproved = prediction.recommendation === "APPROVED";
  const probability = prediction.approval_probability;
  const health = prediction.risk_assessment;
  const indicators = prediction.derived_indicators;

  const positiveFactors = prediction.explanations.filter((f) => f.impact === "POSITIVE");
  const negativeFactors = prediction.explanations.filter((f) => f.impact === "NEGATIVE");

  // Use the authoritative backend-computed eligible loan amount.
  // Do NOT compute a frontend fallback — if the backend returns null, show Unavailable
  // so the user sees an honest state rather than a fabricated number.
  const eligibleAmount: number | null = health.estimated_eligible_loan_amount ?? null;

  return (
    <Layout variant="app">
      <div className="space-y-8 max-w-6xl pb-16">
        {/* Top Header */}
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <Link
              to="/dashboard"
              className="inline-flex items-center space-x-1.5 text-xs font-bold text-[#4A5568] hover:text-[#1A2B4C] transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Workspace Dashboard</span>
            </Link>

            <div className="flex items-center space-x-3 text-xs text-[#4A5568]">
              <span>Application ID: <strong className="text-[#1A2B4C]">{application.application_number}</strong></span>
              <span>•</span>
              <span>Assessed: {formatDate(application.created_at)}</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-[#FBF4EC] border border-[#E2E5E9] text-[#1A2B4C] text-[11px] font-extrabold uppercase tracking-wider mb-2">
                <TrendingUp className="w-3.5 h-3.5 text-[#D4A373]" />
                <span>ML UNDERWRITING EXPLAINABILITY</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-[#1A2B4C] tracking-tight">
                Assessment Outcome &amp; Factor Analysis
              </h1>
              <p className="text-sm text-[#4A5568]">
                Decision evaluated via certified <code className="text-[#1A2B4C] font-mono font-bold">{prediction.model_version}</code> Gradient Boosting pipeline in native INR (₹).
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <DecisionBadge status={prediction.recommendation} size="lg" />
              <RiskBadge level={prediction.risk_level} size="lg" />
            </div>
          </div>
        </div>

        {/* Primary Prediction Hero Banner */}
        <div
          className={`crediwise-card p-8 sm:p-10 border-2 ${
            isApproved
              ? "bg-[#EEF4EE]/50 border-[#A7C1A9]"
              : "bg-[#F8EEEE]/60 border-[#E5B8B3]"
          }`}
        >
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
            {/* Probability Gauge & Big Stat */}
            <div className="md:col-span-4 text-center md:text-left space-y-2 md:border-r border-[#E2E5E9] md:pr-8">
              <span className="text-xs font-extrabold tracking-widest text-[#4A5568] uppercase">
                Approval Probability
              </span>
              <div className="flex items-baseline justify-center md:justify-start space-x-2">
                <span
                  className={`text-5xl sm:text-6xl font-black tracking-tight ${
                    isApproved ? "text-[#315236]" : "text-[#A6534A]"
                  }`}
                >
                  {formatPercent(probability)}
                </span>
              </div>
              <p className="text-xs text-[#4A5568] font-medium">
                Calibrated confidence against Kaggle historical benchmark dataset.
              </p>

              {/* Progress Bar */}
              <div className="w-full bg-[#E2E5E9] rounded-full h-3 overflow-hidden mt-3">
                <div
                  className={`h-full rounded-full transition-all duration-1000 ${
                    isApproved ? "bg-[#4F6F52]" : "bg-[#A6534A]"
                  }`}
                  style={{ width: `${Math.max(5, Math.min(100, probability * 100))}%` }}
                />
              </div>
            </div>

            {/* Health Score, Requested Loan & Estimated Maximum Potential Loan */}
            <div className="md:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5 p-4 rounded-xl bg-white/90 border border-[#E2E5E9]">
                <span className="text-[11px] font-bold text-[#4A5568] uppercase tracking-wider block">
                  Financial Health Score
                </span>
                <div className="flex items-baseline space-x-1.5">
                  <span className="text-3xl font-extrabold text-[#1A2B4C]">
                    {health.financial_health_score}
                  </span>
                  <span className="text-xs text-[#4A5568] font-bold">/ 100</span>
                </div>
                <p className="text-xs text-[#1A2B4C] leading-snug">{health.summary}</p>
              </div>

              <div className="space-y-1.5 p-4 rounded-xl bg-white/90 border border-[#E2E5E9]">
                <span className="text-[11px] font-bold text-[#4A5568] uppercase tracking-wider block">
                  Requested Loan Principal
                </span>
                <div className="flex items-baseline space-x-1.5">
                  <span className="text-2xl font-extrabold text-[#1A2B4C]">
                    {formatINR(application.loan_amount)}
                  </span>
                </div>
                <p className="text-xs text-[#4A5568] font-medium">
                  Tenure: <strong className="text-[#1A2B4C]">{application.loan_term} Years</strong> • Submitted Request
                </p>
              </div>

              <div className="sm:col-span-2 space-y-1.5 p-4 rounded-xl bg-white/90 border border-[#E2E5E9]">
                <div className="flex flex-wrap items-center justify-between gap-1">
                  <span className="text-[11px] font-bold text-[#4A5568] uppercase tracking-wider block">
                    Estimated Maximum Potential Loan
                  </span>
                  <span className="text-[10px] font-extrabold text-[#1A2B4C] uppercase tracking-wider bg-[#FBF4EC] px-2 py-0.5 rounded border border-[#D4A373]/40">
                    Capacity Indicator
                  </span>
                </div>
                {eligibleAmount ? (
                  <>
                    <div className="flex items-baseline space-x-2">
                      <span className="text-2xl sm:text-3xl font-black text-[#1A2B4C]">
                        {formatINR(eligibleAmount)}
                      </span>
                      <span className="text-xs text-[#D4A373] font-extrabold">
                        ({formatLakhsCrores(eligibleAmount)})
                      </span>
                    </div>
                    <p className="text-xs text-[#1A2B4C] leading-relaxed pt-0.5">
                      Estimated maximum borrowing capacity based on the submitted financial profile. This is not a guaranteed sanction amount.
                    </p>
                  </>
                ) : (
                  <>
                    <div className="flex items-baseline space-x-1.5">
                      <span className="text-2xl font-extrabold text-[#4A5568]">Unavailable</span>
                    </div>
                    <p className="text-xs text-[#4A5568]">
                      Insufficient financial data to estimate borrowing capacity.
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Assessment Report Actions */}
          <div className="mt-8 pt-6 border-t border-[#E2E5E9] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={handleDownloadReport}
                disabled={isDownloading}
                className="inline-flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl bg-[#1A2B4C] text-white text-xs font-bold hover:bg-[#243A61] transition-colors shadow-xs disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <Download className="w-4 h-4" />
                <span>{isDownloading ? "Downloading..." : "Download Assessment"}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Factor Attribution Breakdown */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-[#1A2B4C]">
                Factor Contribution Breakdown
              </h2>
              <p className="text-xs sm:text-sm text-[#4A5568]">
                Transparent factor attribution highlighting what positively and negatively drove this decision.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Positive Factors */}
            <div className="crediwise-card p-6 space-y-4">
              <div className="flex items-center space-x-2 pb-2 border-b border-[#E2E5E9]">
                <div className="w-7 h-7 rounded-lg bg-[#FBF4EC] text-[#1A2B4C] flex items-center justify-center">
                  <CheckCircle2 className="w-4 h-4 text-[#D4A373]" />
                </div>
                <h3 className="text-base font-bold text-[#1A2B4C]">Positive Catalysts</h3>
              </div>

              {positiveFactors.length > 0 ? (
                <div className="space-y-3">
                  {positiveFactors.map((factor) => (
                    <FactorCard key={factor.feature_name} factor={factor} />
                  ))}
                </div>
              ) : (
                <p className="text-xs text-[#4A5568] italic p-4 text-center">
                  No major positive factors identified above population average.
                </p>
              )}
            </div>

            {/* Negative Factors */}
            <div className="crediwise-card p-6 space-y-4">
              <div className="flex items-center space-x-2 pb-2 border-b border-[#E2E5E9]">
                <div className="w-7 h-7 rounded-lg bg-[#F8EEEE] text-[#7A332D] flex items-center justify-center">
                  <AlertTriangle className="w-4 h-4 text-[#A6534A]" />
                </div>
                <h3 className="text-base font-bold text-[#1A2B4C]">Risk Signals</h3>
              </div>

              {negativeFactors.length > 0 ? (
                <div className="space-y-3">
                  {negativeFactors.map((factor) => (
                    <FactorCard key={factor.feature_name} factor={factor} />
                  ))}
                </div>
              ) : (
                <p className="text-xs text-[#4A5568] italic p-4 text-center">
                  No critical negative risk flags detected for this applicant profile.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Derived Financial Indicators */}
        <div className="crediwise-card p-6 sm:p-8 space-y-6">
          <div>
            <h2 className="text-xl font-bold text-[#1A2B4C]">
              Derived Financial Indicators (Deterministic Parity)
            </h2>
            <p className="text-xs text-[#4A5568] mt-0.5">
              Mathematical features engineered deterministically from input parameters matching ML training formulas.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="p-4 rounded-xl bg-[#F8F9FA] border border-[#E2E5E9] space-y-1">
              <span className="text-[10px] font-bold text-[#4A5568] uppercase block">Monthly Income</span>
              <p className="text-base font-extrabold text-[#1A2B4C]">{formatINR(indicators.monthly_income)}</p>
              <span className="text-[10px] text-[#4A5568]">₹ annual / 12</span>
            </div>

            <div className="p-4 rounded-xl bg-[#F8F9FA] border border-[#E2E5E9] space-y-1">
              <span className="text-[10px] font-bold text-[#4A5568] uppercase block">Est. Monthly EMI</span>
              <p className="text-base font-extrabold text-[#1A2B4C]">
                {formatINR(indicators.estimated_principal_monthly_payment)}
              </p>
              <span className="text-[10px] text-[#4A5568]">Principal / months</span>
            </div>

            <div className="p-4 rounded-xl bg-[#F8F9FA] border border-[#E2E5E9] space-y-1">
              <span className="text-[10px] font-bold text-[#4A5568] uppercase block">Payment / Income</span>
              <p className="text-base font-extrabold text-[#1A2B4C]">
                {formatPercent(indicators.estimated_payment_to_income_ratio)}
              </p>
              <span className="text-[10px] text-[#4A5568]">Debt burden ratio</span>
            </div>

            <div className="p-4 rounded-xl bg-[#F8F9FA] border border-[#E2E5E9] space-y-1">
              <span className="text-[10px] font-bold text-[#4A5568] uppercase block">Total Assets</span>
              <p className="text-base font-extrabold text-[#1A2B4C]">
                {formatINR(indicators.total_asset_value)}
              </p>
              <span className="text-[10px] text-[#4A5568]">Collateral backing</span>
            </div>

            <div className="p-4 rounded-xl bg-[#F8F9FA] border border-[#E2E5E9] space-y-1">
              <span className="text-[10px] font-bold text-[#4A5568] uppercase block">Asset / Loan</span>
              <p className="text-base font-extrabold text-[#1A2B4C]">
                {indicators.asset_to_loan_ratio.toFixed(2)}x
              </p>
              <span className="text-[10px] text-[#4A5568]">Coverage multiplier</span>
            </div>

            <div className="p-4 rounded-xl bg-[#F8F9FA] border border-[#E2E5E9] space-y-1">
              <span className="text-[10px] font-bold text-[#4A5568] uppercase block">Loan / Income</span>
              <p className="text-base font-extrabold text-[#1A2B4C]">
                {indicators.loan_to_annual_income_ratio.toFixed(2)}x
              </p>
              <span className="text-[10px] text-[#4A5568]">Leverage multiple</span>
            </div>
          </div>
        </div>

        {/* Application Input Summary Recap */}
        <div className="crediwise-card p-6 sm:p-8 space-y-6">
          <h2 className="text-xl font-bold text-[#1A2B4C]">Submitted 11-Parameter Recap</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div>
              <span className="text-[#4A5568] block font-semibold">Applicant Name</span>
              <span className="text-[#1A2B4C] font-bold">{application.applicant_name}</span>
            </div>
            <div>
              <span className="text-[#4A5568] block font-semibold">CIBIL Score</span>
              <span className="text-[#1A2B4C] font-bold">{application.cibil_score}</span>
            </div>
            <div>
              <span className="text-[#4A5568] block font-semibold">Annual Income</span>
              <span className="text-[#1A2B4C] font-bold">{formatINR(application.income_annum)}</span>
            </div>
            <div>
              <span className="text-[#4A5568] block font-semibold">Requested Loan</span>
              <span className="text-[#1A2B4C] font-bold">{formatINR(application.loan_amount)} ({application.loan_term} Yrs)</span>
            </div>
            <div>
              <span className="text-[#4A5568] block font-semibold">Residential Assets</span>
              <span className="text-[#1A2B4C] font-bold">{formatINR(application.residential_assets_value)}</span>
            </div>
            <div>
              <span className="text-[#4A5568] block font-semibold">Commercial Assets</span>
              <span className="text-[#1A2B4C] font-bold">{formatINR(application.commercial_assets_value)}</span>
            </div>
            <div>
              <span className="text-[#4A5568] block font-semibold">Luxury Assets</span>
              <span className="text-[#1A2B4C] font-bold">{formatINR(application.luxury_assets_value)}</span>
            </div>
            <div>
              <span className="text-[#4A5568] block font-semibold">Bank Liquid Assets</span>
              <span className="text-[#1A2B4C] font-bold">{formatINR(application.bank_asset_value)}</span>
            </div>
          </div>
        </div>

        {/* Disclaimer Callout */}
        <div className="p-6 rounded-2xl bg-[#FBF4EC]/70 border border-[#D4A373]/40 flex items-start space-x-3 text-[#79552F] text-xs sm:text-sm">
          <AlertCircle className="w-5 h-5 text-[#D4A373] flex-shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <strong>Responsible Assessment Notice:</strong> This prediction is generated using historical data patterns from the certified Kaggle INR dataset. It provides an advisory assessment for credit analysis and does not constitute a guaranteed bank sanction.
          </p>
        </div>

        {/* Next Actions Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4">
          <Link
            to="/dashboard"
            className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-white border border-[#E2E5E9] text-[#1A2B4C] font-bold text-sm text-center hover:bg-[#F8F9FA] transition-colors shadow-xs"
          >
            Go to Workspace Dashboard
          </Link>

          <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
            <Link
              to="/simulator"
              state={{ prefill: application }}
              className="w-full sm:w-auto flex items-center justify-center space-x-2 px-6 py-3.5 rounded-xl bg-[#FBF4EC] text-[#1A2B4C] font-bold text-sm hover:bg-[#b5e6f8] transition-colors shadow-xs border border-[#D4A373]/30"
            >
              <Sliders className="w-4 h-4 text-[#D4A373]" />
              <span>Simulate What-If Adjustments</span>
            </Link>

            <Link
              to="/applications/new"
              className="w-full sm:w-auto flex items-center justify-center space-x-2 px-6 py-3.5 rounded-xl bg-[#D4A373] text-white font-bold text-sm hover:bg-[#C48F5E] transition-colors shadow-sm"
            >
              <FilePlus className="w-4 h-4 text-white" />
              <span>New Assessment</span>
            </Link>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default PredictionResult;


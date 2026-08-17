import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Sliders,
  Sparkles,
  ArrowLeft,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Info,
} from "lucide-react";
import Layout from "../components/Layout";
import CurrencyInput from "../components/CurrencyInput";
import RiskBadge from "../components/RiskBadge";
import DecisionBadge from "../components/DecisionBadge";
import FactorCard from "../components/FactorCard";
import api from "../services/api";
import { PredictionResult } from "../types/api";
import { formatINR, formatPercent } from "../utils/formatters";

interface SimulatorForm {
  no_of_dependents: number;
  education: "Graduate" | "Not Graduate";
  self_employed: "Yes" | "No";
  income_annum: number;
  loan_amount: number;
  loan_term: number;
  cibil_score: number;
  residential_assets_value: number;
  commercial_assets_value: number;
  luxury_assets_value: number;
  bank_asset_value: number;
}

const defaultScenario: SimulatorForm = {
  no_of_dependents: 1,
  education: "Graduate",
  self_employed: "No",
  income_annum: 1500000,
  loan_amount: 3000000,
  loan_term: 10,
  cibil_score: 740,
  residential_assets_value: 3500000,
  commercial_assets_value: 500000,
  luxury_assets_value: 400000,
  bank_asset_value: 1000000,
};

export const Simulator: React.FC = () => {
  const location = useLocation();
  const prefill = location.state?.prefill;

  const initialParams: SimulatorForm = prefill
    ? {
        no_of_dependents: prefill.no_of_dependents ?? defaultScenario.no_of_dependents,
        education: prefill.education ?? defaultScenario.education,
        self_employed: prefill.self_employed ?? defaultScenario.self_employed,
        income_annum: prefill.income_annum ?? defaultScenario.income_annum,
        loan_amount: prefill.loan_amount ?? defaultScenario.loan_amount,
        loan_term: prefill.loan_term ?? defaultScenario.loan_term,
        cibil_score: prefill.cibil_score ?? defaultScenario.cibil_score,
        residential_assets_value: prefill.residential_assets_value ?? defaultScenario.residential_assets_value,
        commercial_assets_value: prefill.commercial_assets_value ?? defaultScenario.commercial_assets_value,
        luxury_assets_value: prefill.luxury_assets_value ?? defaultScenario.luxury_assets_value,
        bank_asset_value: prefill.bank_asset_value ?? defaultScenario.bank_asset_value,
      }
    : defaultScenario;

  const [params, setParams] = useState<SimulatorForm>(initialParams);
  const [result, setResult] = useState<PredictionResult | null>(null);
  const [baselineResult, setBaselineResult] = useState<PredictionResult | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runSimulation = async (currentParams: SimulatorForm, isInitial = false) => {
    setIsSimulating(true);
    setError(null);
    try {
      const response = await api.predictions.simulate(currentParams);
      setResult(response);
      if (isInitial || !baselineResult) {
        setBaselineResult(response);
      }
    } catch (err: any) {
      setError(err.message || "Failed to execute What-If simulation.");
    } finally {
      setIsSimulating(false);
    }
  };

  useEffect(() => {
    // Run initial baseline simulation
    runSimulation(initialParams, true);
  }, []);

  const handleReset = () => {
    setParams(defaultScenario);
    runSimulation(defaultScenario, true);
  };

  const totalAssets =
    params.residential_assets_value +
    params.commercial_assets_value +
    params.luxury_assets_value +
    params.bank_asset_value;

  const probDelta =
    result && baselineResult
      ? result.approval_probability - baselineResult.approval_probability
      : 0;

  return (
    <Layout variant="app">
      <div className="space-y-8 max-w-6xl pb-16">
        {/* Navigation & Header */}
        <div className="space-y-3">
          <Link
            to="/dashboard"
            className="inline-flex items-center space-x-1.5 text-xs font-bold text-[#4A5568] hover:text-[#1A2B4C] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Workspace Dashboard</span>
          </Link>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-[#FBF4EC] border border-[#E2E5E9] text-[#1A2B4C] text-[11px] font-extrabold uppercase tracking-wider mb-2">
                <Sliders className="w-3.5 h-3.5 text-[#D4A373]" />
                <span>INTERACTIVE WHAT-IF SCENARIO SANDBOX</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-[#1A2B4C] tracking-tight">
                What-If Loan Simulator
              </h1>
              <p className="text-sm text-[#4A5568]">
                Adjust financial parameters to explore sensitivity against the certified Gradient Boosting ML model in real-time.
              </p>
            </div>

            <button
              onClick={handleReset}
              className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl border border-[#E2E5E9] bg-white text-[#1A2B4C] text-xs font-bold hover:bg-[#F8F9FA] transition-colors shadow-2xs"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Reset to Defaults</span>
            </button>
          </div>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-[#F8EEEE] border border-[#E5B8B3] text-[#7A332D] text-sm">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Interactive Controls */}
          <div className="lg:col-span-6 space-y-6">
            <div className="crediwise-card p-6 sm:p-8 space-y-6">
              <h2 className="text-lg font-bold text-[#1A2B4C] pb-3 border-b border-[#E2E5E9]">
                Adjust Financial Parameters
              </h2>

              {/* CIBIL Score Slider */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-[#1A2B4C] uppercase tracking-wider">
                    CIBIL Score
                  </label>
                  <span className="text-base font-extrabold text-[#1A2B4C] bg-[#FBF4EC] px-2.5 py-0.5 rounded-md border border-[#E2E5E9]">
                    {params.cibil_score}
                  </span>
                </div>
                <input
                  type="range"
                  min={300}
                  max={900}
                  step={5}
                  value={params.cibil_score}
                  onChange={(e) => setParams({ ...params, cibil_score: parseInt(e.target.value) || 300 })}
                  className="w-full h-2.5 bg-[#E2E5E9] rounded-lg appearance-none cursor-pointer accent-[#D4A373]"
                />
                <div className="flex justify-between text-[10px] font-bold text-[#4A5568]">
                  <span className="text-[#A6534A]">300 (Subprime)</span>
                  <span className="text-[#79552F]">650 (Fair)</span>
                  <span className="text-[#1A2B4C]">750+ (Prime)</span>
                  <span className="text-[#D4A373]">900</span>
                </div>
              </div>

              {/* Loan Term Slider */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-[#1A2B4C] uppercase tracking-wider">
                    Loan Tenure (Years)
                  </label>
                  <span className="text-base font-extrabold text-[#1A2B4C] bg-[#FBF4EC] px-2.5 py-0.5 rounded-md border border-[#E2E5E9]">
                    {params.loan_term} Years ({params.loan_term * 12} Mos)
                  </span>
                </div>
                <input
                  type="range"
                  min={2}
                  max={20}
                  step={1}
                  value={params.loan_term}
                  onChange={(e) => setParams({ ...params, loan_term: parseInt(e.target.value) || 2 })}
                  className="w-full h-2.5 bg-[#E2E5E9] rounded-lg appearance-none cursor-pointer accent-[#D4A373]"
                />
                <div className="flex justify-between text-[10px] font-bold text-[#4A5568]">
                  <span>2 Years</span>
                  <span>10 Years</span>
                  <span>20 Years</span>
                </div>
              </div>

              {/* Currency Inputs */}
              <div className="space-y-4 pt-2">
                <CurrencyInput
                  label="Annual Income (INR)"
                  name="income_annum"
                  value={params.income_annum}
                  onChange={(val) => setParams({ ...params, income_annum: val })}
                  min={200000}
                  max={9900000}
                />

                <CurrencyInput
                  label="Requested Loan Principal (INR)"
                  name="loan_amount"
                  value={params.loan_amount}
                  onChange={(val) => setParams({ ...params, loan_amount: val })}
                  min={300000}
                  max={39500000}
                />
              </div>

              {/* Collateral Asset Values */}
              <div className="pt-2 space-y-4 border-t border-[#E2E5E9]">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase text-[#4A5568]">Asset Backing</span>
                  <span className="text-xs font-extrabold text-[#1A2B4C]">Total: {formatINR(totalAssets)}</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <CurrencyInput
                    label="Residential Assets"
                    name="residential_assets_value"
                    value={params.residential_assets_value}
                    onChange={(val) => setParams({ ...params, residential_assets_value: val })}
                  />
                  <CurrencyInput
                    label="Bank Liquid Assets"
                    name="bank_asset_value"
                    value={params.bank_asset_value}
                    onChange={(val) => setParams({ ...params, bank_asset_value: val })}
                  />
                  <CurrencyInput
                    label="Commercial Assets"
                    name="commercial_assets_value"
                    value={params.commercial_assets_value}
                    onChange={(val) => setParams({ ...params, commercial_assets_value: val })}
                  />
                  <CurrencyInput
                    label="Luxury Assets"
                    name="luxury_assets_value"
                    value={params.luxury_assets_value}
                    onChange={(val) => setParams({ ...params, luxury_assets_value: val })}
                  />
                </div>
              </div>

              {/* Dependents & Categoricals */}
              <div className="grid grid-cols-3 gap-3 pt-2">
                <div>
                  <label className="block text-[10px] font-bold text-[#4A5568] uppercase mb-1">
                    Dependents
                  </label>
                  <select
                    value={params.no_of_dependents}
                    onChange={(e) => setParams({ ...params, no_of_dependents: parseInt(e.target.value) || 0 })}
                    className="w-full px-2.5 py-2 rounded-lg border border-[#E2E5E9] bg-white text-xs font-medium text-[#1A2B4C] focus:outline-none focus:border-[#D4A373]"
                  >
                    <option value={0}>0</option>
                    <option value={1}>1</option>
                    <option value={2}>2</option>
                    <option value={3}>3</option>
                    <option value={4}>4</option>
                    <option value={5}>5+</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-[#4A5568] uppercase mb-1">
                    Education
                  </label>
                  <select
                    value={params.education}
                    onChange={(e) => setParams({ ...params, education: e.target.value as any })}
                    className="w-full px-2.5 py-2 rounded-lg border border-[#E2E5E9] bg-white text-xs font-medium text-[#1A2B4C] focus:outline-none focus:border-[#D4A373]"
                  >
                    <option value="Graduate">Graduate</option>
                    <option value="Not Graduate">Not Graduate</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-[#4A5568] uppercase mb-1">
                    Self-Employed?
                  </label>
                  <select
                    value={params.self_employed}
                    onChange={(e) => setParams({ ...params, self_employed: e.target.value as any })}
                    className="w-full px-2.5 py-2 rounded-lg border border-[#E2E5E9] bg-white text-xs font-medium text-[#1A2B4C] focus:outline-none focus:border-[#D4A373]"
                  >
                    <option value="No">No (Salaried)</option>
                    <option value="Yes">Yes (Business)</option>
                  </select>
                </div>
              </div>

              {/* Execute Simulator Button */}
              <button
                type="button"
                onClick={() => runSimulation(params)}
                disabled={isSimulating}
                className="w-full flex items-center justify-center space-x-2 py-4 px-6 rounded-xl bg-[#D4A373] text-white font-bold text-sm hover:bg-[#C48F5E] transition-colors shadow-sm disabled:opacity-60"
              >
                {isSimulating ? (
                  <>
                    <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                    <span>Running ML Inference...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-white" />
                    <span>Run Real-Time Simulation</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Right Column: Live Simulation Outcome */}
          <div className="lg:col-span-6 space-y-6">
            {result ? (
              <>
                {/* Result Card */}
                <div
                  className={`crediwise-card p-6 sm:p-8 border-2 transition-all ${
                    result.recommendation === "APPROVED"
                      ? "bg-[#FBF4EC]/30 border-[#D4A373]"
                      : "bg-[#F8EEEE]/60 border-[#E5B8B3]"
                  }`}
                >
                  <div className="flex items-center justify-between pb-4 border-b border-[#E2E5E9]">
                    <span className="text-xs font-extrabold text-[#4A5568] uppercase tracking-widest">
                      Simulated Outcome
                    </span>
                    <div className="flex items-center space-x-2">
                      <DecisionBadge status={result.recommendation} size="md" />
                      <RiskBadge level={result.risk_level} size="md" />
                    </div>
                  </div>

                  <div className="py-6 space-y-4 text-center sm:text-left">
                    <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
                      <div>
                        <span className="text-xs font-bold text-[#4A5568] uppercase">
                          Simulated Approval Probability
                        </span>
                        <div className="text-5xl font-black text-[#1A2B4C] tracking-tight mt-1">
                          {formatPercent(result.approval_probability)}
                        </div>
                      </div>

                      {probDelta !== 0 && (
                        <div
                          className={`inline-flex items-center space-x-1 px-3 py-1.5 rounded-full text-xs font-bold ${
                            probDelta > 0
                              ? "bg-[#FBF4EC] text-[#1A2B4C] border border-[#D4A373]"
                              : "bg-[#F8EEEE] text-[#7A332D] border border-[#E5B8B3]"
                          }`}
                        >
                          {probDelta > 0 ? (
                            <TrendingUp className="w-3.5 h-3.5 text-[#D4A373]" />
                          ) : (
                            <TrendingDown className="w-3.5 h-3.5 text-[#A6534A]" />
                          )}
                          <span>
                            {probDelta > 0 ? "+" : ""}
                            {(probDelta * 100).toFixed(1)}% vs Baseline
                          </span>
                        </div>
                      )}
                    </div>

                    <p className="text-xs text-[#1A2B4C] leading-relaxed">
                      {result.risk_assessment.summary}
                    </p>
                  </div>

                  {/* Derived Metrics Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-[#E2E5E9] text-xs">
                    <div className="p-3 rounded-lg bg-white border border-[#E2E5E9]">
                      <span className="text-[#4A5568] block text-[10px] font-semibold">Simulated EMI</span>
                      <span className="text-[#1A2B4C] font-extrabold">
                        {formatINR(result.derived_indicators.estimated_principal_monthly_payment)}
                      </span>
                    </div>

                    <div className="p-3 rounded-lg bg-white border border-[#E2E5E9]">
                      <span className="text-[#4A5568] block text-[10px] font-semibold">Payment / Income</span>
                      <span className="text-[#1A2B4C] font-extrabold">
                        {formatPercent(result.derived_indicators.estimated_payment_to_income_ratio)}
                      </span>
                    </div>

                    <div className="p-3 rounded-lg bg-white border border-[#E2E5E9]">
                      <span className="text-[#4A5568] block text-[10px] font-semibold">Asset Coverage</span>
                      <span className="text-[#1A2B4C] font-extrabold">
                        {result.derived_indicators.asset_to_loan_ratio.toFixed(2)}x
                      </span>
                    </div>

                    <div className="p-3 rounded-lg bg-white border border-[#E2E5E9]">
                      <span className="text-[#4A5568] block text-[10px] font-semibold">Simulated Capacity</span>
                      <span className="text-[#1A2B4C] font-extrabold">
                        {result.risk_assessment.estimated_eligible_loan_amount
                          ? formatINR(result.risk_assessment.estimated_eligible_loan_amount)
                          : "Unavailable"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Simulated Factor Attributions */}
                <div className="crediwise-card p-6 space-y-4">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-[#1A2B4C]">
                    Simulated Contributing Factors
                  </h3>

                  <div className="space-y-3">
                    {result.explanations.slice(0, 3).map((factor) => (
                      <FactorCard key={factor.feature_name} factor={factor} />
                    ))}
                  </div>
                </div>

                {/* Simulation Notice */}
                <div className="p-4 rounded-xl bg-[#FBF4EC]/40 border border-[#E2E5E9] flex items-start space-x-3 text-xs text-[#1A2B4C]">
                  <Info className="w-4 h-4 text-[#D4A373] flex-shrink-0 mt-0.5" />
                  <p className="leading-relaxed">
                    This sandbox evaluates the live Gradient Boosting ML pipeline without storing application records. When satisfied with your parameters, you can submit a formal assessment.
                  </p>
                </div>

                <div className="pt-2">
                  <Link
                    to="/applications/new"
                    className="w-full flex items-center justify-center space-x-2 py-3.5 px-6 rounded-xl bg-[#D4A373] hover:bg-[#C48F5E] text-white font-bold text-sm transition-colors shadow-sm"
                  >
                    <span>Apply with these Parameters</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </>
            ) : null}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Simulator;


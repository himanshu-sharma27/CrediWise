import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  FilePlus,
  ArrowRight,
  ArrowLeft,
  AlertCircle,
  ShieldCheck,
  Building2,
  Banknote,
  GraduationCap,
  Sparkles,
} from "lucide-react";
import Layout from "../components/Layout";
import CurrencyInput from "../components/CurrencyInput";
import api from "../services/api";
import { formatINR, getCibilTier } from "../utils/formatters";

interface FormData {
  applicant_name: string;
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

const initialFormState: FormData = {
  applicant_name: "",
  no_of_dependents: 0,
  education: "Graduate",
  self_employed: "No",
  income_annum: 1200000,
  loan_amount: 2500000,
  loan_term: 10,
  cibil_score: 750,
  residential_assets_value: 3000000,
  commercial_assets_value: 0,
  luxury_assets_value: 500000,
  bank_asset_value: 800000,
};

export const NewApplication: React.FC = () => {
  const [formData, setFormData] = useState<FormData>(initialFormState);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingStep, setLoadingStep] = useState<string>("");

  const navigate = useNavigate();

  const totalAssets =
    formData.residential_assets_value +
    formData.commercial_assets_value +
    formData.luxury_assets_value +
    formData.bank_asset_value;

  const validateForm = (): boolean => {
    const errs: Record<string, string> = {};

    if (!formData.applicant_name.trim()) {
      errs.applicant_name = "Applicant name is required.";
    }
    if (formData.no_of_dependents < 0 || formData.no_of_dependents > 5) {
      errs.no_of_dependents = "Dependents must be between 0 and 5.";
    }
    if (formData.income_annum < 200000 || formData.income_annum > 9900000) {
      errs.income_annum = "Annual income must be between ₹2,00,000 and ₹99,00,000.";
    }
    if (formData.loan_amount < 300000 || formData.loan_amount > 39500000) {
      errs.loan_amount = "Loan amount must be between ₹3,00,000 and ₹3,95,00,000.";
    }
    if (formData.loan_term < 2 || formData.loan_term > 20) {
      errs.loan_term = "Loan term must be between 2 and 20 years.";
    }
    if (formData.cibil_score < 300 || formData.cibil_score > 900) {
      errs.cibil_score = "CIBIL score must be between 300 and 900.";
    }
    if (formData.residential_assets_value < 0) {
      errs.residential_assets_value = "Asset value cannot be negative.";
    }
    if (formData.commercial_assets_value < 0) {
      errs.commercial_assets_value = "Asset value cannot be negative.";
    }
    if (formData.luxury_assets_value < 0) {
      errs.luxury_assets_value = "Asset value cannot be negative.";
    }
    if (formData.bank_asset_value < 0) {
      errs.bank_asset_value = "Asset value cannot be negative.";
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGlobalError(null);

    if (!validateForm()) {
      setGlobalError("Please correct the errors in the form before submitting.");
      return;
    }

    setIsSubmitting(true);
    try {
      setLoadingStep("Creating loan application record...");
      const createdApp = await api.applications.createApplication(formData);

      setLoadingStep("Evaluating ML Gradient Boosting prediction...");
      await api.predictions.generatePrediction(createdApp.id);

      navigate(`/applications/${createdApp.id}/result`);
    } catch (err: any) {
      setGlobalError(err.message || "Failed to process application assessment.");
      setIsSubmitting(false);
    }
  };

  const handleQuickFill = (type: "prime" | "moderate" | "subprime") => {
    if (type === "prime") {
      setFormData({
        applicant_name: "Rajesh Sharma",
        no_of_dependents: 1,
        education: "Graduate",
        self_employed: "No",
        income_annum: 2400000,
        loan_amount: 3500000,
        loan_term: 15,
        cibil_score: 820,
        residential_assets_value: 6000000,
        commercial_assets_value: 2000000,
        luxury_assets_value: 1200000,
        bank_asset_value: 1800000,
      });
    } else if (type === "moderate") {
      setFormData({
        applicant_name: "Priya Patel",
        no_of_dependents: 2,
        education: "Graduate",
        self_employed: "Yes",
        income_annum: 1400000,
        loan_amount: 3200000,
        loan_term: 10,
        cibil_score: 680,
        residential_assets_value: 2500000,
        commercial_assets_value: 800000,
        luxury_assets_value: 400000,
        bank_asset_value: 600000,
      });
    } else {
      setFormData({
        applicant_name: "Amit Verma",
        no_of_dependents: 4,
        education: "Not Graduate",
        self_employed: "Yes",
        income_annum: 450000,
        loan_amount: 3000000,
        loan_term: 20,
        cibil_score: 420,
        residential_assets_value: 200000,
        commercial_assets_value: 0,
        luxury_assets_value: 0,
        bank_asset_value: 80000,
      });
    }
    setErrors({});
    setGlobalError(null);
  };

  const cibilTier = getCibilTier(formData.cibil_score);

  return (
    <Layout variant="app">
      <div className="space-y-8 max-w-5xl">
        {/* Navigation & Title */}
        <div className="space-y-3">
          <Link
            to="/dashboard"
            className="inline-flex items-center space-x-1.5 text-xs font-bold text-slate-500 hover:text-teal-850 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Workspace Dashboard</span>
          </Link>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-coral-100 border border-coral-200 text-coral-700 text-[11px] font-extrabold uppercase tracking-wider mb-2">
                <FilePlus className="w-3.5 h-3.5 text-coral-600" />
                <span>CANONICAL 11-PARAMETER ASSESSMENT</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-teal-900 tracking-tight">
                New Loan Assessment
              </h1>
              <p className="text-sm text-slate-600">
                Submit applicant financial details in native Indian Rupees (₹ INR) for real-time ML risk scoring.
              </p>
            </div>

            {/* Quick Fill Buttons */}
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => handleQuickFill("prime")}
                className="px-3 py-1.5 rounded-lg bg-teal-50 border border-teal-200 text-teal-900 text-xs font-bold hover:bg-teal-100 transition-colors"
              >
                Prime Sample
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill("moderate")}
                className="px-3 py-1.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-xs font-bold hover:bg-amber-100 transition-colors"
              >
                Moderate Sample
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill("subprime")}
                className="px-3 py-1.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-900 text-xs font-bold hover:bg-rose-100 transition-colors"
              >
                Subprime Sample
              </button>
            </div>
          </div>
        </div>

        {globalError && (
          <div className="p-4 rounded-xl bg-red-50 border border-red-200 flex items-start space-x-3 text-red-800 text-sm">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <span>{globalError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Section 1: Applicant Profile */}
          <div className="crediwise-card p-6 sm:p-8 space-y-6">
            <div className="flex items-center space-x-3 pb-3 border-b border-cream-300">
              <div className="w-9 h-9 rounded-xl bg-teal-100 text-teal-850 flex items-center justify-center">
                <GraduationCap className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-teal-900">1. Applicant Profile</h2>
                <p className="text-xs text-slate-500">Personal &amp; professional background details</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              <div className="sm:col-span-2 lg:col-span-1">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Applicant Full Name <span className="text-coral-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.applicant_name}
                  onChange={(e) => setFormData({ ...formData, applicant_name: e.target.value })}
                  placeholder="e.g. Rajesh Sharma"
                  required
                  className="w-full px-4 py-3 rounded-xl border border-cream-300 bg-cream-50/50 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-teal-700 focus:bg-white"
                />
                {errors.applicant_name && (
                  <p className="text-xs text-red-600 mt-1">{errors.applicant_name}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Number of Dependents <span className="text-coral-500">*</span>
                </label>
                <select
                  value={formData.no_of_dependents}
                  onChange={(e) => setFormData({ ...formData, no_of_dependents: parseInt(e.target.value) || 0 })}
                  className="w-full px-4 py-3 rounded-xl border border-cream-300 bg-cream-50/50 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-teal-700 focus:bg-white"
                >
                  <option value={0}>0 Dependents</option>
                  <option value={1}>1 Dependent</option>
                  <option value={2}>2 Dependents</option>
                  <option value={3}>3 Dependents</option>
                  <option value={4}>4 Dependents</option>
                  <option value={5}>5+ Dependents</option>
                </select>
                {errors.no_of_dependents && (
                  <p className="text-xs text-red-600 mt-1">{errors.no_of_dependents}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Education Level <span className="text-coral-500">*</span>
                </label>
                <select
                  value={formData.education}
                  onChange={(e) => setFormData({ ...formData, education: e.target.value as any })}
                  className="w-full px-4 py-3 rounded-xl border border-cream-300 bg-cream-50/50 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-teal-700 focus:bg-white"
                >
                  <option value="Graduate">Graduate (Degree completed)</option>
                  <option value="Not Graduate">Not Graduate</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Self Employed? <span className="text-coral-500">*</span>
                </label>
                <select
                  value={formData.self_employed}
                  onChange={(e) => setFormData({ ...formData, self_employed: e.target.value as any })}
                  className="w-full px-4 py-3 rounded-xl border border-cream-300 bg-cream-50/50 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-teal-700 focus:bg-white"
                >
                  <option value="No">No (Salaried Professional)</option>
                  <option value="Yes">Yes (Self-Employed / Business Owner)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 2: Income & Loan Details */}
          <div className="crediwise-card p-6 sm:p-8 space-y-6">
            <div className="flex items-center space-x-3 pb-3 border-b border-cream-300">
              <div className="w-9 h-9 rounded-xl bg-teal-100 text-teal-850 flex items-center justify-center">
                <Banknote className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-teal-900">2. Income &amp; Loan Parameters</h2>
                <p className="text-xs text-slate-500">Monetary requested amount and verifiable earnings in INR</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              <CurrencyInput
                label="Annual Gross Income"
                name="income_annum"
                value={formData.income_annum}
                onChange={(val) => setFormData({ ...formData, income_annum: val })}
                min={200000}
                max={9900000}
                helperText="Supported benchmark: ₹2,00,000 to ₹99,00,000 per annum"
                error={errors.income_annum}
              />

              <CurrencyInput
                label="Requested Loan Amount"
                name="loan_amount"
                value={formData.loan_amount}
                onChange={(val) => setFormData({ ...formData, loan_amount: val })}
                min={300000}
                max={39500000}
                helperText="Supported benchmark: ₹3,00,000 to ₹3,95,00,000"
                error={errors.loan_amount}
              />

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Loan Term <span className="text-coral-500">*</span>
                  </label>
                  <span className="text-xs font-extrabold text-teal-800 bg-teal-100/80 px-2 py-0.5 rounded">
                    {formData.loan_term} Years ({formData.loan_term * 12} Mos)
                  </span>
                </div>
                <input
                  type="range"
                  min={2}
                  max={20}
                  step={1}
                  value={formData.loan_term}
                  onChange={(e) => setFormData({ ...formData, loan_term: parseInt(e.target.value) || 2 })}
                  className="w-full h-2 bg-cream-300 rounded-lg appearance-none cursor-pointer accent-teal-750 mt-3"
                />
                <div className="flex justify-between text-[10px] font-bold text-slate-400">
                  <span>2 Years</span>
                  <span>10 Years</span>
                  <span>20 Years</span>
                </div>
                {errors.loan_term && <p className="text-xs text-red-600">{errors.loan_term}</p>}
              </div>
            </div>
          </div>

          {/* Section 3: Credit Profile */}
          <div className="crediwise-card p-6 sm:p-8 space-y-6">
            <div className="flex items-center space-x-3 pb-3 border-b border-cream-300">
              <div className="w-9 h-9 rounded-xl bg-teal-100 text-teal-850 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div className="flex-1 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-teal-900">3. Credit Bureau Profile</h2>
                  <p className="text-xs text-slate-500">CIBIL credit score (300 to 900)</p>
                </div>
                <span className={`px-3 py-1 rounded-xl text-xs font-extrabold border ${cibilTier.badgeClass}`}>
                  {cibilTier.label}
                </span>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  CIBIL Score
                </label>
                <span className="text-xl font-extrabold text-teal-900">
                  {formData.cibil_score}
                </span>
              </div>
              <input
                type="range"
                min={300}
                max={900}
                step={5}
                value={formData.cibil_score}
                onChange={(e) => setFormData({ ...formData, cibil_score: parseInt(e.target.value) || 300 })}
                className="w-full h-3 bg-cream-300 rounded-lg appearance-none cursor-pointer accent-teal-750"
              />
              <div className="flex justify-between text-[11px] font-bold text-slate-400">
                <span className="text-rose-600">300 (Sub-Prime)</span>
                <span className="text-amber-600">650 (Fair)</span>
                <span className="text-teal-600">750 (Prime Benchmark)</span>
                <span className="text-emerald-700">900</span>
              </div>
              {errors.cibil_score && <p className="text-xs text-red-600">{errors.cibil_score}</p>}
            </div>
          </div>

          {/* Section 4: Asset Information */}
          <div className="crediwise-card p-6 sm:p-8 space-y-6">
            <div className="flex items-center space-x-3 pb-3 border-b border-cream-300">
              <div className="w-9 h-9 rounded-xl bg-teal-100 text-teal-850 flex items-center justify-center">
                <Building2 className="w-5 h-5" />
              </div>
              <div className="flex-1 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-teal-900">4. Asset Portfolio</h2>
                  <p className="text-xs text-slate-500">Valuation of owned tangible &amp; liquid collateral</p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Total Assets</span>
                  <span className="text-sm font-extrabold text-teal-900">{formatINR(totalAssets)}</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <CurrencyInput
                label="Residential Assets Value"
                name="residential_assets_value"
                value={formData.residential_assets_value}
                onChange={(val) => setFormData({ ...formData, residential_assets_value: val })}
                helperText="Market value of residential apartments, villas, and plots"
                error={errors.residential_assets_value}
              />

              <CurrencyInput
                label="Commercial Assets Value"
                name="commercial_assets_value"
                value={formData.commercial_assets_value}
                onChange={(val) => setFormData({ ...formData, commercial_assets_value: val })}
                helperText="Market value of commercial shops, offices, or warehouses"
                error={errors.commercial_assets_value}
              />

              <CurrencyInput
                label="Luxury Assets Value"
                name="luxury_assets_value"
                value={formData.luxury_assets_value}
                onChange={(val) => setFormData({ ...formData, luxury_assets_value: val })}
                helperText="Market value of four-wheelers, jewelry, and movable assets"
                error={errors.luxury_assets_value}
              />

              <CurrencyInput
                label="Bank Liquid Assets / Deposits"
                name="bank_asset_value"
                value={formData.bank_asset_value}
                onChange={(val) => setFormData({ ...formData, bank_asset_value: val })}
                helperText="Total balances across savings, fixed deposits, and mutual funds"
                error={errors.bank_asset_value}
              />
            </div>
          </div>

          {/* Submission Bar */}
          <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <Link
              to="/dashboard"
              className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-white border border-cream-300 text-slate-700 font-bold text-sm text-center hover:bg-cream-50 transition-colors"
            >
              Cancel
            </Link>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full sm:w-auto flex items-center justify-center space-x-2 px-10 py-4 rounded-xl bg-teal-750 text-white font-bold text-base hover:bg-teal-850 transition-all shadow-md disabled:opacity-60"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  <span>{loadingStep || "Processing Assessment..."}</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5 text-teal-200" />
                  <span>Submit Application Assessment</span>
                  <ArrowRight className="w-5 h-5 text-teal-200" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
};

export default NewApplication;

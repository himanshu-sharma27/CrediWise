import React, { useEffect, useState } from "react";
import { Scale, CheckCircle2, AlertTriangle, BookOpen, Layers } from "lucide-react";
import Layout from "../components/Layout";
import api from "../services/api";
import { EligibilityRulesResponse } from "../types/api";

export const RulesPage: React.FC = () => {
  const [rules, setRules] = useState<EligibilityRulesResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRules = async () => {
      try {
        const data = await api.eligibility.getRules();
        setRules(data);
      } catch (err: any) {
        setError(err.message || "Failed to load policy rules.");
      } finally {
        setLoading(false);
      }
    };
    fetchRules();
  }, []);

  return (
    <Layout variant="public" showFooterBanner={true}>
      <div className="py-16 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto space-y-12">
        {/* Page Header */}
        <div className="text-center space-y-3 max-w-3xl mx-auto">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-[#FBF4EC] border border-[#E2E5E9] text-[#1A2B4C] text-xs font-bold uppercase tracking-wider">
            <Scale className="w-3.5 h-3.5 text-[#D4A373]" />
            <span>POLICY &amp; UNDERWRITING FRAMEWORK</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-[#1A2B4C] tracking-tight">
            Rules, Criteria &amp; Disclaimers
          </h1>
          <p className="text-base sm:text-lg text-[#4A5568] font-normal">
            Understand how CrediWise evaluates loan applications using the calibrated Kaggle INR machine learning model (<code className="text-[#1A2B4C] font-mono">loan-model-v2.0</code>).
          </p>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-8 h-8 rounded-full border-4 border-[#1A2B4C] border-t-transparent animate-spin mb-4" />
            <p className="text-[#4A5568] text-sm font-medium">Loading Underwriting Rules...</p>
          </div>
        ) : error ? (
          <div className="p-6 rounded-2xl bg-[#F8EEEE] border border-[#E5B8B3] text-[#7A332D] text-sm">
            {error}
          </div>
        ) : rules ? (
          <div className="space-y-10">
            {/* Model & Architecture Overview */}
            <div className="crediwise-card p-8 sm:p-10 grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <div className="flex items-center space-x-2 text-[#1A2B4C] font-bold text-sm">
                  <CheckCircle2 className="w-4 h-4 text-[#D4A373]" />
                  <span>Model Target</span>
                </div>
                <p className="text-2xl font-extrabold text-[#1A2B4C]">{rules.model_version}</p>
                <p className="text-xs text-[#4A5568]">Certified Gradient Boosting Architecture</p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center space-x-2 text-[#1A2B4C] font-bold text-sm">
                  <Layers className="w-4 h-4 text-[#D4A373]" />
                  <span>Monetary Standard</span>
                </div>
                <p className="text-2xl font-extrabold text-[#1A2B4C]">
                  {rules.currency} ({rules.currency_symbol})
                </p>
                <p className="text-xs text-[#4A5568]">100% Native Indian Rupee Calculations</p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center space-x-2 text-[#1A2B4C] font-bold text-sm">
                  <BookOpen className="w-4 h-4 text-[#D4A373]" />
                  <span>Feature Contract</span>
                </div>
                <p className="text-2xl font-extrabold text-[#1A2B4C]">11 Source Inputs</p>
                <p className="text-xs text-[#4A5568]">+ 10 Deterministic Engineered Features</p>
              </div>
            </div>

            {/* Required Input Features Table */}
            <div className="crediwise-card overflow-hidden">
              <div className="p-8 sm:p-10 border-b border-[#E2E5E9]">
                <h2 className="text-2xl font-bold text-[#1A2B4C]">
                  11 Certified Input Features
                </h2>
                <p className="text-sm text-[#4A5568] mt-1">
                  The model evaluates applications strictly based on the following authenticated parameters:
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-[#1A2B4C] text-white text-xs font-bold uppercase tracking-wider">
                    <tr>
                      <th className="py-3.5 px-6">Feature Name</th>
                      <th className="py-3.5 px-6">Type</th>
                      <th className="py-3.5 px-6">Benchmark / Range</th>
                      <th className="py-3.5 px-6">Description</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E2E5E9] text-[#1A2B4C]">
                    {rules.features.map((feat) => (
                      <tr key={feat.field_name} className="hover:bg-[#FBF4EC]/20 transition-colors">
                        <td className="py-3.5 px-6 font-bold text-[#1A2B4C]">{feat.display_name}</td>
                        <td className="py-3.5 px-6 text-xs font-mono text-[#4A5568]">{feat.type}</td>
                        <td className="py-3.5 px-6 font-bold text-[#D4A373] text-xs">{feat.benchmark_or_range}</td>
                        <td className="py-3.5 px-6 text-xs text-[#4A5568]">{feat.description}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* CIBIL Score Guide */}
            <div className="crediwise-card p-8 sm:p-10 space-y-6">
              <h2 className="text-2xl font-bold text-[#1A2B4C]">CIBIL Credit Score Tiers</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(rules.cibil_score_guide).map(([tier, desc]) => (
                  <div key={tier} className="p-5 rounded-2xl bg-[#F8F9FA] border border-[#E2E5E9] space-y-2">
                    <span className="text-xs font-extrabold text-[#1A2B4C] uppercase tracking-wider block">
                      {tier}
                    </span>
                    <p className="text-xs text-[#1A2B4C] leading-relaxed">{desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Legal / Assessment Disclaimer */}
            <div className="p-6 sm:p-8 rounded-2xl bg-[#FBF4EC]/70 border border-[#D4A373]/40 flex items-start space-x-4 text-[#79552F]">
              <AlertTriangle className="w-6 h-6 text-[#D4A373] flex-shrink-0 mt-1" />
              <div className="space-y-2 text-sm leading-relaxed">
                <h3 className="font-bold text-base text-[#79552F]">Responsible Assessment Disclaimer</h3>
                <p>{rules.disclaimer}</p>
              </div>
            </div>

            {/* Action CTA Card */}
            <div className="crediwise-card p-8 sm:p-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6 bg-[#1A2B4C] text-white">
              <div className="space-y-2">
                <h3 className="text-2xl font-black">Ready to Check Your Eligibility?</h3>
                <p className="text-sm text-[#FBF4EC] max-w-lg">
                  Submit your 11 authenticated financial parameters to get an instant prediction with full factor explainability.
                </p>
              </div>
              <a
                href="/applications/new"
                className="inline-flex items-center justify-center px-8 py-4 rounded-xl bg-[#D4A373] hover:bg-[#C48F5E] text-white font-bold text-base transition-colors shadow-sm whitespace-nowrap"
              >
                <span>Launch Assessment Form</span>
              </a>
            </div>
          </div>
        ) : null}
      </div>
    </Layout>
  );
};

export default RulesPage;


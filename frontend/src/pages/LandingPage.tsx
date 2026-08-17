import React from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  CheckCircle2,
  HelpCircle,
  TrendingUp,
  FileCheck2,
} from "lucide-react";
import Layout from "../components/Layout";
import CrediWiseLogo from "../components/CrediWiseLogo";
import { useAuth } from "../context/AuthContext";

export const LandingPage: React.FC = () => {
  const { isAuthenticated, isAdmin } = useAuth();
  const navigate = useNavigate();

  const handleEligibilityClick = () => {
    if (isAuthenticated) {
      navigate("/applications/new");
    } else {
      navigate("/login?returnTo=/applications/new");
    }
  };

  const handleRulesClick = () => {
    navigate("/rules");
  };

  const handleDashboardClick = () => {
    if (isAuthenticated) {
      navigate(isAdmin ? "/admin/dashboard" : "/dashboard");
    } else {
      navigate("/login?returnTo=/dashboard");
    }
  };

  const criteriaList = [
    "Stable or verifiable annual income information",
    "Requested loan principal amount and repayment tenure",
    "Credit bureau score (CIBIL 300 to 900 benchmark)",
    "Employment classification (Salaried vs. Self-Employed)",
    "Educational qualification status",
    "Number of financial dependents",
    "Comprehensive asset portfolio (Residential, Commercial, Luxury & Bank deposits)",
  ];

  return (
    <Layout variant="public" showFooterBanner={true}>
      {/* Hero Section */}
      <section className="pt-12 pb-20 sm:pt-20 sm:pb-28 px-4 sm:px-6 lg:px-8 text-center max-w-5xl mx-auto">
        {/* Hero Logo Banner */}
        <div className="flex items-center justify-center mb-8">
          <CrediWiseLogo height="54px" />
        </div>

        {/* Hero Title */}
        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold text-[#1A2B4C] tracking-tight leading-[1.1] mb-6">
          Smarter Loan Assessment,
          <span className="block text-[#D4A373] mt-1">Clearly Explained.</span>
        </h1>

        {/* Hero Subtitle */}
        <p className="text-lg sm:text-xl text-[#4A5568] max-w-3xl mx-auto leading-relaxed mb-10 font-normal">
          <strong className="text-[#1A2B4C] font-bold">CrediWise</strong> evaluates applicant financial information using an explainable Gradient Boosting machine-learning model, delivering real-time approval probabilities, risk scores, and clear factor attributions in native Indian Rupees (₹).
        </p>

        {/* Hero CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            onClick={handleEligibilityClick}
            className="w-full sm:w-auto flex items-center justify-center space-x-2 px-8 py-4 rounded-xl bg-[#1A2B4C] text-white font-bold text-base hover:bg-[#243A61] transition-all shadow-sm hover:shadow"
          >
            <span>Start Loan Assessment</span>
            <ArrowRight className="w-5 h-5 text-[#D4A373]" />
          </button>

          <button
            onClick={handleRulesClick}
            className="w-full sm:w-auto px-8 py-4 rounded-xl bg-white text-[#1A2B4C] border border-[#CBD2DA] font-bold text-base hover:bg-[#F3F4F6] transition-all shadow-xs"
          >
            Eligibility Guidelines
          </button>

          <button
            onClick={handleDashboardClick}
            className="w-full sm:w-auto px-6 py-4 rounded-xl bg-[#FBF4EC] text-[#79552F] border border-[#E7CBB0] font-bold text-base hover:bg-[#F2DFCF] transition-all"
          >
            Applicant Workspace
          </button>
        </div>
      </section>

      {/* How CrediWise Works */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#1A2B4C] tracking-tight">
            How CrediWise Works
          </h2>
          <p className="text-[#4A5568] text-base sm:text-lg mt-2 font-normal">
            Three simple steps to assess your loan approval probability
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
          {/* Step 1 */}
          <div className="crediwise-card p-8 transition-transform hover:-translate-y-1 duration-200">
            <div className="w-12 h-12 rounded-xl bg-[#FBF4EC] text-[#79552F] font-bold text-xl flex items-center justify-center mb-6">
              1
            </div>
            <h3 className="text-xl font-bold text-[#1A2B4C] mb-3">
              Provide Your Information
            </h3>
            <p className="text-[#4A5568] leading-relaxed text-sm sm:text-base">
              Enter your financial details through the CrediWise assessment workflow in native Indian Rupees (INR).
            </p>
          </div>

          {/* Step 2 */}
          <div className="crediwise-card p-8 transition-transform hover:-translate-y-1 duration-200">
            <div className="w-12 h-12 rounded-xl bg-[#FBF4EC] text-[#79552F] font-bold text-xl flex items-center justify-center mb-6">
              2
            </div>
            <h3 className="text-xl font-bold text-[#1A2B4C] mb-3">
              Assessment
            </h3>
            <p className="text-[#4A5568] leading-relaxed text-sm sm:text-base">
              The active loan prediction model processes your data against validated risk parameters.
            </p>
          </div>

          {/* Step 3 */}
          <div className="crediwise-card p-8 transition-transform hover:-translate-y-1 duration-200">
            <div className="w-12 h-12 rounded-xl bg-[#FBF4EC] text-[#79552F] font-bold text-xl flex items-center justify-center mb-6">
              3
            </div>
            <h3 className="text-xl font-bold text-[#1A2B4C] mb-3">
              Understand Your Result
            </h3>
            <p className="text-[#4A5568] leading-relaxed text-sm sm:text-base">
              Receive an approval probability, risk category and contributing factors.
            </p>
          </div>
        </div>
      </section>

      {/* Eligibility Criteria Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="crediwise-card p-8 sm:p-12 lg:p-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
            {/* Left Content */}
            <div className="lg:col-span-7 space-y-6">
              <div>
                <span className="text-xs font-bold tracking-widest text-[#D4A373] uppercase">
                  EVALUATION FRAMEWORK
                </span>
                <h2 className="text-3xl sm:text-4xl font-extrabold text-[#1A2B4C] tracking-tight mt-1">
                  Eligibility Criteria
                </h2>
                <p className="text-[#4A5568] mt-2 text-base">
                  The assessment uses financial and applicant information to estimate loan approval likelihood:
                </p>
              </div>

              <div className="space-y-3.5 pt-2">
                {criteriaList.map((item, index) => (
                  <div key={index} className="flex items-start space-x-3 text-[#1A2B4C]">
                    <CheckCircle2 className="w-5 h-5 text-[#4F6F52] flex-shrink-0 mt-0.5" />
                    <span className="text-sm sm:text-base font-medium">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Notice Card */}
            <div className="lg:col-span-5 bg-[#F8F9FA] border border-[#E2E5E9] rounded-2xl p-6 sm:p-8 flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div className="flex items-center space-x-2.5 text-[#1A2B4C]">
                  <HelpCircle className="w-6 h-6 text-[#D4A373]" />
                  <h3 className="text-lg font-bold">Important Notice</h3>
                </div>
                <p className="text-sm text-[#4A5568] leading-relaxed">
                  Eligibility criteria are model inputs and application assessment rules used for probability estimation. They do not constitute a formal lending guarantee or credit approval from any bank or financial institution.
                </p>
              </div>

              <div className="pt-4 border-t border-[#E2E5E9] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <span className="text-[#718096] font-medium">Want to see all policy guidelines?</span>
                <Link
                  to="/rules"
                  className="font-bold text-[#1A2B4C] hover:text-[#D4A373] flex items-center space-x-1"
                >
                  <span>Read Policy Rules</span>
                  <ArrowRight className="w-3.5 h-3.5 text-[#D4A373]" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* What You Need / What You Receive */}
      <section className="py-12 pb-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Card 1: What You Need */}
          <div className="crediwise-card p-8 sm:p-10 space-y-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-[#FBF4EC] text-[#1A2B4C] flex items-center justify-center">
                <FileCheck2 className="w-5 h-5 text-[#D4A373]" />
              </div>
              <h3 className="text-2xl font-bold text-[#1A2B4C]">What You Need</h3>
            </div>
            <ul className="space-y-3 text-[#4A5568] text-sm sm:text-base">
              <li className="flex items-center space-x-2.5">
                <div className="w-1.5 h-1.5 rounded-full bg-[#D4A373]" />
                <span>Verified annual income details</span>
              </li>
              <li className="flex items-center space-x-2.5">
                <div className="w-1.5 h-1.5 rounded-full bg-[#D4A373]" />
                <span>Credit score (CIBIL benchmark)</span>
              </li>
              <li className="flex items-center space-x-2.5">
                <div className="w-1.5 h-1.5 rounded-full bg-[#D4A373]" />
                <span>Requested loan amount &amp; desired tenure</span>
              </li>
              <li className="flex items-center space-x-2.5">
                <div className="w-1.5 h-1.5 rounded-full bg-[#D4A373]" />
                <span>Asset portfolio valuations (Residential, Commercial, Luxury, Bank)</span>
              </li>
              <li className="flex items-center space-x-2.5">
                <div className="w-1.5 h-1.5 rounded-full bg-[#D4A373]" />
                <span>Basic applicant profile information</span>
              </li>
            </ul>
          </div>

          {/* Card 2: What You Receive */}
          <div className="crediwise-card p-8 sm:p-10 space-y-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-[#FBF4EC] text-[#1A2B4C] flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-[#D4A373]" />
              </div>
              <h3 className="text-2xl font-bold text-[#1A2B4C]">What You Receive</h3>
            </div>
            <ul className="space-y-3 text-[#4A5568] text-sm sm:text-base">
              <li className="flex items-center space-x-2.5">
                <div className="w-1.5 h-1.5 rounded-full bg-[#D4A373]" />
                <span>Calibrated ML approval probability percentage</span>
              </li>
              <li className="flex items-center space-x-2.5">
                <div className="w-1.5 h-1.5 rounded-full bg-[#D4A373]" />
                <span>Multi-pillar risk level classification (LOW / MEDIUM / HIGH)</span>
              </li>
              <li className="flex items-center space-x-2.5">
                <div className="w-1.5 h-1.5 rounded-full bg-[#D4A373]" />
                <span>Ranked positive &amp; negative factor attribution explanations</span>
              </li>
              <li className="flex items-center space-x-2.5">
                <div className="w-1.5 h-1.5 rounded-full bg-[#D4A373]" />
                <span>Deterministic debt indicators (EMI, Asset Coverage, Leverage)</span>
              </li>
              <li className="flex items-center space-x-2.5">
                <div className="w-1.5 h-1.5 rounded-full bg-[#D4A373]" />
                <span>Personal assessment history and What-If simulation sandbox</span>
              </li>
            </ul>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default LandingPage;


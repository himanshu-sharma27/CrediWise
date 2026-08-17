import React from "react";
import { useNavigate } from "react-router-dom";
import {
  CheckCircle2,
  Award,
  ArrowRight,
  Banknote,
  GraduationCap,
  Briefcase,
  Users,
  Building2,
  CreditCard,
} from "lucide-react";
import Layout from "../components/Layout";

export const EligibilityPage: React.FC = () => {
  const navigate = useNavigate();

  const requirements = [
    {
      icon: Banknote,
      title: "Monthly / Annual Income",
      description: "Verifiable net annual gross income in Indian Rupees (INR)",
    },
    {
      icon: CreditCard,
      title: "Requested Loan Amount",
      description: "Total desired principal borrowing amount (INR)",
    },
    {
      icon: Award,
      title: "Credit Score (CIBIL)",
      description: "Credit bureau score between 300 and 900",
    },
    {
      icon: Briefcase,
      title: "Employment Type",
      description: "Salaried individual ('No') or Self-Employed business owner ('Yes')",
    },
    {
      icon: GraduationCap,
      title: "Education Level",
      description: "Formal qualification ('Graduate' or 'Not Graduate')",
    },
    {
      icon: Users,
      title: "Dependents",
      description: "Number of family members financially reliant on applicant",
    },
    {
      icon: Building2,
      title: "Asset Portfolio",
      description: "Market valuation of Residential, Commercial, Luxury, and Bank assets",
    },
  ];

  return (
    <Layout variant="app">
      <div className="space-y-8">
        {/* Header */}
        <div className="space-y-3">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-[#FBF4EC] border border-[#E7CBB0] text-[#79552F] text-[11px] font-extrabold uppercase tracking-wider">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#D4A373]" />
            <span>ASSESSMENT PREPARATION</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#1A2B4C] tracking-tight">
            Eligibility Workflow &amp; Requirements
          </h1>
          <p className="text-sm sm:text-base text-[#4A5568] max-w-3xl">
            Before submitting your application, review the required information and select how you would like to provide your details.
          </p>
        </div>

        {/* Required Information Section */}
        <div className="space-y-6">
          <h2 className="text-xl font-bold text-[#1A2B4C]">Required Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            {requirements.map((req, idx) => {
              const ReqIcon = req.icon;
              return (
                <div
                  key={idx}
                  className="crediwise-card p-6 flex items-start space-x-4 transition-all hover:border-[#D4A373]"
                >
                  <div className="w-10 h-10 rounded-xl bg-[#FBF4EC] border border-[#E7CBB0] flex items-center justify-center text-[#1A2B4C] flex-shrink-0 mt-0.5">
                    <ReqIcon className="w-5 h-5 text-[#D4A373]" />
                  </div>
                  <div>
                    <h3 className="font-bold text-[#1A2B4C] text-base">{req.title}</h3>
                    <p className="text-xs sm:text-sm text-[#4A5568] mt-1 leading-relaxed">
                      {req.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Action Card */}
        <div className="crediwise-card p-8 bg-[#F8F9FA] flex flex-col sm:flex-row items-center justify-between gap-6 border-[#E2E5E9]">
          <div className="space-y-1 text-center sm:text-left">
            <h3 className="text-lg font-bold text-[#1A2B4C]">Ready to Start Assessment?</h3>
            <p className="text-sm text-[#4A5568]">
              Complete the 11 verified parameters to receive instant ML prediction &amp; factor analysis.
            </p>
          </div>

          <button
            onClick={() => navigate("/applications/new")}
            className="flex items-center space-x-2 px-8 py-3.5 rounded-xl bg-[#1A2B4C] hover:bg-[#243A61] text-white font-bold text-sm transition-colors shadow-sm"
          >
            <span>Proceed to New Assessment</span>
            <ArrowRight className="w-4 h-4 text-[#D4A373]" />
          </button>
        </div>
      </div>
    </Layout>
  );
};

export default EligibilityPage;


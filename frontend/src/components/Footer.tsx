import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

interface FooterProps {
  showBanner?: boolean;
}

export const Footer: React.FC<FooterProps> = ({ showBanner = true }) => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleAssessmentCta = () => {
    if (isAuthenticated) {
      navigate("/eligibility");
    } else {
      navigate("/login?returnTo=/eligibility");
    }
  };

  return (
    <footer>
      {/* Responsible Assessment Banner */}
      {showBanner && (
        <section className="bg-[#1A2B4C] text-white py-16 px-4 sm:px-6 lg:px-8 text-center">
          <div className="max-w-4xl mx-auto space-y-6">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              Responsible Assessment
            </h2>
            <p className="text-base sm:text-lg text-[#DCE3EC] leading-relaxed font-normal max-w-3xl mx-auto">
              CrediWise provides a prediction and explainability analysis. The result is an estimated probability based on historical data patterns and business rules. It does not constitute a guaranteed bank sanction or formal loan commitment.
            </p>
            <div className="pt-2">
              <button
                onClick={handleAssessmentCta}
                className="px-8 py-3.5 rounded-xl bg-[#D4A373] text-[#1A2B4C] font-bold text-sm hover:bg-[#C48F5E] transition-colors shadow-sm"
              >
                Start Your Assessment
              </button>
            </div>
          </div>
        </section>
      )}

      {/* Copyright & Quick Links */}
      <div className="bg-[#1A2B4C] border-t border-[#2D4160] py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-medium text-[#DCE3EC]">
          <p>© 2026 CrediWise. All rights reserved.</p>
          <div className="flex items-center space-x-6">
            <Link to="/rules" className="text-white hover:text-[#D4A373] transition-colors">
              Rules &amp; Policies
            </Link>
            {!isAuthenticated ? (
              <>
                <Link to="/login" className="text-white hover:text-[#D4A373] transition-colors">
                  Sign In
                </Link>
                <Link to="/register" className="text-white hover:text-[#D4A373] transition-colors">
                  Register
                </Link>
              </>
            ) : (
              <Link to="/dashboard" className="text-white hover:text-[#D4A373] transition-colors">
                Workspace Dashboard
              </Link>
            )}
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;


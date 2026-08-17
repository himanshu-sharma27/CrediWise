import React, { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { LogIn, AlertCircle, UserCheck } from "lucide-react";
import Layout from "../components/Layout";
import CrediWiseLogo from "../components/CrediWiseLogo";
import { useAuth } from "../context/AuthContext";

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const returnTo = searchParams.get("returnTo") || searchParams.get("redirect");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email || !password) {
      setError("Please provide both email and password.");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await login({ email, password });
      const targetPath = returnTo
        ? decodeURIComponent(returnTo)
        : response.user.role === "admin"
        ? "/admin/dashboard"
        : "/dashboard";
      navigate(targetPath, { replace: true });
    } catch (err: any) {
      setError(err.message || "Invalid email or password.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickFill = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setError(null);
  };

  return (
    <Layout variant="public" showFooterBanner={false}>
      <div className="min-h-[calc(100vh-180px)] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 bg-[#F8F9FA]">
        <div className="max-w-md w-full mx-auto space-y-8">
          {/* Card Header */}
          <div className="text-center space-y-2 flex flex-col items-center">
            <CrediWiseLogo height="54px" className="mx-auto mb-2" />
            <h1 className="text-2xl font-extrabold text-[#1A2B4C] tracking-tight">
              Sign In to Your Account
            </h1>
            <p className="text-sm text-[#4A5568]">
              Access your applicant assessment portal or admin workspace
            </p>
          </div>

          {/* Authentication Card */}
          <div className="crediwise-card p-8 sm:p-10">
            {error && (
              <div className="mb-6 p-4 rounded-xl bg-[#F8EEEE] border border-[#E5B8B3] flex items-start space-x-3 text-[#7A332D] text-sm animate-fadeIn">
                <AlertCircle className="w-5 h-5 text-[#A6534A] flex-shrink-0 mt-0.5" />
                <span className="leading-snug">{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-[#1A2B4C] uppercase tracking-wider mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  required
                  className="w-full px-4 py-3 rounded-xl border border-[#CBD2DA] bg-white text-[#1A2B4C] placeholder:text-[#718096] focus:outline-none text-sm transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1A2B4C] uppercase tracking-wider mb-2">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full px-4 py-3 rounded-xl border border-[#CBD2DA] bg-white text-[#1A2B4C] placeholder:text-[#718096] focus:outline-none text-sm transition-all"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex items-center justify-center space-x-2 py-3.5 px-4 rounded-xl bg-[#1A2B4C] text-white font-bold text-sm hover:bg-[#243A61] transition-colors shadow-sm disabled:opacity-70 mt-2"
              >
                {isSubmitting ? (
                  <span>Signing in...</span>
                ) : (
                  <>
                    <LogIn className="w-4 h-4 text-[#D4A373]" />
                    <span>Sign In to Workspace</span>
                  </>
                )}
              </button>
            </form>

            {/* Quick Demo Credentials */}
            <div className="mt-8 pt-6 border-t border-[#E2E5E9] space-y-3">
              <div className="flex items-center space-x-2 text-xs font-bold text-[#718096] uppercase tracking-wider">
                <UserCheck className="w-4 h-4 text-[#D4A373]" />
                <span>Quick-Fill Demo Account</span>
              </div>
              <div>
                <button
                  type="button"
                  onClick={() => handleQuickFill("applicant@credwise.ai", "Password@123")}
                  className="w-full px-4 py-2.5 text-left rounded-lg bg-[#FBF4EC] border border-[#E7CBB0] hover:bg-[#F2DFCF] text-[#1A2B4C] text-xs font-medium transition-colors flex items-center justify-between"
                >
                  <div>
                    <span className="font-bold block">Applicant Demo</span>
                    <span className="text-[10px] text-[#79552F] block">applicant@credwise.ai</span>
                  </div>
                  <span className="text-[10px] font-bold text-[#79552F] bg-[#FBF4EC] px-2 py-0.5 rounded border border-[#E7CBB0]">Click to Fill</span>
                </button>
              </div>
            </div>

            {/* Link to Register */}
            <div className="mt-6 text-center text-sm text-[#4A5568]">
              Don't have an applicant account?{" "}
              <Link
                to="/register"
                className="font-bold text-[#1A2B4C] hover:text-[#D4A373] transition-colors"
              >
                Register Here
              </Link>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default LoginPage;


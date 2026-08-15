import React, { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ShieldCheck, LogIn, AlertCircle, UserCheck } from "lucide-react";
import Layout from "../components/Layout";
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
      <div className="min-h-[calc(100vh-180px)] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full mx-auto space-y-8">
          {/* Card Header */}
          <div className="text-center space-y-2">
            <div className="w-14 h-14 rounded-2xl bg-teal-850 text-white flex items-center justify-center mx-auto shadow-sm">
              <ShieldCheck className="w-8 h-8 text-teal-100" />
            </div>
            <h1 className="text-3xl font-extrabold text-teal-900 tracking-tight">
              Sign In to Credi<span className="text-coral-500">Wise</span>
            </h1>
            <p className="text-sm text-slate-600">
              Access your applicant assessment portal or admin workspace
            </p>
          </div>

          {/* Authentication Card */}
          <div className="crediwise-card p-8 sm:p-10">
            {error && (
              <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 flex items-start space-x-3 text-red-800 text-sm animate-fadeIn">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <span className="leading-snug">{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  required
                  className="w-full px-4 py-3 rounded-xl border border-cream-300 bg-cream-50/50 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-750 focus:bg-white text-sm transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full px-4 py-3 rounded-xl border border-cream-300 bg-cream-50/50 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-750 focus:bg-white text-sm transition-all"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex items-center justify-center space-x-2 py-3.5 px-4 rounded-xl bg-teal-750 text-white font-bold text-sm hover:bg-teal-850 transition-colors shadow-sm disabled:opacity-70 mt-2"
              >
                {isSubmitting ? (
                  <span>Signing in...</span>
                ) : (
                  <>
                    <LogIn className="w-4 h-4" />
                    <span>Sign In to Workspace</span>
                  </>
                )}
              </button>
            </form>

            {/* Quick Demo Credentials */}
            <div className="mt-8 pt-6 border-t border-cream-300 space-y-3">
              <div className="flex items-center space-x-2 text-xs font-bold text-slate-500 uppercase tracking-wider">
                <UserCheck className="w-4 h-4 text-coral-500" />
                <span>Quick-Fill Demo Accounts</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleQuickFill("applicant@credwise.ai", "Password@123")}
                  className="px-3 py-2 text-left rounded-lg bg-teal-50 border border-teal-100 hover:bg-teal-100 text-teal-900 text-xs font-medium transition-colors"
                >
                  <span className="font-bold block">Applicant Demo</span>
                  <span className="text-[10px] text-teal-700 truncate block">applicant@credwise.ai</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickFill("admin@credwise.ai", "AdminPassword@123")}
                  className="px-3 py-2 text-left rounded-lg bg-coral-50 border border-coral-100 hover:bg-coral-100 text-coral-900 text-xs font-medium transition-colors"
                >
                  <span className="font-bold block">Admin Demo</span>
                  <span className="text-[10px] text-coral-700 truncate block">admin@credwise.ai</span>
                </button>
              </div>
            </div>

            {/* Link to Register */}
            <div className="mt-6 text-center text-sm text-slate-600">
              Don't have an applicant account?{" "}
              <Link
                to="/register"
                className="font-bold text-coral-600 hover:text-coral-700 transition-colors"
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

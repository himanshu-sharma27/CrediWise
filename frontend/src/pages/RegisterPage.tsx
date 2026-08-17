import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ShieldCheck, UserPlus, AlertCircle } from "lucide-react";
import Layout from "../components/Layout";
import { useAuth } from "../context/AuthContext";

export const RegisterPage: React.FC = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim() || !email.trim() || !password) {
      setError("Please fill in all required fields.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    setIsSubmitting(true);
    try {
      await register({
        name: name.trim(),
        email: email.trim(),
        password,
      });
      navigate("/dashboard", { replace: true });
    } catch (err: any) {
      setError(err.message || "Registration failed. Please check your information.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Layout variant="public" showFooterBanner={false}>
      <div className="min-h-[calc(100vh-180px)] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full mx-auto space-y-8">
          {/* Header */}
          <div className="text-center space-y-2">
            <div className="w-14 h-14 rounded-2xl bg-teal-850 text-white flex items-center justify-center mx-auto shadow-sm">
              <ShieldCheck className="w-8 h-8 text-teal-100" />
            </div>
            <h1 className="text-3xl font-extrabold text-teal-900 tracking-tight">
              Create Applicant Account
            </h1>
            <p className="text-sm text-slate-600">
              Join CrediWise to assess loan eligibility with an explainable model
            </p>
          </div>

          {/* Registration Form Card */}
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
                  Full Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Rajesh Sharma"
                  required
                  className="w-full px-4 py-3 rounded-xl border border-cream-300 bg-cream-50/50 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-750 focus:bg-white text-sm transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="rajesh.sharma@example.com"
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
                  placeholder="Minimum 6 characters"
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
                  <span>Creating Account...</span>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" />
                    <span>Create Applicant Account</span>
                  </>
                )}
              </button>
            </form>

            <div className="mt-8 text-center text-sm text-slate-600">
              Already have an account?{" "}
              <Link
                to="/login"
                className="font-bold text-coral-600 hover:text-coral-700 transition-colors"
              >
                Return to Login
              </Link>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default RegisterPage;

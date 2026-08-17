import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { UserPlus, AlertCircle } from "lucide-react";
import Layout from "../components/Layout";
import CrediWiseLogo from "../components/CrediWiseLogo";
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
      <div className="min-h-[calc(100vh-180px)] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 bg-[#F8F9FA]">
        <div className="max-w-md w-full mx-auto space-y-8">
          {/* Header */}
          <div className="text-center space-y-2 flex flex-col items-center">
            <CrediWiseLogo height="54px" className="mx-auto mb-2" />
            <h1 className="text-2xl font-extrabold text-[#1A2B4C] tracking-tight">
              Create Applicant Account
            </h1>
            <p className="text-sm text-[#4A5568]">
              Join CrediWise to assess loan eligibility with an explainable model
            </p>
          </div>

          {/* Registration Form Card */}
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
                  Full Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Rajesh Sharma"
                  required
                  className="w-full px-4 py-3 rounded-xl border border-[#CBD2DA] bg-white text-[#1A2B4C] placeholder:text-[#718096] focus:outline-none text-sm transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1A2B4C] uppercase tracking-wider mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="rajesh.sharma@example.com"
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
                  placeholder="Minimum 6 characters"
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
                  <span>Creating Account...</span>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4 text-[#D4A373]" />
                    <span>Create Applicant Account</span>
                  </>
                )}
              </button>
            </form>

            <div className="mt-8 text-center text-sm text-[#4A5568]">
              Already have an account?{" "}
              <Link
                to="/login"
                className="font-bold text-[#1A2B4C] hover:text-[#D4A373] transition-colors"
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


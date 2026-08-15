import React from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { FactorExplanation } from "../types/api";

interface FactorCardProps {
  factor: FactorExplanation;
}

export const FactorCard: React.FC<FactorCardProps> = ({ factor }) => {
  const isPositive = factor.impact === "POSITIVE";
  const isNegative = factor.impact === "NEGATIVE";

  return (
    <div
      className={`p-4 rounded-xl border transition-all ${
        isPositive
          ? "bg-teal-50/50 border-teal-200/80 hover:border-teal-300"
          : isNegative
          ? "bg-coral-50/50 border-coral-200/80 hover:border-coral-300"
          : "bg-cream-50 border-cream-300"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start space-x-3">
          <div
            className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${
              isPositive
                ? "bg-teal-100 text-teal-800"
                : isNegative
                ? "bg-coral-100 text-coral-700"
                : "bg-slate-100 text-slate-700"
            }`}
          >
            {isPositive ? (
              <TrendingUp className="w-4 h-4" />
            ) : isNegative ? (
              <TrendingDown className="w-4 h-4" />
            ) : (
              <Minus className="w-4 h-4" />
            )}
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Rank #{factor.rank}
              </span>
              <span
                className={`text-[10px] font-extrabold uppercase px-1.5 py-0.2 rounded ${
                  isPositive
                    ? "bg-teal-100 text-teal-850"
                    : isNegative
                    ? "bg-coral-100 text-coral-800"
                    : "bg-slate-100 text-slate-800"
                }`}
              >
                {factor.impact}
              </span>
            </div>
            <h4 className="font-bold text-teal-900 text-sm mt-0.5">{factor.display_name}</h4>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed">{factor.explanation_text}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FactorCard;

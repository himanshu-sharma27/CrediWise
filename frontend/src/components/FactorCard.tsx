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
          ? "bg-[#EEF4EE]/60 border-[#A7C1A9] hover:border-[#4F6F52]"
          : isNegative
          ? "bg-[#F8EEEE]/70 border-[#E5B8B3] hover:border-[#A6534A]"
          : "bg-[#F8F9FA] border-[#E2E5E9]"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start space-x-3">
          <div
            className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${
              isPositive
                ? "bg-[#EEF4EE] text-[#4F6F52]"
                : isNegative
                ? "bg-[#F8EEEE] text-[#A6534A]"
                : "bg-[#F3F4F6] text-[#4A5568]"
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
              <span className="text-xs font-bold uppercase tracking-wider text-[#718096]">
                Rank #{factor.rank}
              </span>
              <span
                className={`text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded ${
                  isPositive
                    ? "bg-[#EEF4EE] text-[#315236]"
                    : isNegative
                    ? "bg-[#F8EEEE] text-[#7A332D]"
                    : "bg-[#F3F4F6] text-[#4A5568]"
                }`}
              >
                {factor.impact}
              </span>
            </div>
            <h4 className="font-bold text-[#1A2B4C] text-sm mt-0.5">{factor.display_name}</h4>
            <p className="text-xs text-[#4A5568] mt-1 leading-relaxed">{factor.explanation_text}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FactorCard;


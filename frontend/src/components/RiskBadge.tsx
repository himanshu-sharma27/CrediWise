import React from "react";
import { AlertTriangle, CheckCircle2, AlertOctagon, Info } from "lucide-react";

interface RiskBadgeProps {
  level: "LOW" | "MEDIUM" | "HIGH" | string;
  showIcon?: boolean;
  size?: "sm" | "md" | "lg";
}

export const RiskBadge: React.FC<RiskBadgeProps> = ({
  level,
  showIcon = true,
  size = "md",
}) => {
  const normLevel = (level || "MEDIUM").toUpperCase();

  const config = {
    LOW: {
      label: "Low Risk",
      bg: "bg-[#EEF4EE] text-[#315236] border-[#A7C1A9]",
      icon: CheckCircle2,
      iconColor: "text-[#4F6F52]",
    },
    MEDIUM: {
      label: "Moderate Risk",
      bg: "bg-[#FBF4EC] text-[#79552F] border-[#E7CBB0]",
      icon: AlertTriangle,
      iconColor: "text-[#D4A373]",
    },
    HIGH: {
      label: "High Risk",
      bg: "bg-[#F8EEEE] text-[#7A332D] border-[#E5B8B3]",
      icon: AlertOctagon,
      iconColor: "text-[#A6534A]",
    },
  }[normLevel] || {
    label: normLevel,
    bg: "bg-[#F3F4F6] text-[#4A5568] border-[#E2E5E9]",
    icon: Info,
    iconColor: "text-[#4A5568]",
  };

  const Icon = config.icon;

  const sizeClasses = {
    sm: "px-2 py-0.5 text-[10px]",
    md: "px-2.5 py-1 text-xs",
    lg: "px-3.5 py-1.5 text-sm",
  }[size];

  return (
    <span
      className={`inline-flex items-center space-x-1.5 font-bold uppercase tracking-wider rounded-lg border ${config.bg} ${sizeClasses}`}
    >
      {showIcon && <Icon className={`w-3.5 h-3.5 ${config.iconColor}`} />}
      <span>{config.label}</span>
    </span>
  );
};

export default RiskBadge;


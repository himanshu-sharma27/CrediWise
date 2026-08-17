import React from "react";
import { CheckCircle2, XCircle, Clock, AlertCircle } from "lucide-react";

interface DecisionBadgeProps {
  status: "APPROVED" | "REJECTED" | "UNDER_REVIEW" | "INFO_REQUESTED" | string;
  size?: "sm" | "md" | "lg";
}

export const DecisionBadge: React.FC<DecisionBadgeProps> = ({
  status,
  size = "md",
}) => {
  const normStatus = (status || "UNDER_REVIEW").toUpperCase();

  const config = {
    APPROVED: {
      label: "Approved",
      bg: "bg-[#EEF4EE] text-[#315236] border-[#A7C1A9]",
      icon: CheckCircle2,
      iconColor: "text-[#4F6F52]",
    },
    REJECTED: {
      label: "Rejected",
      bg: "bg-[#F8EEEE] text-[#7A332D] border-[#E5B8B3]",
      icon: XCircle,
      iconColor: "text-[#A6534A]",
    },
    UNDER_REVIEW: {
      label: "Under Review",
      bg: "bg-[#F3F4F6] text-[#1A2B4C] border-[#CBD2DA]",
      icon: Clock,
      iconColor: "text-[#4A5568]",
    },
    INFO_REQUESTED: {
      label: "Info Requested",
      bg: "bg-[#FBF4EC] text-[#79552F] border-[#E7CBB0]",
      icon: AlertCircle,
      iconColor: "text-[#D4A373]",
    },
  }[normStatus] || {
    label: normStatus,
    bg: "bg-[#F3F4F6] text-[#4A5568] border-[#E2E5E9]",
    icon: Clock,
    iconColor: "text-[#718096]",
  };

  const Icon = config.icon;

  const sizeClasses = {
    sm: "px-2.5 py-0.5 text-xs font-bold",
    md: "px-3 py-1 text-xs font-extrabold",
    lg: "px-4 py-2 text-sm font-extrabold",
  }[size];

  return (
    <span
      className={`inline-flex items-center space-x-1.5 rounded-lg border ${config.bg} ${sizeClasses}`}
    >
      <Icon className={`w-4 h-4 flex-shrink-0 ${config.iconColor}`} />
      <span>{config.label}</span>
    </span>
  );
};

export default DecisionBadge;


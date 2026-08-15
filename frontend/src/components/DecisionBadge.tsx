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
      bg: "bg-teal-100/80 text-teal-900 border-teal-300",
      icon: CheckCircle2,
      iconColor: "text-teal-700",
    },
    REJECTED: {
      label: "Rejected",
      bg: "bg-coral-100/70 text-coral-900 border-coral-200",
      icon: XCircle,
      iconColor: "text-coral-600",
    },
    UNDER_REVIEW: {
      label: "Under Review",
      bg: "bg-blue-50 text-blue-900 border-blue-200",
      icon: Clock,
      iconColor: "text-blue-600",
    },
    INFO_REQUESTED: {
      label: "Info Requested",
      bg: "bg-amber-50 text-amber-900 border-amber-200",
      icon: AlertCircle,
      iconColor: "text-amber-600",
    },
  }[normStatus] || {
    label: normStatus,
    bg: "bg-slate-50 text-slate-800 border-slate-200",
    icon: Clock,
    iconColor: "text-slate-600",
  };

  const Icon = config.icon;

  const sizeClasses = {
    sm: "px-2.5 py-0.5 text-xs font-bold",
    md: "px-3 py-1 text-xs font-extrabold",
    lg: "px-4 py-2 text-sm font-extrabold",
  }[size];

  return (
    <span
      className={`inline-flex items-center space-x-1.5 rounded-xl border ${config.bg} ${sizeClasses}`}
    >
      <Icon className="w-4 h-4 flex-shrink-0" />
      <span>{config.label}</span>
    </span>
  );
};

export default DecisionBadge;

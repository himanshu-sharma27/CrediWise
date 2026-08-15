import React from "react";
import { ShieldAlert, ShieldCheck, Shield } from "lucide-react";

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
      bg: "bg-emerald-50 text-emerald-800 border-emerald-200",
      icon: ShieldCheck,
      iconColor: "text-emerald-600",
    },
    MEDIUM: {
      label: "Moderate Risk",
      bg: "bg-amber-50 text-amber-800 border-amber-200",
      icon: Shield,
      iconColor: "text-amber-600",
    },
    HIGH: {
      label: "High Risk",
      bg: "bg-rose-50 text-rose-800 border-rose-200",
      icon: ShieldAlert,
      iconColor: "text-rose-600",
    },
  }[normLevel] || {
    label: normLevel,
    bg: "bg-slate-50 text-slate-800 border-slate-200",
    icon: Shield,
    iconColor: "text-slate-600",
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

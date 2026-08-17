/**
 * Indian Rupee (INR / en-IN) Formatting Utilities.
 * Strictly compliant with CrediWise monetary standards.
 */

export const formatINR = (amount?: number | null): string => {
  if (amount === undefined || amount === null || isNaN(amount)) {
    return "₹0";
  }
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
};

export const formatLakhsCrores = (amount?: number | null): string => {
  if (amount === undefined || amount === null || isNaN(amount) || amount === 0) {
    return "₹0";
  }
  const absAmount = Math.abs(amount);
  if (absAmount >= 10000000) {
    const cr = (amount / 10000000).toFixed(2);
    return `₹${cr} Cr`;
  } else if (absAmount >= 100000) {
    const lakh = (amount / 100000).toFixed(2);
    return `₹${lakh} Lakh`;
  } else if (absAmount >= 1000) {
    const k = (amount / 1000).toFixed(1);
    return `₹${k} K`;
  }
  return formatINR(amount);
};

export const formatPercent = (probability?: number | null): string => {
  if (probability === undefined || probability === null || isNaN(probability)) {
    return "0.0%";
  }
  const pct = probability <= 1.0 ? probability * 100 : probability;
  return `${pct.toFixed(1)}%`;
};

export const formatDate = (dateStr?: string | null): string => {
  if (!dateStr) return "N/A";
  try {
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "numeric",
      minute: "numeric",
      hour12: true,
    }).format(date);
  } catch {
    return dateStr;
  }
};

export interface CibilTier {
  tier: "Prime" | "Good" | "Fair" | "Subprime";
  label: string;
  badgeClass: string;
  description: string;
}

export const getCibilTier = (score?: number | null): CibilTier => {
  if (score === undefined || score === null || isNaN(score)) {
    return {
      tier: "Subprime",
      label: "Awaiting Assessment",
      badgeClass: "text-[#4A5568] bg-[#F8F9FA] border-[#E2E5E9]",
      description: "No score recorded",
    };
  }
  if (score >= 750) {
    return {
      tier: "Prime",
      label: "Prime Tier (Exceptional)",
      badgeClass: "text-[#1A2B4C] bg-[#FBF4EC] border-[#D4A373]",
      description: "Prime credit: low historical default risk (750–900)",
    };
  }
  if (score >= 700) {
    return {
      tier: "Good",
      label: "Good Tier (Low Risk)",
      badgeClass: "text-[#1A2B4C] bg-[#FBF4EC] border-[#E2E5E9]",
      description: "Good credit: standard institutional lending (700–749)",
    };
  }
  if (score >= 650) {
    return {
      tier: "Fair",
      label: "Fair Tier (Moderate Risk)",
      badgeClass: "text-[#79552F] bg-[#FBF4EC] border-[#D4A373]",
      description: "Fair credit: moderate default risk (650–699)",
    };
  }
  return {
    tier: "Subprime",
    label: "Sub-Prime (High Risk)",
    badgeClass: "text-[#7A332D] bg-[#F8EEEE] border-[#E5B8B3]",
    description: "Sub-prime credit: elevated default risk (300–649)",
  };
};


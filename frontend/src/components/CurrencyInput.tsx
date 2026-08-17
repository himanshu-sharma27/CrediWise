import React from "react";
import { formatLakhsCrores } from "../utils/formatters";

interface CurrencyInputProps {
  label: string;
  name: string;
  value: number | string;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  required?: boolean;
  helperText?: string;
  error?: string;
  placeholder?: string;
}

export const CurrencyInput: React.FC<CurrencyInputProps> = ({
  label,
  name,
  value,
  onChange,
  min = 0,
  max,
  step = 10000,
  required = true,
  helperText,
  error,
  placeholder = "0",
}) => {
  const numValue = typeof value === "number" ? value : parseFloat(value) || 0;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value.replace(/[^0-9.]/g, "");
    const parsed = parseFloat(rawVal) || 0;
    onChange(parsed);
  };

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label htmlFor={name} className="block text-xs font-bold text-[#1A2B4C] uppercase tracking-wider">
          {label} {required && <span className="text-[#A6534A]">*</span>}
        </label>
        {numValue > 0 && (
          <span className="text-[11px] font-extrabold text-[#79552F] bg-[#FBF4EC] px-2 py-0.5 rounded-md border border-[#E7CBB0]">
            {formatLakhsCrores(numValue)}
          </span>
        )}
      </div>

      <div className="relative rounded-xl shadow-2xs">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
          <span className="text-[#718096] font-bold text-sm">₹</span>
        </div>
        <input
          type="number"
          id={name}
          name={name}
          min={min}
          max={max}
          step={step}
          value={value === 0 ? "" : value}
          onChange={handleChange}
          placeholder={placeholder}
          className={`block w-full rounded-xl border py-3 pl-8 pr-4 text-sm font-medium text-[#1A2B4C] bg-white placeholder:text-[#718096] focus:outline-none transition-all ${
            error
              ? "border-[#E5B8B3] focus:border-[#A6534A] focus:ring-2 focus:ring-[#F8EEEE]"
              : "border-[#CBD2DA] focus:border-[#D4A373] focus:ring-2 focus:ring-[#FBF4EC]"
          }`}
        />
      </div>

      {helperText && !error && (
        <p className="text-[11px] text-[#718096] leading-tight">{helperText}</p>
      )}

      {error && <p className="text-xs text-[#A6534A] font-medium">{error}</p>}
    </div>
  );
};

export default CurrencyInput;


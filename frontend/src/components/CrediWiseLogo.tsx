import React from "react";

export interface CrediWiseLogoProps {
  className?: string;
  height?: string | number;
  width?: string | number;
  variant?: "default" | "light" | "white" | "dark" | "dark-bg" | "icon" | "icon-white";
  alt?: string;
}

export const CrediWiseLogo: React.FC<CrediWiseLogoProps> = ({
  className = "",
  height,
  width = "auto",
  variant = "default",
  alt = "CrediWise - Loan Intelligence",
}) => {
  let logoSrc = "/assets/credwise-swoosh-logo.png";

  if (variant === "dark" || variant === "white" || variant === "dark-bg") {
    logoSrc = "/assets/credwise-swoosh-logo-white.png";
  } else if (variant === "icon") {
    logoSrc = "/assets/credwise-swoosh-icon.png";
  } else if (variant === "icon-white") {
    logoSrc = "/assets/credwise-swoosh-icon-white.png";
  }

  return (
    <img
      src={logoSrc}
      alt={alt}
      className={`object-contain select-none ${className}`}
      style={{
        height: height || undefined,
        width: width || "auto",
        maxHeight: height || undefined,
      }}
      loading="eager"
      decoding="async"
    />
  );
};

export default CrediWiseLogo;


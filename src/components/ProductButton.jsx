import React from "react";

/**
 * ProductButton - Reusable button component for Product pages
 * @param {string} variant - Button variant: 'primary', 'secondary', 'danger', 'default'
 * @param {string} size - Button size: 'sm', 'md', 'lg'
 * @param {boolean} disabled - Disabled state
 * @param {string} className - Additional CSS classes
 * @param {React.ReactNode} children - Button content
 * @param {object} props - Other button props
 */
const ProductButton = ({
  variant = "default",
  size = "md",
  disabled = false,
  className = "",
  children,
  ...props
}) => {
  // Size classes
  const sizeClasses = {
    xs: "px-3 py-1.5 text-xs",
    sm: "px-4 py-2 text-sm",
    md: "px-5 py-2.5 text-sm sm:text-base",
    lg: "px-6 py-3 text-base",
    xl: "px-8 py-4 text-lg",
  };

  // Variant classes
  const variantClasses = {
    primary: {
      base: "bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white border-2 border-amber-400/30 rounded-xl cursor-pointer font-semibold transition-all duration-300 shadow-[0_4px_15px_rgba(251,191,36,0.3)] hover:shadow-[0_8px_25px_rgba(251,191,36,0.4)] hover:scale-105 active:scale-100",
      style: {},
      disabledStyle: {},
      disabled: "disabled:from-amber-300 disabled:to-amber-400 disabled:border-amber-300/50 disabled:text-gray-100 disabled:cursor-not-allowed disabled:opacity-60 disabled:shadow-none disabled:hover:scale-100",
    },
    secondary: {
      base: "border-2 border-gray-300 rounded-xl cursor-pointer font-semibold transition-all duration-300 bg-white text-gray-700 hover:bg-gradient-to-r hover:from-gray-50 hover:to-gray-100 hover:border-amber-400 hover:text-gray-900 shadow-[0_2px_8px_rgba(0,0,0,0.1)] hover:shadow-[0_4px_12px_rgba(251,191,36,0.2)] hover:scale-105 active:scale-100",
      style: {},
      disabledStyle: {},
      disabled: "disabled:bg-gray-100 disabled:border-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed disabled:opacity-60 disabled:shadow-none disabled:hover:scale-100",
    },
    danger: {
      base: "border-2 border-red-300 rounded-xl cursor-pointer font-semibold transition-all duration-300 bg-white text-red-600 hover:bg-gradient-to-r hover:from-red-50 hover:to-red-100 hover:border-red-500 hover:text-red-700 shadow-[0_2px_8px_rgba(239,68,68,0.15)] hover:shadow-[0_4px_12px_rgba(239,68,68,0.25)] hover:scale-105 active:scale-100",
      style: {},
      disabledStyle: {},
      disabled: "disabled:bg-gray-100 disabled:border-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed disabled:opacity-60 disabled:shadow-none disabled:hover:scale-100",
    },
    default: {
      base: "border-2 border-gray-300 rounded-xl cursor-pointer font-semibold transition-all duration-300 bg-white text-gray-700 hover:bg-gradient-to-r hover:from-gray-50 hover:to-gray-100 hover:border-amber-400 hover:text-gray-900 shadow-[0_2px_8px_rgba(0,0,0,0.1)] hover:shadow-[0_4px_12px_rgba(251,191,36,0.2)] hover:scale-105 active:scale-100",
      style: {},
      disabledStyle: {},
      disabled: "disabled:bg-gray-100 disabled:border-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed disabled:opacity-60 disabled:shadow-none disabled:hover:scale-100",
    },
  };

  const variantConfig = variantClasses[variant] || variantClasses.default;
  const sizeClass = sizeClasses[size] || sizeClasses.md;

  const baseClasses = "focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:ring-offset-2";

  return (
    <button
      className={`${sizeClass} ${variantConfig.base} ${variantConfig.disabled} ${baseClasses} ${className}`}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
};

export default ProductButton;


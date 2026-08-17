import React, { memo } from "react";
import { motion } from "framer-motion";

/**
 * Button - Modern animated reusable button component
 * @param {string} variant - Button variant: 'primary', 'secondary', 'gradient', 'danger', 'ghost', 'default'
 * @param {string} size - Button size: 'xs', 'sm', 'md', 'lg', 'xl'
 * @param {boolean} disabled - Disabled state
 * @param {string} className - Additional CSS classes
 * @param {React.ReactNode} children - Button content
 * @param {object} props - Other button props
 */
const Button = memo(({
  variant = "default",
  size = "md",
  disabled = false,
  className = "",
  children,
  ...props
}) => {
  // Size classes
  const sizeClasses = {
    xs: "px-2.5 py-1 text-xs rounded-lg gap-1.5",
    sm: "px-3.5 py-1.5 text-sm rounded-xl gap-2",
    md: "px-4 py-2.5 sm:py-2.5 text-sm rounded-xl gap-2 font-medium",
    lg: "px-5 py-3 text-base rounded-xl gap-2.5 font-semibold",
    xl: "px-7 py-3.5 text-lg rounded-2xl gap-3 font-semibold",
  };

  // Variant classes
  const variantClasses = {
    primary: {
      base: "border-2 border-brand-primary-700 bg-brand-primary-500 text-gray-900 shadow-sm hover:shadow-md hover:bg-brand-primary-400 active:bg-brand-primary-600",
      disabled: "disabled:bg-brand-primary-300 disabled:border-brand-primary-400 disabled:text-gray-600 disabled:cursor-not-allowed disabled:shadow-none",
    },
    gradient: {
      base: "bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 text-gray-900 border border-amber-600/30 shadow-md hover:shadow-lg hover:brightness-105 active:scale-[0.99]",
      disabled: "disabled:opacity-60 disabled:cursor-not-allowed disabled:shadow-none",
    },
    secondary: {
      base: "border-2 border-gray-300 bg-gray-50 text-gray-900 hover:bg-gray-100 hover:border-gray-400 shadow-sm hover:shadow-md active:bg-gray-200",
      disabled: "disabled:bg-gray-100 disabled:border-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed disabled:shadow-none",
    },
    ghost: {
      base: "bg-transparent text-gray-700 hover:bg-gray-100 hover:text-gray-900 active:bg-gray-200 border border-transparent",
      disabled: "disabled:text-gray-300 disabled:hover:bg-transparent disabled:cursor-not-allowed",
    },
    danger: {
      base: "border-2 border-red-500 bg-red-50 text-red-600 hover:bg-red-500 hover:text-white shadow-sm hover:shadow-md active:bg-red-600",
      disabled: "disabled:bg-red-50 disabled:border-red-200 disabled:text-red-300 disabled:cursor-not-allowed disabled:shadow-none",
    },
    default: {
      base: "border-2 border-gray-300 bg-white text-gray-900 hover:bg-gray-50 hover:border-brand-primary-500 shadow-sm hover:shadow-md",
      disabled: "disabled:bg-gray-50 disabled:border-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed disabled:shadow-none",
    },
  };

  const variantConfig = variantClasses[variant] || variantClasses.default;
  const sizeClass = sizeClasses[size] || sizeClasses.md;

  const baseClasses = "inline-flex items-center justify-center cursor-pointer transition-all select-none focus:outline-none focus:ring-2 focus:ring-brand-primary-500 focus:ring-offset-2";

  return (
    <motion.button
      whileHover={!disabled ? { y: -1 } : undefined}
      whileTap={!disabled ? { scale: 0.98 } : undefined}
      className={`${sizeClass} ${variantConfig.base} ${variantConfig.disabled} ${baseClasses} ${className}`}
      disabled={disabled}
      {...props}
    >
      {children}
    </motion.button>
  );
});

Button.displayName = "Button";

export default Button;

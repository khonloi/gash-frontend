import React from "react";

const Input = React.forwardRef(({
  label,
  error,
  required,
  leftIcon,
  rightIcon,
  className = "",
  type = "text",
  id,
  ...props
}, ref) => {
  const generatedId = React.useId();
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : generatedId);
  const errorId = `${inputId}-error`;

  return (
    <div className="w-full relative">
      {label && (
        <label
          htmlFor={inputId}
          className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2"
        >
          {label} {required && <span className="text-red-500" aria-hidden="true">*</span>}
        </label>
      )}
      <div className="relative">
        {leftIcon && (
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" aria-hidden="true">
            {leftIcon}
          </div>
        )}
        <input
          ref={ref}
          id={inputId}
          type={type}
          required={required}
          aria-required={required}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : undefined}
          className={`w-full py-3 bg-gray-50 border-2 rounded-xl transition-all outline-none 
            ${leftIcon ? "pl-11" : "pl-4"} 
            ${rightIcon ? "pr-11" : "pr-4"} 
            ${error
              ? "border-red-500 bg-red-50/30 focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
              : "border-gray-300 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 focus:bg-white"
            } 
            ${className}`}
          {...props}
        />
        {rightIcon && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" aria-hidden="true">
            {rightIcon}
          </div>
        )}
      </div>
      {error && (
        <p id={errorId} role="alert" className="mt-1.5 text-xs font-medium text-red-600">
          {error}
        </p>
      )}
    </div>
  );
});

Input.displayName = "Input";

export default Input;

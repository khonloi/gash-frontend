import React from "react";

const TextArea = React.forwardRef(({
  label,
  error,
  required,
  className = "",
  id,
  rows = 4,
  ...props
}, ref) => {
  const generatedId = React.useId();
  const textareaId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : generatedId);
  const errorId = `${textareaId}-error`;

  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={textareaId}
          className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2"
        >
          {label} {required && <span className="text-red-500" aria-hidden="true">*</span>}
        </label>
      )}
      <textarea
        ref={ref}
        id={textareaId}
        rows={rows}
        required={required}
        aria-required={required}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? errorId : undefined}
        className={`w-full py-3 px-4 bg-gray-50 border-2 rounded-xl transition-all outline-none resize-none
          ${error 
            ? "border-red-500 bg-red-50/30 focus:border-red-500 focus:ring-2 focus:ring-red-500/20" 
            : "border-gray-300 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 focus:bg-white"
          } 
          ${className}`}
        {...props}
      />
      {error && (
        <p id={errorId} role="alert" className="mt-1.5 text-xs font-medium text-red-600">
          {error}
        </p>
      )}
    </div>
  );
});

TextArea.displayName = "TextArea";

export default TextArea;

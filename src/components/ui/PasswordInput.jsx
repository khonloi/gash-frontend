import React, { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import Input from "./Input";

const PasswordInput = React.forwardRef(({ className = "", ...props }, ref) => {
  const [showPassword, setShowPassword] = useState(false);

  const toggleVisibility = () => {
    setShowPassword((prev) => !prev);
  };

  const rightIcon = (
    <button
      type="button"
      onClick={toggleVisibility}
      className="p-1 text-gray-500 hover:text-gray-700 transition-colors focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:outline-none rounded-md"
      aria-label={showPassword ? "Hide password" : "Show password"}
    >
      {showPassword ? (
        <EyeOff className="w-5 h-5" aria-hidden="true" />
      ) : (
        <Eye className="w-5 h-5" aria-hidden="true" />
      )}
    </button>
  );

  return (
    <Input
      ref={ref}
      type={showPassword ? "text" : "password"}
      rightIcon={rightIcon}
      className={className}
      {...props}
    />
  );
});

PasswordInput.displayName = "PasswordInput";

export default PasswordInput;

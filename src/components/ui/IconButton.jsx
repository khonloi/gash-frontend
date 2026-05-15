import React from "react";

export default function IconButton({
  children,
  onClick,
  title,
  className = "",
  badge,
  badgeColor = "bg-amber-500",
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={`p-2 text-white hover:text-amber-500 transition-colors duration-200 ease-in-out ${className}`}
    >
      {children}

      {/* Badge displaying number */}
      {badge && (
        <span
          className={`absolute -top-1 -right-1 ${badgeColor} text-white text-xs font-semibold rounded-full h-5 w-5 flex items-center justify-center`}
        >
          {badge}
        </span>
      )}
    </button>
  );
}
import React from "react";

export default function IconButton({
  children,
  onClick,
  title,
  className = "",
  badge,
  badgeColor = "bg-red-500",
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={`p-2 text-white hover:text-amber-500${className}`}
    >
      {children}

      {/* Badge hiển thị số */}
      {badge && (
        <span
          className={`absolute top-1 right-1 ${badgeColor} 
            text-xs text-white px-1.5 rounded-full 
            animate-pulse`}
        >
          {badge}
        </span>
      )}
    </button>
  );
}

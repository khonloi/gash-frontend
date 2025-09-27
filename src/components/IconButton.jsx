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
      className={`relative p-2 rounded-full bg-gray-800 text-white 
        transition-all duration-200 
        hover:bg-gray-700 hover:scale-110 hover:shadow-md 
        active:scale-95 ${className}`}
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

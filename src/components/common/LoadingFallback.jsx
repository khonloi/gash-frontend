import React from "react";

export default function LoadingFallback() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center p-8">
      <div className="relative flex items-center justify-center">
        {/* Outer glowing pulsing ring */}
        <div className="absolute w-16 h-16 rounded-full border-4 border-amber-500/20 animate-ping" />
        {/* Spinning gradient ring */}
        <div className="w-12 h-12 rounded-full border-3 border-transparent border-t-amber-500 border-r-amber-500 animate-spin" />
        {/* Inner center dot */}
        <div className="absolute w-3 h-3 bg-amber-500 rounded-full shadow-lg shadow-amber-500/50" />
      </div>
      <p className="mt-4 text-xs font-semibold tracking-widest text-gray-400 uppercase animate-pulse">
        Loading...
      </p>
    </div>
  );
}

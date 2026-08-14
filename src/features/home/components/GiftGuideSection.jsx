import React from "react";
import Button from "../../../components/ui/Button";

export default function GiftGuideSection({ navigate }) {
  return (
    <div className="w-full mt-8 sm:mt-10 mb-2">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-6">
        {/* Tile 1: Left-most Large Card (spans 5 cols on lg) */}
        <div className="lg:col-span-5 bg-[#d0e1f9] border-2 border-gray-300 rounded-xl p-6 sm:p-8 flex flex-col justify-between overflow-hidden relative min-h-[350px] transition-all duration-300 ease-in-out hover:shadow-lg">
          <div className="z-10 flex flex-col items-start text-left max-w-xs">
            <span className="text-xs font-semibold text-blue-900 tracking-widest">
              Nike, LEGO®, Owala & more
            </span>
            <h3 className="text-2xl sm:text-3xl font-semibold text-[#0a2540] mt-2 mb-6 leading-tight">
              Dad's Day Top 100+ gifts
            </h3>
            <Button
              onClick={() => navigate("/products")}
              variant="default"
              size="sm"
              className="px-5 py-2 rounded-full font-semibold transition-all shadow-sm"
            >
              Shop now
            </Button>
          </div>

          <div className="absolute right-0 bottom-2 w-1/2 h-[60%] hidden md:block pointer-events-none select-none z-0">
            <svg viewBox="0 0 200 200" className="w-full h-full">
              <circle cx="100" cy="100" r="80" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="8" strokeDasharray="6 6" />
              <g transform="translate(25, 40)">
                <rect x="10" y="40" width="26" height="80" rx="8" fill="#2d3748" />
                <rect x="12" y="25" width="22" height="15" rx="3" fill="#e2e8f0" />
                <path d="M12,25 Q23,10 34,25" fill="none" stroke="#e2e8f0" strokeWidth="4" />
                <circle cx="23" cy="32" r="3" fill="#dd6b20" />
                <rect x="17" y="15" width="12" height="10" rx="2" fill="#718096" />
              </g>
              <g transform="translate(55, 85)">
                <path d="M10,60 L20,40 Q35,28 65,32 L100,50 L110,65 L105,75 L85,75 Q40,78 20,70 Z" fill="#ffffff" stroke="#cbd5e0" strokeWidth="1.5" />
                <path d="M10,60 L15,70 Q40,75 85,77 L105,75 L110,75 L108,79 L85,81 Q40,79 15,74 Z" fill="#dd6b20" opacity="0.9" />
                <path d="M40,48 Q60,45 85,55 Q65,60 50,58 Z" fill="#1a365d" />
                <line x1="45" y1="36" x2="52" y2="44" stroke="#cbd5e0" strokeWidth="2" strokeLinecap="round" />
                <line x1="53" y1="38" x2="60" y2="46" stroke="#cbd5e0" strokeWidth="2" strokeLinecap="round" />
                <line x1="61" y1="40" x2="68" y2="48" stroke="#cbd5e0" strokeWidth="2" strokeLinecap="round" />
              </g>
              <g transform="translate(110, 30)">
                <rect x="10" y="20" width="45" height="25" rx="3" fill="#e53e3e" />
                <rect x="15" y="15" width="8" height="5" rx="1" fill="#e53e3e" />
                <rect x="28.5" y="15" width="8" height="5" rx="1" fill="#e53e3e" />
                <rect x="42" y="15" width="8" height="5" rx="1" fill="#e53e3e" />
              </g>
            </svg>
          </div>

          <div className="absolute left-6 sm:left-8 bottom-6 sm:bottom-8 z-10 bg-blue-900 text-white text-[10px] font-bold px-2.5 py-1 rounded-full tracking-wider">
            Top 100+
          </div>
        </div>

        {/* Center Column (spans 4 cols on lg) */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          <div className="bg-[#dceaf9] border-2 border-gray-300 rounded-xl p-6 flex justify-between items-center overflow-hidden min-h-[160px] relative transition-all duration-300 ease-in-out hover:shadow-lg">
            <div className="flex flex-col items-start text-left max-w-[55%] z-10">
              <span className="text-xs font-semibold text-blue-900/60 tracking-wider">
                Team jerseys & more
              </span>
              <h4 className="text-lg font-semibold text-[#0a2540] mt-1 mb-2">
                Game day gear for Dad
              </h4>
              <button
                onClick={() => navigate("/products")}
                className="text-xs font-semibold text-blue-700 underline hover:text-blue-900"
              >
                Shop now
              </button>
            </div>
            <div className="absolute right-2 bottom-0 w-[45%] h-[95%] hidden md:block pointer-events-none select-none z-0">
              <svg viewBox="0 0 200 200" className="w-full h-full">
                <g transform="translate(15, 110)">
                  <path d="M10,40 Q25,10 50,40 Z" fill="#1a365d" />
                  <circle cx="30" cy="25" r="1.5" fill="#e2e8f0" />
                  <path d="M35,38 Q60,35 65,48 Q45,46 25,44 Z" fill="#1a365d" opacity="0.95" />
                  <text x="25" y="35" fontFamily="monospace" fontSize="10" fontWeight="bold" fill="#fff" opacity="0.9">N</text>
                </g>
                <g transform="translate(10, 80)">
                  <circle cx="20" cy="20" r="10" fill="#fff" stroke="#cbd5e0" strokeWidth="1" />
                  <path d="M13,13 Q20,20 13,27" fill="none" stroke="#e53e3e" strokeWidth="1" strokeDasharray="1 1" />
                  <path d="M27,13 Q20,20 27,27" fill="none" stroke="#e53e3e" strokeWidth="1" strokeDasharray="1 1" />
                </g>
                <g transform="translate(85, 15)">
                  <path d="M15,20 L5,35 L20,45 L35,28 Z" fill="#e2e8f0" />
                  <path d="M65,20 L75,35 L60,45 L45,28 Z" fill="#e2e8f0" />
                  <line x1="5" y1="35" x2="20" y2="45" stroke="#1a365d" strokeWidth="1.5" />
                  <line x1="75" y1="35" x2="60" y2="45" stroke="#1a365d" strokeWidth="1.5" />
                  <path d="M25,20 L55,20 L60,85 L20,85 Z" fill="#e2e8f0" />
                  <line x1="40" y1="20" x2="40" y2="85" stroke="#cbd5e0" strokeWidth="2" />
                  <circle cx="40" cy="35" r="2" fill="#2d3748" />
                  <circle cx="40" cy="50" r="2" fill="#2d3748" />
                  <circle cx="40" cy="65" r="2" fill="#2d3748" />
                  <line x1="30" y1="20" x2="26" y2="85" stroke="#cbd5e0" strokeWidth="0.5" />
                  <line x1="50" y1="20" x2="54" y2="85" stroke="#cbd5e0" strokeWidth="0.5" />
                </g>
                <g transform="translate(55, 45)">
                  <path d="M15,20 L3,32 L15,42 L28,26 Z" fill="#1a365d" />
                  <path d="M60,20 L72,32 L60,42 L47,26 Z" fill="#1a365d" />
                  <line x1="3" y1="32" x2="15" y2="42" stroke="#fff" strokeWidth="1.5" />
                  <line x1="72" y1="32" x2="60" y2="42" stroke="#fff" strokeWidth="1.5" />
                  <path d="M20,20 L55,20 L58,80 L17,80 Z" fill="#1a365d" />
                  <path d="M37.5,20 L37.5,80" stroke="#fff" strokeWidth="1.5" />
                  <circle cx="37.5" cy="32" r="1.5" fill="#fff" />
                  <circle cx="37.5" cy="45" r="1.5" fill="#fff" />
                  <circle cx="37.5" cy="58" r="1.5" fill="#fff" />
                  <text x="43" y="40" fontFamily="monospace" fontSize="8" fontWeight="bold" fill="#fff" opacity="0.9">NY</text>
                </g>
              </svg>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 flex-1">
            <div className="bg-[#e2ebd5] border-2 border-gray-300 rounded-xl p-5 flex flex-col justify-between overflow-hidden min-h-[160px] transition-all duration-300 ease-in-out hover:shadow-lg">
              <div className="flex flex-col items-start text-left">
                <span className="text-[10px] font-semibold text-[#2d4a22] tracking-wider">
                  Grooming gifts for Dad
                </span>
                <button
                  onClick={() => navigate("/products")}
                  className="text-xs font-semibold text-[#2d4a22] underline hover:text-green-900 mt-2"
                >
                  Shop now
                </button>
              </div>
              <div className="relative w-12 h-16 mx-auto mt-2 flex items-end justify-center select-none pointer-events-none">
                <div className="absolute bottom-[46px] w-4 h-4 bg-[#2d3748] rounded-t-sm border border-gray-700/20" />
                <div className="absolute bottom-[40px] w-6 h-1.5 bg-[#2d4a22]/40" />
                <div className="w-10 h-[42px] bg-gradient-to-br from-amber-100/70 to-amber-600/80 rounded border-2 border-amber-800/40 flex items-center justify-center shadow-sm">
                  <span className="text-[6px] font-mono font-semibold text-amber-950/80 tracking-widest">GASH</span>
                </div>
              </div>
            </div>

            <div className="bg-[#daf0f6] border-2 border-gray-300 rounded-xl p-5 flex flex-col justify-between overflow-hidden min-h-[160px] transition-all duration-300 ease-in-out hover:shadow-lg">
              <div className="flex flex-col items-start text-left">
                <span className="text-[10px] font-semibold text-[#0e3c46] tracking-wider">
                  Ready to make a splash
                </span>
                <button
                  onClick={() => navigate("/products")}
                  className="text-xs font-semibold text-[#0e3c46] underline hover:text-[#0a272e] mt-2"
                >
                  Shop now
                </button>
              </div>
              <div className="relative w-16 h-12 mx-auto mt-4 flex items-center justify-center select-none pointer-events-none">
                <div className="flex gap-1 items-center">
                  <div className="w-7 h-5 bg-gradient-to-br from-[#111] to-[#333] rounded-b-lg rounded-t-sm border border-[#222] shadow-sm relative">
                    <div className="absolute top-0.5 left-1 w-4 h-0.5 bg-white/20 rounded-full rotate-[-15deg]" />
                  </div>
                  <div className="w-2 h-0.5 bg-[#222] rounded-full" />
                  <div className="w-7 h-5 bg-gradient-to-br from-[#111] to-[#333] rounded-b-lg rounded-t-sm border border-[#222] shadow-sm relative">
                    <div className="absolute top-0.5 left-1 w-4 h-0.5 bg-white/20 rounded-full rotate-[-15deg]" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tile 5: Rightmost Tall Card */}
        <div className="lg:col-span-3 bg-[#1b4332] border-2 border-gray-800 rounded-xl p-6 sm:p-8 flex flex-col justify-between overflow-hidden relative min-h-[350px] transition-all duration-300 ease-in-out hover:shadow-lg">
          <div className="z-10 flex flex-col items-start text-left text-white">
            <span className="text-xs font-semibold text-green-200 tracking-wider">
              Grilling musts in 1 click
            </span>
            <h3 className="text-xl font-semibold text-white mt-2 mb-2 leading-tight">
              A cookout for 8, under $5 per person*
            </h3>
            <button
              onClick={() => navigate("/products")}
              className="text-xs font-semibold text-green-300 underline hover:text-green-100"
            >
              Shop now
            </button>
          </div>

          <div className="relative w-24 h-24 mx-auto mt-6 flex flex-col items-center justify-end select-none pointer-events-none">
            <div className="w-16 h-8 bg-[#e53e3e] rounded-t-full border border-red-700 relative">
              <div className="absolute top-0.5 left-[28px] w-2 h-1.5 bg-gray-800 rounded-sm" />
            </div>
            <div className="w-16 h-8 bg-gray-900 rounded-b-full border-t border-gray-700 flex flex-col justify-start relative shadow-lg">
              <div className="w-full h-0.5 bg-gray-600" />
              <div className="flex gap-1 justify-center mt-1.5">
                <div className="w-1 h-1 bg-red-500 rounded-full" />
                <div className="w-1 h-1 bg-gray-400 rounded-full" />
                <div className="w-1 h-1 bg-gray-400 rounded-full" />
              </div>
            </div>
            <div className="flex gap-4 justify-between w-10 h-8 mt-[-1px]">
              <div className="w-0.5 h-full bg-gray-400 rotate-[-15deg]" />
              <div className="w-0.5 h-full bg-gray-400 rotate-[15deg]" />
            </div>
          </div>

          <span className="text-[8px] font-semibold text-green-300/60 tracking-wider text-center block mt-2">
            *Excludes tax. Terms apply.
          </span>
        </div>
      </div>
    </div>
  );
}

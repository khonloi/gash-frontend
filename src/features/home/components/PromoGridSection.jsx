import React from "react";
import Button from "../../../components/ui/Button";

export default function PromoGridSection({ navigate }) {
  return (
    <div className="w-full mt-8 sm:mt-10 mb-2">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-6">
        {/* Tile 1: Left-most Gift Cards Card (spans 5 cols on lg) */}
        <div className="lg:col-span-5 bg-[#c3daf9] border-2 border-gray-300 rounded-xl p-6 sm:p-8 flex flex-col justify-between overflow-hidden relative min-h-[350px] transition-all duration-300 ease-in-out hover:shadow-lg">
          <div className="z-10 flex flex-col items-start text-left max-w-xs">
            <span className="text-xs font-semibold text-blue-950 tracking-widest">
              GASH Gift Cards
            </span>
            <h3 className="text-2xl sm:text-3xl font-semibold text-[#0d2847] mt-2 mb-6 leading-tight">
              Give the gift of premium style
            </h3>
            <Button
              onClick={() => navigate("/products")}
              variant="primary"
              size="sm"
              className="px-5 py-2 rounded-full font-semibold transition-all shadow-sm"
            >
              Shop gift cards
            </Button>
          </div>

          {/* Styled e-Gift Card Previews with inline SVG */}
          <div className="absolute right-4 bottom-4 w-56 h-56 pointer-events-none select-none">
            <svg viewBox="0 0 200 200" className="w-full h-full">
              <defs>
                <linearGradient id="cardGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#1e3a8a" />
                  <stop offset="100%" stopColor="#0f172a" />
                </linearGradient>
                <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#fbbf24" />
                  <stop offset="50%" stopColor="#f59e0b" />
                  <stop offset="100%" stopColor="#d97706" />
                </linearGradient>
                <linearGradient id="envGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#ffffff" />
                  <stop offset="100%" stopColor="#f3f4f6" />
                </linearGradient>
                <filter id="svgShadow" x="-10%" y="-10%" width="120%" height="120%">
                  <feDropShadow dx="1" dy="2" stdDeviation="3" floodColor="#000000" floodOpacity="0.15" />
                </filter>
              </defs>

              {/* Envelope Back/Body */}
              <g transform="translate(10, 50)" filter="url(#svgShadow)">
                <path d="M0,40 L0,110 Q0,120 10,120 L170,120 Q180,120 180,110 L180,40 L90,85 Z" fill="url(#envGrad)" stroke="#e5e7eb" strokeWidth="1" />
              </g>

              {/* Gift Card sliding out */}
              <g transform="translate(30, 25) rotate(-8)" filter="url(#svgShadow)">
                <rect x="0" y="0" width="130" height="80" rx="8" fill="url(#cardGrad)" />
                {/* Chip */}
                <rect x="15" y="15" width="18" height="13" rx="2.5" fill="url(#goldGrad)" />
                {/* GASH logo */}
                <text x="115" y="25" fill="#ffffff" fontSize="9" fontWeight="600" textAnchor="end" letterSpacing="0.1em" opacity="0.9">GASH</text>
                {/* Card number */}
                <text x="15" y="55" fill="#e2e8f0" fontSize="8" fontFamily="monospace" letterSpacing="0.15em">•••• •••• •••• 9876</text>
                {/* Card text */}
                <text x="15" y="68" fill="#fbbf24" fontSize="7" fontWeight="600" letterSpacing="0.05em">PREMIUM GIFT CARD</text>
              </g>

              {/* Envelope Front Flap overlaps */}
              <g transform="translate(10, 50)" filter="url(#svgShadow)">
                <path d="M0,120 L90,75 L180,120 Z" fill="#f9fafb" stroke="#e5e7eb" strokeWidth="0.5" />
              </g>

              {/* Gold Ribbon / Bow */}
              <g transform="translate(85, 125)" filter="url(#svgShadow)">
                {/* Ribbon bands */}
                <path d="M-85,-20 L95,-20" stroke="url(#goldGrad)" strokeWidth="12" />
                {/* Bow loops */}
                <path d="M0,0 C-20,-20 -30,10 0,0 C20,-20 30,10 0,0" fill="url(#goldGrad)" />
                <path d="M0,0 C-10,-25 -25,-15 -5,-5" fill="#fef08a" opacity="0.6" />
                {/* Bow center */}
                <circle cx="0" cy="-2" r="6" fill="url(#goldGrad)" />
                {/* Ribbon tails */}
                <path d="M-2,-2 L-15,20 L-5,22 L0,5 Z" fill="url(#goldGrad)" />
                <path d="M2,-2 L15,20 L5,22 L0,5 Z" fill="url(#goldGrad)" />
              </g>
            </svg>
          </div>
        </div>

        {/* Center Column (spans 4 cols on lg) */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          {/* Center Top: Same-day delivery */}
          <div className="bg-[#f2f4f7] border-2 border-gray-300 rounded-xl p-6 flex justify-between items-center overflow-hidden min-h-[160px] transition-all duration-300 ease-in-out hover:shadow-lg">
            <div className="flex flex-col items-start text-left max-w-[65%]">
              <span className="text-xs font-semibold text-gray-500 tracking-wider">
                Express Delivery
              </span>
              <h4 className="text-lg font-semibold text-[#0d2847] mt-1 mb-2">
                Free express delivery on orders over $75
              </h4>
              <button
                onClick={() => navigate("/products")}
                className="text-xs font-semibold text-blue-700 underline hover:text-blue-900"
              >
                Shop collections
              </button>
            </div>
            <div className="w-24 h-20 flex items-center justify-center select-none pointer-events-none">
              <svg viewBox="0 0 100 80" className="w-full h-full">
                <path d="M10,25 L28,25" stroke="#2563eb" strokeWidth="3" strokeLinecap="round" opacity="0.8" />
                <path d="M5,38 L22,38" stroke="#2563eb" strokeWidth="3" strokeLinecap="round" opacity="0.8" />
                <path d="M12,50 L25,50" stroke="#2563eb" strokeWidth="3" strokeLinecap="round" opacity="0.8" />
                <path d="M32,18 H70 L85,35 V60 H32 Z" fill="#3b82f6" />
                <path d="M68,22 H78 L83,32 H68 Z" fill="#eff6ff" />
                <path d="M32,40 H60 V48 H32 Z" fill="#1d4ed8" opacity="0.8" />
                <circle cx="44" cy="60" r="10" fill="#1e293b" />
                <circle cx="44" cy="60" r="4" fill="#f1f5f9" />
                <circle cx="72" cy="60" r="10" fill="#1e293b" />
                <circle cx="72" cy="60" r="4" fill="#f1f5f9" />
              </svg>
            </div>
          </div>

          {/* Center Bottom: 2 Cards side-by-side */}
          <div className="grid grid-cols-2 gap-4 flex-1">
            {/* Tile 3 */}
            <div className="bg-[#eaeff5] border-2 border-gray-300 rounded-xl p-5 flex flex-col justify-between overflow-hidden min-h-[160px] transition-all duration-300 ease-in-out hover:shadow-lg">
              <div className="flex flex-col items-start text-left">
                <h4 className="text-sm sm:text-base font-semibold text-[#0d2847] leading-snug">
                  Explore seasonal outerwear styles
                </h4>
                <button
                  onClick={() => navigate("/products")}
                  className="text-xs font-semibold text-blue-700 underline hover:text-blue-900 mt-2"
                >
                  Shop outerwear
                </button>
              </div>
              <div className="flex justify-end mt-2 select-none pointer-events-none">
                <svg viewBox="0 0 100 80" className="w-20 h-16">
                  <line x1="10" y1="75" x2="90" y2="75" stroke="#334155" strokeWidth="3" strokeLinecap="round" />
                  <line x1="25" y1="75" x2="25" y2="15" stroke="#475569" strokeWidth="2.5" />
                  <line x1="75" y1="75" x2="75" y2="15" stroke="#475569" strokeWidth="2.5" />
                  <line x1="20" y1="15" x2="80" y2="15" stroke="#334155" strokeWidth="3" strokeLinecap="round" />
                  <g transform="translate(32, 15)">
                    <path d="M8,-5 Q12,-5 10,0 Q8,5 10,8" fill="none" stroke="#64748b" strokeWidth="1.5" />
                    <path d="M-6,8 H26 L22,52 H-2 Z" fill="#1e3a8a" />
                    <path d="M-6,8 L-12,25 L-6,28 L-3,15" fill="#1e3a8a" />
                    <path d="M26,8 L32,25 L26,28 L23,15" fill="#1e3a8a" />
                    <path d="M2,8 L10,18 L18,8" fill="none" stroke="#3b82f6" strokeWidth="2" />
                  </g>
                  <g transform="translate(52, 15)">
                    <path d="M8,-5 Q12,-5 10,0 Q8,5 10,8" fill="none" stroke="#64748b" strokeWidth="1.5" />
                    <path d="M-4,8 H24 L20,55 H0 Z" fill="#0284c7" />
                    <path d="M-4,8 L-9,24 L-4,27 L-1,14" fill="#0284c7" />
                    <path d="M24,8 L29,24 L24,27 L21,14" fill="#0284c7" />
                    <line x1="10" y1="8" x2="10" y2="55" stroke="#e0f2fe" strokeWidth="1.5" />
                  </g>
                </svg>
              </div>
            </div>

            {/* Tile 4 */}
            <div className="bg-[#d2efff] border-2 border-gray-300 rounded-xl p-5 flex flex-col justify-between overflow-hidden min-h-[160px] transition-all duration-300 ease-in-out hover:shadow-lg">
              <div className="flex flex-col items-start text-left">
                <h4 className="text-sm sm:text-base font-semibold text-[#0d2847] leading-snug">
                  30-day effortless returns & exchanges
                </h4>
                <button
                  onClick={() => navigate("/products")}
                  className="text-xs font-semibold text-blue-700 underline hover:text-blue-900 mt-2"
                >
                  Read returns policy
                </button>
              </div>
              <div className="flex justify-end mt-2 select-none pointer-events-none">
                <svg viewBox="0 0 100 80" className="w-20 h-16">
                  <ellipse cx="50" cy="65" rx="25" ry="6" fill="#cbd5e1" opacity="0.6" />
                  <g transform="translate(15, 15)">
                    <path d="M15,35 L35,45 L35,20 L15,10 Z" fill="#0284c7" />
                    <path d="M35,45 L55,35 L55,10 L35,20 Z" fill="#0ea5e9" />
                    <path d="M35,20 L55,10 L35,0 L15,10 Z" fill="#38bdf8" />
                    <path d="M35,20 L35,45" stroke="#0369a1" strokeWidth="2.5" />
                    <path d="M35,20 L25,15 M35,20 L45,15" stroke="#0369a1" strokeWidth="2.5" />
                  </g>
                  <path d="M72,25 C82,32 78,52 62,54 C54,55 42,52 35,45" fill="none" stroke="#f59e0b" strokeWidth="3" strokeLinecap="round" />
                  <path d="M40,52 L32,45 L40,38" fill="none" stroke="#f59e0b" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Tile 5: Rightmost Tall Card */}
        <div className="lg:col-span-3 bg-white border-2 border-gray-300 rounded-xl p-6 sm:p-8 flex flex-col justify-between overflow-hidden relative min-h-[350px] transition-all duration-300 ease-in-out hover:shadow-lg">
          <div className="z-10 flex flex-col items-start text-left">
            <span className="text-xs font-semibold text-gray-500 tracking-wider">
              Loyalty Program
            </span>
            <h3 className="text-xl font-semibold text-[#0d2847] mt-2 mb-2">
              Earn points & redeem exclusive vouchers
            </h3>
            <button
              onClick={() => navigate("/vouchers")}
              className="text-xs font-semibold text-blue-700 underline hover:text-blue-900"
            >
              Join rewards
            </button>
          </div>

          <div className="relative mt-8 mb-4 select-none pointer-events-none">
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-36 h-36 bg-blue-100 rounded-full opacity-60 filter blur-xl pointer-events-none" />
            <div className="w-52 h-32 mx-auto transition-all duration-300 hover:rotate-1 hover:scale-105">
              <svg viewBox="0 0 160 100" className="w-full h-full drop-shadow-xl">
                <defs>
                  <linearGradient id="cardBg" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#0a192f" />
                    <stop offset="60%" stopColor="#0f2b48" />
                    <stop offset="100%" stopColor="#1a365d" />
                  </linearGradient>
                  <linearGradient id="goldAcc" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#fbbf24" />
                    <stop offset="50%" stopColor="#f59e0b" />
                    <stop offset="100%" stopColor="#b45309" />
                  </linearGradient>
                  <linearGradient id="goldGlow" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#fef08a" />
                    <stop offset="100%" stopColor="#f59e0b" />
                  </linearGradient>
                </defs>
                <rect x="0" y="0" width="160" height="100" rx="10" fill="url(#cardBg)" stroke="#1e293b" strokeWidth="0.5" />
                <path d="M-10,80 Q30,60 80,85 T170,70 L170,110 L-10,110 Z" fill="url(#goldAcc)" opacity="0.15" />
                <path d="M-10,85 Q40,65 90,95 T170,75 L170,110 L-10,110 Z" fill="url(#goldAcc)" opacity="0.25" />
                <text x="12" y="22" fill="url(#goldGlow)" fontSize="10" fontWeight="600" letterSpacing="0.1em">GASH</text>
                <path d="M140,15 A5,5 0 0,1 140,25 M143,12 A9,9 0 0,1 143,28 M146,9 A13,13 0 0,1 146,31" fill="none" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />
                <rect x="12" y="32" width="20" height="14" rx="2.5" fill="url(#goldAcc)" />
                <line x1="22" y1="32" x2="22" y2="46" stroke="#78350f" strokeWidth="0.5" />
                <line x1="12" y1="39" x2="32" y2="39" stroke="#78350f" strokeWidth="0.5" />
                <text x="12" y="66" fill="#cbd5e1" fontSize="9" fontFamily="monospace" letterSpacing="0.15em">•••• •••• •••• 5678</text>
                <text x="12" y="85" fill="#94a3b8" fontSize="6" fontWeight="600" letterSpacing="0.05em">VALUED CUSTOMER</text>
                <text x="148" y="85" fill="url(#goldGlow)" fontSize="7" fontWeight="600" letterSpacing="0.05em" textAnchor="end">GOLD MEMBER</text>
              </svg>
            </div>
          </div>

          <span className="text-xs font-semibold text-gray-400 tracking-wider text-center block mt-2">
            AllPay Member Rewards
          </span>
        </div>
      </div>
    </div>
  );
}

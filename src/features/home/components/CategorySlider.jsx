import React, { useRef, useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight, Tag } from "lucide-react";

export default function CategorySlider({
  categories = [],
  loading = false,
  onCategoryClick,
}) {
  const sliderRef = useRef(null);
  const [scrollPos, setScrollPos] = useState(0);
  const [canScrollNext, setCanScrollNext] = useState(false);

  const checkScroll = useCallback(() => {
    if (sliderRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = sliderRef.current;
      setScrollPos(scrollLeft);
      setCanScrollNext(scrollLeft + clientWidth < scrollWidth - 10);
    }
  }, []);

  useEffect(() => {
    checkScroll();
  }, [categories, checkScroll]);

  const handlePrev = () => {
    if (sliderRef.current) {
      sliderRef.current.scrollBy({ left: -300, behavior: "smooth" });
    }
  };

  const handleNext = () => {
    if (sliderRef.current) {
      sliderRef.current.scrollBy({ left: 300, behavior: "smooth" });
    }
  };

  return (
    <section className="w-full mt-8 bg-white rounded-2xl p-5 sm:p-6 shadow-xs border border-gray-100">
      <div className="flex items-center gap-2 mb-4 sm:mb-5">
        <span className="w-2 h-5 bg-brand-primary-500 rounded-full inline-block" />
        <h2 className="text-left text-lg sm:text-xl font-bold tracking-tight text-gray-900">
          Browse by Category
        </h2>
      </div>

      {loading ? (
        <div className="flex overflow-x-auto gap-3 sm:gap-4 pb-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {[...Array(7)].map((_, index) => (
            <div
              key={index}
              className="w-36 sm:w-40 flex-shrink-0 rounded-2xl overflow-hidden p-3.5 bg-gray-50 flex items-center justify-center min-h-[3.25rem]"
            >
              <div className="h-4 rounded-md animate-shimmer w-20" />
            </div>
          ))}
        </div>
      ) : (
        <div className="relative">
          <div
            ref={sliderRef}
            onScroll={checkScroll}
            className="flex overflow-x-auto gap-3 sm:gap-4 scroll-smooth pb-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
            role="list"
          >
            {categories.map((category) => (
              <div
                key={category}
                className="group w-36 sm:w-44 flex-shrink-0 border-2 border-gray-200 hover:border-brand-primary-500 rounded-2xl p-3.5 flex items-center justify-center gap-2 text-center cursor-pointer card-lift bg-white min-h-[3.5rem] focus:outline-none focus:ring-2 focus:ring-amber-500 select-none"
                tabIndex={0}
                role="button"
                aria-label={`Browse ${category} category`}
                onClick={() => onCategoryClick(category)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onCategoryClick(category);
                  }
                }}
              >
                <Tag className="w-3.5 h-3.5 text-gray-400 group-hover:text-amber-600 transition-colors shrink-0" />
                <span className="font-semibold text-xs sm:text-sm text-gray-800 group-hover:text-amber-700 transition-colors line-clamp-1">
                  {category}
                </span>
              </div>
            ))}
          </div>

          {scrollPos > 10 && (
            <button
              onClick={handlePrev}
              aria-label="Previous categories"
              className="absolute -left-3 top-1/2 -translate-y-1/2 z-10 w-9 h-9 flex items-center justify-center bg-white border border-gray-200 rounded-full shadow-md hover:bg-gray-50 transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-gray-700" />
            </button>
          )}

          {canScrollNext && (
            <button
              onClick={handleNext}
              aria-label="Next categories"
              className="absolute -right-3 top-1/2 -translate-y-1/2 z-10 w-9 h-9 flex items-center justify-center bg-white border border-gray-200 rounded-full shadow-md hover:bg-gray-50 transition-colors"
            >
              <ChevronRight className="w-5 h-5 text-gray-700" />
            </button>
          )}
        </div>
      )}
    </section>
  );
}

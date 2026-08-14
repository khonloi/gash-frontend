import React, { useRef, useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

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
    <section className="w-full mt-6 bg-white rounded-xl p-4 sm:p-5 md:p-6 shadow-sm border border-gray-200">
      <h2 className="text-left mb-4 sm:mb-5 text-lg sm:text-xl font-semibold text-gray-900">
        Browse by Category
      </h2>

      {loading ? (
        <div className="flex overflow-x-auto gap-3 sm:gap-4 pb-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {[...Array(7)].map((_, index) => (
            <div
              key={index}
              className="w-36 flex-shrink-0 border border-gray-200 rounded-xl overflow-hidden p-3 bg-gray-50 flex items-center justify-center min-h-[3rem]"
            >
              <div className="h-4 bg-gray-200 rounded w-20 animate-pulse" />
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
                className="w-36 sm:w-40 flex-shrink-0 border-2 border-gray-200 hover:border-amber-400 rounded-xl p-3 flex items-center justify-center text-center cursor-pointer hover:shadow-md transition-all duration-200 bg-white min-h-[3.25rem]"
                tabIndex={0}
                role="listitem"
                onClick={() => onCategoryClick(category)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") onCategoryClick(category);
                }}
              >
                <span className="font-semibold text-xs sm:text-sm text-gray-900 line-clamp-2">
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

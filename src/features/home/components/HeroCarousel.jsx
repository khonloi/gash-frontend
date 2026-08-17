import React, { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Play, Pause } from "lucide-react";
import Button from "../../../components/ui/Button";

export default function HeroCarousel({
  slides = [],
  navigate,
  autoCycleDelay = 5000,
}) {
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isManuallyNavigated, setIsManuallyNavigated] = useState(false);

  useEffect(() => {
    if (isPaused || slides.length === 0) return;
    if (isManuallyNavigated) {
      const pause = setTimeout(() => setIsManuallyNavigated(false), autoCycleDelay);
      return () => clearTimeout(pause);
    }
    const timer = setTimeout(() => {
      setCarouselIndex((prev) => (prev + 1) % slides.length);
    }, autoCycleDelay);
    return () => clearTimeout(timer);
  }, [carouselIndex, isManuallyNavigated, isPaused, slides.length, autoCycleDelay]);

  const handlePrev = () => {
    setIsManuallyNavigated(true);
    setCarouselIndex((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const handleNext = () => {
    setIsManuallyNavigated(true);
    setCarouselIndex((prev) => (prev + 1) % slides.length);
  };

  if (slides.length === 0) return null;

  return (
    <section
      className="relative w-full rounded-2xl overflow-hidden border-2 border-gray-300 shadow-sm transition-all duration-300"
      aria-roledescription="carousel"
      aria-label="Featured promotions carousel"
    >
      <div
        className="relative flex transition-transform duration-700 ease-in-out"
        style={{ transform: `translateX(-${carouselIndex * 100}%)` }}
      >
        {slides.map((slide, index) => (
          <div
            key={index}
            className={`min-w-full ${slide.bgClass} flex flex-col md:flex-row items-center justify-between p-6 sm:p-10 md:p-14 min-h-[360px] md:min-h-[420px]`}
            role="group"
            aria-roledescription="slide"
            aria-label={`${index + 1} of ${slides.length}: ${slide.title}`}
          >
            <div
              className={`flex flex-col items-start max-w-lg z-10 ${
                slide.alignRight ? "md:order-2" : "md:order-1"
              }`}
            >
              {slide.subtitle && (
                <span className="text-xs sm:text-sm font-bold uppercase tracking-widest text-gray-700 mb-2">
                  {slide.subtitle}
                </span>
              )}
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-gray-900 leading-tight mb-4">
                {slide.title}
              </h2>
              <p className="text-sm sm:text-base text-gray-700 mb-6 leading-relaxed">
                {slide.description}
              </p>
              <Button
                variant="primary"
                size="md"
                onClick={() => navigate(slide.link)}
                className="px-6 py-3 rounded-full font-bold shadow-md hover:shadow-lg transition-all"
              >
                {slide.buttonText}
              </Button>
            </div>

            <div
              className={`mt-6 md:mt-0 max-w-sm md:max-w-md ${
                slide.alignRight ? "md:order-1" : "md:order-2"
              }`}
            >
              <img
                src={slide.image}
                alt={slide.title}
                className="w-full h-auto object-contain max-h-72 drop-shadow-xl select-none pointer-events-none"
              />
            </div>
          </div>
        ))}
      </div>

      {/* Navigation Controls */}
      <button
        onClick={handlePrev}
        aria-label="Previous slide"
        className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/80 hover:bg-white text-gray-800 flex items-center justify-center shadow-md backdrop-blur-sm transition-all z-20"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>

      <button
        onClick={handleNext}
        aria-label="Next slide"
        className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/80 hover:bg-white text-gray-800 flex items-center justify-center shadow-md backdrop-blur-sm transition-all z-20"
      >
        <ChevronRight className="w-5 h-5" />
      </button>

      {/* Bottom Bar: Indicators & Pause/Play */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-3 z-20 bg-black/20 backdrop-blur-md px-4 py-2 rounded-full">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => {
              setIsManuallyNavigated(true);
              setCarouselIndex(i);
            }}
            aria-label={`Go to slide ${i + 1}`}
            className={`h-2 rounded-full transition-all ${
              carouselIndex === i ? "w-6 bg-white" : "w-2 bg-white/50 hover:bg-white/75"
            }`}
          />
        ))}

        <button
          onClick={() => setIsPaused(!isPaused)}
          aria-label={isPaused ? "Play slideshow" : "Pause slideshow"}
          className="text-white hover:text-amber-300 transition-colors ml-1"
        >
          {isPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
        </button>
      </div>
    </section>
  );
}

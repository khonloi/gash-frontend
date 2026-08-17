import React from "react";

/**
 * Skeleton loading view for ProductDetail page.
 */
export default function ProductDetailSkeleton() {
  return (
    <div className="page-container page-container-centered">
      {/* Breadcrumb Skeleton */}
      <nav className="w-full mb-3 sm:mb-4" aria-label="Breadcrumb skeleton">
        <div className="flex items-center gap-2 text-xs sm:text-sm">
          <div className="h-3 sm:h-4 bg-gray-200 rounded w-12 animate-pulse"></div>
          <div className="h-3 sm:h-4 bg-gray-200 rounded w-1 animate-pulse"></div>
          <div className="h-3 sm:h-4 bg-gray-200 rounded w-20 animate-pulse"></div>
          <div className="h-3 sm:h-4 bg-gray-200 rounded w-1 animate-pulse"></div>
          <div className="h-3 sm:h-4 bg-gray-200 rounded w-32 animate-pulse"></div>
        </div>
      </nav>

      {/* Main Product Section Skeleton */}
      <section className="bg-white rounded-xl p-4 sm:p-5 md:p-6 w-full mb-4 sm:mb-5 md:mb-6 shadow-sm border border-gray-200">
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 md:gap-5 w-full">
          {/* Image Gallery Skeleton */}
          <div className="flex-1 sm:flex-[3] max-w-full sm:max-w-[420px] flex flex-col gap-3">
            <div className="flex justify-center items-start w-full">
              <div className="w-full h-[360px] bg-gray-200 rounded-xl animate-pulse"></div>
            </div>
            <div className="flex items-center justify-center gap-2">
              <div className="w-8 h-8 sm:w-9 sm:h-9 bg-gray-200 rounded-full animate-pulse flex-shrink-0"></div>
              <div className="flex gap-2 overflow-x-auto">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="w-[50px] h-[50px] bg-gray-200 rounded animate-pulse flex-shrink-0"></div>
                ))}
              </div>
              <div className="w-8 h-8 sm:w-9 sm:h-9 bg-gray-200 rounded-full animate-pulse flex-shrink-0"></div>
            </div>
          </div>

          {/* Product Info Skeleton */}
          <div className="flex-1 sm:flex-[3] px-0 sm:px-3 space-y-4 sm:space-y-5">
            <div className="h-6 sm:h-8 bg-gray-200 rounded w-3/4 animate-pulse"></div>
            <div className="h-7 sm:h-8 bg-gray-200 rounded w-40 animate-pulse"></div>
            <div className="h-5 sm:h-6 bg-gray-200 rounded w-32 animate-pulse"></div>

            <div className="space-y-3 sm:space-y-4">
              <div className="border-2 border-gray-300 rounded-xl p-3 sm:p-4">
                <div className="h-4 sm:h-5 bg-gray-200 rounded w-16 mb-3 animate-pulse"></div>
                <div className="flex flex-wrap gap-2">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="h-8 bg-gray-200 rounded-md w-20 animate-pulse"></div>
                  ))}
                </div>
              </div>

              <div className="border-2 border-gray-300 rounded-xl p-3 sm:p-4">
                <div className="h-4 sm:h-5 bg-gray-200 rounded w-12 mb-3 animate-pulse"></div>
                <div className="flex flex-wrap gap-2">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="h-8 bg-gray-200 rounded-md w-16 animate-pulse"></div>
                  ))}
                </div>
              </div>

              <div className="border-2 border-gray-300 rounded-xl p-3 sm:p-4">
                <div className="h-4 sm:h-5 bg-gray-200 rounded w-20 mb-3 animate-pulse"></div>
                <div className="h-10 bg-gray-200 rounded-md w-20 animate-pulse"></div>
              </div>
            </div>
          </div>

          {/* Action Buttons Sidebar Skeleton */}
          <div className="flex-1 min-w-[200px] max-w-full sm:max-w-[260px] p-4 sm:p-5 border-2 border-gray-300 rounded-xl bg-gray-50 flex flex-col gap-2">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-10 bg-gray-200 rounded-md animate-pulse"></div>
            ))}
            <div className="mt-3 space-y-2">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-4 bg-gray-200 rounded w-full animate-pulse"></div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Description Section Skeleton */}
      <section className="bg-white rounded-xl p-4 sm:p-5 md:p-6 w-full mb-4 sm:mb-5 md:mb-6 shadow-sm border border-gray-200">
        <div className="h-6 sm:h-7 bg-gray-200 rounded w-48 mb-4 animate-pulse"></div>
        <div className="space-y-3">
          <div className="h-4 bg-gray-200 rounded w-full animate-pulse"></div>
          <div className="h-4 bg-gray-200 rounded w-full animate-pulse"></div>
          <div className="h-4 bg-gray-200 rounded w-5/6 animate-pulse"></div>
          <div className="h-4 bg-gray-200 rounded w-full animate-pulse"></div>
          <div className="h-4 bg-gray-200 rounded w-4/5 animate-pulse"></div>
        </div>
      </section>

      {/* Feedback Section Skeleton */}
      <section className="bg-white rounded-xl p-4 sm:p-5 md:p-6 w-full shadow-sm border border-gray-200">
        <div className="h-6 sm:h-7 bg-gray-200 rounded w-40 mb-4 animate-pulse"></div>
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="border-2 border-gray-300 rounded-xl p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-gray-200 rounded-full animate-pulse"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-32 mb-2 animate-pulse"></div>
                  <div className="h-3 bg-gray-200 rounded w-24 animate-pulse"></div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded w-full animate-pulse"></div>
                <div className="h-4 bg-gray-200 rounded w-5/6 animate-pulse"></div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

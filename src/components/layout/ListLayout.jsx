import React from "react";
import LoadingSpinner, { LoadingSkeleton } from "../ui/LoadingSpinner";
import Button from "../ui/Button";

const ListLayout = ({
  title,
  searchPlaceholder,
  searchQuery,
  setSearchQuery,
  startIndex,
  endIndex,
  loading,
  emptyIcon,
  emptyStateTitle,
  emptyStateMessage,
  noResultsTitle,
  noResultsMessage,
  totalItems,
  filteredItems,
  currentItems,
  renderItem,
  itemsPerPage,
  currentPage,
  totalPages,
  handlePageChange,
  itemNamePlural,
  children,
  isAuthLoading,
  authLoadingText = "Loading..."
}) => {
  if (isAuthLoading) {
    return <LoadingSpinner fullScreen text={authLoadingText} />;
  }

  return (
    <div className="page-container page-container-centered">
      <section className="bg-white rounded-xl p-4 sm:p-5 md:p-6 w-full max-w-5xl shadow-sm border border-gray-200">
        <header className="mb-4">
          <h1 className="text-xl sm:text-2xl font-normal mb-2 m-0">{title}</h1>
        </header>

        <div className="mb-6 space-y-4">
          <fieldset className="border-2 border-gray-300 rounded-xl p-3 sm:p-4">
            <legend className="text-sm sm:text-base font-semibold m-0">Search</legend>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <div className="flex-1">
                <fieldset className="flex flex-col">
                  <div className="relative">
                    <input
                      id="search-input"
                      type="text"
                      placeholder={searchPlaceholder}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full p-3 pl-10 border-2 border-gray-300 rounded-md bg-white text-xs sm:text-sm transition-colors hover:bg-gray-50 hover:border-blue-600 focus:outline-none disabled:bg-gray-200 disabled:border-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed"
                    />
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg
                        className="h-5 w-5 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                        />
                      </svg>
                    </div>
                  </div>
                </fieldset>
              </div>

              {searchQuery && (
                <div className="flex items-end">
                  <Button
                    variant="default"
                    size="md"
                    onClick={() => {
                      setSearchQuery("");
                    }}
                  >
                    Clear
                  </Button>
                </div>
              )}
            </div>
          </fieldset>
        </div>

        <div className="mb-6">
          <p className="text-xs sm:text-sm text-gray-600">
            Showing {filteredItems.length > 0 ? startIndex + 1 : 0}–
            {Math.min(endIndex, filteredItems.length)} of {filteredItems.length}{" "}
            {itemNamePlural}
          </p>
        </div>

        {loading ? (
          <LoadingSkeleton count={3} />
        ) : filteredItems.length === 0 ? (
          <div className="text-center text-xs sm:text-sm text-gray-500 border-2 border-gray-300 rounded-xl p-4 sm:p-6 md:p-8 mb-3 sm:mb-4 w-full min-h-[100px] flex flex-col items-center justify-center gap-4" role="status">
            <div className="text-gray-400">
              {emptyIcon || (
                <svg
                  className="w-16 h-16 mx-auto"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1}
                    d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z"
                  />
                </svg>
              )}
            </div>
            {totalItems === 0 ? (
              <>
                <p className="text-gray-500 italic text-base sm:text-lg">{emptyStateTitle}</p>
                <p className="text-gray-400 text-xs sm:text-sm mt-2">
                  {emptyStateMessage}
                </p>
              </>
            ) : (
              <>
                <p className="text-gray-500 italic text-base sm:text-lg">
                  {noResultsTitle}
                </p>
                <p className="text-gray-400 text-xs sm:text-sm mt-2">
                  {noResultsMessage}
                </p>
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => {
                    setSearchQuery("");
                  }}
                  className="text-blue-600"
                >
                  Clear Search
                </Button>
              </>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {currentItems.map(renderItem)}
          </div>
        )}

        {filteredItems.length > itemsPerPage && (
          <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-sm text-gray-600">
              Page {currentPage} of {totalPages}
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="default"
                size="sm"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
              >
                <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
                Previous
              </Button>

              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                  const shouldShow =
                    page === 1 ||
                    page === totalPages ||
                    (page >= currentPage - 1 && page <= currentPage + 1);

                  if (!shouldShow) {
                    if (page === currentPage - 2 || page === currentPage + 2) {
                      return (
                        <span key={page} className="px-2 py-1 text-gray-400">
                          ...
                        </span>
                      );
                    }
                    return null;
                  }

                  return (
                    <Button
                      key={page}
                      variant={page === currentPage ? "primary" : "default"}
                      size="sm"
                      onClick={() => handlePageChange(page)}
                    >
                      {page}
                    </Button>
                  );
                })}
              </div>

              <Button
                variant="default"
                size="sm"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                Next
                <svg className="w-4 h-4 inline ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </Button>
            </div>
          </div>
        )}
      </section>

      {children}
    </div>
  );
};

export default ListLayout;

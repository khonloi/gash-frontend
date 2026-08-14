import React from "react";
import LoadingSpinner, { LoadingSkeleton } from "../ui/LoadingSpinner";
import Button from "../ui/Button";
import EmptyState from "../ui/EmptyState";

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
  authLoadingText = "Loading...",
  error,
  errorRef,
  onRetry,
  aside,
  hideSearch,
  hideItemCount,
  listHeader,
  customEmptyState
}) => {
  if (isAuthLoading) {
    return <LoadingSpinner fullScreen text={authLoadingText} />;
  }

  return (
    <div className="page-container page-container-centered pb-24 sm:pb-0">
      <section className="bg-white rounded-xl p-4 sm:p-5 md:p-6 w-full max-w-5xl shadow-sm border border-gray-200">
        <header className="mb-4">
          <h1 className="text-xl sm:text-2xl font-normal mb-2 m-0">{title}</h1>
        </header>

        {!hideSearch && (
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
        )}

        {error && (
          <div
            ref={errorRef}
            className="text-center text-[10px] sm:text-sm text-red-600 bg-red-50 border-2 border-red-200 rounded-xl p-4 sm:p-6 md:p-8 mb-3 sm:mb-4 w-full flex items-center justify-center gap-2 sm:gap-2.5 flex-wrap"
            role="alert"
            tabIndex={0}
            aria-live="polite"
          >
            <span className="text-lg" aria-hidden="true">
              ⚠
            </span>
            {error}
            {onRetry && (
              <Button
                variant="secondary"
                size="sm"
                onClick={onRetry}
                disabled={loading}
                aria-label="Retry"
              >
                Retry
              </Button>
            )}
          </div>
        )}

        {!hideItemCount && filteredItems && (
          <div className="mb-6">
            <p className="text-xs sm:text-sm text-gray-600">
              Showing {filteredItems.length > 0 ? startIndex + 1 : 0}–
              {Math.min(endIndex, filteredItems.length)} of {filteredItems.length}{" "}
              {itemNamePlural}
            </p>
          </div>
        )}

        {loading ? (
          <LoadingSkeleton count={3} />
        ) : filteredItems?.length === 0 ? (
          totalItems === 0 && customEmptyState ? (
            customEmptyState
          ) : totalItems === 0 ? (
            <EmptyState
              title={emptyStateTitle || "No items found"}
              description={emptyStateMessage || "Explore our collection to add items."}
              actionText="Explore Products"
              actionLink="/products"
            />
          ) : (
            <div className="text-center text-xs sm:text-sm text-gray-500 border-2 border-gray-300 rounded-xl p-4 sm:p-6 md:p-8 mb-3 sm:mb-4 w-full min-h-[100px] flex flex-col items-center justify-center" role="status">
              <p className="text-gray-900 font-semibold text-base sm:text-lg">
                {noResultsTitle || "No items match your search"}
              </p>
              <p className="text-gray-500 text-xs sm:text-sm mt-1 mb-4">
                {noResultsMessage || "Try adjusting your search query."}
              </p>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setSearchQuery("")}
              >
                Clear Search
              </Button>
            </div>
          )
        ) : (
          aside ? (
            <main className="flex flex-col sm:flex-row gap-4 sm:gap-6 md:gap-8" role="main">
              <section className="flex-1 min-w-0" aria-label={`${title} items`}>
                {listHeader}
                <div className="space-y-4">
                  {currentItems?.map(renderItem)}
                </div>
              </section>
              <aside className="flex-shrink-0 w-full sm:w-64 fixed bottom-0 left-0 z-40 bg-white border-t-2 border-gray-300 p-4 shadow-[0_-4px_10px_rgba(0,0,0,0.08)] sm:static sm:z-auto sm:bg-transparent sm:border-0 sm:p-0 sm:shadow-none sm:sticky sm:top-44 sm:self-start" aria-label={`${title} summary`}>
                {aside}
              </aside>
            </main>
          ) : (
            <div className="space-y-4">
              {listHeader}
              {currentItems?.map(renderItem)}
            </div>
          )
        )}

        {filteredItems && itemsPerPage && filteredItems.length > itemsPerPage && (
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

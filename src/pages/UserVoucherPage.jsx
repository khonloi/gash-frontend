import React from "react";
import Button from "../components/ui/Button";
import { useVouchers } from "../features/vouchers/hooks/useVouchers";
import ListLayout from "../components/layout/ListLayout";

const UserVoucherPage = () => {
  const {
    isAuthLoading,
    vouchers,
    filteredVouchers,
    loading,
    searchQuery,
    setSearchQuery,
    currentPage,
    totalPages,
    startIndex,
    endIndex,
    currentVouchers,
    handlePageChange,
    itemsPerPage
  } = useVouchers();

  const renderVoucher = (v) => {
    const isExpired = new Date(v.endDate) < new Date();
    return (
      <article
        key={v.id || v.code}
        className={`border-2 border-gray-300 rounded-xl p-4 sm:p-5 mb-4 last:mb-0 flex flex-col sm:flex-row gap-4 transition-shadow hover:shadow-sm border border-gray-200 focus-within:shadow-sm ${
          isExpired ? "opacity-60 bg-gray-50 border-gray-200 grayscale cursor-not-allowed" : "bg-white"
        }`}
        tabIndex={0}
        aria-label={`Voucher: ${v.code} ${isExpired ? "(Expired)" : ""}`}
      >
        <div className="flex items-stretch gap-6 flex-1">
          <div className={`w-20 sm:w-24 aspect-square ${isExpired ? "bg-gray-200" : "bg-blue-100"} flex items-center justify-center rounded-lg flex-shrink-0`}>
            <svg className={`w-10 h-10 ${isExpired ? "text-gray-400" : "text-blue-500"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
            </svg>
          </div>
          
          <div className="flex-1 min-w-0 flex flex-col justify-center gap-2">
            <div className="flex items-center gap-2 flex-wrap">
              <p className={`text-base sm:text-lg font-semibold m-0 ${isExpired ? "text-gray-500 line-through" : "text-blue-700"}`}>
                {v.code}
              </p>
              {isExpired && (
                <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded font-medium">
                  Expired
                </span>
              )}
            </div>
            <p className="text-sm text-gray-600 m-0">
              {v.discountType === "percentage"
                ? `${v.discountValue}% Off`
                : `-${v.discountValue?.toLocaleString()}₫`}
            </p>
            {v.minOrderValue && (
              <p className="text-xs text-gray-500 mt-1">
                Min. Order: {v.minOrderValue.toLocaleString()}₫
              </p>
            )}
            {v.endDate && (
              <p className="text-xs text-gray-500">
                Expires: {new Date(v.endDate).toLocaleDateString()}
              </p>
            )}
          </div>
        </div>
        
        <div className="flex flex-row sm:flex-col items-center sm:items-center sm:justify-center gap-3 sm:gap-4">
          <Button
            variant={isExpired ? "default" : "primary"}
            size="sm"
            onClick={() => {
              if (!isExpired) {
                navigator.clipboard.writeText(v.code);
              }
            }}
            disabled={isExpired}
            title={isExpired ? "Expired" : "Copy Code"}
          >
            {isExpired ? "Expired" : "Copy Code"}
          </Button>
        </div>
      </article>
    );
  };

  return (
    <ListLayout
      title="Vouchers"
      searchPlaceholder="Search by voucher code..."
      searchQuery={searchQuery}
      setSearchQuery={setSearchQuery}
      startIndex={startIndex}
      endIndex={endIndex}
      loading={loading}
      emptyIcon={
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
      }
      emptyStateTitle="No vouchers found"
      emptyStateMessage="There are no vouchers available at the moment"
      noResultsTitle="No vouchers match your search"
      noResultsMessage="Try adjusting your search criteria"
      totalItems={vouchers.length}
      filteredItems={filteredVouchers}
      currentItems={currentVouchers}
      renderItem={renderVoucher}
      itemsPerPage={itemsPerPage}
      currentPage={currentPage}
      totalPages={totalPages}
      handlePageChange={handlePageChange}
      itemNamePlural="vouchers"
      isAuthLoading={isAuthLoading}
    />
  );
};

export default UserVoucherPage;


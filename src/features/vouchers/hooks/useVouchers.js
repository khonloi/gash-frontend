import { useState, useEffect, useContext, useCallback } from "react";
import { AuthContext } from "../../../context/AuthContext";
import { useToast } from "../../../hooks/useToast";
import Api from "../../../common/SummaryAPI";

export const useVouchers = () => {
  const { user, isAuthLoading } = useContext(AuthContext);
  const { showToast } = useToast();

  const [vouchers, setVouchers] = useState([]);
  const [filteredVouchers, setFilteredVouchers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const fetchVouchers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await Api.voucher.getAll();
      const data = res.data?.data || [];
      const sorted = data.sort((a, b) => {
        const aExpired = new Date(a.endDate) < new Date();
        const bExpired = new Date(b.endDate) < new Date();
        if (aExpired && !bExpired) return 1;
        if (!aExpired && bExpired) return -1;
        return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
      });
      setVouchers(sorted);
      setFilteredVouchers(sorted);
    } catch (err) {
      console.error("Error fetching vouchers:", err);
      showToast("Failed to load vouchers", "error");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchVouchers();
  }, [fetchVouchers]);

  const handleSearchAndFilter = useCallback(() => {
    let filtered = [...vouchers];
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(v => v.code?.toLowerCase().includes(query));
    }
    setFilteredVouchers(filtered);
  }, [vouchers, searchQuery]);

  useEffect(() => {
    handleSearchAndFilter();
    setCurrentPage(1);
  }, [handleSearchAndFilter]);

  const totalPages = Math.ceil(filteredVouchers.length / Math.max(1, itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentVouchers = filteredVouchers.slice(startIndex, endIndex);

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return {
    user,
    isAuthLoading,
    vouchers,
    filteredVouchers,
    loading,
    searchQuery,
    setSearchQuery,
    currentPage,
    itemsPerPage,
    totalPages,
    startIndex,
    endIndex,
    currentVouchers,
    handlePageChange
  };
};

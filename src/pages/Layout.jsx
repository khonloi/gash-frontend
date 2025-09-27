import React, { useState, useEffect, useContext, useCallback } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import axiosClient from '../common/axiosClient';
import gashLogo from '../assets/image/gash-logo.svg';
import {
  DROPDOWN_CLOSE_DELAY,
  SEARCH_DEBOUNCE_DELAY,
  ERROR_TIMEOUT,
} from '../constants/constants';
import Footer from '../components/Footer';
import Header from '../components/Header';


export default function Layout({ children }) {
  const { user, logout } = useContext(AuthContext);
  const [search, setSearch] = useState('');
  const [searchError, setSearchError] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [dropdownTimer, setDropdownTimer] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    setSearch('');
    setSearchResults([]);
    setShowDropdown(false);
  }, [location]);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (err) {
      console.error(err);
    }
  };

  const fetchSearchResults = useCallback(async (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    try {
      const res = await axiosClient.get(`/search?q=${query}`);
      setSearchResults(res.data || []);
      setShowDropdown(true);
    } catch (err) {
      console.error(err);
      setSearchError('Lỗi khi tìm kiếm');
      setTimeout(() => setSearchError(''), ERROR_TIMEOUT);
    }
  }, []);

  useEffect(() => {
    if (!search) {
      setSearchResults([]);
      return;
    }
    const debounce = setTimeout(
      () => fetchSearchResults(search),
      SEARCH_DEBOUNCE_DELAY
    );
    return () => clearTimeout(debounce);
  }, [search, fetchSearchResults]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (search.trim()) {
      navigate(`/search?q=${encodeURIComponent(search)}`);
      setShowDropdown(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Navbar */}
      <Header />

      {/* Spacer để tránh nội dung bị che bởi fixed header */}
      <div className="h-16" />

      {/* Main content */}
      <main className="flex-1">{children}</main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
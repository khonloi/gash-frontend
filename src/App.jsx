import React from "react";
import { ToastProvider } from "./components/Toast";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { GoogleOAuthProvider } from "@react-oauth/google";

// ==== Pages ====
import ProductList from "./pages/ProductList";
import ProductDetail from "./pages/ProductDetail";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Profile from "./pages/Profile";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import Orders from "./pages/Orders";
import Layout from "./pages/Layout";
import ProductFavorite from "./pages/ProductFavorite";
import Search from "./pages/Search";
import OTPVerification from "./pages/OTPVerification";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Register from "./pages/Register";
import Home from "./pages/Home";
import BlogPost from "./pages/BlogPost";
import Contact from "./pages/Contact";
import VNPayReturn from "./pages/VNPayReturn";
import ScrollToTop from "./pages/ScrollToTop";
import UserVoucherPage from "./pages/UserVoucherPage"; // ✅ thêm import này

// ==== App Component ====
const App = () => {
  return (
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID || ""}>
      <Router>
        <AuthProvider>
          <ToastProvider>
            <ScrollToTop />
            <Layout>
              <Routes>
                {/* Trang chính */}
                <Route path="/" element={<Home />} />

                {/* Sản phẩm */}
                <Route path="/products" element={<ProductList />} />
                <Route path="/product/:id" element={<ProductDetail />} />

                {/* Tài khoản */}
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
                <Route path="/otp-verification" element={<OTPVerification />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/register" element={<Register />} />
                <Route path="/profile" element={<Profile />} />

                {/* Giỏ hàng & thanh toán */}
                <Route path="/cart" element={<Cart />} />
                <Route path="/checkout" element={<Checkout />} />
                <Route path="/orders" element={<Orders />} />
                <Route path="/favorites" element={<ProductFavorite />} />
                <Route path="/search" element={<Search />} />

                {/* Blog, liên hệ, VNPay */}
                <Route path="/news" element={<BlogPost />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/vnpay-return" element={<VNPayReturn />} />

                {/* ✅ Ví Voucher cho user */}
                <Route path="/vouchers" element={<UserVoucherPage />} />
              </Routes>
            </Layout>
          </ToastProvider>
        </AuthProvider>
      </Router>
    </GoogleOAuthProvider>
  );
};

export default App;

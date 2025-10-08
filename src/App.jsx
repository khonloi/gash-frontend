import React, { useContext } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { ToastProvider } from "./components/Toast";
import { AuthProvider, AuthContext } from "./context/AuthContext";

// ==== Pages ====
import Layout from "./pages/Layout";
import ScrollToTop from "./pages/ScrollToTop";
import Home from "./pages/Home";
import ProductList from "./pages/ProductList";
import ProductDetail from "./pages/ProductDetail";
import ProductFeedback from "./pages/ProductFeedback";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Profile from "./pages/Profile";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import Orders from "./pages/Orders";
import OrderDetails from "./components/OrderDetails";
import Layout from "./pages/Layout";
import ProductFavorite from "./pages/ProductFavorite";
import Search from "./pages/Search";
import OTPVerification from "./pages/OTPVerification";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Register from "./pages/Register";
import BlogPost from "./pages/BlogPost";
import Contact from "./pages/Contact";
import VNPayReturn from "./pages/VNPayReturn";
import ScrollToTop from "./pages/ScrollToTop";
import UserVoucherPage from "./pages/UserVoucherPage";
import Bill from "./pages/Bill";
import UserVoucherPage from "./pages/UserVoucherPage";

// ==== Components ====
import UserChat from "./components/UserChat";

// ✅ Component: chỉ hiển thị chat nếu user đã đăng nhập
function ChatIfLoggedIn() {
  const auth = useContext(AuthContext);

  // Nếu context chưa load hoặc chưa login => không render chat
  if (!auth || !auth.user || !auth.user._id) {
    return null;
  }

  return (
    <div style={{ position: "fixed", bottom: 20, right: 20, zIndex: 9999 }}>
      <UserChat userId={auth.user._id} />
    </div>
  );
}

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
                {/* 🌐 Trang chính */}
                <Route path="/" element={<Home />} />

                {/* 🛍️ Sản phẩm */}
                <Route path="/products" element={<ProductList />} />
                <Route path="/product/:id" element={<ProductDetail />} />
                <Route path="/product/:id/feedback" element={<ProductFeedback />} />
                <Route path="/product/:id/feedback/:variantId" element={<ProductFeedback />} />

                {/* 👤 Tài khoản */}
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
                <Route path="/otp-verification" element={<OTPVerification />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/register" element={<Register />} />
                <Route path="/profile" element={<Profile />} />

                {/* 🛒 Giỏ hàng & thanh toán */}
                <Route path="/cart" element={<Cart />} />
                <Route path="/checkout" element={<Checkout />} />
                <Route path="/orders" element={<Orders />} />
                <Route path="/orders/:id" element={<OrderDetails />} />
                <Route path="/bills/:orderId" element={<Bill />} />
                <Route path="/favorites" element={<ProductFavorite />} />
                <Route path="/search" element={<Search />} />

                {/* 📰 Blog, liên hệ, thanh toán */}
                <Route path="/news" element={<BlogPost />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/vnpay-return" element={<VNPayReturn />} />


                {/* 🎟️ Ví Voucher */}

                {/* Ví Voucher cho user */}
                <Route path="/vouchers" element={<UserVoucherPage />} />
              </Routes>

              {/* ✅ Chỉ hiển thị chat khi user đã đăng nhập */}
              <ChatIfLoggedIn />
            </Layout>
          </ToastProvider>
        </AuthProvider>
      </Router>
    </GoogleOAuthProvider>
  );
};

export default App;

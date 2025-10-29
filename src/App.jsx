import React, { useContext } from "react";
import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { ToastProvider } from "./components/Toast";
import { AuthProvider, AuthContext } from "./context/AuthContext";

// ==== Pages ====
import Layout from "./pages/Layout";
import ScrollToTop from "./pages/ScrollToTop";
import Home from "./pages/Home";
import ProductList from "./pages/ProductList";
import ProductDetail from "./pages/ProductDetail";
import AllProductFeedback from "./pages/AllProductFeedback";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Profile from "./pages/customer/Profile";
import Cart from "./pages/customer/Cart";
import Checkout from "./pages/customer/Checkout";
import Orders from "./pages/customer/Orders";
import OrderDetails from "./components/OrderDetails";
import ProductFavorite from "./pages/customer/ProductFavorite";
import Search from "./pages/Search";
import OTPVerification from "./pages/OTPVerification";
import ForgotPassword from "./pages/customer/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Register from "./pages/Register";
import BlogPost from "./pages/BlogPost";
import Contact from "./pages/Contact";
import VNPayReturn from "./pages/VNPayReturn";
import Bill from "./pages/customer/Bill";
import UserVoucherPage from "./pages/UserVoucherPage";
import Notifications from "./pages/Notifications";
import ListLiveStream from "./pages/LiveStream/ListLiveStream";
import ViewLiveStream from "./pages/LiveStream/ViewLiveStream";

// ==== Components ====
import UserChat from "./components/UserChat";

// Component: chỉ hiển thị chat nếu user đã đăng nhập
function ChatIfLoggedIn() {
  const auth = useContext(AuthContext);
  const location = useLocation();

  // Nếu context chưa load hoặc chưa login => không render chat
  if (!auth || !auth.user || !auth.user._id) {
    return null;
  }

  // Ẩn chat khi ở trang LiveStream detail
  if (location.pathname.startsWith("/live/")) {
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
                {/* Trang chính */}
                <Route path="/" element={<Home />} />

                {/* Sản phẩm */}
                <Route path="/products" element={<ProductList />} />
                <Route path="/product/:id" element={<ProductDetail />} />
                <Route path="/product/:id/all-feedback" element={<AllProductFeedback />} />

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
                <Route path="/orders/:id" element={<OrderDetails />} />
                <Route path="/bills/:orderId" element={<Bill />} />
                <Route path="/favorites" element={<ProductFavorite />} />
                <Route path="/search" element={<Search />} />

                {/* Blog, liên hệ, thanh toán */}
                <Route path="/news" element={<BlogPost />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/vnpay-return" element={<VNPayReturn />} />

                {/* Ví Voucher */}
                <Route path="/vouchers" element={<UserVoucherPage />} />

                {/* Trang thông báo */}
                <Route path="/notifications" element={<Notifications />} />

                {/* Livestream */}
                <Route path="/live" element={<ListLiveStream />} />
                <Route path="/live/:id" element={<ViewLiveStream />} />

              </Routes>

              {/* Chỉ hiển thị chat khi user đã đăng nhập */}
              <ChatIfLoggedIn />
            </Layout>
          </ToastProvider>
        </AuthProvider>
      </Router>
    </GoogleOAuthProvider>
  );
};

export default App;

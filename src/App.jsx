import React from "react";
import { ToastProvider } from "./components/Toast";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { GoogleOAuthProvider } from "@react-oauth/google";
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

const App = () => {
  return (
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID || ""}>
      <Router>
        <AuthProvider>
          <ToastProvider>
            <ScrollToTop />
            <Layout>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/product/:id" element={<ProductDetail />} />
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
                <Route path="/otp-verification" element={<OTPVerification />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/cart" element={<Cart />} />
                <Route path="/checkout" element={<Checkout />} />
                <Route path="/orders" element={<Orders />} />
                <Route path="/favorites" element={<ProductFavorite />} />
                <Route path="/search" element={<Search />} />
                <Route path="/products" element={<ProductList />} />
                <Route path="/register" element={<Register />} />
                <Route path="/news" element={<BlogPost />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/vnpay-return" element={<VNPayReturn />} />
              </Routes>
            </Layout>
          </ToastProvider>
        </AuthProvider>
      </Router>
    </GoogleOAuthProvider>
  );
};

export default App;

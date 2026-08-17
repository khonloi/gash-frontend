import React, { Suspense, lazy, useContext } from "react";
import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { ToastProvider } from "./components/ui/Toast";
import { AuthProvider, AuthContext } from "./context/AuthContext";
import Layout from "./pages/Layout";
import ScrollToTop from "./pages/ScrollToTop";
import LoadingFallback from "./components/common/LoadingFallback";
import PrivateRoute from "./components/common/PrivateRoute";
import ErrorBoundary from "./components/ui/ErrorBoundary";

// ==== Lazy-loaded Pages (Route-level Code Splitting) ====
const Home = lazy(() => import("./pages/Home"));
const ProductList = lazy(() => import("./pages/ProductList"));
const ProductDetail = lazy(() => import("./pages/ProductDetail"));
const AllProductFeedback = lazy(() => import("./pages/AllProductFeedback"));
const Login = lazy(() => import("./pages/auth/Login"));
const Signup = lazy(() => import("./pages/auth/Signup"));
const Profile = lazy(() => import("./pages/customer/Profile"));
const Cart = lazy(() => import("./pages/customer/Cart"));
const Checkout = lazy(() => import("./pages/customer/Checkout"));
const Orders = lazy(() => import("./pages/customer/Orders"));
const OrderDetails = lazy(() => import("./features/orders/components/OrderDetails"));
const ProductFavorite = lazy(() => import("./pages/customer/ProductFavorite"));
const Feedback = lazy(() => import("./pages/customer/Feedback"));
const Search = lazy(() => import("./pages/Search"));
const OTPVerification = lazy(() => import("./pages/auth/OTPVerification"));
const ForgotPassword = lazy(() => import("./pages/customer/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const Register = lazy(() => import("./pages/auth/Register"));
const BlogPost = lazy(() => import("./pages/BlogPost"));
const Contact = lazy(() => import("./pages/Contact"));
const Bill = lazy(() => import("./pages/customer/Bill"));
const UserVoucherPage = lazy(() => import("./pages/UserVoucherPage"));
const Notifications = lazy(() => import("./pages/Notifications"));
const ListLiveStream = lazy(() => import("./pages/LiveStream/ListLiveStream"));
const ViewLiveStream = lazy(() => import("./pages/LiveStream/ViewLiveStream"));
const VNPayReturn = lazy(() => import("./pages/VNPayReturn"));
const NotFound = lazy(() => import("./pages/NotFound"));

// ==== Components ====
const UserChat = lazy(() => import("./features/chat/components/UserChat"));

// Component: render chat when user is logged in (not in livestream)
function ChatIfLoggedIn() {
  const auth = useContext(AuthContext);
  const location = useLocation();

  if (!auth || !auth.user || !auth.user._id) {
    return null;
  }

  if (location.pathname.startsWith("/live/")) {
    return null;
  }

  return (
    <Suspense fallback={null}>
      <div style={{ position: "fixed", bottom: 20, right: 20, zIndex: 9999 }}>
        <UserChat userId={auth.user._id} />
      </div>
    </Suspense>
  );
}

// Component: routes container with route-aware error boundary
function AppRoutes() {
  const location = useLocation();

  return (
    <ErrorBoundary resetKey={location.pathname}>
      <Suspense fallback={<LoadingFallback />}>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<Home />} />
          <Route path="/products" element={<ProductList />} />
          <Route path="/product/:id" element={<ProductDetail />} />
          <Route path="/product/:id/all-feedback" element={<AllProductFeedback />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/otp-verification" element={<OTPVerification />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/register" element={<Register />} />
          <Route path="/search" element={<Search />} />
          <Route path="/news" element={<BlogPost />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/vnpay-return" element={<VNPayReturn />} />
          <Route path="/live" element={<ListLiveStream />} />

          {/* Protected customer routes */}
          <Route
            path="/profile"
            element={
              <PrivateRoute>
                <Profile />
              </PrivateRoute>
            }
          />
          <Route
            path="/cart"
            element={
              <PrivateRoute>
                <Cart />
              </PrivateRoute>
            }
          />
          <Route
            path="/checkout"
            element={
              <PrivateRoute>
                <Checkout />
              </PrivateRoute>
            }
          />
          <Route
            path="/orders"
            element={
              <PrivateRoute>
                <Orders />
              </PrivateRoute>
            }
          />
          <Route
            path="/orders/:id"
            element={
              <PrivateRoute>
                <OrderDetails />
              </PrivateRoute>
            }
          />
          <Route
            path="/bills/:orderId"
            element={
              <PrivateRoute>
                <Bill />
              </PrivateRoute>
            }
          />
          <Route
            path="/favorites"
            element={
              <PrivateRoute>
                <ProductFavorite />
              </PrivateRoute>
            }
          />
          <Route
            path="/feedback"
            element={
              <PrivateRoute>
                <Feedback />
              </PrivateRoute>
            }
          />
          <Route
            path="/vouchers"
            element={
              <PrivateRoute>
                <UserVoucherPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/notifications"
            element={
              <PrivateRoute>
                <Notifications />
              </PrivateRoute>
            }
          />
          <Route
            path="/live/:id"
            element={
              <PrivateRoute>
                <ViewLiveStream />
              </PrivateRoute>
            }
          />

          {/* 404 Catch-all */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </ErrorBoundary>
  );
}

// ==== App Component ====
const App = () => {
  return (
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID || ""}>
      <Router>
        <ToastProvider>
          <AuthProvider>
            <ScrollToTop />
            <Layout>
              <AppRoutes />
              <ChatIfLoggedIn />
            </Layout>
          </AuthProvider>
        </ToastProvider>
      </Router>
    </GoogleOAuthProvider>
  );
};

export default App;

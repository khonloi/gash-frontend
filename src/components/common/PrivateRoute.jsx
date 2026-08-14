import React, { useContext } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import LoadingFallback from "./LoadingFallback";

export default function PrivateRoute({ children }) {
  const { user, isAuthLoading } = useContext(AuthContext);
  const location = useLocation();

  if (isAuthLoading) {
    return <LoadingFallback />;
  }

  const token = localStorage.getItem("token");

  if (!user && !token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}

import React from "react";
import { Link } from "react-router-dom";
import { Compass, Home, ArrowLeft } from "lucide-react";
import Button from "../components/ui/Button";

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-16">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="relative inline-flex items-center justify-center">
          <div className="w-28 h-28 bg-amber-500/10 rounded-full flex items-center justify-center animate-pulse">
            <Compass className="w-14 h-14 text-amber-500 animate-spin-slow" />
          </div>
          <span className="absolute -top-2 -right-2 bg-gradient-to-r from-amber-500 to-amber-600 text-white font-extrabold text-xs px-2.5 py-1 rounded-full shadow-md">
            404
          </span>
        </div>

        <div className="space-y-2">
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">
            Page Not Found
          </h1>
          <p className="text-sm text-gray-500 max-w-sm mx-auto">
            Sorry, we couldn't find the page you're looking for. It might have been moved or doesn't exist.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Link to="/" className="w-full sm:w-auto">
            <Button
              variant="primary"
              className="w-full sm:w-auto flex items-center justify-center gap-2"
            >
              <Home className="w-4 h-4" />
              <span>Back to Home</span>
            </Button>
          </Link>
          <button
            onClick={() => window.history.back()}
            className="w-full sm:w-auto px-5 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Go Back</span>
          </button>
        </div>
      </div>
    </div>
  );
}

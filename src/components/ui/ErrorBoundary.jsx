import React from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import Button from "./Button";

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    console.error("[ErrorBoundary caught an error]:", error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.reload();
  };

  handleGoHome = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.href = "/";
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-[60vh] flex items-center justify-center p-6 bg-gray-50/50">
          <div className="max-w-lg w-full bg-white rounded-2xl border-2 border-red-100 shadow-xl p-8 text-center space-y-6">
            <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full mx-auto flex items-center justify-center border-2 border-red-200">
              <AlertTriangle className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-gray-900">
                Something went wrong
              </h2>
              <p className="text-sm text-gray-500 leading-relaxed">
                An unexpected error occurred while rendering this component. You can try refreshing the page or returning home.
              </p>
            </div>

            {import.meta.env.DEV && this.state.error && (
              <div className="text-left bg-gray-900 text-red-300 p-4 rounded-xl text-xs font-mono overflow-x-auto max-h-44 border border-gray-800">
                <p className="font-bold text-white mb-1">
                  {this.state.error.toString()}
                </p>
                <pre className="text-[11px] text-gray-400">
                  {this.state.errorInfo?.componentStack || this.state.error.stack}
                </pre>
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <Button
                variant="primary"
                onClick={this.handleReset}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-6"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Try Again</span>
              </Button>
              <Button
                variant="secondary"
                onClick={this.handleGoHome}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-6"
              >
                <Home className="w-4 h-4" />
                <span>Back to Home</span>
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

import React from "react";

// Reusable loading spinner component with different variants
const LoadingSpinner = ({
    size = "md",
    color = "blue",
    text = "",
    fullScreen = false,
    className = ""
}) => {
    // Size variants
    const sizeClasses = {
        xs: "h-3 w-3",
        sm: "h-4 w-4",
        md: "h-6 w-6",
        lg: "h-8 w-8",
        xl: "h-12 w-12"
    };

    // Color variants
    const colorClasses = {
        blue: "border-blue-500",
        green: "border-green-500",
        red: "border-red-500",
        yellow: "border-yellow-500",
        gray: "border-gray-500",
        white: "border-white"
    };

    const spinnerClasses = `animate-spin rounded-full border-b-2 ${sizeClasses[size]} ${colorClasses[color]}`;

    if (fullScreen) {
        return (
            <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50">
                <div className="bg-white rounded-2xl shadow-xl p-8 flex flex-col items-center gap-4">
                    <div className={spinnerClasses}></div>
                    {text && (
                        <p className="text-gray-600 font-medium">{text}</p>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className={`flex items-center justify-center ${className}`}>
            <div className="flex flex-col items-center gap-2">
                <div className={spinnerClasses}></div>
                {text && (
                    <p className="text-sm text-gray-600">{text}</p>
                )}
            </div>
        </div>
    );
};

// Unified loading form component
export const LoadingForm = ({
    text = "Loading...",
    height = "h-20",
    className = "",
    showText = true,
    size = "md"
}) => {
    const sizeClasses = {
        sm: "h-4 w-4",
        md: "h-6 w-6",
        lg: "h-8 w-8"
    };

    return (
        <div className={`bg-gray-50 border border-gray-200 rounded-lg ${height} ${className}`}>
            <div className="flex items-center justify-center h-full">
                <div className="flex flex-col items-center gap-2">
                    <div className={`animate-spin rounded-full border-b-2 border-blue-500 ${sizeClasses[size]}`}></div>
                    {showText && (
                        <p className="text-sm text-gray-600 font-medium">{text}</p>
                    )}
                </div>
            </div>
        </div>
    );
};

// Loading card component for content areas (deprecated - use LoadingForm instead)
export const LoadingCard = ({
    text = "Loading...",
    height = "h-32",
    className = ""
}) => {
    return <LoadingForm text={text} height={height} className={className} size="lg" />;
};

// Loading skeleton for list items
export const LoadingSkeleton = ({ count = 3, className = "" }) => {
    return (
        <div className={`space-y-4 ${className}`}>
            {[...Array(count)].map((_, index) => (
                <div key={index} className="animate-pulse">
                    <div className="bg-gray-200 rounded-lg p-4">
                        <div className="flex items-center space-x-4">
                            <div className="bg-gray-300 rounded-md w-16 h-16"></div>
                            <div className="flex-1 space-y-2">
                                <div className="bg-gray-300 rounded h-4 w-3/4"></div>
                                <div className="bg-gray-300 rounded h-3 w-1/2"></div>
                                <div className="bg-gray-300 rounded h-3 w-1/4"></div>
                            </div>
                            <div className="bg-gray-300 rounded h-6 w-20"></div>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};

// Loading overlay for buttons
export const LoadingButton = ({
    loading = false,
    children,
    className = "",
    disabled = false,
    ...props
}) => {
    return (
        <button
            {...props}
            disabled={loading || disabled}
            className={`relative flex items-center justify-center gap-2 transition ${loading || disabled
                ? 'opacity-50 cursor-not-allowed'
                : ''
                } ${className}`}
        >
            {loading && (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
            )}
            {children}
        </button>
    );
};

// Loading dots animation
export const LoadingDots = ({ className = "" }) => {
    return (
        <div className={`flex items-center gap-1 ${className}`}>
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
        </div>
    );
};

export default LoadingSpinner;

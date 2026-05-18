import React from 'react';

export const getStatusBadge = (status, type = "order") => {
    const base = "inline-flex items-center px-2.5 py-0.5 rounded-sm text-xs font-medium";

    const capitalizeFirst = (str) => {
        if (!str) return '';
        return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
    };

    if (type === "order") {
        const cleanStatus = status?.toString().trim().toLowerCase();
        switch (cleanStatus) {
            case "pending":
                return <span className={`${base} bg-yellow-100 text-yellow-800`}>Pending</span>;
            case "confirmed":
                return <span className={`${base} bg-blue-100 text-blue-800`}>Confirmed</span>;
            case "shipping":
                return <span className={`${base} bg-indigo-100 text-indigo-800`}>Shipping</span>;
            case "delivered":
                return <span className={`${base} bg-green-100 text-green-800`}>Delivered</span>;
            case "cancelled":
                return <span className={`${base} bg-red-100 text-red-800`}>Cancelled</span>;
            default:
                return <span className={`${base} bg-gray-100 text-gray-800`}>{capitalizeFirst(status || 'Unknown')}</span>;
        }
    } else if (type === "pay") {
        switch (status?.toLowerCase()) {
            case "unpaid":
                return <span className={`${base} bg-orange-100 text-orange-800`}>Unpaid</span>;
            case "paid":
                return <span className={`${base} bg-green-100 text-green-800`}>Paid</span>;
            case "refunded":
                return <span className={`${base} bg-purple-100 text-purple-800`}>Refunded</span>;
            default:
                return <span className={`${base} bg-gray-100 text-gray-800`}>{capitalizeFirst(status || 'Unknown')}</span>;
        }
    } else if (type === "refund") {
        switch (status?.toLowerCase()) {
            case "pending_refund":
                return <span className={`${base} bg-yellow-100 text-yellow-800`}>Pending Refund</span>;
            case "refunded":
                return <span className={`${base} bg-green-100 text-green-800`}>Refunded</span>;
            case "not_applicable":
                return <span className={`${base} bg-gray-100 text-gray-800`}>Not Applicable</span>;
            default:
                return <span className={`${base} bg-gray-100 text-gray-800`}>{capitalizeFirst(status || '')}</span>;
        }
    }
    
    return null;
};

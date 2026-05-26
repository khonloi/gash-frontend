import React from 'react';
import { getStatusBadge } from '../utils/orderUtils';

const OrderStatusCard = ({ order }) => {
    return (
        <div className="bg-white border-2 border-gray-300 rounded-xl p-4 sm:p-5 transition-shadow hover:shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-3 text-sm">
                    <span className="text-gray-600 font-medium">Order Status:</span>
                    {getStatusBadge(order.orderStatus, "order")}
                    <span className="text-gray-600 font-medium">Payment:</span>
                    {getStatusBadge(order.payStatus, "pay")}
                    <span className="text-gray-600 font-medium">Method:</span>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-sm text-xs font-medium bg-gray-100 text-gray-800 uppercase">
                        {order.paymentMethod}
                    </span>
                </div>
                <span className="text-sm text-gray-500">
                    Placed on {new Date(order.orderDate || order.createdAt).toLocaleDateString('vi-VN')}
                </span>
            </div>

            {/* Cancel Reason (if cancelled) */}
            {order.orderStatus?.toLowerCase() === "cancelled" && order.cancelReason && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                    <span className="text-gray-600 font-medium">Cancellation Reason:</span>
                    <p className="mt-1 text-gray-700">{order.cancelReason}</p>
                </div>
            )}
        </div>
    );
};

export default OrderStatusCard;

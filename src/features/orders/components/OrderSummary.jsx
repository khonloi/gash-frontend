import React from 'react';

const OrderSummary = ({ order, formatPrice }) => {
    return (
        <div className="bg-white border-2 border-gray-300 rounded-xl p-4 sm:p-5 transition-shadow hover:shadow-sm focus-within:shadow-sm">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h4>
            <div className="space-y-3">
                {order.summary && (
                    <div className="flex justify-between text-sm text-gray-600">
                        <span className="font-medium">Items:</span>
                        <span>{order.summary.totalItems} item(s) - {order.summary.totalQuantity} quantity</span>
                    </div>
                )}
                <div className="flex justify-between text-gray-700">
                    <span>Subtotal:</span>
                    <span className="font-medium">{formatPrice(order.totalPrice)}</span>
                </div>
                {order.discountAmount > 0 && (
                    <div className="flex justify-between text-green-600 font-medium">
                        <span>Discount:</span>
                        <span>-{formatPrice(order.discountAmount)}</span>
                    </div>
                )}
                {order.voucher && (
                    <div className="flex justify-between text-blue-600 font-medium text-sm">
                        <span>Voucher Applied:</span>
                        <span>{order.voucher.code}</span>
                    </div>
                )}
                <hr className="border-gray-200" />
                <div className="flex justify-between items-center text-lg">
                    <span className="font-bold text-gray-900">Total Amount:</span>
                    <span className="font-bold text-xl text-red-600">{formatPrice(order.finalPrice)}</span>
                </div>
            </div>
        </div>
    );
};

export default OrderSummary;

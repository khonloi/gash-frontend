import React from 'react';

const OrderCustomerInfo = ({ order }) => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="bg-white border-2 border-gray-300 rounded-xl p-4 sm:p-5 transition-shadow hover:shadow-sm focus-within:shadow-sm">
                <h4 className="text-lg font-semibold text-gray-900 mb-3">Customer Information</h4>
                <div className="space-y-2 text-sm">
                    <p className="text-gray-700">
                        <span className="font-medium">Name:</span> {order.customer?.name || order.customer?.username}
                    </p>
                    <p className="text-gray-600">
                        <span className="font-medium">Phone:</span> {order.phone}
                    </p>
                    <p className="text-gray-600">
                        <span className="font-medium">Address:</span> {order.addressReceive}
                    </p>
                </div>
            </div>

            <div className="bg-white border-2 border-gray-300 rounded-xl p-4 sm:p-5 mb-4 transition-shadow hover:shadow-sm focus-within:shadow-sm">
                <h4 className="text-sm sm:text-base font-semibold text-gray-900 mb-3">Payment Information</h4>
                <div className="space-y-2 text-sm">
                    <p className="text-gray-700">
                        <span className="font-medium">Method:</span> {order.paymentMethod}
                    </p>
                    {order.voucher && (
                        <p className="text-blue-600 font-medium">
                            <span className="font-medium">Voucher Applied:</span> {order.voucher.code}
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default OrderCustomerInfo;

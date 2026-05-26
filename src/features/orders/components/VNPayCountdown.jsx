import React from 'react';
import Button from '../../../components/ui/Button';

const VNPayCountdown = ({ order, timeLeft, isVNPayExpired }) => {
    if (order?.paymentMethod !== 'VNPAY' || order?.payStatus !== 'unpaid' || order?.orderStatus === 'cancelled') {
        return null;
    }

    return (
        <div className="bg-white border-2 border-gray-300 rounded-xl p-4 sm:p-5 mb-6 transition-shadow hover:shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex flex-col gap-2">
                    <h3 className="text-lg font-semibold text-gray-900">VNPay Payment</h3>
                    {timeLeft !== null && !isVNPayExpired && (
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-600">Time remaining:</span>
                            <span className={`text-lg font-mono font-bold ${timeLeft < 300 ? 'text-red-600' : timeLeft < 600 ? 'text-orange-600' : 'text-green-600'}`}>
                                {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
                            </span>
                        </div>
                    )}
                    {isVNPayExpired && (
                        <div className="text-red-600 font-medium">
                            Payment time expired. Order will be cancelled automatically.
                        </div>
                    )}
                </div>
                {!isVNPayExpired && order?.vnpay_payment_url && (
                    <Button
                        variant="primary"
                        size="md"
                        onClick={() => window.open(order.vnpay_payment_url, '_blank')}
                        className="flex items-center gap-2"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                        Continue VNPay Payment
                    </Button>
                )}
            </div>
        </div>
    );
};

export default VNPayCountdown;


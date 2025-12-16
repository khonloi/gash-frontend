import React from 'react';
import { CheckCircle, Home, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ProductButton from './ProductButton';

export default function OrderSuccessModal({ open, info, onClose }) {
    const navigate = useNavigate();
    if (!open || !info) return null;
    
    return (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-[2px] flex items-center justify-center z-[9999] p-4">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-5 md:p-6 text-center max-w-md w-full">
                <div className="mb-4 flex justify-center">
                    <CheckCircle size={64} className="text-green-600" />
                </div>
                <h2 className="text-green-600 font-bold text-2xl sm:text-3xl mb-2">Order Successfully</h2>
                <p className="text-gray-700 mb-5">Thank you for your order. It will be shipped to you promptly!</p>
                
                <div className="text-left bg-gray-50 rounded-xl p-4 sm:p-5 mb-6 border border-gray-200">
                    <h3 className="text-base font-semibold mb-3 text-gray-900">Transaction Information</h3>
                    <div className="space-y-2 text-sm">
                        <p className="text-gray-700">
                            <strong>Order ID:</strong>{' '}
                            <span className="text-blue-600">{info.orderId || '-'}</span>
                        </p>
                        <p className="text-gray-700">
                            <strong>Total Amount:</strong>{' '}
                            {info.amount ? `${Number(info.amount).toLocaleString('en-US')} VND` : '-'}
                        </p>
                        <p className="text-gray-700">
                            <strong>Payment Method:</strong> {info.paymentMethod}
                        </p>
                    </div>
                </div>
                
                <div className="flex flex-col sm:flex-row justify-center gap-3">
                    <ProductButton
                        variant="primary"
                        size="md"
                        onClick={() => { 
                            onClose(); 
                            navigate('/orders', { state: { forceFetch: true } }); 
                        }}
                        className="flex items-center justify-center gap-2"
                    >
                        <Clock size={20} />
                        View My Orders
                    </ProductButton>
                    <ProductButton
                        variant="secondary"
                        size="md"
                        onClick={() => { 
                            onClose(); 
                            navigate('/'); 
                        }}
                        className="flex items-center justify-center gap-2"
                    >
                        <Home size={20} />
                        Back to Home
                    </ProductButton>
                </div>
            </div>
        </div>
    );
}

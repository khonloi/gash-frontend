import React from 'react';
import { CheckCircle, Home, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function OrderSuccessModal({ open, info, onClose }) {
    const navigate = useNavigate();
    if (!open || !info) return null;
    return (
        <div className="checkout-success-modal" style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.2)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 2px 16px rgba(0,0,0,0.08)', padding: 32, textAlign: 'center', maxWidth: 500 }}>
                <div style={{ marginBottom: 16 }}>
                    <CheckCircle size={64} color="#22c55e" />
                </div>
                <h2 style={{ color: '#22c55e', fontWeight: 700, fontSize: 28, marginBottom: 8 }}>Order Successfully!</h2>
                <p style={{ color: '#334155', marginBottom: 20 }}>Thank you for your order. It will be shipped to you promptly!</p>
                <div style={{ textAlign: 'left', background: '#f8fafc', borderRadius: 8, padding: 16, marginBottom: 24 }}>
                    <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 10, color: '#334155' }}>Transaction Information</h3>
                    <p style={{ fontSize: 14, marginBottom: 6, color: '#334155' }}><strong>Order ID:</strong> <span style={{ color: '#2563eb' }}>{info.orderId || '-'}</span></p>
                    <p style={{ fontSize: 14, marginBottom: 6, color: '#334155' }}><strong>Total Amount:</strong> {info.amount ? `${Number(info.amount).toLocaleString('en-US')} VND` : '-'}</p>
                    <p style={{ fontSize: 14, marginBottom: 0, color: '#334155' }}><strong>Payment Method:</strong> {info.paymentMethod}</p>
                </div>
                <div style={{ display: 'flex', justifyContent: 'center', gap: 12 }}>
                    <button
                        style={{ background: '#22c55e', color: '#fff', border: 'none', borderRadius: 6, padding: '10px 24px', fontWeight: 500, fontSize: 16, cursor: 'pointer' }}
                        onClick={() => { onClose(); navigate('/orders', { state: { forceFetch: true } }); }}
                    >
                        <Clock size={20} /> View My Orders
                    </button>
                    <button
                        style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 24px', borderRadius: 6, border: '1px solid #3b82f6', background: 'transparent', color: '#3b82f6', fontWeight: 500, cursor: 'pointer', fontSize: 16 }}
                        onClick={() => { onClose(); navigate('/'); }}
                    >
                        <Home size={20} /> Back to Home
                    </button>
                </div>
            </div>
        </div>
    );
}

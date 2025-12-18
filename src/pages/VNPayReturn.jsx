import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Api from '../common/SummaryAPI';
import OrderSuccessModal from '../components/OrderSuccessModal';

export default function VNPayReturn() {
  const [status, setStatus] = useState('pending');
  const [successInfo, setSuccessInfo] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPaymentResult = async () => {
      const params = window.location.search;
      try {
        const response = await Api.order.vnpayReturn(params);
        const data = response.data;
        if (data.success && data.data && data.data.code === '00') {
          setStatus('success');
          setSuccessInfo({
            status: 'success',
            message: data.message || 'Your order will be promptly prepared and sent to you.!',
            orderId: data.data?.orderId || data.orderId || '',
            amount: data.data?.amount || data.amount || '',
            paymentMethod: data.data?.paymentMethod || 'VNPay',
          });
        } else {
          setStatus('failed');
          setSuccessInfo({
            status: 'failed',
            message: data.message || 'Payment failed. Please try again.',
            orderId: data.data?.orderId || data.orderId || '',
            amount: data.data?.amount || data.amount || '',
            paymentMethod: 'VNPay',
          });
        }
      } catch (err) {
        setStatus('failed');
        setSuccessInfo({
          status: 'failed',
          message: 'Payment verification failed. Please check your order status.',
          orderId: '',
          amount: '',
          paymentMethod: 'VNPay',
        });
      }
    };
    fetchPaymentResult();
  }, []);

  const isSuccess = status === 'success';
  const handleCloseModal = () => {
    setSuccessInfo(null);
    setStatus('pending');
    // Redirect to orders page after closing modal
    navigate('/orders', { state: { forceFetch: true } });
  };

  return (
    <OrderSuccessModal open={!!successInfo} info={{ ...successInfo, message: undefined }} onClose={handleCloseModal} />
  );
}

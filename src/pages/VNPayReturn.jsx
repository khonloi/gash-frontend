import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosClient from '../common/axiosClient';
import OrderSuccessModal from '../components/OrderSuccessModal';

export default function VNPayReturn() {
  const [status, setStatus] = useState('pending');
  const [successInfo, setSuccessInfo] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPaymentResult = async () => {
      const params = window.location.search;
      try {
        const response = await axiosClient.get(`/orders/vnpay-return${params}`);
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
          setSuccessInfo(null);
        }
      } catch (err) {
        setStatus('failed');
        setSuccessInfo(null);
      }
    };
    fetchPaymentResult();
  }, []);

  const isSuccess = status === 'success';
  const handleCloseModal = () => {
    setSuccessInfo(null);
    setStatus('pending');
  };

  return (
    <OrderSuccessModal open={!!successInfo} info={{ ...successInfo, message: undefined }} onClose={handleCloseModal} />
  );
}

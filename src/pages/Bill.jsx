import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams } from 'react-router-dom';
import Api from '../common/SummaryAPI';
import LoadingSpinner, { LoadingButton } from '../components/LoadingSpinner';
import { useToast } from '../hooks/useToast';
import gashLogo from '../assets/image/gash-logo.svg';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

const Bill = () => {
    const { orderId } = useParams();
    const { showToast } = useToast();

    const [billData, setBillData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isExporting, setIsExporting] = useState(false);
    // const [selectedImage, setSelectedImage] = useState(null); // Unused for now
    const billRef = useRef(null);

    const fetchBillData = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            const token = localStorage.getItem('token');
            const response = await Api.bills.export(orderId, token);
            const orderData = response.data.data;

            // Check if order is paid before allowing bill access
            if (orderData?.order?.paymentStatus?.toLowerCase() !== 'paid') {
                setError('Bill is only available for paid orders');
                showToast('Bill is only available for paid orders', 'error');
                return;
            }

            setBillData(orderData);
            showToast('Bill exported successfully!', 'success');
        } catch (err) {
            setError(err.response?.data?.message || 'Unable to load invoice');
            showToast('Unable to load invoice', 'error');
        } finally {
            setLoading(false);
        }
    }, [orderId, showToast]);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (orderId && token) {
            fetchBillData();
        }
    }, [orderId, fetchBillData]);

    const formatPrice = (price) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(price);
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('vi-VN');
    };

    const handleExportPDF = async () => {
        if (!billData) {
            showToast('Unable to export PDF', 'error');
            return;
        }

        setIsExporting(true);
        try {
            // Create a simplified PDF version of the bill
            const pdfContent = document.createElement('div');
            pdfContent.style.cssText = `
                width: 800px;
                background: white;
                font-family: Arial, sans-serif;
                color: #000;
                padding: 20px;
                box-sizing: border-box;
            `;

            // Create the PDF content HTML
            pdfContent.innerHTML = `
                <div style="background: linear-gradient(to right, #7B542F, #B6771D); padding: 32px; border-bottom: 4px solid #FF9D00; color: white;">
                    <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                        <div style="display: flex; align-items: center;">
                            <div style="width: 200px; height: 64px; background: rgba(255,255,255,0.2); border-radius: 8px; display: flex; align-items: center; justify-content: center; margin-right: 16px; padding: 8px;">
                                <img src="${gashLogo}" alt="GASH Logo" style="height: 48px; width: auto;" />
                            </div>
                            <div>
                                <p style="color: rgba(255,255,255,0.9); font-size: 14px; margin: 0;">Modern fashion for everyone</p>
                            </div>
                        </div>
                        <div style="text-align: right;">
                            <h2 style="font-size: 30px; font-weight: bold; color: white; margin: 0 0 8px 0;">INVOICE</h2>
                            <p style="color: rgba(255,255,255,0.9); margin: 0;">Date: ${formatDate(billData.order?.orderDate || new Date())}</p>
                            <p style="color: rgba(255,255,255,0.9); font-size: 14px; margin: 0;">Order ID: #${billData.order?.orderId || 'N/A'}</p>
                        </div>
                    </div>
                </div>

                <div style="padding: 32px; border-bottom: 1px solid #e5e7eb;">
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 32px;">
                        <div style="background: #FFCF71; padding: 24px; border-radius: 8px; border-left: 4px solid #B6771D;">
                            <h3 style="font-size: 18px; font-weight: bold; color: #7B542F; margin: 0 0 16px 0;">BILL TO:</h3>
                            <div style="color: #374151;">
                                <p style="color: #4b5563; margin: 0 0 4px 0;">Email: ${billData.customer?.email || 'N/A'}</p>
                                <p style="color: #4b5563; margin: 0 0 4px 0;">Phone: ${billData.customer?.phone || 'N/A'}</p>
                                <p style="color: #4b5563; margin: 0;">Address: ${billData.customer?.address || 'N/A'}</p>
                            </div>
                        </div>
                        <div style="background: #FFCF71; padding: 24px; border-radius: 8px; border-left: 4px solid #B6771D;">
                            <h3 style="font-size: 18px; font-weight: bold; color: #7B542F; margin: 0 0 16px 0;">PAY TO:</h3>
                            <div style="color: #374151;">
                                <p style="font-weight: 600; color: #111827; margin: 0 0 4px 0;">GASH Company</p>
                                <p style="color: #4b5563; margin: 0 0 4px 0;">support@gash.com</p>
                                <p style="color: #4b5563; margin: 0 0 4px 0;">123 ABC Street, District 1</p>
                                <p style="color: #4b5563; margin: 0;">Ho Chi Minh City, Vietnam</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div style="padding: 24px;">
                    <h3 style="font-size: 18px; font-weight: bold; color: #1f2937; margin: 0 0 16px 0;">ORDER ITEMS</h3>
                    <table style="width: 100%; border-collapse: collapse; border: 1px solid #d1d5db;">
                        <thead>
                            <tr style="background-color: #f9fafb;">
                                <th style="border: 1px solid #d1d5db; padding: 12px; text-align: left; font-weight: 600; color: #374151;">Product</th>
                                <th style="border: 1px solid #d1d5db; padding: 12px; text-align: center; font-weight: 600; color: #374151;">Color</th>
                                <th style="border: 1px solid #d1d5db; padding: 12px; text-align: center; font-weight: 600; color: #374151;">Size</th>
                                <th style="border: 1px solid #d1d5db; padding: 12px; text-align: center; font-weight: 600; color: #374151;">Quantity</th>
                                <th style="border: 1px solid #d1d5db; padding: 12px; text-align: right; font-weight: 600; color: #374151;">Unit Price</th>
                                <th style="border: 1px solid #d1d5db; padding: 12px; text-align: right; font-weight: 600; color: #374151;">Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${billData.items?.map(item => `
                                <tr>
                                    <td style="border: 1px solid #d1d5db; padding: 12px;">
                                        <p style="font-weight: 600; color: #1f2937; margin: 0;">${item.productName || 'Product'}</p>
                                    </td>
                                    <td style="border: 1px solid #d1d5db; padding: 12px; text-align: center; color: #6b7280;">
                                        ${item.color || 'N/A'}
                                    </td>
                                    <td style="border: 1px solid #d1d5db; padding: 12px; text-align: center; color: #6b7280;">
                                        ${item.size || 'N/A'}
                                    </td>
                                    <td style="border: 1px solid #d1d5db; padding: 12px; text-align: center; font-weight: 500;">
                                        ${item.quantity || 0}
                                    </td>
                                    <td style="border: 1px solid #d1d5db; padding: 12px; text-align: right; color: #6b7280;">
                                        ${formatPrice(item.unitPrice || 0)}
                                    </td>
                                    <td style="border: 1px solid #d1d5db; padding: 12px; text-align: right; font-weight: 600; color: #1f2937;">
                                        ${formatPrice(item.totalPrice || 0)}
                                    </td>
                                </tr>
                            `).join('') || '<tr><td colspan="6" style="border: 1px solid #d1d5db; padding: 12px; text-align: center; color: #6b7280;">No items available</td></tr>'}
                        </tbody>
                    </table>
                </div>

                <div style="padding: 32px; background: #FFCF71; border-top: 1px solid #e5e7eb;">
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 32px;">
                        <div style="background: white; padding: 24px; border-radius: 8px; border: 1px solid #e5e7eb;">
                            <h3 style="font-size: 18px; font-weight: bold; color: #7B542F; margin: 0 0 16px 0;">PAYMENT INFORMATION</h3>
                            <div style="color: #374151;">
                                <p style="margin: 0 0 8px 0;"><span style="font-weight: 600;">Method:</span> ${billData.order?.paymentMethod || 'N/A'}</p>
                                <p style="margin: 0 0 8px 0;"><span style="font-weight: 600;">Payment Status:</span>
                                    <span style="margin-left: 8px; padding: 4px 12px; border-radius: 9999px; font-size: 14px; font-weight: 500; 
                                        ${billData.order?.paymentStatus === 'paid' ? 'background: #dcfce7; color: #065f46;' :
                    billData.order?.paymentStatus === 'unpaid' ? 'background: #fef3c7; color: #92400e;' :
                        billData.order?.paymentStatus === 'refunded' ? 'background: #fee2e2; color: #991b1b;' :
                            'background: #f3f4f6; color: #1f2937;'}">
                                        ${billData.order?.paymentStatus === 'paid' ? 'Paid' :
                    billData.order?.paymentStatus === 'unpaid' ? 'Unpaid' :
                        billData.order?.paymentStatus === 'refunded' ? 'Refunded' :
                            billData.order?.paymentStatus || 'N/A'}
                                    </span>
                                </p>
                                ${billData.discount?.voucher ? `
                                    <p style="margin: 0;"><span style="font-weight: 600;">Voucher:</span> ${billData.discount.voucher.code} (${billData.discount.voucher.discountValue}% off)</p>
                                ` : ''}
                            </div>
                        </div>
                        <div style="background: white; padding: 16px; border-radius: 8px; border: 1px solid #e5e7eb;">
                            <h3 style="font-size: 18px; font-weight: bold; color: #7B542F; margin: 0 0 12px 0;">PRICE SUMMARY</h3>
                            <div>
                                <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                                    <span>Subtotal:</span>
                                    <span>${formatPrice(billData.summary?.subtotal || 0)}</span>
                                </div>
                                ${billData.summary?.discount > 0 ? `
                                    <div style="display: flex; justify-content: space-between; color: #B6771D; margin-bottom: 8px;">
                                        <span>Discount:</span>
                                        <span>-${formatPrice(billData.summary.discount)}</span>
                                    </div>
                                ` : ''}
                                <hr style="border: none; border-top: 1px solid #d1d5db; margin: 8px 0;" />
                                <div style="display: flex; justify-content: space-between; font-weight: bold; font-size: 18px;">
                                    <span>Total:</span>
                                    <span style="color: #B6771D;">${formatPrice(billData.summary?.totalAmount || 0)}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div style="padding: 24px; background: #FFCF71; border-top: 1px solid #e5e7eb;">
                    <div style="text-align: center; color: #4b5563;">
                        <p style="margin: 0 0 8px 0;">Thank you for your purchase!</p>
                        <p style="font-size: 14px; margin: 0;">For support, contact: support@gash.com</p>
                    </div>
                </div>
            `;

            // Temporarily add to DOM for html2canvas
            document.body.appendChild(pdfContent);

            // Create canvas from the simplified content
            const canvas = await html2canvas(pdfContent, {
                scale: 2,
                useCORS: true,
                allowTaint: true,
                backgroundColor: '#ffffff',
                width: 800,
                height: pdfContent.scrollHeight,
                logging: false
            });

            // Remove from DOM
            document.body.removeChild(pdfContent);

            // Create PDF
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');

            // Calculate dimensions
            const imgWidth = 210; // A4 width in mm
            const pageHeight = 295; // A4 height in mm
            const imgHeight = (canvas.height * imgWidth) / canvas.width;
            let heightLeft = imgHeight;

            let position = 0;

            // Add first page
            pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
            heightLeft -= pageHeight;

            // Add additional pages if needed
            while (heightLeft >= 0) {
                position = heightLeft - imgHeight;
                pdf.addPage();
                pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
                heightLeft -= pageHeight;
            }

            // Save the PDF
            const fileName = `bill-${billData?.order?.orderId || orderId}-${new Date().toISOString().split('T')[0]}.pdf`;
            pdf.save(fileName);

            showToast('PDF exported successfully!', 'success');
        } catch (error) {
            console.error('PDF export error:', error);
            showToast('Failed to export PDF', 'error');
        } finally {
            setIsExporting(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                <LoadingSpinner />
            </div>
        );
    }

    if (error || !billData) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                <div className="text-center">
                    <div className="text-red-500 text-6xl mb-4">⚠️</div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">Unable to load invoice</h2>
                    <p className="text-gray-600 mb-4">{error}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen py-8 bg-white">
            <div className="max-w-5xl mx-auto px-4">
                {/* Header Actions */}
                <div className="mb-6 flex justify-between items-center no-print">
                    <div className="flex gap-3">
                        <LoadingButton
                            onClick={handleExportPDF}
                            loading={isExporting}
                            className="text-white px-6 py-2 rounded-lg transition-colors flex items-center"
                            style={{ backgroundColor: '#FF9D00' }}
                            onMouseEnter={(e) => e.target.style.backgroundColor = '#B6771D'}
                            onMouseLeave={(e) => e.target.style.backgroundColor = '#FF9D00'}
                        >
                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            {isExporting ? 'Exporting...' : 'Export PDF'}
                        </LoadingButton>
                    </div>
                </div>

                {/* Invoice Container */}
                <div ref={billRef} className="bg-white shadow-2xl rounded-xl overflow-hidden print:shadow-none print:rounded-none border-4" style={{ borderColor: '#B6771D' }}>
                    {/* Invoice Header */}
                    <div className="p-8 text-white" style={{ background: 'linear-gradient(to right, #7B542F, #B6771D)', borderBottom: '4px solid #FF9D00' }}>
                        <div className="flex justify-between items-start">
                            {/* Company Info */}
                            <div className="flex items-center">
                                <div>
                                    <div className="w-50 h-16 rounded-lg flex items-center justify-center mr-4 p-2" style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}>
                                        <img src={gashLogo} alt="GASH Logo" className="h-12 w-auto" />
                                    </div>
                                    <p className="text-sm" style={{ color: 'rgba(255,255,255,0.9)' }}>Modern fashion for everyone</p>
                                </div>
                            </div>

                            {/* Invoice Title */}
                            <div className="text-right">
                                <h2 className="text-3xl font-bold text-white mb-2">INVOICE</h2>
                                <p style={{ color: 'rgba(255,255,255,0.9)' }}>
                                    Date: {formatDate(billData.order?.orderDate || new Date())}
                                </p>
                                <p className="text-sm" style={{ color: 'rgba(255,255,255,0.9)' }}>
                                    Order ID: #{billData.order?.orderId || 'N/A'}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Customer & Company Info */}
                    <div className="p-8 border-b border-gray-200">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {/* Bill To */}
                            <div className="p-6 rounded-lg" style={{ backgroundColor: '#FFCF71', borderLeft: '4px solid #B6771D' }}>
                                <h3 className="text-lg font-bold mb-4" style={{ color: '#7B542F' }}>BILL TO:</h3>
                                <div className="text-gray-700 space-y-1">
                                    <p className="text-gray-600">Email: {billData.customer?.email || 'N/A'}</p>
                                    <p className="text-gray-600">Phone: {billData.customer?.phone || 'N/A'}</p>
                                    <p className="text-gray-600">Address: {billData.customer?.address || 'N/A'}</p>
                                </div>
                            </div>

                            {/* Pay To */}
                            <div className="p-6 rounded-lg" style={{ backgroundColor: '#FFCF71', borderLeft: '4px solid #B6771D' }}>
                                <h3 className="text-lg font-bold mb-4" style={{ color: '#7B542F' }}>PAY TO:</h3>
                                <div className="text-gray-700 space-y-1">
                                    <p className="font-semibold text-gray-900">GASH Company</p>
                                    <p className="text-gray-600">support@gash.com</p>
                                    <p className="text-gray-600">123 ABC Street, District 1</p>
                                    <p className="text-gray-600">Ho Chi Minh City, Vietnam</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Items Table */}
                    <div className="p-6">
                        <h3 className="text-lg font-bold text-gray-800 mb-4">ORDER ITEMS</h3>
                        <div className="overflow-x-auto">
                            <table className="w-full border-collapse border border-gray-300">
                                <thead>
                                    <tr className="bg-gray-50">
                                        <th className="border border-gray-300 px-4 py-3 text-left font-semibold text-gray-700">Product</th>
                                        <th className="border border-gray-300 px-4 py-3 text-center font-semibold text-gray-700">Color</th>
                                        <th className="border border-gray-300 px-4 py-3 text-center font-semibold text-gray-700">Size</th>
                                        <th className="border border-gray-300 px-4 py-3 text-center font-semibold text-gray-700">Quantity</th>
                                        <th className="border border-gray-300 px-4 py-3 text-right font-semibold text-gray-700">Unit Price</th>
                                        <th className="border border-gray-300 px-4 py-3 text-right font-semibold text-gray-700">Total</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {billData.items?.map((item, index) => (
                                        <tr key={index} className="hover:bg-gray-50">
                                            <td className="border border-gray-300 px-4 py-3">
                                                <p className="font-semibold text-gray-800">{item.productName || 'Product'}</p>
                                            </td>
                                            <td className="border border-gray-300 px-4 py-3 text-center text-gray-600">
                                                {item.color || 'N/A'}
                                            </td>
                                            <td className="border border-gray-300 px-4 py-3 text-center text-gray-600">
                                                {item.size || 'N/A'}
                                            </td>
                                            <td className="border border-gray-300 px-4 py-3 text-center font-medium">
                                                {item.quantity || 0}
                                            </td>
                                            <td className="border border-gray-300 px-4 py-3 text-right text-gray-600">
                                                {formatPrice(item.unitPrice || 0)}
                                            </td>
                                            <td className="border border-gray-300 px-4 py-3 text-right font-semibold text-gray-800">
                                                {formatPrice(item.totalPrice || 0)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Payment Info */}
                    <div className="p-8 border-t border-gray-200" style={{ backgroundColor: '#FFCF71' }}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="bg-white p-6 rounded-lg border border-gray-200">
                                <h3 className="text-lg font-bold mb-4" style={{ color: '#7B542F' }}>PAYMENT INFORMATION</h3>
                                <div className="text-gray-700 space-y-2">
                                    <p><span className="font-semibold">Method:</span> {billData.order?.paymentMethod || 'N/A'}</p>
                                    <p><span className="font-semibold">Payment Status:</span>
                                        <span className={`ml-2 px-3 py-1 rounded-full text-sm font-medium ${billData.order?.paymentStatus === 'paid' ? 'bg-green-100 text-green-800' :
                                            billData.order?.paymentStatus === 'unpaid' ? 'bg-yellow-100 text-yellow-800' :
                                                billData.order?.paymentStatus === 'refunded' ? 'bg-red-100 text-red-800' :
                                                    'bg-gray-100 text-gray-800'
                                            }`}>
                                            {billData.order?.paymentStatus === 'paid' ? 'Paid' :
                                                billData.order?.paymentStatus === 'unpaid' ? 'Unpaid' :
                                                    billData.order?.paymentStatus === 'refunded' ? 'Refunded' :
                                                        billData.order?.paymentStatus || 'N/A'}
                                        </span>
                                    </p>
                                    {billData.discount?.voucher && (
                                        <p><span className="font-semibold">Voucher:</span> {billData.discount.voucher.code} ({billData.discount.voucher.discountValue}% off)</p>
                                    )}
                                </div>
                            </div>

                            <div className="bg-white p-4 rounded-lg border border-gray-200">
                                <h3 className="text-lg font-bold mb-3" style={{ color: '#7B542F' }}>PRICE SUMMARY</h3>
                                <div className="space-y-2">
                                    <div className="flex justify-between">
                                        <span>Subtotal:</span>
                                        <span>{formatPrice(billData.summary?.subtotal || 0)}</span>
                                    </div>
                                    {billData.summary?.discount > 0 && (
                                        <div className="flex justify-between" style={{ color: '#B6771D' }}>
                                            <span>Discount:</span>
                                            <span>-{formatPrice(billData.summary.discount)}</span>
                                        </div>
                                    )}
                                    <hr className="border-gray-300" />
                                    <div className="flex justify-between font-bold text-lg">
                                        <span>Total:</span>
                                        <span style={{ color: '#B6771D' }}>{formatPrice(billData.summary?.totalAmount || 0)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="p-6 border-t border-gray-200" style={{ backgroundColor: '#FFCF71' }}>
                        <div className="text-center text-gray-600">
                            <p className="mb-2">Thank you for your purchase!</p>
                            <p className="text-sm">For support, contact: support@gash.com</p>
                        </div>
                    </div>
                </div>
            </div>

        </div>
    );
};

export default Bill;
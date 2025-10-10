import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams } from 'react-router-dom';
import Api from '../common/SummaryAPI';
import LoadingSpinner from '../components/LoadingSpinner';
import { useToast } from '../components/Toast';
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
    const billRef = useRef(null);

    const fetchBillData = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            const token = localStorage.getItem('token');
            const response = await Api.bills.export(orderId, token);
            setBillData(response.data.data);
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
                                <p style="font-weight: 600; color: #111827; margin: 0 0 4px 0;">Name: ${billData.customer?.name || 'N/A'}</p>
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
                    <div>
                        ${billData.items?.map(item => `
                            <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px; border: 1px solid #e5e7eb; border-radius: 8px; margin-bottom: 12px;">
                                <div>
                                    <p style="font-weight: 600; color: #1f2937; margin: 0;">${item.productName || 'Product'}</p>
                                    <p style="font-size: 14px; color: #4b5563; margin: 0;">${item.color || 'N/A'} | ${item.size || 'N/A'}</p>
                                </div>
                                <div style="text-align: right;">
                                    <p style="font-size: 14px; color: #6b7280; margin: 0;">Qty: ${item.quantity || 0} × ${formatPrice(item.unitPrice || 0)}</p>
                                    <p style="font-weight: 600; margin: 0;">${formatPrice(item.totalPrice || 0)}</p>
                                </div>
                            </div>
                        `).join('') || '<p>No items available</p>'}
                    </div>
                </div>

                <div style="padding: 32px; background: #FFCF71; border-top: 1px solid #e5e7eb;">
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 32px;">
                        <div style="background: white; padding: 24px; border-radius: 8px; border: 1px solid #e5e7eb;">
                            <h3 style="font-size: 18px; font-weight: bold; color: #7B542F; margin: 0 0 16px 0;">PAYMENT INFORMATION</h3>
                            <div style="color: #374151;">
                                <p style="margin: 0 0 8px 0;"><span style="font-weight: 600;">Method:</span> ${billData.order?.paymentMethod || 'N/A'}</p>
                                <p style="margin: 0 0 8px 0;"><span style="font-weight: 600;">Status:</span>
                                    <span style="margin-left: 8px; padding: 4px 12px; border-radius: 9999px; font-size: 14px; font-weight: 500; 
                                        ${billData.order?.orderStatus === 'delivered' ? 'background: #dcfce7; color: #065f46;' :
                    billData.order?.orderStatus === 'pending' ? 'background: #fef3c7; color: #92400e;' :
                        billData.order?.orderStatus === 'cancelled' ? 'background: #fee2e2; color: #991b1b;' :
                            'background: #f3f4f6; color: #1f2937;'}">
                                        ${billData.order?.orderStatus === 'delivered' ? 'Delivered' :
                    billData.order?.orderStatus === 'pending' ? 'Processing' :
                        billData.order?.orderStatus === 'cancelled' ? 'Cancelled' :
                            billData.order?.orderStatus || 'N/A'}
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
                                ${billData.discount?.appliedDiscount > 0 ? `
                                    <div style="display: flex; justify-content: space-between; color: #B6771D; margin-bottom: 8px;">
                                        <span>Discount:</span>
                                        <span>-${formatPrice(billData.discount.appliedDiscount)}</span>
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
        } catch (err) {
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
                        <button
                            onClick={handleExportPDF}
                            disabled={isExporting}
                            className="text-white px-6 py-2 rounded-lg transition-colors flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                            style={{ backgroundColor: '#FF9D00' }}
                            onMouseEnter={(e) => e.target.style.backgroundColor = '#B6771D'}
                            onMouseLeave={(e) => e.target.style.backgroundColor = '#FF9D00'}
                        >
                            {isExporting ? (
                                <>
                                    <svg className="animate-spin w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Exporting...
                                </>
                            ) : (
                                <>
                                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                    Export PDF
                                </>
                            )}
                        </button>
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
                                    <p className="font-semibold text-gray-900">Name: {billData.customer?.name || 'N/A'}</p>
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

                    {/* Items List */}
                    <div className="p-6">
                        <h3 className="text-lg font-bold text-gray-800 mb-4">ORDER ITEMS</h3>
                        <div className="space-y-3">
                            {billData.items?.map((item, index) => (
                                <div key={index} className="flex justify-between items-center p-3 border rounded-lg">
                                    <div>
                                        <p className="font-semibold text-gray-800">{item.productName || 'Product'}</p>
                                        <p className="text-sm text-gray-600">{item.color || 'N/A'} | {item.size || 'N/A'}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm text-gray-500">Qty: {item.quantity || 0} × {formatPrice(item.unitPrice || 0)}</p>
                                        <p className="font-semibold">{formatPrice(item.totalPrice || 0)}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Payment Info */}
                    <div className="p-8 border-t border-gray-200" style={{ backgroundColor: '#FFCF71' }}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="bg-white p-6 rounded-lg border border-gray-200">
                                <h3 className="text-lg font-bold mb-4" style={{ color: '#7B542F' }}>PAYMENT INFORMATION</h3>
                                <div className="text-gray-700 space-y-2">
                                    <p><span className="font-semibold">Method:</span> {billData.order?.paymentMethod || 'N/A'}</p>
                                    <p><span className="font-semibold">Status:</span>
                                        <span className={`ml-2 px-3 py-1 rounded-full text-sm font-medium ${billData.order?.orderStatus === 'delivered' ? 'bg-green-100 text-green-800' :
                                            billData.order?.orderStatus === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                                billData.order?.orderStatus === 'cancelled' ? 'bg-red-100 text-red-800' :
                                                    'bg-gray-100 text-gray-800'
                                            }`}>
                                            {billData.order?.orderStatus === 'delivered' ? 'Delivered' :
                                                billData.order?.orderStatus === 'pending' ? 'Processing' :
                                                    billData.order?.orderStatus === 'cancelled' ? 'Cancelled' :
                                                        billData.order?.orderStatus || 'N/A'}
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
                                    {billData.discount?.appliedDiscount > 0 && (
                                        <div className="flex justify-between" style={{ color: '#B6771D' }}>
                                            <span>Discount:</span>
                                            <span>-{formatPrice(billData.discount.appliedDiscount)}</span>
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
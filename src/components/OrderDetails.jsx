import React, { useEffect, useState, useContext } from "react";
import axiosClient from "../common/axiosClient";
import { AuthContext } from "../context/AuthContext";
import { useToast } from "../components/Toast";
import FeedbackForm from "./FeedbackForm";

const OrderDetailsModal = ({ orderId, onClose }) => {
    const { user } = useContext(AuthContext);
    const { showToast } = useToast();

    const [order, setOrder] = useState(null);
    const [details, setDetails] = useState([]);
    const [loading, setLoading] = useState(true);

    // 🧭 Fetch order + details
    const fetchOrderDetails = async () => {
        try {
            const token = localStorage.getItem("token");
            const [orderRes, detailsRes] = await Promise.all([
                axiosClient.get(`/orders/${orderId}`, {
                    headers: { Authorization: `Bearer ${token}` },
                }),
                axiosClient.get(`/order-details?order_id=${orderId}`, {
                    headers: { Authorization: `Bearer ${token}` },
                }),
            ]);
            setOrder(orderRes.data);
            setDetails(detailsRes.data || []);
        } catch (err) {
            showToast(err.message || "Failed to load order details", "error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (orderId) fetchOrderDetails();
    }, [orderId]);

    const formatPrice = (p) =>
        p?.toLocaleString("vi-VN", { style: "currency", currency: "VND" });

    // 🗑 Cancel order
    const handleCancelOrder = async () => {
        if (!window.confirm("Are you sure you want to cancel this order?")) return;
        try {
            const token = localStorage.getItem("token");
            await axiosClient.patch(
                `/orders/${orderId}/cancel`,
                {},
                { headers: { Authorization: `Bearer ${token}` } }
            );
            showToast("Order canceled successfully", "success");
            fetchOrderDetails();
        } catch (err) {
            showToast("Failed to cancel order", "error");
        }
    };

    // 📝 Send feedback
    const handleFeedback = async (variantId, comment, rating) => {
        try {
            const token = localStorage.getItem("token");
            await axiosClient.post(
                `/feedbacks`,
                {
                    acc_id: user._id,
                    variant_id: variantId,
                    comment,
                    rating,
                },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            showToast("Feedback submitted successfully!", "success");
        } catch (err) {
            showToast("Failed to submit feedback", "error");
        }
    };

    const getStatusBadge = (status, type = "order") => {
        const base =
            "px-3 py-1 rounded-full text-xs font-semibold border inline-block";
        if (type === "order") {
            switch (status?.toLowerCase()) {
                case "pending":
                    return (
                        <span className={`${base} bg-yellow-100 text-yellow-700 border-yellow-300`}>
                            Pending
                        </span>
                    );
                case "shipping":
                    return (
                        <span className={`${base} bg-blue-100 text-blue-700 border-blue-300`}>
                            Shipping
                        </span>
                    );
                case "completed":
                    return (
                        <span className={`${base} bg-green-100 text-green-700 border-green-300`}>
                            Completed
                        </span>
                    );
                case "cancelled":
                    return (
                        <span className={`${base} bg-red-100 text-red-700 border-red-300`}>
                            Cancelled
                        </span>
                    );
                default:
                    return (
                        <span className={`${base} bg-gray-100 text-gray-600 border-gray-300`}>
                            Unknown
                        </span>
                    );
            }
        } else {
            switch (status?.toLowerCase()) {
                case "unpaid":
                    return (
                        <span className={`${base} bg-orange-100 text-orange-700 border-orange-300`}>
                            Unpaid
                        </span>
                    );
                case "paid":
                    return (
                        <span className={`${base} bg-green-100 text-green-700 border-green-300`}>
                            Paid
                        </span>
                    );
                case "refunded":
                    return (
                        <span className={`${base} bg-purple-100 text-purple-700 border-purple-300`}>
                            Refunded
                        </span>
                    );
                default:
                    return (
                        <span className={`${base} bg-gray-100 text-gray-600 border-gray-300`}>
                            Unknown
                        </span>
                    );
            }
        }
    };

    return (
        <div
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={onClose}
        >
            <div
                className="bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[85vh] overflow-y-auto relative animate-fadeIn border-t-4 border-yellow-400"
                onClick={(e) => e.stopPropagation()}
            >
                <button
                    onClick={onClose}
                    className="absolute top-3 right-3 text-gray-500 hover:text-yellow-600 text-2xl font-bold"
                >
                    ×
                </button>

                {loading ? (
                    <div className="text-center mt-10 text-gray-600">
                        Loading order details...
                    </div>
                ) : !order ? (
                    <div className="text-center text-red-500">Order not found</div>
                ) : (
                    <div className="p-6">
                        <h2 className="text-2xl font-bold text-yellow-600 mb-4">
                            Order #{order._id}
                        </h2>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-gray-700 mb-6">
                            <p>
                                <strong>Order Status:</strong> {getStatusBadge(order.order_status, "order")}
                            </p>
                            <p>
                                <strong>Payment Status:</strong> {getStatusBadge(order.pay_status, "pay")}
                            </p>
                            <p>
                                <strong>Receiver:</strong> {order.addressReceive}
                            </p>
                            <p>
                                <strong>Phone:</strong> {order.phone}
                            </p>
                            <p>
                                <strong>Payment:</strong> {order.payment_method}
                            </p>
                            <p>
                                <strong>Total:</strong>{" "}
                                <span className="text-yellow-700 font-semibold">
                                    {formatPrice(order.finalPrice)}
                                </span>
                            </p>
                        </div>

                        <h3 className="text-xl font-semibold text-yellow-700 mb-3">
                            Products
                        </h3>

                        <div className="space-y-4">
                            {details.map((d) => (
                                <div
                                    key={d._id}
                                    className="flex items-center justify-between border rounded-lg p-3 hover:shadow-md transition"
                                >
                                    <div className="flex items-center space-x-4">
                                        <img
                                            src={
                                                d.variant_id?.pro_id?.fullImageURL ||
                                                d.variant_id?.pro_id?.imageURL ||
                                                "/placeholder.png"
                                            }
                                            alt={d.variant_id?.pro_id?.pro_name}
                                            className="w-20 h-20 object-cover rounded-md border"
                                        />
                                        <div>
                                            <p className="font-medium text-gray-900">
                                                {d.variant_id?.pro_id?.pro_name}
                                            </p>
                                            <p className="text-gray-500 text-sm">
                                                Color: {d.variant_id?.color_id?.color_name} | Size:{" "}
                                                {d.variant_id?.size_id?.size_name}
                                            </p>
                                            <p className="text-gray-500 text-sm">
                                                Quantity: {d.Quantity}
                                            </p>
                                            <p className="text-yellow-700 font-semibold">
                                                Price: {formatPrice(d.UnitPrice)}
                                            </p>
                                            <FeedbackForm
                                                variantId={d.variant_id?._id}
                                                onSubmit={handleFeedback}
                                            />
                                        </div>
                                    </div>
                                    <p className="font-semibold text-yellow-600 text-right w-32">
                                        {formatPrice(d.UnitPrice * d.Quantity)}
                                    </p>
                                </div>
                            ))}
                        </div>

                        {order.order_status?.toLowerCase() === "pending" && (
                            <button
                                className="mt-6 bg-yellow-500 hover:bg-yellow-600 text-white px-5 py-2.5 rounded-lg transition font-medium"
                                onClick={handleCancelOrder}
                            >
                                Cancel Order
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default OrderDetailsModal;

import React, { useEffect, useState } from "react";
import Api from "../common/SummaryAPI";


export default function MyVoucherList() {
  const [vouchers, setVouchers] = useState([]);

  useEffect(() => {
    fetchVouchers();
  }, []);

  const fetchVouchers = async () => {
    try {
      const res = await Api.voucher.getAll();
      const valid = res.data.filter(
        (v) =>
          v.status === "active" &&
          new Date(v.endDate) >= new Date() &&
          v.usedCount < v.usageLimit
      );
      setVouchers(valid);
    } catch (err) {
      console.error("Error fetching vouchers:", err);
    }
  };

  if (!vouchers.length)
    return <p className="text-gray-500">Hiện chưa có voucher khả dụng.</p>;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {vouchers.map((v) => (
        <div
          key={v.id}
          className="border border-gray-300 bg-white p-4 rounded-xl shadow hover:shadow-lg transition"
        >
          <div className="flex justify-between items-center">
            <h3 className="text-blue-700 font-semibold text-lg">{v.code}</h3>
            <span className="text-sm text-gray-600">
              {v.discountType === "percentage"
                ? `${v.discountValue}%`
                : `-${v.discountValue.toLocaleString()}₫`}
            </span>
          </div>
          <p className="text-sm text-gray-600 mt-1">
            Đơn tối thiểu: {v.minOrderValue?.toLocaleString()}₫
          </p>
          {v.maxDiscount && (
            <p className="text-sm text-gray-600">
              Giảm tối đa: {v.maxDiscount?.toLocaleString()}₫
            </p>
          )}
          <p className="text-xs text-gray-500 mt-2">
            HSD: {new Date(v.endDate).toLocaleDateString()}
          </p>
        </div>
      ))}
    </div>
  );
}

import React, { useState } from "react";
import Api from "../common/SummaryAPI";
import ProductButton from "./ProductButton";


export default function ApplyVoucherForm() {
  const [code, setCode] = useState("");
  const [message, setMessage] = useState("");

  const handleApply = async () => {
    try {
      const voucher = await Api.voucher.validateCode(code);
      setMessage(
        `Áp dụng thành công: Giảm ${
          voucher.discountType === "percentage"
            ? voucher.discountValue + "%"
            : voucher.discountValue.toLocaleString() + "₫"
        }`
      );
    } catch (err) {
      setMessage(err.message);
    }
  };

  return (
    <div className="bg-white shadow-sm border border-gray-200 rounded-xl p-5 mt-8">
      <h3 className="text-lg font-semibold mb-3">Nhập mã giảm giá</h3>
      <div className="flex gap-2">
        <input
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="Nhập mã voucher..."
          className="flex-grow border p-2 rounded-lg"
        />
        <ProductButton
          variant="primary"
          size="md"
          onClick={handleApply}
        >
          Áp dụng
        </ProductButton>
      </div>
      {message && (
        <p
          className={`mt-3 text-sm font-medium ${
            message.includes("thành công") ? "text-green-600" : "text-red-500"
          }`}
        >
          {message}
        </p>
      )}
    </div>
  );
}

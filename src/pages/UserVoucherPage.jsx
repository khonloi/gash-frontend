import React from "react";
import MyVoucherList from "../components/MyVoucherList";
import ApplyVoucherForm from "../components/ApplyVoucherForm";

export default function UserVoucherPage() {
  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Ví Voucher của tôi</h1>
      <MyVoucherList />
      <ApplyVoucherForm />
    </div>
  );
}

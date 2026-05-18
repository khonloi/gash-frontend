import React from "react";
import { motion } from "framer-motion";
import { useChangePassword } from "../hooks/useChangePassword";
import { Eye, EyeOff } from "lucide-react";
import ProductButton from "../../../components/ui/ProductButton";

const ChangePasswordModal = ({ handleCancel }) => {
    const {
        form,
        loading,
        validationErrors,
        showPassword,
        handleFieldChange,
        togglePasswordVisibility,
        handleSubmit
    } = useChangePassword(handleCancel);

    return (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[110] p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="bg-white rounded-xl shadow-2xl border-2 border-gray-300 w-full max-w-md overflow-hidden flex flex-col"
            >
                {/* Modal Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b-2 border-gray-300 bg-gray-50">
                    <h2 className="text-xl font-semibold text-gray-900">Change Password</h2>
                    <button
                        type="button"
                        onClick={handleCancel}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-white rounded-full transition-all border border-transparent hover:border-gray-200"
                        aria-label="Close modal"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Modal Content */}
                <div className="p-6 lg:p-8 overflow-y-auto">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {[
                            { label: "Current Password", key: "oldPassword" },
                            { label: "New Password", key: "newPassword" },
                            { label: "Confirm New Password", key: "repeatPassword" },
                        ].map((field) => (
                            <div key={field.key} className="relative">
                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">
                                    {field.label} <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <input
                                        type={showPassword[field.key] ? "text" : "password"}
                                        value={form[field.key]}
                                        onChange={(e) => handleFieldChange(field.key, e.target.value)}
                                        className={`w-full pl-4 pr-11 py-3 bg-gray-50 border-2 rounded-xl transition-all outline-none ${validationErrors[field.key] ? 'border-red-500 bg-red-50/30' : 'border-gray-300 focus:border-amber-400 focus:bg-white'}`}
                                        placeholder={`Enter ${field.label.toLowerCase()}`}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => togglePasswordVisibility(field.key)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                                    >
                                        {showPassword[field.key] ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                    </button>
                                </div>
                                {validationErrors[field.key] && (
                                    <p className="mt-1.5 text-xs font-bold text-red-500 uppercase tracking-wider">{validationErrors[field.key]}</p>
                                )}
                            </div>
                        ))}
                    </form>
                </div>

                {/* Modal Footer */}
                <div className="px-6 py-4 bg-gray-50 border-t-2 border-gray-300 flex items-center justify-end gap-3">
                    <ProductButton
                        variant="secondary"
                        onClick={handleCancel}
                        disabled={loading}
                        className="px-6 py-2.5"
                    >
                        Cancel
                    </ProductButton>
                    <ProductButton
                        variant="primary"
                        onClick={handleSubmit}
                        disabled={loading}
                        className="px-8 py-2.5 min-w-[120px] justify-center"
                    >
                        {loading ? <div className="flex items-center gap-2">
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            <span>Updating...</span>
                        </div> : 'Update Password'}
                    </ProductButton>
                </div>
            </motion.div>
        </div>
    );
};

export default ChangePasswordModal;
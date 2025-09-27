import React, { useRef } from "react";

const EditProfileModal = ({
  formData,
  setFormData,
  previewUrl,
  handleFileChange,
  handleSubmit,
  handleCancel,
}) => {
  const fileInputRef = useRef(null);

  return (
    // Modal hiển thị trong container cha có className="relative"
    <div className="absolute top-20 left-1/2 transform -translate-x-1/2 z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 border border-gray-200">
        {/* Title */}
        <h2 className="text-xl font-bold text-gray-800 mb-6 text-center">
          Edit Profile
        </h2>

        {/* Avatar Preview */}
        <div className="flex flex-col items-center mb-6">
          <img
            src={previewUrl || formData.image}
            alt="Preview"
            className="w-20 h-20 rounded-full object-cover border-2 border-gray-300"
          />
          <button
            type="button"
            className="mt-3 px-4 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded-full"
            onClick={() => fileInputRef.current.click()}
          >
            Change Avatar
          </button>
          <input
            type="file"
            accept="image/*"
            className="hidden"
            ref={fileInputRef}
            onChange={handleFileChange}
          />
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3">
          {[
            { label: "Username", type: "text", key: "username" },
            { label: "Name", type: "text", key: "name" },
            { label: "Email", type: "email", key: "email" },
            { label: "Phone", type: "text", key: "phone" },
            { label: "Address", type: "text", key: "address" },
            { label: "Password", type: "password", key: "password" },
            { label: "Repeat Password", type: "password", key: "repeatPassword" },
          ].map((field) => (
            <div key={field.key}>
              <label className="block text-sm font-semibold text-gray-700">
                {field.label}
              </label>
              <input
                type={field.type}
                value={formData[field.key]}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, [field.key]: e.target.value }))
                }
                className="w-full border border-gray-300 rounded-lg p-2 mt-1 text-sm"
              />
            </div>
          ))}

          {/* Buttons */}
          <div className="flex justify-end gap-3 mt-6">
            <button
              type="button"
              onClick={handleCancel}
              className="px-4 py-2 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-full bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-semibold text-sm"
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditProfileModal;

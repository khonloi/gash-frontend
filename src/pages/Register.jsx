import React from 'react';
import { Link } from 'react-router-dom';
import ProductButton from '../components/ui/ProductButton';
import { useRegister } from '../features/auth/hooks/useRegister';

const Register = () => {
  const {
    formData,
    isLoading,
    invalidFile,
    previewUrl,
    usernameRef,
    handleChange,
    handleFileChange,
    handleSubmit
  } = useRegister();

  return (
    <div className="page-container flex-col items-center justify-center min-h-[calc(100vh-6rem)]">
      <section className="bg-white rounded-xl p-4 sm:p-5 md:p-6 w-full max-w-5xl shadow-sm border border-gray-200">
        <h1 className="text-xl sm:text-2xl md:text-2xl font-semibold mb-4 sm:mb-5 md:mb-6 text-center text-gray-900">
          Complete Your Registration
        </h1>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
            {/* Left Column */}
            <div className="flex flex-col space-y-4 sm:space-y-5">
              {/* Username */}
              <fieldset className="flex flex-col">
                <label htmlFor="username" className="text-sm sm:text-base font-semibold mb-2 text-gray-900">
                  Username <span className="text-red-600">*</span>
                </label>
                <input
                  id="username"
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  ref={usernameRef}
                  required
                  maxLength={30}
                  className="p-3 border-2 border-gray-300 rounded-md bg-white text-sm transition-colors hover:bg-gray-50 hover:border-blue-600 focus:outline-none disabled:bg-gray-200 disabled:border-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed"
                  aria-required={true}
                />
              </fieldset>

              {/* Email */}
              <fieldset className="flex flex-col">
                <label htmlFor="email" className="text-sm sm:text-base font-semibold mb-2 text-gray-900">
                  Email <span className="text-red-600">*</span>
                </label>
                <input
                  id="email"
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  readOnly
                  className="p-3 border-2 border-gray-300 rounded-md bg-gray-100 text-sm transition-colors hover:bg-gray-50 hover:border-blue-600 focus:outline-none disabled:bg-gray-200 disabled:border-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed"
                  aria-required={true}
                />
              </fieldset>

              {/* Address */}
              <fieldset className="flex flex-col">
                <label htmlFor="address" className="text-sm sm:text-base font-semibold mb-2 text-gray-900">
                  Address <span className="text-red-600">*</span>
                </label>
                <input
                  id="address"
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  required
                  maxLength={200}
                  className="p-3 border-2 border-gray-300 rounded-md bg-white text-sm transition-colors hover:bg-gray-50 hover:border-blue-600 focus:outline-none disabled:bg-gray-200 disabled:border-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed"
                  aria-required={true}
                />
              </fieldset>

              {/* Gender */}
              <fieldset className="flex flex-col">
                <label htmlFor="gender" className="text-sm sm:text-base font-semibold mb-2 text-gray-900">
                  Gender
                </label>
                <select
                  id="gender"
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  className="p-3 border-2 border-gray-300 rounded-md bg-white text-sm transition-colors hover:bg-gray-50 hover:border-blue-600 focus:outline-none disabled:bg-gray-200 disabled:border-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed"
                  aria-required={false}
                >
                  <option value="">Select Gender</option>
                  {['Male', 'Female', 'Other'].map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </fieldset>

              {/* Password */}
              <fieldset className="flex flex-col">
                <label htmlFor="password" className="text-sm sm:text-base font-semibold mb-2 text-gray-900">
                  Password <span className="text-red-600">*</span>
                </label>
                <input
                  id="password"
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  className="p-3 border-2 border-gray-300 rounded-md bg-white text-sm transition-colors hover:bg-gray-50 hover:border-blue-600 focus:outline-none disabled:bg-gray-200 disabled:border-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed"
                  aria-required={true}
                />
              </fieldset>
            </div>

            {/* Right Column */}
            <div className="flex flex-col space-y-4 sm:space-y-5">
              {/* Full Name */}
              <fieldset className="flex flex-col">
                <label htmlFor="name" className="text-sm sm:text-base font-semibold mb-2 text-gray-900">
                  Full Name <span className="text-red-600">*</span>
                </label>
                <input
                  id="name"
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  maxLength={50}
                  className="p-3 border-2 border-gray-300 rounded-md bg-white text-sm transition-colors hover:bg-gray-50 hover:border-blue-600 focus:outline-none disabled:bg-gray-200 disabled:border-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed"
                  aria-required={true}
                />
              </fieldset>

              {/* Phone */}
              <fieldset className="flex flex-col">
                <label htmlFor="phone" className="text-sm sm:text-base font-semibold mb-2 text-gray-900">
                  Phone <span className="text-red-600">*</span>
                </label>
                <input
                  id="phone"
                  type="text"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                  maxLength={10}
                  className="p-3 border-2 border-gray-300 rounded-md bg-white text-sm transition-colors hover:bg-gray-50 hover:border-blue-600 focus:outline-none disabled:bg-gray-200 disabled:border-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed"
                  aria-required={true}
                />
              </fieldset>

              {/* Date of Birth */}
              <fieldset className="flex flex-col">
                <label htmlFor="dob" className="text-sm sm:text-base font-semibold mb-2 text-gray-900">
                  Date of Birth
                </label>
                <input
                  id="dob"
                  type="date"
                  name="dob"
                  value={formData.dob}
                  onChange={handleChange}
                  className="p-3 border-2 border-gray-300 rounded-md bg-white text-sm transition-colors hover:bg-gray-50 hover:border-blue-600 focus:outline-none disabled:bg-gray-200 disabled:border-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed"
                  aria-required={false}
                />
              </fieldset>

              {/* Profile Image */}
              <fieldset className="flex flex-col">
                <label htmlFor="signup-image-upload" className="text-sm sm:text-base font-semibold mb-2 text-gray-900">
                  Profile Image (Optional)
                </label>
                <div className="flex flex-col gap-2">
                  <input
                    id="signup-image-upload"
                    type="file"
                    accept="image/png,image/jpeg,image/jpg"
                    onChange={handleFileChange}
                    className="p-3 border-2 border-gray-300 rounded-md bg-white text-sm transition-colors hover:bg-gray-50 hover:border-blue-600 focus:outline-none disabled:bg-gray-200 disabled:border-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed"
                    aria-required={false}
                    aria-invalid={invalidFile}
                  />
                  {previewUrl && (
                    <div className="mt-2">
                      <img src={previewUrl} alt="Preview" className="max-w-[120px] max-h-[120px] rounded-lg object-cover border-2 border-gray-300" />
                    </div>
                  )}
                </div>
              </fieldset>

              {/* Repeat Password */}
              <fieldset className="flex flex-col">
                <label htmlFor="repeatPassword" className="text-sm sm:text-base font-semibold mb-2 text-gray-900">
                  Repeat Password <span className="text-red-600">*</span>
                </label>
                <input
                  id="repeatPassword"
                  type="password"
                  name="repeatPassword"
                  value={formData.repeatPassword}
                  onChange={handleChange}
                  required
                  className="p-3 border-2 border-gray-300 rounded-md bg-white text-sm transition-colors hover:bg-gray-50 hover:border-blue-600 focus:outline-none disabled:bg-gray-200 disabled:border-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed"
                  aria-required={true}
                />
              </fieldset>
            </div>
          </div>

          <div className="mt-6 sm:mt-8">
            <ProductButton
              type="submit"
              variant="primary"
              size="lg"
              disabled={isLoading}
              aria-busy={isLoading}
              className="w-full"
            >
              {isLoading ? 'Creating Account...' : 'Create your GASH account'}
            </ProductButton>
          </div>
        </form>

        <p className="text-center text-sm text-gray-600 mt-4 sm:mt-5">
          Already have an account?{' '}
          <Link
            to="/login"
            className="text-blue-600 hover:text-blue-800 hover:underline font-medium transition-colors focus:outline-none rounded"
          >
            Sign In
          </Link>
        </p>
      </section>
    </div>
  );
};

export default Register;
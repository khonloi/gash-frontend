import React from 'react';
import { Link } from 'react-router-dom';
import Button from '../components/ui/Button';
import Form from '../components/ui/Form';
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

  const columns = [
    {
      className: "flex flex-col space-y-4 sm:space-y-5",
      fields: [
        {
          name: 'username',
          label: 'Username',
          type: 'text',
          required: true,
          value: formData.username,
          onChange: handleChange,
          inputProps: {
            ref: usernameRef,
            maxLength: 30
          }
        },
        {
          name: 'email',
          label: 'Email',
          type: 'email',
          required: true,
          value: formData.email,
          onChange: handleChange,
          inputProps: {
            readOnly: true,
            className: 'bg-gray-100'
          }
        },
        {
          name: 'address',
          label: 'Address',
          type: 'text',
          required: true,
          value: formData.address,
          onChange: handleChange,
          inputProps: {
            maxLength: 200
          }
        },
        {
          name: 'gender',
          label: 'Gender',
          type: 'select',
          value: formData.gender,
          onChange: handleChange,
          placeholder: 'Select Gender',
          options: ['Male', 'Female', 'Other']
        },
        {
          name: 'password',
          label: 'Password',
          type: 'password',
          required: true,
          value: formData.password,
          onChange: handleChange
        }
      ]
    },
    {
      className: "flex flex-col space-y-4 sm:space-y-5",
      fields: [
        {
          name: 'name',
          label: 'Full Name',
          type: 'text',
          required: true,
          value: formData.name,
          onChange: handleChange,
          inputProps: {
            maxLength: 50
          }
        },
        {
          name: 'phone',
          label: 'Phone',
          type: 'text',
          required: true,
          value: formData.phone,
          onChange: handleChange,
          inputProps: {
            maxLength: 10
          }
        },
        {
          name: 'dob',
          label: 'Date of Birth',
          type: 'date',
          value: formData.dob,
          onChange: handleChange
        },
        {
          name: 'image',
          render: () => (
            <div key="image-upload" className="w-full relative">
              <label htmlFor="signup-image-upload" className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">
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
            </div>
          )
        },
        {
          name: 'repeatPassword',
          label: 'Repeat Password',
          type: 'password',
          required: true,
          value: formData.repeatPassword,
          onChange: handleChange
        }
      ]
    }
  ];

  return (
    <div className="page-container flex-col items-center justify-center min-h-[calc(100vh-6rem)]">
      <section className="bg-white rounded-xl p-4 sm:p-5 md:p-6 w-full max-w-5xl shadow-sm border border-gray-200">
        <h1 className="text-xl sm:text-2xl md:text-2xl font-semibold mb-4 sm:mb-5 md:mb-6 text-center text-gray-900">
          Complete Your Registration
        </h1>

        <Form
          onSubmit={handleSubmit}
          columns={columns}
          submitText={isLoading ? 'Creating Account...' : 'Create your GASH account'}
          isLoading={isLoading}
        />

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

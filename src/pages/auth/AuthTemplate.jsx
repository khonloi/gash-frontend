import React from 'react';

const AuthTemplate = ({ title, children, maxWidth = 'max-w-sm', customLayout = false }) => {
  return (
    <div className="page-container flex flex-col items-center justify-center w-full">
      <section className={`bg-white rounded-xl w-full ${maxWidth} shadow-sm border border-gray-200 overflow-hidden ${!customLayout ? 'p-4 sm:p-5 md:p-6' : ''}`}>
        {!customLayout && title && (
          <h1 className="text-xl sm:text-2xl md:text-3xl font-semibold mb-4 sm:mb-5 md:mb-6 text-center text-gray-900">
            {title}
          </h1>
        )}
        {children}
      </section>
    </div>
  );
};

export default AuthTemplate;

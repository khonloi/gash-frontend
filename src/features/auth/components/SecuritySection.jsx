import React from "react";
import { Key } from "lucide-react";

export default function SecuritySection({
  requireAuthForCheckout,
  handleToggleCheckoutAuth,
  isDemoMode,
  showDemoNotice,
  passkeys = [],
  handleDeletePasskey,
  handleSetupPasskey,
}) {
  return (
    <div className="bg-white rounded-xl border-2 border-gray-300 shadow-sm overflow-hidden">
      <div className="px-6 py-4 bg-gray-50 border-b-2 border-gray-300">
        <h3 className="text-base sm:text-lg font-semibold text-gray-900">Authentication & Security</h3>
      </div>
      <div className="p-6 space-y-8">
        {/* Checkout Auth Toggle */}
        <div className="flex items-start justify-between p-4 bg-gray-50 rounded-xl border-2 border-gray-300">
          <div className="mr-4">
            <h4 className="text-sm sm:text-base font-bold text-gray-900 mb-1">Require Authentication for Checkout</h4>
            <p className="text-xs sm:text-sm text-gray-500 leading-relaxed">
              For extra security, you'll be asked to authenticate via password, Google, or Passkey before placing any order.
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-1">
            <input
              type="checkbox"
              checked={requireAuthForCheckout}
              onChange={(e) => isDemoMode ? showDemoNotice() : handleToggleCheckoutAuth(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-12 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
          </label>
        </div>

        {/* Passkeys */}
        <div className="space-y-4">
          <h4 className="text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-wider">Passkeys</h4>
          {passkeys.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {passkeys.map((pk) => (
                <div key={pk.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border-2 border-gray-300">
                  <div className="flex items-center">
                    <div className="w-10 h-10 rounded-lg bg-white border border-gray-200 shadow-sm flex items-center justify-center mr-3">
                      <Key className="w-5 h-5 text-amber-600" />
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm font-bold text-gray-900 capitalize">{pk.deviceType || 'Device'}</p>
                      <p className="text-[10px] text-gray-400 uppercase font-bold mt-0.5">
                        Added {new Date(pk.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeletePasskey(pk.id)}
                    className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                    title="Remove passkey"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
              <p className="text-gray-500 text-sm">No passkeys linked to this account yet.</p>
              <button
                onClick={handleSetupPasskey}
                className="mt-3 text-amber-600 text-sm font-bold hover:underline"
              >
                Setup Passkey Now
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

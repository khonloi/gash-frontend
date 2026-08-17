import { useState, useEffect, useCallback, useRef } from "react";

/**
 * Custom hook for handling asynchronous data operations with loading, error, retry, and abort lifecycle.
 *
 * @param {Function} asyncFunction - Async function returning a promise
 * @param {Array} [dependencies=[]] - Dependencies that trigger re-execution when changed
 * @param {Object} [options={}] - Configuration options
 * @param {boolean} [options.immediate=true] - Whether to execute immediately on mount / dependency change
 * @param {*} [options.initialData=null] - Initial data value
 * @param {Function} [options.onSuccess] - Callback when execution succeeds
 * @param {Function} [options.onError] - Callback when execution fails
 * @param {Function} [options.transform] - Transformation function applied to the result data
 * @param {number} [options.retryCount=0] - Number of automatic retries on failure
 * @param {number} [options.retryDelay=1000] - Delay in milliseconds between retries
 * @returns {{
 *   data: *,
 *   loading: boolean,
 *   error: Error|string|null,
 *   execute: Function,
 *   retry: Function,
 *   setData: Function,
 *   setError: Function,
 *   reset: Function
 * }}
 */
export function useAsyncData(asyncFunction, dependencies = [], options = {}) {
  const {
    immediate = true,
    initialData = null,
    onSuccess,
    onError,
    transform,
    retryCount = 0,
    retryDelay = 1000,
  } = options;

  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(immediate);
  const [error, setError] = useState(null);

  const mountedRef = useRef(true);
  const lastCallIdRef = useRef(0);
  const asyncFunctionRef = useRef(asyncFunction);
  const onSuccessRef = useRef(onSuccess);
  const onErrorRef = useRef(onError);
  const transformRef = useRef(transform);

  // Keep refs synchronized with latest props/callbacks
  useEffect(() => {
    asyncFunctionRef.current = asyncFunction;
    onSuccessRef.current = onSuccess;
    onErrorRef.current = onError;
    transformRef.current = transform;
  });

  const execute = useCallback(
    async (...args) => {
      const callId = ++lastCallIdRef.current;
      setLoading(true);
      setError(null);

      let attemptsLeft = retryCount;

      const runAttempt = async () => {
        try {
          const result = await asyncFunctionRef.current(...args);

          if (mountedRef.current && callId === lastCallIdRef.current) {
            const transformedData = transformRef.current
              ? transformRef.current(result)
              : result;
            setData(transformedData);
            setLoading(false);
            onSuccessRef.current?.(transformedData);
            return transformedData;
          }
        } catch (err) {
          if (attemptsLeft > 0) {
            attemptsLeft -= 1;
            await new Promise((resolve) => setTimeout(resolve, retryDelay));
            return runAttempt();
          }

          if (mountedRef.current && callId === lastCallIdRef.current) {
            const errorMessage =
              err?.response?.data?.message || err?.message || "An error occurred";
            setError(errorMessage);
            setLoading(false);
            onErrorRef.current?.(err);
            throw err;
          }
        }
      };

      return runAttempt();
    },
    [retryCount, retryDelay]
  );

  const retry = useCallback(() => {
    return execute();
  }, [execute]);

  const reset = useCallback(() => {
    setData(initialData);
    setLoading(false);
    setError(null);
  }, [initialData]);

  // Handle immediate execution and dependency changes
  useEffect(() => {
    mountedRef.current = true;
    if (immediate) {
      execute().catch(() => {
        // Handled internally in state
      });
    }

    return () => {
      mountedRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, dependencies);

  return {
    data,
    loading,
    error,
    execute,
    retry,
    setData,
    setError,
    reset,
  };
}

export default useAsyncData;

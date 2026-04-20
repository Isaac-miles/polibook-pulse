import axios, { AxiosError, AxiosInstance, AxiosResponse, InternalAxiosRequestConfig } from "axios";
import axiosRetry from "axios-retry";

const API_BASE = import.meta.env.VITE_API_URL ?? "";

// Create axios instance
export const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE,
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Configure retry logic
axiosRetry(apiClient, {
  retries: 3,
  retryDelay: (retryCount: number) => {
    // Exponential backoff: 1s, 2s, 4s
    return retryCount * 1000 * Math.pow(2, retryCount - 1);
  },
  retryCondition: (error: AxiosError) => {
    // Retry on network errors or specific status codes
    return (
      axiosRetry.isNetworkOrIdempotentRequestError(error) ||
      (error.response?.status !== undefined &&
        [408, 429, 500, 502, 503, 504].includes(error.response.status))
    );
  },
});

// Request interceptor
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Add any auth headers here if needed
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  },
);

// Response interceptor
apiClient.interceptors.response.use(
  (response: AxiosResponse<unknown>) => response,
  (error: AxiosError) => {
    // Centralized error handling
    const message =
      error.response?.data instanceof Object
        ? (error.response.data as { error?: string }).error || "An error occurred"
        : error.message || "An unexpected error occurred";

    const apiError = new Error(message);
    Object.assign(apiError, {
      status: error.response?.status,
      originalError: error,
    });

    return Promise.reject(apiError);
  },
);

export default apiClient;

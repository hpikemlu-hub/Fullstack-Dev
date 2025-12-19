import axios from 'axios'
import toast from 'react-hot-toast'
import { getToken, setToken, removeToken, isTokenExpired } from '../utils/tokenUtils'

// Determine the API base URL based on environment
const getApiBaseUrl = () => {
  // Check if we're in development mode
  if (import.meta.env.DEV) {
    return import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
  }
  
  // In production, use the same origin or fallback to production URL
  if (import.meta.env.PROD) {
    // If VITE_API_URL is set in production, use it
    if (import.meta.env.VITE_API_URL) {
      return import.meta.env.VITE_API_URL
    }
    
    // Otherwise, use relative path for same-origin requests
    return '/api'
  }
  
  // Fallback to environment variable or localhost
  return import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
}

const API_BASE_URL = getApiBaseUrl()

console.log('API Base URL:', API_BASE_URL)

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Flag to prevent multiple refresh attempts
let isRefreshing = false
let failedQueue = []

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error)
    } else {
      prom.resolve(token)
    }
  })
  
  failedQueue = []
}

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = getToken()
    if (token) {
      // Check if token is expired before sending
      if (isTokenExpired(token)) {
        console.log('Token expired in request interceptor, removing token')
        removeToken()
        // Don't add the header for expired token
        return config
      }
      config.headers.Authorization = `Bearer ${token}`
    }
    
    // Log request for debugging
    console.log('API Request:', config.method?.toUpperCase(), config.url, config.data)
    return config
  },
  (error) => {
    console.error('API Request Error:', error)
    return Promise.reject(error)
  }
)

// Response interceptor to handle errors and token refresh
api.interceptors.response.use(
  (response) => {
    // Log response for debugging
    console.log('API Response:', response.config.method?.toUpperCase(), response.config.url, response.status, response.data)
    return response
  },
  async (error) => {
    const originalRequest = error.config
    
    console.error('API Response Error:', error)
    
    if (error.response) {
      const { status, data } = error.response
      
      switch (status) {
        case 401:
          // If it's not a refresh token request and we haven't tried refreshing yet
          if (!originalRequest._retry && !originalRequest.url.includes('/auth/refresh')) {
            if (isRefreshing) {
              // If already refreshing, add this request to the queue
              return new Promise((resolve, reject) => {
                failedQueue.push({ resolve, reject })
              }).then(token => {
                originalRequest.headers.Authorization = `Bearer ${token}`
                return api(originalRequest)
              }).catch(err => {
                return Promise.reject(err)
              })
            }

            originalRequest._retry = true
            isRefreshing = true
            
            try {
              // Try to refresh the token
              const refreshResponse = await api.post('/auth/refresh')
              
              let newToken = null
              if (refreshResponse.data?.data?.token) {
                newToken = refreshResponse.data.data.token
              } else if (refreshResponse.data?.token) {
                newToken = refreshResponse.data.token
              }
              
              if (newToken) {
                // Store the new token using utility function
                setToken(newToken)
                
                // Process the queue with the new token
                processQueue(null, newToken)
                
                // Update the authorization header and retry the original request
                originalRequest.headers.Authorization = `Bearer ${newToken}`
                return api(originalRequest)
              } else {
                throw new Error('No token in refresh response')
              }
            } catch (refreshError) {
              console.error('Token refresh failed:', refreshError)
              
              // Process the queue with the error
              processQueue(refreshError, null)
              
              // Clear tokens and redirect to login
              removeToken()
              
              // Only redirect if we're not already on the login page
              if (!window.location.pathname.includes('/login')) {
                window.location.href = '/login'
              }
              
              toast.error('Session expired. Please login again.')
              return Promise.reject(refreshError)
            } finally {
              isRefreshing = false
            }
          } else {
            // If it's a refresh token request or we already tried refreshing
            // Clear tokens and redirect
            removeToken()
            
            // Only redirect if we're not already on the login page
            if (!window.location.pathname.includes('/login')) {
              window.location.href = '/login'
            }
            
            toast.error('Session expired. Please login again.')
          }
          break
        case 403:
          toast.error('You do not have permission to perform this action.')
          break
        case 404:
          toast.error('Resource not found.')
          break
        case 422:
          // Validation errors
          if (data.errors && Array.isArray(data.errors)) {
            data.errors.forEach(err => toast.error(err))
          } else {
            toast.error(data.message || 'Validation failed.')
          }
          break
        case 500:
          toast.error('Server error. Please try again later.')
          break
        default:
          toast.error(data.message || 'An error occurred.')
      }
    } else if (error.request) {
      console.error('Network error details:', error.request);
      console.error('Network error config:', error.config);
      toast.error('Network error. Please check your connection.')
    } else {
      console.error('Unexpected error:', error.message);
      toast.error('An unexpected error occurred.')
    }
    
    return Promise.reject(error)
  }
)

export default api
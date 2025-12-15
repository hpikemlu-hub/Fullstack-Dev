import axios from 'axios'
import toast from 'react-hot-toast'

const API_BASE_URL = 'http://localhost:3000/api'

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Log all requests for debugging
api.interceptors.request.use(
  (config) => {
    console.log('API Request:', config.method?.toUpperCase(), config.url, config.data)
    return config
  },
  (error) => {
    console.error('API Request Error:', error)
    return Promise.reject(error)
  }
)

// Log all responses for debugging
api.interceptors.response.use(
  (response) => {
    console.log('API Response:', response.config.method?.toUpperCase(), response.config.url, response.status, response.data)
    return response
  },
  (error) => {
    console.error('API Response Error:', error)
    return Promise.reject(error)
  }
)

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => {
    return response
  },
  (error) => {
    if (error.response) {
      const { status, data } = error.response
      
      switch (status) {
        case 401:
          // Unauthorized - clear token and redirect to login
          localStorage.removeItem('token')
          window.location.href = '/login'
          toast.error('Session expired. Please login again.')
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
import api from './api'
import { getToken, setToken, removeToken, isTokenExpired } from '../utils/tokenUtils'

export const authService = {
  async login(credentials) {
    try {
      console.log('authService.login called with:', credentials)
      console.log('API Base URL:', api.defaults.baseURL)
      const response = await api.post('/auth/login', credentials)
      console.log('authService.login response status:', response.status)
      console.log('authService.login response headers:', response.headers)
      console.log('authService.login response.data:', response.data)
      console.log('authService.login full response:', response)
      
      // Backend returns: { success: true, message: "...", data: { user: {...}, token: "..." } }
      // We need to return the data object which contains user and token
      if (response.data.success) {
        const authData = response.data.data;
        console.log('Extracted authData from response.data.data:', authData)
        
        // Ensure we have both user and token
        if (!authData.user || !authData.token) {
          console.error('Missing user or token in response:', authData)
          console.error('Response structure:', JSON.stringify(response.data, null, 2))
          throw new Error('Invalid response format from server - missing user or token');
        }
        
        console.log('Storing token:', authData.token.substring(0, 20) + '...')
        // Store token immediately after successful login
        setToken(authData.token)
        
        return authData; // Return the data object with user and token
      } else {
        console.error('Login failed with response:', response.data)
        throw new Error(response.data.message || 'Login failed');
      }
    } catch (error) {
      console.error('authService.login error:', error)
      console.error('Error response:', error.response)
      console.error('Error request:', error.request)
      throw error
    }
  },

  async logout() {
    try {
      const response = await api.post('/auth/logout')
      console.log('authService.logout response:', response)
      
      // Clear token regardless of response success
      removeToken()
      
      return response.data
    } catch (error) {
      console.error('authService.logout error:', error)
      // Still clear token even if request fails
      removeToken()
      throw error
    }
  },

  async getCurrentUser() {
    try {
      const token = getToken()
      
      // Check if token exists and is not expired
      if (!token) {
        throw new Error('No token found')
      }
      
      if (isTokenExpired(token)) {
        console.log('Token expired in getCurrentUser, removing token')
        removeToken()
        throw new Error('Token expired')
      }
      
      const response = await api.get('/auth/user')
      console.log('authService.getCurrentUser response:', response)
      
      // Handle different response formats
      let userData = null
      if (response.data?.data) {
        userData = response.data.data
      } else if (response.data) {
        userData = response.data
      } else {
        userData = response
      }
      
      return { data: userData }
    } catch (error) {
      console.error('authService.getCurrentUser error:', error)
      
      // If it's an authentication error, clear the token
      if (error.response?.status === 401) {
        removeToken()
      }
      
      throw error
    }
  },

  async refreshToken() {
    try {
      const token = getToken()
      
      // Check if token exists
      if (!token) {
        throw new Error('No token found')
      }
      
      console.log('authService.refreshToken called')
      const response = await api.post('/auth/refresh')
      console.log('authService.refreshToken response:', response)
      
      // Handle different response formats
      let authData = null
      if (response.data?.data) {
        authData = response.data.data
      } else if (response.data) {
        authData = response.data
      } else {
        authData = response
      }
      
      // Ensure we have both user and token
      if (!authData.user || !authData.token) {
        console.error('Missing user or token in refresh response:', authData)
        throw new Error('Invalid refresh response format from server');
      }
      
      // Store the new token
      setToken(authData.token)
      
      return { data: authData }
    } catch (error) {
      console.error('authService.refreshToken error:', error)
      
      // If refresh fails, clear the token
      removeToken()
      
      throw error
    }
  }
}
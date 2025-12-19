import api from './api'
import { getToken, setToken, removeToken, isTokenExpired } from '../utils/tokenUtils'

export const authService = {
  async login(credentials) {
    try {
      console.log('authService.login called with:', credentials)
      const response = await api.post('/auth/login', credentials)
      console.log('authService.login response:', response)
      console.log('authService.login response.data:', response.data)
      
      // Backend returns: { success: true, message: "...", data: { user: {...}, token: "..." } }
      // We need to return the data object which contains user and token
      if (response.data.success) {
        const authData = response.data.data;
        
        // Ensure we have both user and token
        if (!authData.user || !authData.token) {
          console.error('Missing user or token in response:', authData)
          throw new Error('Invalid response format from server - missing user or token');
        }
        
        // Store token immediately after successful login
        setToken(authData.token)
        
        return authData; // Return the data object with user and token
      } else {
        throw new Error(response.data.message || 'Login failed');
      }
    } catch (error) {
      console.error('authService.login error:', error)
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
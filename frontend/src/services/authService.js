import api from './api'

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
        return response.data.data; // Return the nested data object
      } else {
        throw new Error(response.data.message || 'Login failed');
      }
    } catch (error) {
      console.error('authService.login error:', error)
      throw error
    }
  },

  async logout() {
    const response = await api.post('/auth/logout')
    return response.data
  },

  async getCurrentUser() {
    const response = await api.get('/auth/user')
    return response.data
  },

  async refreshToken() {
    const response = await api.post('/auth/refresh')
    return response.data
  }
}
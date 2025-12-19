import { createContext, useContext, useState, useEffect } from 'react'
import { authService } from '../services/authService'
import toast from 'react-hot-toast'
import { getToken, setToken, removeToken, isTokenExpired } from '../utils/tokenUtils'

const AuthContext = createContext()

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const initAuth = async () => {
      console.log('=== AuthContext.initAuth START ===')
      const token = getToken()
      
      if (token) {
        console.log('Token found during init')
        // Check if token is expired before making request
        if (isTokenExpired(token)) {
          console.log('Token expired during init, removing token')
          removeToken()
          setLoading(false)
          return
        }
        
        try {
          // Sync token to ensure it's stored in both places
          setToken(token)
          
          const response = await authService.getCurrentUser()
          console.log('AuthContext.initAuth response:', response)
          
          // Handle different response formats
          let userData = null
          if (response.data?.data) {
            userData = response.data.data
          } else if (response.data) {
            userData = response.data
          } else {
            userData = response
          }
          
          console.log('AuthContext.initAuth userData:', userData)
          setUser(userData)
        } catch (error) {
          console.error('Failed to restore auth session:', error)
          removeToken()
          // Don't redirect to login here, let the user stay on current page
        }
      } else {
        console.log('No token found during init')
      }
      setLoading(false)
      console.log('=== AuthContext.initAuth END ===')
    }

    initAuth()
  }, [])

  const login = async (credentials) => {
    try {
      console.log('=== AuthContext.login START ===')
      console.log('Credentials:', credentials)
      const response = await authService.login(credentials)
      console.log('AuthContext.login authService response:', response)
      
      // authService now returns the data object directly: { user: {...}, token: "..." }
      if (response.user && response.token) {
        console.log('=== AuthContext.login SUCCESS ===')
        console.log('Extracted user data:', response.user)
        console.log('Extracted token:', response.token.substring(0, 20) + '...')
        
        // Store token first to ensure it's available before state update
        setToken(response.token)
        
        // Update user state
        setUser(response.user)
        
        toast.success('Login successful!')
        console.log('=== AuthContext.login END ===')
        return { user: response.user, token: response.token }
      } else {
        console.error('=== AuthContext.login INVALID FORMAT ===')
        console.error('Response:', response)
        throw new Error('Invalid response format from server - missing user or token')
      }
    } catch (error) {
      console.error('=== AuthContext.login ERROR ===')
      console.error('Error:', error)
      console.error('Error message:', error.message)
      console.error('Error response:', error.response)
      toast.error(error.message || 'Login failed')
      throw error
    }
  }

  const logout = async () => {
    try {
      await authService.logout()
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      setUser(null)
      // Clear tokens using utility function
      removeToken()
      toast.success('Logged out successfully')
    }
  }

  const refreshToken = async () => {
    try {
      const response = await authService.refreshToken()
      console.log('AuthContext.refreshToken response:', response)
      
      // Handle different response formats
      let userData = null
      let token = null
      
      if (response.data?.data) {
        userData = response.data.data.user
        token = response.data.data.token
      } else if (response.data) {
        userData = response.data.user
        token = response.data.token
      } else {
        userData = response.user
        token = response.token
      }
      
      if (userData && token) {
        // Store token first
        setToken(token)
        // Then update user state
        setUser(userData)
      }
      
      return response
    } catch (error) {
      console.error('AuthContext.refreshToken error:', error)
      logout()
      throw error
    }
  }

  const value = {
    user,
    login,
    logout,
    refreshToken,
    isAuthenticated: !!user,
    loading
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export default AuthContext
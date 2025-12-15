import { createContext, useContext, useState, useEffect } from 'react'
import { authService } from '../services/authService'
import toast from 'react-hot-toast'

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
      const token = localStorage.getItem('token')
      if (token) {
        try {
          const userData = await authService.getCurrentUser()
          setUser(userData)
        } catch (error) {
          localStorage.removeItem('token')
          console.error('Failed to restore auth session:', error)
        }
      }
      setLoading(false)
    }

    initAuth()
  }, [])

  const login = async (credentials) => {
    try {
      console.log('AuthContext.login called with:', credentials)
      const response = await authService.login(credentials)
      console.log('AuthContext.login response:', response)
      
      // authService now returns the data object directly: { user: {...}, token: "..." }
      if (response.user && response.token) {
        console.log('Extracted user data:', response.user)
        console.log('Extracted token:', response.token)
        
        setUser(response.user)
        localStorage.setItem('token', response.token)
        toast.success('Login successful!')
        return { user: response.user, token: response.token }
      } else {
        throw new Error('Invalid response format from server - missing user or token')
      }
    } catch (error) {
      console.error('AuthContext.login error:', error)
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
      localStorage.removeItem('token')
      toast.success('Logged out successfully')
    }
  }

  const refreshToken = async () => {
    try {
      const response = await authService.refreshToken()
      setUser(response.user)
      localStorage.setItem('token', response.token)
      return response
    } catch (error) {
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
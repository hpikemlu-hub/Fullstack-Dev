import api from './api'

export const userService = {
  async getUsers(params = {}) {
    const response = await api.get('/users', { params })
    return response.data.data
  },

  async getUserById(id) {
    const response = await api.get(`/users/${id}`)
    return response.data.data
  },

  async createUser(data) {
    const response = await api.post('/users', data)
    return response.data.data
  },

  async updateUser(id, data) {
    const response = await api.put(`/users/${id}`, data)
    return response.data.data
  },

  async deleteUser(id, force = false) {
    const params = force ? { force: 'true' } : {}
    const response = await api.delete(`/users/${id}`, { params })
    return response.data.data
  },

  async getProfile() {
    const response = await api.get('/users/profile/me')
    return response.data.data
  },

  async updateProfile(data) {
    const response = await api.put('/users/profile/me', data)
    return response.data.data
  }
}
import api from './api'

export const workloadService = {
  async getWorkloads(params = {}) {
    const response = await api.get('/workload', { params })
    return response.data.data
  },

  async getWorkloadById(id) {
    const response = await api.get(`/workload/${id}`)
    return response.data.data
  },

  async createWorkload(data) {
    const response = await api.post('/workload', data)
    return response.data.data
  },

  async updateWorkload(id, data) {
    const response = await api.put(`/workload/${id}`, data)
    return response.data.data
  },

  async deleteWorkload(id) {
    const response = await api.delete(`/workload/${id}`)
    return response.data
  },

  async getWorkloadOptions() {
    const response = await api.get('/workload/options')
    return response.data.data
  },

  async getWorkloadStatistics(userId = null) {
    const params = userId ? { user_id: userId } : {}
    const response = await api.get('/workload/statistics', { params })
    return response.data.data
  },

  async getMyWorkloads(params = {}) {
    const response = await api.get('/workload/my', { params })
    return response.data.data
  }
}
import React, { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { useAuth } from '../context/AuthContext'
import { workloadService } from '../services/workloadService'
import { userService } from '../services/userService'
import LoadingSpinner from '../components/common/LoadingSpinner'
import toast from 'react-hot-toast'

const Workload = () => {
  const { user } = useAuth()
  const [workloads, setWorkloads] = useState([])
  const [users, setUsers] = useState([])
  const [options, setOptions] = useState({})
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingWorkload, setEditingWorkload] = useState(null)
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    type: '',
    user_id: ''
  })

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm()

  useEffect(() => {
    fetchWorkloads()
    fetchOptions()
    if (user.role === 'Admin') {
      fetchUsers()
    }
  }, [filters, user])

  const fetchWorkloads = async () => {
    try {
      setLoading(true)
      const params = { ...filters }
      if (user.role !== 'Admin') {
        params.user_id = user.id
      }
      const data = await workloadService.getWorkloads(params)
      setWorkloads(data.workloads || [])
    } catch (error) {
      console.error('Failed to fetch workloads:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchOptions = async () => {
    try {
      const data = await workloadService.getWorkloadOptions()
      setOptions(data)
    } catch (error) {
      console.error('Failed to fetch options:', error)
    }
  }

  const fetchUsers = async () => {
    try {
      const data = await userService.getUsers()
      setUsers(data.users || [])
    } catch (error) {
      console.error('Failed to fetch users:', error)
    }
  }

  const onSubmit = async (data) => {
    try {
      if (editingWorkload) {
        await workloadService.updateWorkload(editingWorkload.id, data)
        toast.success('Workload updated successfully')
      } else {
        await workloadService.createWorkload(data)
        toast.success('Workload created successfully')
      }
      
      setShowModal(false)
      setEditingWorkload(null)
      reset()
      fetchWorkloads()
    } catch (error) {
      console.error('Failed to save workload:', error)
    }
  }

  const handleEdit = (workload) => {
    setEditingWorkload(workload)
    reset({
      nama: workload.nama,
      type: workload.type,
      deskripsi: workload.deskripsi,
      status: workload.status,
      tgl_diterima: workload.tgl_diterima,
      fungsi: workload.fungsi,
      user_id: workload.user_id
    })
    setShowModal(true)
  }

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this workload?')) {
      try {
        await workloadService.deleteWorkload(id)
        toast.success('Workload deleted successfully')
        fetchWorkloads()
      } catch (error) {
        console.error('Failed to delete workload:', error)
      }
    }
  }

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }))
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'Completed':
        return 'bg-green-100 text-green-800'
      case 'In Progress':
        return 'bg-blue-100 text-blue-800'
      case 'New':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner size="large" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Workload Management</h1>
        <button
          onClick={() => {
            setEditingWorkload(null)
            reset()
            setShowModal(true)
          }}
          className="btn btn-primary"
        >
          Add Workload
        </button>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <input
            type="text"
            placeholder="Search..."
            value={filters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            className="input"
          />
          
          <select
            value={filters.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
            className="input"
          >
            <option value="">All Status</option>
            {options.statuses?.map(status => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>

          <select
            value={filters.type}
            onChange={(e) => handleFilterChange('type', e.target.value)}
            className="input"
          >
            <option value="">All Types</option>
            {options.types?.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>

          {user.role === 'Admin' && (
            <select
              value={filters.user_id}
              onChange={(e) => handleFilterChange('user_id', e.target.value)}
              className="input"
            >
              <option value="">All Users</option>
              {users.map(u => (
                <option key={u.id} value={u.id}>{u.nama}</option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Workload Table */}
      <div className="card">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Function
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Assigned To
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date Received
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {workloads.map((workload) => (
                <tr key={workload.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{workload.nama}</div>
                      <div className="text-sm text-gray-500">{workload.deskripsi}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {workload.type || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(workload.status)}`}>
                      {workload.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {workload.fungsi || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {workload.user_nama}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {workload.tgl_diterima ? new Date(workload.tgl_diterima).toLocaleDateString() : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => handleEdit(workload)}
                      className="text-primary-600 hover:text-primary-900 mr-3"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(workload.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {workloads.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No workloads found
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {editingWorkload ? 'Edit Workload' : 'Add Workload'}
              </h3>
              
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Name</label>
                  <input
                    {...register('nama', { required: 'Name is required' })}
                    className="input mt-1"
                  />
                  {errors.nama && (
                    <p className="text-red-500 text-xs mt-1">{errors.nama.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Type</label>
                  <select {...register('type')} className="input mt-1">
                    <option value="">Select Type</option>
                    {options.types?.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Description</label>
                  <textarea
                    {...register('deskripsi')}
                    rows="3"
                    className="input mt-1"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Status</label>
                  <select {...register('status')} className="input mt-1">
                    <option value="New">New</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Function</label>
                  <input
                    {...register('fungsi')}
                    className="input mt-1"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Date Received</label>
                  <input
                    {...register('tgl_diterima')}
                    type="date"
                    className="input mt-1"
                  />
                </div>

                {user.role === 'Admin' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Assigned To</label>
                    <select {...register('user_id')} className="input mt-1">
                      <option value="">Select User</option>
                      {users.map(u => (
                        <option key={u.id} value={u.id}>{u.nama}</option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false)
                      setEditingWorkload(null)
                      reset()
                    }}
                    className="btn btn-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                  >
                    {editingWorkload ? 'Update' : 'Create'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Workload
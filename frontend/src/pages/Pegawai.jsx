import React, { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { useAuth } from '../context/AuthContext'
import { userService } from '../services/userService'
import LoadingSpinner from '../components/common/LoadingSpinner'
import toast from 'react-hot-toast'

const Pegawai = () => {
  const { user: currentUser } = useAuth()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingUser, setEditingUser] = useState(null)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm()

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const data = await userService.getUsers()
      setUsers(data.users || [])
    } catch (error) {
      console.error('Failed to fetch users:', error)
    } finally {
      setLoading(false)
    }
  }

  const onSubmit = async (data) => {
    try {
      if (editingUser) {
        await userService.updateUser(editingUser.id, data)
        toast.success('User updated successfully')
      } else {
        await userService.createUser(data)
        toast.success('User created successfully')
      }
      
      setShowModal(false)
      setEditingUser(null)
      reset()
      fetchUsers()
    } catch (error) {
      console.error('Failed to save user:', error)
      
      // Show more detailed error message
      if (error.response?.data?.errors) {
        error.response.data.errors.forEach(err => {
          toast.error(`${err.field}: ${err.message}`)
        })
      } else if (error.response?.data?.message) {
        toast.error(error.response.data.message)
      } else {
        toast.error('Failed to save user. Please check your input and try again.')
      }
    }
  }

  const handleEdit = (user) => {
    setEditingUser(user)
    reset({
      username: user.username,
      nama: user.nama,
      nip: user.nip,
      golongan: user.golongan,
      jabatan: user.jabatan,
      role: user.role
    })
    setShowModal(true)
  }

  const handleDelete = async (id, nama) => {
    if (window.confirm(`Are you sure you want to delete user ${nama}?`)) {
      try {
        await userService.deleteUser(id)
        toast.success('User deleted successfully')
        fetchUsers()
      } catch (error) {
        console.error('Failed to delete user:', error)
      }
    }
  }

  const getRoleColor = (role) => {
    switch (role) {
      case 'Admin':
        return 'bg-purple-100 text-purple-800'
      case 'User':
        return 'bg-blue-100 text-blue-800'
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
        <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
        <button
          onClick={() => {
            setEditingUser(null)
            reset()
            setShowModal(true)
          }}
          className="btn btn-primary"
        >
          Add User
        </button>
      </div>

      {/* Users Table */}
      <div className="card">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Username
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  NIP
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Position
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{user.nama}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {user.username}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {user.nip || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{user.jabatan || '-'}</div>
                    <div className="text-sm text-gray-500">{user.golongan || '-'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getRoleColor(user.role)}`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(user.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => handleEdit(user)}
                      className="text-primary-600 hover:text-primary-900 mr-3"
                    >
                      Edit
                    </button>
                    {user.id !== currentUser.id && (
                      <button
                        onClick={() => handleDelete(user.id, user.nama)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Delete
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {users.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No users found
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
                {editingUser ? 'Edit User' : 'Add User'}
              </h3>
              
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Username</label>
                  <input
                    {...register('username', { required: 'Username is required' })}
                    className="input mt-1"
                  />
                  {errors.username && (
                    <p className="text-red-500 text-xs mt-1">{errors.username.message}</p>
                  )}
                </div>

                {!editingUser && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Password</label>
                    <input
                      {...register('password', { 
                        required: 'Password is required',
                        minLength: { value: 6, message: 'Password must be at least 6 characters' }
                      })}
                      type="password"
                      className="input mt-1"
                    />
                    {errors.password && (
                      <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>
                    )}
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700">Full Name</label>
                  <input
                    {...register('nama', { required: 'Full name is required' })}
                    className="input mt-1"
                  />
                  {errors.nama && (
                    <p className="text-red-500 text-xs mt-1">{errors.nama.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">NIP</label>
                  <input
                    {...register('nip', {
                      validate: (value) => {
                        if (value && value.length > 18) {
                          return 'NIP must be maximum 18 characters long';
                        }
                        return true;
                      }
                    })}
                    className="input mt-1"
                    placeholder="Optional - Maximum 18 characters"
                  />
                  {errors.nip && (
                    <p className="text-red-500 text-xs mt-1">{errors.nip.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Position</label>
                  <input
                    {...register('jabatan')}
                    className="input mt-1"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Rank/Level</label>
                  <select {...register('golongan')} className="input mt-1">
                    <option value="">Select Rank/Level</option>
                    <option value="I/a">I/a</option>
                    <option value="I/b">I/b</option>
                    <option value="I/c">I/c</option>
                    <option value="I/d">I/d</option>
                    <option value="II/a">II/a</option>
                    <option value="II/b">II/b</option>
                    <option value="II/c">II/c</option>
                    <option value="II/d">II/d</option>
                    <option value="III/a">III/a</option>
                    <option value="III/b">III/b</option>
                    <option value="III/c">III/c</option>
                    <option value="III/d">III/d</option>
                    <option value="IV/a">IV/a</option>
                    <option value="IV/b">IV/b</option>
                    <option value="IV/c">IV/c</option>
                    <option value="IV/d">IV/d</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Role</label>
                  <select {...register('role', { required: 'Role is required' })} className="input mt-1">
                    <option value="User">User</option>
                    <option value="Admin">Admin</option>
                  </select>
                  {errors.role && (
                    <p className="text-red-500 text-xs mt-1">{errors.role.message}</p>
                  )}
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false)
                      setEditingUser(null)
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
                    {editingUser ? 'Update' : 'Create'}
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

export default Pegawai
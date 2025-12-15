import React from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

const Navbar = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  const isActive = (path) => location.pathname === path

  return (
    <nav className="bg-white shadow-lg border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <h1 className="text-xl font-bold text-gray-900">
              Workload Management System
            </h1>
          </div>

          <div className="flex items-center space-x-4">
            <div className="hidden md:flex space-x-4">
              <a
                href="/dashboard"
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  isActive('/dashboard')
                    ? 'bg-primary-600 text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                Dashboard
              </a>
              <a
                href="/workload"
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  isActive('/workload')
                    ? 'bg-primary-600 text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                Workload
              </a>
              {user?.role === 'Admin' && (
                <a
                  href="/pegawai"
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    isActive('/pegawai')
                      ? 'bg-primary-600 text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  Pegawai
                </a>
              )}
            </div>

            <div className="flex items-center space-x-3 border-l pl-4">
              <span className="text-sm text-gray-700">
                {user?.nama}
              </span>
              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                {user?.role}
              </span>
              <button
                onClick={handleLogout}
                className="btn btn-secondary text-sm"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <div className="md:hidden border-t border-gray-200">
        <div className="px-2 pt-2 pb-3 space-y-1">
          <a
            href="/dashboard"
            className={`block px-3 py-2 rounded-md text-base font-medium ${
              isActive('/dashboard')
                ? 'bg-primary-600 text-white'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            Dashboard
          </a>
          <a
            href="/workload"
            className={`block px-3 py-2 rounded-md text-base font-medium ${
              isActive('/workload')
                ? 'bg-primary-600 text-white'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            Workload
          </a>
          {user?.role === 'Admin' && (
            <a
              href="/pegawai"
              className={`block px-3 py-2 rounded-md text-base font-medium ${
                isActive('/pegawai')
                  ? 'bg-primary-600 text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              Pegawai
            </a>
          )}
        </div>
      </div>
    </nav>
  )
}

export default Navbar
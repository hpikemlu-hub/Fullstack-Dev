import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import EmployeeTable from '@/components/employees/employee-table'

// Mock the auth context
const mockAuthContext = {
  user: {
    id: 'test-user',
    role: 'ADMIN',
    namaLengkap: 'Test Admin',
  },
  logout: jest.fn(),
}

jest.mock('@/hooks/useAuth', () => ({
  useAuth: () => mockAuthContext,
}))

// Mock API calls
const mockFetch = jest.fn()
global.fetch = mockFetch

const mockEmployees = [
  {
    id: '1',
    namaLengkap: 'John Doe',
    username: 'johndoe',
    nip: '123456789',
    golongan: 'III/a',
    jabatan: 'Staff',
    email: 'john@example.com',
    role: 'USER',
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: '2',
    namaLengkap: 'Jane Smith',
    username: 'janesmith',
    nip: '987654321',
    golongan: 'III/b',
    jabatan: 'Senior Staff',
    email: 'jane@example.com',
    role: 'USER',
    isActive: true,
    createdAt: '2024-01-02T00:00:00Z',
    updatedAt: '2024-01-02T00:00:00Z',
  },
]

describe('EmployeeTable', () => {
  beforeEach(() => {
    mockFetch.mockClear()
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        data: mockEmployees,
        count: mockEmployees.length,
      }),
    })
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should render employee table with data', async () => {
    render(<EmployeeTable />)

    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument()
      expect(screen.getByText('Jane Smith')).toBeInTheDocument()
    })

    // Check table headers
    expect(screen.getByText('Name')).toBeInTheDocument()
    expect(screen.getByText('NIP')).toBeInTheDocument()
    expect(screen.getByText('Position')).toBeInTheDocument()
    expect(screen.getByText('Role')).toBeInTheDocument()
    expect(screen.getByText('Status')).toBeInTheDocument()
  })

  it('should handle search functionality', async () => {
    const user = userEvent.setup()
    render(<EmployeeTable />)

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument()
    })

    // Search for specific employee
    const searchInput = screen.getByPlaceholderText(/search employees/i)
    await user.type(searchInput, 'Jane')

    // Should filter results
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/employees?search=Jane'),
        expect.any(Object)
      )
    })
  })

  it('should handle role filtering', async () => {
    const user = userEvent.setup()
    render(<EmployeeTable />)

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument()
    })

    // Filter by role
    const roleFilter = screen.getByRole('combobox', { name: /role filter/i })
    await user.selectOptions(roleFilter, 'ADMIN')

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/employees?role=ADMIN'),
        expect.any(Object)
      )
    })
  })

  it('should handle active status filtering', async () => {
    const user = userEvent.setup()
    render(<EmployeeTable />)

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument()
    })

    // Filter by active status
    const activeFilter = screen.getByRole('checkbox', { name: /active only/i })
    await user.click(activeFilter)

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/employees?active=true'),
        expect.any(Object)
      )
    })
  })

  it('should open edit modal when edit button is clicked', async () => {
    const user = userEvent.setup()
    render(<EmployeeTable />)

    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument()
    })

    // Click edit button for first employee
    const editButtons = screen.getAllByRole('button', { name: /edit/i })
    await user.click(editButtons[0])

    // Should open edit modal
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument()
      expect(screen.getByDisplayValue('John Doe')).toBeInTheDocument()
    })
  })

  it('should handle delete confirmation', async () => {
    const user = userEvent.setup()
    render(<EmployeeTable />)

    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument()
    })

    // Click delete button for first employee
    const deleteButtons = screen.getAllByRole('button', { name: /delete/i })
    await user.click(deleteButtons[0])

    // Should show confirmation dialog
    await waitFor(() => {
      expect(screen.getByRole('alertdialog')).toBeInTheDocument()
      expect(screen.getByText(/are you sure/i)).toBeInTheDocument()
    })

    // Cancel deletion
    const cancelButton = screen.getByRole('button', { name: /cancel/i })
    await user.click(cancelButton)

    // Dialog should close
    await waitFor(() => {
      expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
    })
  })

  it('should handle pagination', async () => {
    // Mock response with pagination
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        data: mockEmployees,
        count: 50, // Total count to trigger pagination
        totalPages: 5,
        currentPage: 1,
      }),
    })

    const user = userEvent.setup()
    render(<EmployeeTable />)

    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument()
    })

    // Should show pagination controls
    expect(screen.getByText('Page 1 of 5')).toBeInTheDocument()

    // Click next page
    const nextButton = screen.getByRole('button', { name: /next page/i })
    await user.click(nextButton)

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('page=2'),
        expect.any(Object)
      )
    })
  })

  it('should handle loading state', () => {
    // Mock pending promise
    mockFetch.mockReturnValue(new Promise(() => {}))

    render(<EmployeeTable />)

    // Should show loading indicator
    expect(screen.getByRole('status')).toBeInTheDocument()
    expect(screen.getByText(/loading/i)).toBeInTheDocument()
  })

  it('should handle error state', async () => {
    // Mock API error
    mockFetch.mockRejectedValue(new Error('API Error'))

    render(<EmployeeTable />)

    // Should show error message
    await waitFor(() => {
      expect(screen.getByText(/error loading employees/i)).toBeInTheDocument()
    })
  })

  it('should handle empty state', async () => {
    // Mock empty response
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        data: [],
        count: 0,
      }),
    })

    render(<EmployeeTable />)

    // Should show empty state
    await waitFor(() => {
      expect(screen.getByText(/no employees found/i)).toBeInTheDocument()
    })
  })

  it('should handle role-based permissions correctly', async () => {
    render(<EmployeeTable />)

    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument()
    })

    // Admin should see edit and delete buttons
    expect(screen.getAllByRole('button', { name: /edit/i })).toHaveLength(2)
    expect(screen.getAllByRole('button', { name: /delete/i })).toHaveLength(2)
  })

  it('should restrict actions for non-admin users', async () => {
    // Mock user role as USER
    mockAuthContext.user.role = 'USER'

    render(<EmployeeTable />)

    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument()
    })

    // User should not see edit/delete buttons
    expect(screen.queryByRole('button', { name: /edit/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /delete/i })).not.toBeInTheDocument()
  })

  it('should handle sort functionality', async () => {
    const user = userEvent.setup()
    render(<EmployeeTable />)

    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument()
    })

    // Click on name column header to sort
    const nameHeader = screen.getByRole('button', { name: /sort by name/i })
    await user.click(nameHeader)

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('sortBy=namaLengkap&sortOrder=asc'),
        expect.any(Object)
      )
    })
  })

  it('should refresh data when refresh button is clicked', async () => {
    const user = userEvent.setup()
    render(<EmployeeTable />)

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument()
    })

    // Clear mock call history
    mockFetch.mockClear()

    // Click refresh button
    const refreshButton = screen.getByRole('button', { name: /refresh/i })
    await user.click(refreshButton)

    // Should make new API call
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/employees'),
        expect.any(Object)
      )
    })
  })
})
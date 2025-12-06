// Workload Status Constants
export const WORKLOAD_STATUS = {
  PENDING: 'pending',
  IN_PROGRESS: 'in_progress', 
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  ON_HOLD: 'on_hold'
} as const;

export const WORKLOAD_STATUS_LABELS = {
  [WORKLOAD_STATUS.PENDING]: 'Pending',
  [WORKLOAD_STATUS.IN_PROGRESS]: 'In Progress',
  [WORKLOAD_STATUS.COMPLETED]: 'Completed', 
  [WORKLOAD_STATUS.CANCELLED]: 'Cancelled',
  [WORKLOAD_STATUS.ON_HOLD]: 'On Hold'
} as const;

export const WORKLOAD_STATUS_COLORS = {
  [WORKLOAD_STATUS.PENDING]: 'bg-yellow-100 text-yellow-800',
  [WORKLOAD_STATUS.IN_PROGRESS]: 'bg-blue-100 text-blue-800',
  [WORKLOAD_STATUS.COMPLETED]: 'bg-green-100 text-green-800',
  [WORKLOAD_STATUS.CANCELLED]: 'bg-red-100 text-red-800',
  [WORKLOAD_STATUS.ON_HOLD]: 'bg-gray-100 text-gray-800'
} as const;

// Priority Levels
export const PRIORITY_LEVELS = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  URGENT: 'urgent'
} as const;

export const PRIORITY_LABELS = {
  [PRIORITY_LEVELS.LOW]: 'Low',
  [PRIORITY_LEVELS.MEDIUM]: 'Medium', 
  [PRIORITY_LEVELS.HIGH]: 'High',
  [PRIORITY_LEVELS.URGENT]: 'Urgent'
} as const;

export const PRIORITY_COLORS = {
  [PRIORITY_LEVELS.LOW]: 'bg-gray-100 text-gray-800',
  [PRIORITY_LEVELS.MEDIUM]: 'bg-blue-100 text-blue-800',
  [PRIORITY_LEVELS.HIGH]: 'bg-orange-100 text-orange-800',
  [PRIORITY_LEVELS.URGENT]: 'bg-red-100 text-red-800'
} as const;

// User Roles
export const USER_ROLES = {
  ADMIN: 'admin',
  MANAGER: 'manager', 
  EMPLOYEE: 'employee',
  VIEWER: 'viewer'
} as const;

export const USER_ROLE_LABELS = {
  [USER_ROLES.ADMIN]: 'Administrator',
  [USER_ROLES.MANAGER]: 'Manager',
  [USER_ROLES.EMPLOYEE]: 'Employee', 
  [USER_ROLES.VIEWER]: 'Viewer'
} as const;

// Calendar Event Types
export const EVENT_TYPES = {
  MEETING: 'meeting',
  DEADLINE: 'deadline',
  TASK: 'task',
  REMINDER: 'reminder',
  TRAVEL: 'travel'
} as const;

export const EVENT_TYPE_LABELS = {
  [EVENT_TYPES.MEETING]: 'Meeting',
  [EVENT_TYPES.DEADLINE]: 'Deadline',
  [EVENT_TYPES.TASK]: 'Task',
  [EVENT_TYPES.REMINDER]: 'Reminder',
  [EVENT_TYPES.TRAVEL]: 'Perjalanan Dinas'
} as const;

export const EVENT_TYPE_COLORS = {
  [EVENT_TYPES.MEETING]: '#3B82F6',
  [EVENT_TYPES.DEADLINE]: '#EF4444', 
  [EVENT_TYPES.TASK]: '#10B981',
  [EVENT_TYPES.REMINDER]: '#F59E0B',
  [EVENT_TYPES.TRAVEL]: '#8B5CF6'
} as const;

// Pagination
export const ITEMS_PER_PAGE = {
  SMALL: 10,
  MEDIUM: 25, 
  LARGE: 50,
  EXTRA_LARGE: 100
} as const;

export const DEFAULT_PAGE_SIZE = ITEMS_PER_PAGE.MEDIUM;

// API Routes
export const API_ROUTES = {
  AUTH: {
    LOGIN: '/api/auth/login',
    LOGOUT: '/api/auth/logout',
    PROFILE: '/api/auth/profile'
  },
  EMPLOYEES: {
    LIST: '/api/employees',
    CREATE: '/api/employees',
    UPDATE: (id: string) => `/api/employees/${id}`,
    DELETE: (id: string) => `/api/employees/${id}`,
    PASSWORD: (id: string) => `/api/employees/${id}/password`
  },
  WORKLOAD: {
    LIST: '/api/workload',
    CREATE: '/api/workload', 
    UPDATE: (id: string) => `/api/workload/${id}`,
    DELETE: (id: string) => `/api/workload/${id}`
  },
  CALENDAR: {
    EVENTS: '/api/calendar/events',
    CREATE: '/api/calendar/events',
    UPDATE: (id: string) => `/api/calendar/events/${id}`,
    DELETE: (id: string) => `/api/calendar/events/${id}`
  },
  DASHBOARD: {
    STATS: '/api/dashboard/stats',
    NEAR_DEADLINE: '/api/dashboard/near-deadline'
  }
} as const;

// File Upload
export const FILE_UPLOAD = {
  MAX_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_TYPES: [
    'image/jpeg',
    'image/png', 
    'image/gif',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ],
  UPLOAD_PATH: '/uploads'
} as const;

// Date Formats
export const DATE_FORMATS = {
  DISPLAY: 'dd/MM/yyyy',
  INPUT: 'yyyy-MM-dd',
  DATETIME: 'dd/MM/yyyy HH:mm',
  TIME: 'HH:mm'
} as const;

// App Configuration
export const APP_CONFIG = {
  NAME: 'Workload Management System',
  DESCRIPTION: 'Sistem Manajemen Beban Kerja Direktorat HPI Sosbud',
  VERSION: '2.0.0',
  AUTHOR: 'Tim Pengembang Aplikasi'
} as const;

// Export types
export type WorkloadStatus = typeof WORKLOAD_STATUS[keyof typeof WORKLOAD_STATUS];
export type PriorityLevel = typeof PRIORITY_LEVELS[keyof typeof PRIORITY_LEVELS]; 
export type UserRole = typeof USER_ROLES[keyof typeof USER_ROLES];
export type EventType = typeof EVENT_TYPES[keyof typeof EVENT_TYPES];
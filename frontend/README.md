# Workload Management System - Frontend

Frontend React application for Workload Management System with authentication, dashboard, workload management, and user management features.

## Features

- **Authentication**: Login/logout with JWT tokens
- **Dashboard**: Statistics and recent workloads overview
- **Workload Management**: Full CRUD operations for workloads
- **User Management**: Admin-only user management (CRUD)
- **Responsive Design**: Mobile-friendly interface using Tailwind CSS
- **State Management**: React Context for global state
- **Error Handling**: Comprehensive error handling with toast notifications

## Tech Stack

- **React 18** - UI framework
- **React Router** - Client-side routing
- **Tailwind CSS** - Utility-first CSS framework
- **Axios** - HTTP client for API calls
- **React Hook Form** - Form handling
- **React Hot Toast** - Toast notifications
- **Vite** - Build tool and dev server

## Project Structure

```
src/
├── components/
│   └── common/
│       ├── Layout.jsx
│       ├── LoadingSpinner.jsx
│       └── Navbar.jsx
├── context/
│   └── AuthContext.jsx
├── pages/
│   ├── Dashboard.jsx
│   ├── Login.jsx
│   ├── Pegawai.jsx
│   └── Workload.jsx
├── services/
│   ├── api.js
│   ├── authService.js
│   ├── userService.js
│   └── workloadService.js
├── App.jsx
├── main.jsx
└── index.css
```

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- Backend API running on http://localhost:3000

### Installation

1. Install dependencies:
```bash
npm install
```

2. Start development server:
```bash
npm run dev
```

3. Open http://localhost:5173 in your browser

### Build for Production

```bash
npm run build
```

## Usage

### Login

Use the following credentials to test the application:

- **Admin**: username: `admin`, password: `admin123`
- **User**: username: `user`, password: `user123`

### Navigation

- **Dashboard**: Overview of workloads and statistics
- **Workload**: Manage workloads (create, read, update, delete)
- **Pegawai**: User management (admin only)

## API Integration

The frontend is configured to connect to the backend API at `http://localhost:3000/api`. The API endpoints are:

- Authentication: `/api/auth/*`
- Workloads: `/api/workload/*`
- Users: `/api/users/*`

## Features Details

### Authentication

- JWT-based authentication
- Automatic token refresh
- Protected routes
- Logout functionality

### Dashboard

- Real-time statistics
- Recent workloads list
- User count (admin only)
- Status breakdown

### Workload Management

- Create new workloads
- Edit existing workloads
- Delete workloads
- Filter by status, type, user
- Search functionality
- Status tracking (New, In Progress, Completed)

### User Management (Admin Only)

- Create new users
- Edit user information
- Delete users
- Role assignment (Admin/User)
- User listing with details

## Responsive Design

The application is fully responsive and works on:
- Desktop (1024px+)
- Tablet (768px - 1023px)
- Mobile (< 768px)

## Error Handling

- Global error handling with axios interceptors
- User-friendly error messages
- Toast notifications for all operations
- Form validation with react-hook-form

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

### Environment Variables

Create a `.env` file in the root directory:

```
VITE_API_URL=http://localhost:3000/api
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the ISC License.
# 🏛️ HPSB Workload Management System

[![Production Deploy](https://github.com/USERNAME/hpsb-workload-management/actions/workflows/production-deploy.yml/badge.svg)](https://github.com/USERNAME/hpsb-workload-management/actions/workflows/production-deploy.yml)
[![Staging Deploy](https://github.com/USERNAME/hpsb-workload-management/actions/workflows/staging-deploy.yml/badge.svg)](https://github.com/USERNAME/hpsb-workload-management/actions/workflows/staging-deploy.yml)
[![Security Scan](https://github.com/USERNAME/hpsb-workload-management/actions/workflows/security-scan.yml/badge.svg)](https://github.com/USERNAME/hpsb-workload-management/actions/workflows/security-scan.yml)

> **Enterprise-grade Workload Management System for Direktorat Hukum dan Perjanjian Sosial Budaya (HPSB)** - Fullstack Development

A modern, secure, and scalable workload management system built with Next.js 14, PostgreSQL, and Redis.

## 🚀 Quick Start

### One-Command Setup

```bash
npm run docker:dev
```

This starts the complete development environment with:
- PostgreSQL database with Adminer (port 8080)
- Redis cache with Redis Commander (port 8081)
- Prometheus metrics collection (port 9090)
- Grafana monitoring dashboard (port 3001)
- Next.js development server (port 3000)

### Manual Setup

1. **Environment Setup**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your configuration
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Start Services Only**
   ```bash
   npm run docker:dev:services  # Start PostgreSQL, Redis, monitoring only
   ```

4. **Database Setup**
   ```bash
   npm run db:generate
   npm run db:migrate
   npm run db:seed
   ```

5. **Start Development Server**
   ```bash
   npm run dev
   ```

## 📋 Available Scripts

### Development
- `npm run dev` - Start Next.js development server
- `npm run setup:dev` - Complete development environment setup
- `npm run docker:dev` - Start all services with Docker
- `npm run docker:dev:services` - Start only database and cache services
- `npm run docker:dev:stop` - Stop all Docker services
- `npm run docker:dev:clean` - Clean up Docker volumes and images

### Database
- `npm run db:generate` - Generate Prisma client
- `npm run db:migrate` - Run database migrations
- `npm run db:seed` - Seed database with sample data
- `npm run db:reset` - Reset database and run migrations
- `npm run test:db` - Test database connectivity
- `npm run backup:db` - Create database backup

### Testing & Quality
- `npm run test` - Run unit tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:e2e` - Run end-to-end tests
- `npm run test:integration` - Run integration tests
- `npm run type-check` - TypeScript type checking
- `npm run lint` - ESLint code linting

### Building & Deployment
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run docker:build` - Build Docker image
- `npm run docker:build:prod` - Build optimized production image
- `npm run deploy:staging` - Deploy to staging environment
- `npm run deploy:prod` - Deploy to production environment

### Monitoring & Health
- `npm run health-check` - Comprehensive health check
- `npm run monitor:logs` - View Docker service logs
- `npm run monitor:performance` - Performance monitoring

## 🏗️ Architecture

### Technology Stack
- **Frontend**: Next.js 14 with App Router, React 19, TypeScript
- **Backend**: Next.js API Routes, Prisma ORM
- **Database**: PostgreSQL 15 with connection pooling
- **Cache**: Redis 7 for session and data caching
- **Authentication**: JWT-based auth with refresh tokens
- **Monitoring**: Prometheus + Grafana
- **Containerization**: Docker with multi-stage builds

### Project Structure
```
fullstack-dev/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   ├── auth/              # Authentication pages
│   ├── dashboard/         # Dashboard pages
│   ├── employees/         # Employee management
│   ├── workload/          # Workload management
│   └── calendar/          # Calendar features
├── components/            # React components
│   ├── ui/               # Reusable UI components
│   ├── dashboard/        # Dashboard components
│   ├── employees/        # Employee components
│   ├── workload/         # Workload components
│   └── calendar/         # Calendar components
├── docker/               # Docker configuration
│   ├── Dockerfile        # Multi-stage production build
│   ├── docker-compose.dev.yml
│   ├── docker-compose.prod.yml
│   └── monitoring/       # Prometheus & Grafana config
├── prisma/               # Database schema and migrations
├── scripts/              # Utility scripts
└── lib/                  # Shared utilities
```

## 🔧 Development Tools

### Database Management
- **Adminer**: http://localhost:8080
  - Server: `postgres`
  - Username: `workload_user`
  - Password: `workload_pass`
  - Database: `workload_dev`

### Cache Management
- **Redis Commander**: http://localhost:8081

### Monitoring
- **Grafana**: http://localhost:3001
  - Username: `admin`
  - Password: `admin`
- **Prometheus**: http://localhost:9090

### Application URLs
- **Development**: http://localhost:3000
- **Health Check**: http://localhost:3000/api/health
- **Metrics**: http://localhost:3000/api/metrics

## 📊 Monitoring & Health Checks

### Built-in Monitoring
The application includes comprehensive monitoring:

- **Health Endpoint**: `/api/health`
  - Database connectivity
  - Redis connectivity (if configured)
  - Memory usage
  - System status

- **Metrics Endpoint**: `/api/metrics`
  - Prometheus-format metrics
  - Process statistics
  - HTTP request metrics
  - System information

### Grafana Dashboards
Pre-configured dashboards for:
- Application performance
- Database metrics
- Cache performance
- System resources

## 🚀 Production Deployment

### Coolify Deployment

1. **Environment Variables**
   ```bash
   DATABASE_URL=postgresql://...
   JWT_SECRET=your_secret_here
   JWT_REFRESH_SECRET=your_refresh_secret
   ALLOWED_ORIGINS=https://yourdomain.com
   ```

2. **Deployment Commands**
   ```bash
   npm run deploy:staging   # Deploy to staging
   npm run deploy:prod      # Deploy to production
   ```

### Docker Production Build
```bash
npm run docker:build:prod
docker run -p 3000:3000 workload-app:latest
```

## 🔐 Security Features

- JWT-based authentication with refresh tokens
- Secure password hashing with bcrypt
- CORS protection
- Environment-based configuration
- Docker security best practices
- Automated security scanning in CI/CD

## 📈 Performance Optimization

- Next.js standalone output for minimal Docker images
- Multi-stage Docker builds for size optimization
- Redis caching for improved response times
- Database connection pooling
- Optimized bundle splitting
- Gzip compression

## 🧪 Testing Strategy

- **Unit Tests**: Component and utility testing
- **Integration Tests**: API endpoint testing
- **End-to-End Tests**: Full user workflow testing
- **Database Tests**: Connection and query testing
- **Performance Tests**: Load and response time testing

## 📚 API Documentation

### Authentication Endpoints
- `POST /api/auth/login` - User authentication
- `POST /api/auth/refresh` - Token refresh
- `POST /api/auth/logout` - User logout

### Employee Management
- `GET /api/employees` - List employees
- `POST /api/employees` - Create employee
- `PUT /api/employees/[id]` - Update employee
- `DELETE /api/employees/[id]` - Delete employee

### Workload Management
- `GET /api/workload` - List workloads
- `POST /api/workload` - Create workload
- `PUT /api/workload/[id]` - Update workload
- `DELETE /api/workload/[id]` - Delete workload

### Calendar Events
- `GET /api/calendar/events` - List events
- `POST /api/calendar/events` - Create event
- `PUT /api/calendar/events/[id]` - Update event
- `DELETE /api/calendar/events/[id]` - Delete event

## 🔄 Migration from Supabase

For migrating from the existing Supabase setup:

```bash
# Set Supabase credentials in .env.local
npm run migrate:supabase --dry-run  # Preview migration
npm run migrate:supabase            # Execute migration
```

## 📞 Support

For issues and support:
1. Check the application logs: `npm run monitor:logs`
2. Run health check: `npm run health-check`
3. Verify database connectivity: `npm run test:db`
4. Review monitoring dashboards in Grafana

## 🏃‍♂️ Getting Started Checklist

- [ ] Clone repository
- [ ] Copy `.env.example` to `.env.local`
- [ ] Run `npm run docker:dev`
- [ ] Access application at http://localhost:3000
- [ ] Set up monitoring at http://localhost:3001
- [ ] Configure production environment variables
- [ ] Set up CI/CD pipelines
- [ ] Configure backup strategy

---

**Built with ❤️ for efficient workload management**
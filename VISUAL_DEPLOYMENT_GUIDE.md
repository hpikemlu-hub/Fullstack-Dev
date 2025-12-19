# Visual Deployment Guide with Diagrams

## Overview

This guide provides visual representations and diagrams to enhance understanding of the Dokploy deployment process for the Workload Management Application with authentication fix. Visual aids help clarify complex concepts and relationships between components.

## Architecture Overview

### System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           DOKPLOY CLOUD                             │
├─────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐ │
│  │   Application   │    │    Database     │    │     Storage     │ │
│  │    Container   │◄──►│     Volume      │◄──►│     Volume      │ │
│  │                 │    │                 │    │                 │ │
│  │ ┌─────────────┐ │    │ ┌─────────────┐ │    │ ┌─────────────┐ │ │
│  │ │   Frontend  │ │    │ │   SQLite    │ │    │ │   Backups   │ │ │
│  │ │   (React)   │ │    │ │ Database    │ │    │ │   Files     │ │ │
│  │ └─────────────┘ │    │ └─────────────┘ │    │ └─────────────┘ │ │
│  │ ┌─────────────┐ │    │                 │    │                 │ │
│  │ │   Backend   │ │    │                 │    │                 │ │
│  │ │ (Node.js)   │ │    │                 │    │                 │ │
│  │ └─────────────┘ │    │                 │    │                 │ │
│  │                 │    │                 │    │                 │ │
│  │ ┌─────────────┐ │    │                 │    │                 │ │
│  │ │   Auth      │ │    │                 │    │                 │ │
│  │ │   System    │ │    │                 │    │                 │ │
│  │ └─────────────┘ │    │                 │    │                 │ │
│  └─────────────────┘    └─────────────────┘    └─────────────────┘ │
└─────────────────────────────────────────────────────────────────────────┘
                                ▲
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                        END USERS                                   │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐      │
│  │    Admin    │    │   Regular   │    │   Mobile    │      │
│  │    User     │    │    User     │    │    User     │      │
│  └─────────────┘    └─────────────┘    └─────────────┘      │
└─────────────────────────────────────────────────────────────────────────┘
```

### Data Flow Diagram

```
┌─────────────┐    1. Login Request    ┌─────────────┐    2. Check Credentials    ┌─────────────┐
│   Frontend  │──────────────────────►│   Backend   │─────────────────────────►│   Database  │
│   (React)   │                     │ (Node.js)   │                       │  (SQLite)   │
└─────────────┘                     └─────────────┘                       └─────────────┘
       ▲                                   │                                   ▲
       │                                   │                                   │
       │                                   │                                   │
       │                                   ▼                                   │
       │                    3. Return User Data    ┌─────────────┐              │
       │◄───────────────────────────────────────│   Auth      │◄─────────────┘
       │                                   │   System    │
       │                                   └─────────────┘
       │                                           │
       │                                           │
       │                                           ▼
       │                                   4. Generate JWT Token
       │                                           │
       │                                           ▼
       │                                   ┌─────────────┐
       │◄───────────────────────────────────────│   JWT       │
       │      5. Return Token                │   Token     │
       │                                   └─────────────┘
       │
       ▼
┌─────────────┐
│   User      │
│  Dashboard │
└─────────────┘
```

## Deployment Process Flow

### Step-by-Step Deployment Flowchart

```
┌─────────────────┐
│   START        │
│   DEPLOYMENT   │
└─────────┬───────┘
          │
          ▼
┌─────────────────┐     NO     ┌─────────────────┐
│ Push Code to   │────────────►│ Fix Issues     │
│   GitHub       │             │ in Repository  │
└─────────┬───────┘             └─────────┬───────┘
          │                               │
          ▼                               ▼
     YES │                               │
          ▼                               ▼
┌─────────────────┐                 ┌─────────────────┐
│ Configure      │                 │   Return to    │
│ Dokploy App   │                 │   Start        │
└─────────┬───────┘                 └─────────────────┘
          │
          ▼
┌─────────────────┐
│ Set Environment│
│ Variables      │
└─────────┬───────┘
          │
          ▼
┌─────────────────┐
│ Configure      │
│ Volume Mounts  │
└─────────┬───────┘
          │
          ▼
┌─────────────────┐     ERROR    ┌─────────────────┐
│ Start         │────────────►│ Check Logs     │
│ Deployment    │             │ & Troubleshoot │
└─────────┬───────┘             └─────────┬───────┘
          │                               │
          ▼                               ▼
    SUCCESS │                               │
          ▼                               ▼
┌─────────────────┐                 ┌─────────────────┐
│ Verify        │                 │   Fix Issues   │
│ Deployment    │                 │   & Retry      │
└─────────┬───────┘                 └─────────┬───────┘
          │                               │
          ▼                               ▼
┌─────────────────┐                 ┌─────────────────┐
│   COMPLETED    │◄──────────────│   Return to    │
│   SUCCESSFULLY │    SUCCESS     │   Deployment   │
└─────────────────┘                └─────────────────┘
```

## Volume Mounting Visual Guide

### Volume Mounting Structure

```
HOST SYSTEM (Dokploy Server)                    CONTAINER (Application)
┌─────────────────────────────────┐         ┌─────────────────────────────────┐
│ /var/lib/dokploy/volumes/     │         │ /app/                       │
│ workload-app-data/            │         │                             │
│ ┌─────────────────────────────┐ │         │ ┌─────────────────────────────┐ │
│ │ database.sqlite            │ │◄────────┤ │ data/                      │ │
│ │ database_backup_*.sqlite   │ │  MOUNT   │ │ ┌─────────────────────────┐ │ │
│ │ .write_test               │ │         │ │ │ database.sqlite        │ │ │
│ │ logs/                    │ │         │ │ │ database_backup_*.sqlite│ │ │
│ │ └─ app.log              │ │         │ │ └─────────────────────────┘ │ │
│ └─────────────────────────────┘ │         │ └─────────────────────────────┘ │
└─────────────────────────────────┘         │                             │
                                       │ logs/                       │
                                       │ ┌─────────────────────────┐ │
                                       │ │ app.log               │ │
                                       │ │ auth.log              │ │
                                       │ │ error.log             │ │
                                       │ └─────────────────────────┘ │
                                       └─────────────────────────────────┘
```

### Volume Creation Process

```
STEP 1: Create Directory on Host
┌─────────────────────────────────────────────────────────────────────────┐
│ $ sudo mkdir -p /var/lib/dokploy/volumes/workload-app-data      │
│ $ sudo chown -R 1001:1001 /var/lib/dokploy/volumes/...     │
│ $ sudo chmod -R 755 /var/lib/dokploy/volumes/...           │
└─────────────────────────────────────────────────────────────────────────┘
                                │
                                ▼
STEP 2: Configure in Dokploy Dashboard
┌─────────────────────────────────────────────────────────────────────────┐
│ Volume Configuration:                                             │
│ ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐ │
│ │ Type: Bind     │ │ Source:        │ │ Destination:   │ │
│ │ Mount         │ │ /var/lib/...  │ │ /app/data      │ │
│ └─────────────────┘ └─────────────────┘ └─────────────────┘ │
│                                                               │
│ [Add Volume]                                                   │
└─────────────────────────────────────────────────────────────────────────┘
                                │
                                ▼
STEP 3: Verify Mount
┌─────────────────────────────────────────────────────────────────────────┐
│ $ dokploy exec <container> mount | grep /app/data                │
│ /dev/sda1 on /app/data type ext4 (rw,relatime)              │
│                                                               │
│ $ dokploy exec <container> ls -la /app/data                     │
│ -rw-r--r-- 1 nodejs nodejs 24576 Dec 1 12:00 database.sqlite │
└─────────────────────────────────────────────────────────────────────────┘
```

## Authentication System Flow

### Authentication Process Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    AUTHENTICATION PROCESS                         │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────┐    1. POST /api/auth/login    ┌─────────────┐ │
│  │    User     │────────────────────────────►│   Backend   │ │
│  │  Browser    │                            │  Server     │ │
│  └─────────────┘                            └─────────────┘ │
│         ▲                                           │         │
│         │                                           │         │
│         │                                           ▼         │
│         │                                2. Validate Credentials │
│         │                                           │         │
│         │                                 ┌─────────────────┐ │
│         │                                 │   Database     │ │
│         │                                 │  (SQLite)      │ │
│         │                                 └─────────────────┘ │
│         │                                           ▲         │
│         │                                           │         │
│         │                                           │         │
│         │                                 3. User Found? │         │
│         │                                           │         │
│         │                                  ┌────────┴────────┐ │
│         │                                  │                 │ │
│         │                                  ▼                 ▼ │
│         │                        ┌─────────────────┐ ┌─────────────────┐ │
│         │                        │     YES         │ │      NO         │ │
│         │                        └─────────────────┘ └─────────────────┘ │
│         │                                  │                 │         │
│         │                                  ▼                 ▼         │
│         │                        4. Generate JWT    5. Return Error │
│         │                        Token             (401 Unauthorized)│
│         │                                  │                 │         │
│         │                                  ▼                 │         │
│         │                        ┌─────────────────┐         │         │
│         │                        │   JWT Token     │         │         │
│         │                        └─────────────────┘         │         │
│         │                                  │                 │         │
│         │                                  ▼                 │         │
│         │                        6. Return Token   │                 │
│         │                        with User Data    │                 │
│         │                                  │                 │         │
│         │                                  ▼                 │         │
│         │                        ┌─────────────────┐         │         │
│         │                        │   Response:     │         │         │
│         │                        │ {token, user}   │         │         │
│         │                        └─────────────────┘         │         │
│         │                                  │                 │         │
│         │                                  ▼                 │         │
│         │                        7. Store Token    │                 │
│         │                        in localStorage  │                 │         │
│         │                                  │                 │         │
│         │                                  ▼                 │         │
│         │                        8. Redirect to   │                 │
│         │                        Dashboard        │                 │         │
│         │                                          │         │
│         │                                          ▼         │
│         │                        ┌─────────────────┐         │
│         │                        │   User         │         │
│         │                        │  Dashboard     │         │
│         │                        └─────────────────┘         │
│         │                                          │         │
│         └───────────────────────────────────────────────────┘         │
└─────────────────────────────────────────────────────────────────────────┘
```

### Admin User Creation Process

```
┌─────────────────────────────────────────────────────────────────────────┐
│              ADMIN USER CREATION PROCESS                          │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────┐    1. Application Startup    ┌─────────────┐ │
│  │   Container    │────────────────────────────►│   Database   │ │
│  │    Start       │                            │  Check      │ │
│  └─────────────────┘                            └─────────────┘ │
│         │                                           │         │
│         │                                           ▼         │
│         │                                2. Admin User Exists? │
│         │                                           │         │
│         │                                  ┌────────┴────────┐ │
│         │                                  │                 │ │
│         │                                  ▼                 ▼ │
│         │                        ┌─────────────────┐ ┌─────────────────┐ │
│         │                        │      NO         │ │      YES        │ │
│         │                        └─────────────────┘ └─────────────────┘ │
│         │                                  │                 │         │
│         │                                  ▼                 │         │
│         │                        3. Create Admin    4. Skip Creation │
│         │                        User             │                 │
│         │                                  │                 │         │
│         │                                  ▼                 │         │
│         │                        ┌─────────────────┐         │         │
│         │                        │   User Model    │         │         │
│         │                        │  (createAdmin) │         │         │
│         │                        └─────────────────┘         │         │
│         │                                  │                 │         │
│         │                                  ▼                 │         │
│         │                        5. Hash Password  │                 │
│         │                        (bcrypt)        │                 │         │
│         │                                  │                 │         │
│         │                                  ▼                 │         │
│         │                        ┌─────────────────┐         │         │
│         │                        │   Save to      │         │         │
│         │                        │   Database     │         │         │
│         │                        └─────────────────┘         │         │
│         │                                  │                 │         │
│         │                                  ▼                 │         │
│         │                        6. Log Success   │                 │
│         │                        ✅ Admin user    │                 │
│         │                        created         │                 │
│         │                                  │                 │         │
│         │                                  ▼                 │         │
│         │                        ┌─────────────────┐         │         │
│         │                        │   Continue     │         │         │
│         │                        │   Startup       │         │         │
│         │                        └─────────────────┘         │         │
│         │                                                        │
│         └────────────────────────────────────────────────────────────┘         │
└─────────────────────────────────────────────────────────────────────────┘
```

## Environment Variables Configuration

### Environment Variables Relationship Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                 ENVIRONMENT VARIABLES CONFIGURATION              │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐ │
│  │   NODE_ENV     │    │    PORT        │    │  JWT_SECRET     │ │
│  │   production   │    │    3000        │    │  [32+ chars]   │ │
│  └─────────────────┘    └─────────────────┘    └─────────────────┘ │
│           │                       │                       │         │
│           │                       │                       │         │
│           ▼                       ▼                       ▼         │
│  ┌─────────────────────────────────────────────────────────────────┐ │
│  │              APPLICATION BEHAVIOR                     │ │
│  │                                                      │ │
│  │ • Production mode logging                              │ │
│  │ • Listen on port 3000                               │ │
│  │ • JWT token signing and verification                   │ │
│  └─────────────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐ │
│  │ CORS_ORIGIN    │    │    DB_PATH     │    │ RESET_ADMIN    │ │
│  │https://app... │    │/app/data/...   │    │    false       │ │
│  └─────────────────┘    └─────────────────┘    └─────────────────┘ │
│           │                       │                       │         │
│           │                       │                       │         │
│           ▼                       ▼                       ▼         │
│  ┌─────────────────────────────────────────────────────────────────┐ │
│  │              SYSTEM INTEGRATION                     │ │
│  │                                                      │ │
│  │ • Frontend-backend communication                    │ │
│  │ • Database file location                           │ │
│  │ • Admin user reset trigger                         │ │
│  └─────────────────────────────────────────────────────────────────┘ │
│                                                                 │
└─────────────────────────────────────────────────────────────────────────┘
```

## Troubleshooting Decision Tree

### Authentication Issues Decision Tree

```
                    ┌─────────────────┐
                    │  Login Failed?  │
                    └─────────┬───────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │  Check Error    │
                    │    Message     │
                    └─────────┬───────┘
                              │
                ┌─────────────┴─────────────┐
                │                           │
                ▼                           ▼
        ┌─────────────┐           ┌─────────────┐
        │"User not   │           │"Invalid    │
        │found"      │           │credentials"│
        └─────────────┘           └─────────────┘
                │                           │
                ▼                           ▼
        ┌─────────────┐           ┌─────────────┐
        │Check Admin │           │Check Password│
        │User Exists?│           │Correct?     │
        └─────────────┘           └─────────────┘
                │                           │
        ┌───────┴───────┐       ┌───────┴───────┐
        │               │       │               │
        ▼               ▼       ▼               ▼
┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐
│Reset Admin  │ │Check Database│ │Verify User   │ │Check JWT    │
│User         ││Permissions  │ │Password     ││Secret      │
│(RESET_ADMIN │ │             │ │Hash         ││            │
│=true)       │ │             │ │             │ │
└─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘
```

### Database Issues Decision Tree

```
                    ┌─────────────────┐
                    │  Data Lost on   │
                    │   Restart?     │
                    └─────────┬───────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │  Check Volume  │
                    │   Mounting    │
                    └─────────┬───────┘
                              │
                ┌─────────────┴─────────────┐
                │                           │
                ▼                           ▼
        ┌─────────────┐           ┌─────────────┐
        │Volume Not   │           │Volume Mounted │
        │Mounted      │           │Correctly    │
        └─────────────┘           └─────────────┘
                │                           │
                ▼                           ▼
        ┌─────────────┐           ┌─────────────┐
        │Configure   │           │Check        │
        │Volume Mount │           │Permissions  │
        │in Dokploy   │           │             │
        └─────────────┘           └─────────────┘
                │                           │
                ▼                           ▼
        ┌─────────────┐           ┌─────────────┐
        │Fix Volume  │           │Fix File     │
        │Permissions │           │Permissions  │
        │and Restart │           │             │
        └─────────────┘           └─────────────┘
```

## Backup and Recovery Flow

### Backup Process Flowchart

```
┌─────────────────┐
│   SCHEDULED    │
│    BACKUP      │
└─────────┬───────┘
          │
          ▼
┌─────────────────┐
│ Create Backup  │
│  Directory    │
└─────────┬───────┘
          │
          ▼
┌─────────────────┐
│ Copy Database  │
│   File        │
└─────────┬───────┘
          │
          ▼
┌─────────────────┐
│ Compress      │
│   Backup      │
└─────────┬───────┘
          │
          ▼
┌─────────────────┐
│ Verify Backup  │
│  Integrity    │
└─────────┬───────┘
          │
          ▼
┌─────────────────┐     YES    ┌─────────────────┐
│   Backup      │────────────►│   Store in    │
│  Valid?       │             │  Multiple     │
└─────────────────┘             │  Locations    │
          │                    └─────────────────┘
          ▼
     NO  │
          ▼
┌─────────────────┐
│   Log Error   │
│   and Retry   │
└─────────────────┘
```

### Recovery Process Flowchart

```
┌─────────────────┐
│   SYSTEM       │
│   FAILURE     │
└─────────┬───────┘
          │
          ▼
┌─────────────────┐
│ Identify      │
│  Failure Type │
└─────────┬───────┘
          │
          ▼
┌─────────────────┐
│ Select        │
│  Recovery     │
│  Strategy    │
└─────────┬───────┘
          │
          ▼
┌─────────────────┐
│   Restore     │
│   from        │
│   Backup      │
└─────────┬───────┘
          │
          ▼
┌─────────────────┐
│ Verify        │
│   System      │
│   Function    │
└─────────┬───────┘
          │
          ▼
┌─────────────────┐     YES    ┌─────────────────┐
│   System      │────────────►│   Return to    │
│  Working?    │             │   Service     │
└─────────────────┘             └─────────────────┘
          │
          ▼
     NO  │
          ▼
┌─────────────────┐
│   Try Next    │
│   Recovery    │
│   Method     │
└─────────────────┘
```

## Security Configuration

### Security Layers Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    SECURITY LAYERS                           │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────────────────────────────────────────────────────┐ │
│  │                NETWORK SECURITY                        │ │
│  │                                                      │ │
│  │  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐ │ │
│  │  │    HTTPS    │    │    CORS     │    │   Firewall  │ │ │
│  │  │  Encryption │    │  Protection │    │   Rules     │ │ │
│  │  └─────────────┘    └─────────────┘    └─────────────┘ │ │
│  └─────────────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────────────┐ │
│  │              APPLICATION SECURITY                   │ │
│  │                                                      │ │
│  │  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐ │ │
│  │  │   JWT       │    │   Password   │    │   Input     │ │ │
│  │  │  Tokens     │    │   Hashing   │    │ Validation │ │ │
│  │  └─────────────┘    └─────────────┘    └─────────────┘ │ │
│  └─────────────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────────────┐ │
│  │                DATA SECURITY                         │ │
│  │                                                      │ │
│  │  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐ │ │
│  │  │  Database   │    │   Volume    │    │   Backup    │ │ │
│  │  │ Encryption │    │ Permissions │    │ Encryption │ │ │
│  │  └─────────────┘    └─────────────┘    └─────────────┘ │ │
│  └─────────────────────────────────────────────────────────────────┘ │
│                                                                 │
└─────────────────────────────────────────────────────────────────────────┘
```

## Performance Monitoring

### Performance Metrics Dashboard

```
┌─────────────────────────────────────────────────────────────────────────┐
│                PERFORMANCE DASHBOARD                           │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐ │
│  │   RESPONSE     │    │   DATABASE     │    │   SYSTEM       │ │
│  │     TIME       │    │   QUERIES     │    │  RESOURCES     │ │
│  │               │    │               │    │               │ │
│  │  Avg: 245ms   │    │  Auth: 12ms   │    │  CPU: 25%      │ │
│  │  P95: 520ms   │    │  User: 8ms    │    │  Mem: 512MB    │ │
│  │  Max: 1.2s    │    │  Load: 5ms    │    │  Disk: 75%     │ │
│  └─────────────────┘    └─────────────────┘    └─────────────────┘ │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────────────┐ │
│  │              AUTHENTICATION METRICS                │ │
│  │                                                      │ │
│  │  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐ │ │
│  │  │   Login     │    │   Token      │    │   Failed    │ │ │
│  │  │  Success    │    │ Validation  │    │  Attempts   │ │ │
│  │  │   Rate      │    │   Rate       │    │   Rate      │ │ │
│  │  │   98.5%     │    │   100%       │    │   1.5%      │ │ │
│  │  └─────────────┘    └─────────────┘    └─────────────┘ │ │
│  └─────────────────────────────────────────────────────────────────┘ │
│                                                                 │
└─────────────────────────────────────────────────────────────────────────┘
```

## Quick Reference Visual Aids

### Authentication Flow Cheat Sheet

```
LOGIN PROCESS:
┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐
│  User   │ │  POST   │ │  Check  │ │ Generate│ │ Return  │
│ enters  │ │ /login   │ │ Database│ │  JWT    │ │ Token   │
│credentials│ │         │ │         │ │         │ │         │
└─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘
```

### Volume Mounting Cheat Sheet

```
VOLUME SETUP:
┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐
│ Create  │ │ Set     │ │ Add     │ │ Verify  │
│Directory│ │Permissions│ │ Volume  │ │ Mount   │
└─────────┘ └─────────┘ └─────────┘ └─────────┘
```

### Troubleshooting Cheat Sheet

```
COMMON ISSUES:
┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐
│ Admin   │ │ Database│ │ JWT     │ │ CORS    │
│ User    │ │ Not     │ │ Token   │ │ Errors  │
│ Missing │ │Persisting│ │ Invalid │ │         │
└─────────┘ └─────────┘ └─────────┘ └─────────┘
```

## Conclusion

These visual aids provide clear understanding of:

1. **System Architecture**: How components interact and relate to each other
2. **Deployment Process**: Step-by-step flow of deployment operations
3. **Authentication Flow**: How user authentication works in the system
4. **Volume Mounting**: How data persistence is achieved
5. **Troubleshooting**: Decision trees for common issues
6. **Security Layers**: Multiple security protections in place
7. **Performance Monitoring**: Key metrics to track system health

Use these diagrams as quick references when deploying, troubleshooting, or maintaining the Workload Management Application on Dokploy.
# Admin User Reset Guide for Dokploy

This guide explains how to create or reset the admin user in your Dokploy-deployed workload application.

## Problem
If you're experiencing 401 Unauthorized errors when trying to login with the admin credentials, it's likely that the admin user hasn't been created in the production database.

## Solutions

### Option 1: Using Docker Exec (Recommended)

1. **Find your container name** in Dokploy:
   - Go to your Dokploy dashboard
   - Navigate to your application
   - Find the container name (usually something like `workload-app-xxxxx`)

2. **Execute the reset script**:
   ```bash
   docker exec -it <container_name> /bin/bash -c 'cd /app && ./docker_reset_admin.sh'
   ```

   Example:
   ```bash
   docker exec -it workload-app-abc123 /bin/bash -c 'cd /app && ./docker_reset_admin.sh'
   ```

### Option 2: Direct Docker Exec

1. **Execute the Node script directly**:
   ```bash
   docker exec -it <container_name> /bin/bash -c 'cd /app && NODE_ENV=production DB_PATH=/app/data/database.sqlite node reset_admin_prod.js'
   ```

### Option 3: Using Dokploy Terminal

1. **Access the container terminal**:
   - In Dokploy, go to your application
   - Click on "Terminal" or "Console"
   - This will open a shell inside your container

2. **Run the reset script**:
   ```bash
   cd /app
   ./docker_reset_admin.sh
   ```

### Option 4: Manual Reset (if scripts don't work)

1. **Access the container terminal** (as in Option 3)

2. **Run Node directly**:
   ```bash
   cd /app
   node -e "
   const database = require('./src/config/database');
   const User = require('./src/models/User');
   
   (async () => {
     try {
       process.env.NODE_ENV = 'production';
       process.env.DB_PATH = '/app/data/database.sqlite';
       
       await database.initialize();
       
       // Delete existing admin if any
       await database.run('DELETE FROM users WHERE username = ?', ['admin']);
       
       // Create new admin
       const adminData = {
         username: 'admin',
         password: 'admin123',
         nama: 'Administrator',
         role: 'Admin',
         nip: null,
         golongan: null,
         jabatan: null
       };
       
       const adminUser = await User.create(adminData);
       console.log('Admin user created:', adminUser);
       
       // Test authentication
       const authResult = await User.authenticate('admin', 'admin123');
       console.log('Authentication test:', authResult ? 'SUCCESS' : 'FAILED');
       
       await database.close();
     } catch (error) {
       console.error('Error:', error.message);
     }
   })();
   "
   ```

## Verification

After running any of the above options, you should see output indicating:
1. ✅ Connected to production database
2. ✅ Admin user created successfully
3. ✅ Verification successful
4. ✅ Authentication successful

## Login Credentials

Once the admin user is created, you can login with:
- **Username**: `admin`
- **Password**: `admin123`
- **URL**: `https://your-domain.com/login`

## Troubleshooting

### Permission Denied
If you get permission errors, make sure the scripts are executable:
```bash
docker exec -it <container_name> chmod +x /app/docker_reset_admin.sh
```

### Database Connection Issues
If the database connection fails, check:
1. The database directory exists: `/app/data`
2. The database file is writable: `/app/data/database.sqlite`

### Container Not Found
If you can't find the container name:
```bash
docker ps | grep workload
```

### Still Getting 401 Errors
If you still get 401 errors after creating the admin user:
1. Clear your browser cache and cookies
2. Try an incognito/private browser window
3. Check the application logs in Dokploy for any errors

## Automation (Optional)

To automatically create the admin user when the container starts, you could modify the Dockerfile CMD:

```dockerfile
# Start application with admin reset
CMD ["/bin/sh", "-c", "cd /app && ./docker_reset_admin.sh && npm start"]
```

However, this is not recommended for production as it will reset the admin user every time the container restarts.

## Security Note

The default password `admin123` is only for initial setup. After logging in:
1. Go to the user management section
2. Change the admin password to something secure
3. Consider creating additional admin users if needed
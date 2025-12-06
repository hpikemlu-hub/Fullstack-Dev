# 🔧 ENVIRONMENT VARIABLES - COMPLETE GUIDE

**For Coolify Production Deployment**

---

## 📋 **HOW TO GET EACH ENVIRONMENT VARIABLE**

### **1. NODE_ENV** ✅ (Sudah Fix)
```env
NODE_ENV=production
```
**Cara dapat**: Ini **fixed value** untuk production. Copy exact seperti ini.

---

### **2. PORT** ✅ (Sudah Fix) 
```env
PORT=3000
```
**Cara dapat**: Ini **default port** Next.js. Copy exact seperti ini.

---

### **3. JWT_SECRET** 🔑 (Generate Baru)
```env
JWT_SECRET=secure-production-secret-minimum-32-characters-long
```
**Cara dapat**: **Generate random string 32+ karakter**

**Option A - Manual Generate:**
```bash
# Buat string random 32+ karakter, contoh:
JWT_SECRET=MyApp2024SecureJWTSecretForProductionUse123456789
```

**Option B - Auto Generate (Recommend):**
```bash
# Gunakan online generator atau command:
# openssl rand -base64 32
# Hasil contoh: "xK9mP4vN2wQ8rE5tY7uI3oP1aS6dF0gH9jK2lZ8xC4vB7nM3qW"
```

**Option C - Use This Ready Secret:**
```env
JWT_SECRET=WorkloadApp2024ProductionSecureJWTSecret32CharsMin
```

---

### **4. JWT_REFRESH_SECRET** 🔑 (Generate Baru)
```env
JWT_REFRESH_SECRET=secure-production-refresh-secret-minimum-32-characters
```
**Cara dapat**: **Generate string berbeda dari JWT_SECRET**

**Ready to Use:**
```env
JWT_REFRESH_SECRET=WorkloadRefreshToken2024SecureProductionKey32Chars
```

---

### **5. NEXT_PUBLIC_BASE_URL** 🌐 (Dari Coolify)
```env
NEXT_PUBLIC_BASE_URL=https://your-app.coolify-domain.com
```
**Cara dapat**: 
1. **Di Coolify Dashboard** → Your Application
2. Look for **"Domains"** atau **"URL"** section
3. Copy URL yang diberikan Coolify

**Format biasanya:**
```
https://app-name-random.coolify-domain.com
# atau
https://your-app.your-coolify-instance.com
```

**Temporary (jika belum ada domain):**
```env
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

---

### **6. DATABASE_URL** ✅ (Sudah Fix)
```env
DATABASE_URL=file:./production.db
```
**Cara dapat**: Ini **fixed value** untuk SQLite. Copy exact seperti ini.

---

## 🎯 **READY TO COPY - FINAL VALUES**

### **Production-Ready Environment Variables:**
```env
NODE_ENV=production
PORT=3000
JWT_SECRET=WorkloadApp2024ProductionSecureJWTSecret32CharsMin
JWT_REFRESH_SECRET=WorkloadRefreshToken2024SecureProductionKey32Chars
NEXT_PUBLIC_BASE_URL=REPLACE_WITH_COOLIFY_DOMAIN
DATABASE_URL=file:./production.db
```

### **Steps to Complete:**
1. ✅ **Copy 4 values** yang sudah ready (NODE_ENV, PORT, JWT_SECRET, JWT_REFRESH_SECRET, DATABASE_URL)
2. 🌐 **Get domain** dari Coolify dashboard setelah aplikasi dibuat
3. 🔄 **Replace** NEXT_PUBLIC_BASE_URL dengan domain Coolify

---

## 📍 **WHERE TO FIND COOLIFY DOMAIN**

### **After Creating Application:**
1. **Coolify Dashboard** → Applications
2. **Select Your App** → Settings/Configuration
3. **Look for**: 
   - "Domains" tab
   - "Public URL" 
   - "Application URL"
   - "Exposed Domains"

### **Domain Format Examples:**
```
https://workload-management-abc123.coolify.example.com
https://fullstack-dev-xyz789.yourdomain.com  
https://app-random-string.coolify-instance.com
```

---

## 🚀 **QUICK ACTION PLAN**

### **Now (Immediate):**
```env
# Set these 5 values in Coolify Environment Variables:
NODE_ENV=production
PORT=3000
JWT_SECRET=WorkloadApp2024ProductionSecureJWTSecret32CharsMin
JWT_REFRESH_SECRET=WorkloadRefreshToken2024SecureProductionKey32Chars
DATABASE_URL=file:./production.db
```

### **After Deployment (Update):**
```env
# Update this after you get Coolify domain:
NEXT_PUBLIC_BASE_URL=https://your-actual-coolify-domain.com
```

---

## 🔍 **VERIFICATION**

### **Check If Variables Are Set:**
After deployment, test:
```bash
curl https://your-domain.com/api/health
# Should return: {"status":"healthy",...}
```

### **If Environment Issues:**
- Check Coolify Environment tab
- Restart application after variable changes
- View logs for environment errors

---

**🎯 Ready to set these in Coolify dashboard now!** 🚀
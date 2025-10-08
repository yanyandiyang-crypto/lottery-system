# Fix: AWS RDS SSL Connection Error

## Error from Logs:
```
could not accept SSL connection: EOF detected
```

## What This Means:
✅ Your connection IS reaching AWS RDS (security group works!)  
❌ SSL handshake is failing  
🔧 Need to configure SSL properly in pgAdmin  

---

## Quick Fix: pgAdmin SSL Configuration

### Method 1: Relaxed SSL (Testing Only)

1. **pgAdmin 4** → Right-click server → **Properties**
2. **SSL tab:**
   ```
   SSL mode: Prefer
   ```
3. **Save** and try connecting

If this works, RDS is accessible! For production, use Method 2.

---

### Method 2: Proper SSL (Production)

1. **Download AWS RDS CA Certificate:**
   ```
   https://truststore.pki.rds.amazonaws.com/global/global-bundle.pem
   ```
   Save to: `C:\AWS\rds-ca-bundle.pem`

2. **pgAdmin SSL tab:**
   ```
   SSL mode: Require
   Root certificate: C:\AWS\rds-ca-bundle.pem
   ```

3. **Save** and connect

---

## SSL Mode Options Explained

| Mode | Description | Use Case |
|------|-------------|----------|
| **Disable** | No SSL | Testing only - NOT recommended |
| **Prefer** | Try SSL, fallback to non-SSL | Quick testing |
| **Require** | SSL required, no cert verification | Good for development |
| **Verify-CA** | Verify certificate authority | Better security |
| **Verify-Full** | Full SSL verification | Production (best) |

---

## Connection String Format (with SSL)

For Elastic Beanstalk or direct connection:

```bash
# Require SSL
postgresql://username:password@endpoint.rds.amazonaws.com:5432/postgres?sslmode=require

# Disable SSL (testing)
postgresql://username:password@endpoint.rds.amazonaws.com:5432/postgres?sslmode=disable
```

---

## Test Connection via Command Line

```powershell
# Install PostgreSQL client first if needed
# Download from: https://www.postgresql.org/download/windows/

# Test with SSL required
psql "postgresql://lottery_admin:YOUR_PASSWORD@your-endpoint.rds.amazonaws.com:5432/postgres?sslmode=require"

# Test without SSL (to verify connection works)
psql "postgresql://lottery_admin:YOUR_PASSWORD@your-endpoint.rds.amazonaws.com:5432/postgres?sslmode=disable"
```

---

## Update Environment Variables

Once you confirm the SSL mode that works, update your Elastic Beanstalk:

```bash
# With SSL required (recommended)
eb setenv DATABASE_URL="postgresql://username:password@endpoint.rds.amazonaws.com:5432/postgres?sslmode=require"

# Without SSL (not recommended for production)
eb setenv DATABASE_URL="postgresql://username:password@endpoint.rds.amazonaws.com:5432/postgres?sslmode=disable"
```

---

## pgAdmin 4 Complete Settings

### General Tab:
```
Name: AWS Lottery RDS
```

### Connection Tab:
```
Host:     your-database.xxxxx.us-east-1.rds.amazonaws.com
Port:     5432
Database: postgres
Username: lottery_admin
Password: your_password
✅ Save password
```

### SSL Tab (Choose one):

**Option A - Quick (Development):**
```
SSL mode: Prefer
```

**Option B - Secure (Production):**
```
SSL mode: Require
Root certificate: C:\AWS\rds-ca-bundle.pem
```

### Advanced Tab:
```
(Leave default)
```

---

## Download AWS RDS Certificate

### PowerShell Command:
```powershell
# Create directory
New-Item -ItemType Directory -Force -Path "C:\AWS"

# Download certificate
Invoke-WebRequest -Uri "https://truststore.pki.rds.amazonaws.com/global/global-bundle.pem" -OutFile "C:\AWS\rds-ca-bundle.pem"

# Verify download
Get-Item "C:\AWS\rds-ca-bundle.pem"
```

---

## Troubleshooting

### Still getting SSL error?

1. **Try SSL mode: Disable** (just to test)
   - If this works → It's purely SSL config issue
   - Then switch to `Require` for production

2. **Check RDS SSL settings:**
   - AWS Console → RDS → Your database
   - Configuration → Look for "Certificate authority"

3. **Update certificate if needed:**
   - Some older RDS instances need certificate rotation
   - AWS Console → RDS → Modify → Certificate authority

### Connection works in pgAdmin but not in app?

Add `?sslmode=require` to your DATABASE_URL:

```javascript
// In your code or .env
DATABASE_URL=postgresql://user:pass@host:5432/db?sslmode=require
```

---

## Success Indicators

✅ pgAdmin connects without timeout  
✅ Can see database tables  
✅ Can run queries  
✅ Logs show successful connection (not EOF detected)  

---

## Your Current Status

Based on your logs:
- ✅ Security group configured correctly
- ✅ RDS is publicly accessible  
- ✅ Connection reaches RDS
- 🔧 Need to fix: SSL configuration in pgAdmin

**Next step:** Change SSL mode to "Prefer" in pgAdmin and try again!


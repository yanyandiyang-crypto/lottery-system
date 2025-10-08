# Quick Reference: Connect AWS RDS to pgAdmin 4

## ⚡ 5-Minute Setup

### Step 1️⃣: Open AWS RDS Security Group

1. AWS Console → RDS → Your Database
2. Click on **VPC security group**
3. **Inbound rules** → **Edit inbound rules** → **Add rule**
4. Add this:
   ```
   Type: PostgreSQL
   Port: 5432
   Source: My IP
   ```
5. **Save rules**

### Step 2️⃣: Get Connection Details

From RDS Console → Your Database:

```
✏️ Note these down:

Endpoint: ___________________________________.rds.amazonaws.com
Port: 5432
Database: postgres
Username: lottery_admin
Password: (your password)
```

### Step 3️⃣: Add Server in pgAdmin 4

**General Tab:**
```
Name: AWS Lottery Database
```

**Connection Tab:**
```
Host:     [Paste your RDS endpoint here]
Port:     5432
Database: postgres
Username: lottery_admin
Password: [Your password]
✅ Save password
```

**SSL Tab:**
```
SSL mode: Require
```

Click **Save** → Done! ✅

---

## 🔧 Troubleshooting

| Error | Fix |
|-------|-----|
| "Could not connect" | Check security group allows port 5432 from your IP |
| "Timeout" | Set RDS to "Publicly accessible" = Yes |
| "Authentication failed" | Double-check username/password |
| "SSL required" | Set SSL mode to "Require" in pgAdmin |

---

## 📋 Post-Connection Tasks

### 1. Create Application Database (Optional)
```sql
CREATE DATABASE lottery_system;
```

### 2. Run Migrations
```bash
set DATABASE_URL=postgresql://lottery_admin:password@endpoint:5432/postgres
npx prisma migrate deploy
```

### 3. Update Elastic Beanstalk
```bash
eb setenv DATABASE_URL="postgresql://lottery_admin:password@endpoint:5432/postgres"
```

---

**📖 Need detailed guide? See CONNECT_AWS_RDS_PGADMIN.md**


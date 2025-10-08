# Connect AWS RDS PostgreSQL to pgAdmin 4

Complete guide to connect your AWS RDS database to pgAdmin 4 for easy database management.

---

## Prerequisites

✅ AWS RDS PostgreSQL database created  
✅ pgAdmin 4 installed on your computer  
✅ Database endpoint and credentials ready  

---

## Step 1: Configure RDS Security Group (IMPORTANT!)

By default, AWS RDS blocks all external connections. You need to allow your IP address.

### Option A: Using AWS Console (Recommended)

1. **Go to RDS Console:**
   - https://console.aws.amazon.com/rds

2. **Select Your Database:**
   - Click on your database (e.g., `lottery-database`)

3. **Find Security Group:**
   - Scroll to **Connectivity & security** section
   - Under **VPC security groups**, click on the security group link
   - (e.g., `default (sg-xxxxx)`)

4. **Edit Inbound Rules:**
   - Click **Inbound rules** tab
   - Click **Edit inbound rules**
   - Click **Add rule**

5. **Add PostgreSQL Rule:**
   ```
   Type:       PostgreSQL
   Protocol:   TCP
   Port:       5432
   Source:     My IP (automatically detects your IP)
   Description: pgAdmin access from my computer
   ```
   
   **OR for testing (less secure):**
   ```
   Type:       PostgreSQL
   Protocol:   TCP
   Port:       5432
   Source:     Anywhere-IPv4 (0.0.0.0/0)
   Description: Temporary public access
   ```
   ⚠️ **Warning:** `0.0.0.0/0` allows access from anywhere. Only use for testing!

6. **Save Rules:**
   - Click **Save rules**

### Option B: Using AWS CLI

```bash
# Get your security group ID
aws rds describe-db-instances --db-instance-identifier lottery-database --query 'DBInstances[0].VpcSecurityGroups[0].VpcSecurityGroupId'

# Add inbound rule (replace sg-xxxxx with your security group ID)
aws ec2 authorize-security-group-ingress \
  --group-id sg-xxxxx \
  --protocol tcp \
  --port 5432 \
  --cidr YOUR_IP_ADDRESS/32
```

---

## Step 2: Get RDS Connection Details

### From AWS Console:

1. Go to **RDS Console**
2. Click on your database instance
3. Find these details in **Connectivity & security**:

```
Endpoint:   lottery-database.xxxxxxxxxxxx.us-east-1.rds.amazonaws.com
Port:       5432
```

4. Find these in **Configuration**:

```
DB name:    postgres (or your custom database name)
Username:   lottery_admin (or your master username)
```

5. **Password:** The one you created during RDS setup

### Full Connection String Format:

```
Host:     lottery-database.xxxxxxxxxxxx.us-east-1.rds.amazonaws.com
Port:     5432
Database: postgres
Username: lottery_admin
Password: your_password_here
```

---

## Step 3: Connect Using pgAdmin 4

### 3.1 Open pgAdmin 4

1. Launch pgAdmin 4 on your computer
2. Wait for it to open in your browser

### 3.2 Create New Server

1. **Right-click** on **Servers** in the left panel
2. Click **Create** → **Server**

### 3.3 General Tab

```
Name: AWS Lottery Database
```
(You can name it anything you like)

### 3.4 Connection Tab

Fill in these details:

```
Host name/address:  lottery-database.xxxxxxxxxxxx.us-east-1.rds.amazonaws.com
Port:               5432
Maintenance database: postgres
Username:           lottery_admin
Password:           your_rds_password
Save password:      ✅ (Check this box)
```

**Example:**
```
Host:     lottery-db.c7a8b9c0d1e2.us-east-1.rds.amazonaws.com
Port:     5432
Database: postgres
Username: lottery_admin
Password: MySecurePass123!
```

### 3.5 SSL Tab (Optional but Recommended)

For secure connection:

```
SSL mode: Require
```

### 3.6 Advanced Tab (Optional)

```
DB restriction: lottery_system (if you created a custom database)
```

### 3.7 Save

1. Click **Save**
2. pgAdmin will attempt to connect

---

## Step 4: Verify Connection

If successful, you should see:

```
Servers
└── AWS Lottery Database
    └── Databases
        └── postgres
            ├── Schemas
            ├── Tables
            └── ...
```

---

## Troubleshooting

### ❌ Error: "Could not connect to server"

**Cause:** Security group not configured

**Solution:**
1. Check RDS security group allows inbound on port 5432
2. Verify your IP address is whitelisted
3. Check if "Publicly accessible" is set to "Yes" in RDS settings

**Fix RDS Public Access:**
```bash
# Make RDS publicly accessible
aws rds modify-db-instance \
  --db-instance-identifier lottery-database \
  --publicly-accessible \
  --apply-immediately
```

### ❌ Error: "Password authentication failed"

**Cause:** Wrong username or password

**Solution:**
1. Verify username in RDS Console → Configuration → Master username
2. If you forgot password, reset it:
   - RDS Console → Select database → **Modify**
   - New master password → Enter new password
   - Apply immediately

### ❌ Error: "Timeout"

**Cause:** Network/firewall blocking connection

**Solution:**
1. Check your internet connection
2. Verify security group rules
3. Check if your company/ISP blocks port 5432
4. Try using VPN

### ❌ Error: "SSL connection required"

**Solution:**
In pgAdmin connection settings:
- Go to **SSL** tab
- Set **SSL mode** to **Require**

### ❌ Can't find database endpoint

**Get it via AWS CLI:**
```bash
aws rds describe-db-instances \
  --db-instance-identifier lottery-database \
  --query 'DBInstances[0].Endpoint.Address' \
  --output text
```

---

## Step 5: Create Application Database (Optional)

Once connected, you may want to create a separate database for your lottery system:

1. **In pgAdmin:**
   - Right-click **Databases**
   - Click **Create** → **Database**
   
2. **Database Settings:**
   ```
   Database: lottery_system
   Owner: lottery_admin
   ```

3. **Update Connection String:**
   ```
   postgresql://lottery_admin:password@endpoint.rds.amazonaws.com:5432/lottery_system
   ```

---

## Quick Connection Test via Command Line

Before using pgAdmin, test connection with psql:

```bash
# Install psql (if not already installed)
# Windows: Download PostgreSQL from postgresql.org
# Mac: brew install postgresql
# Linux: sudo apt-get install postgresql-client

# Test connection
psql -h lottery-database.xxxxxxxxxxxx.us-east-1.rds.amazonaws.com \
     -p 5432 \
     -U lottery_admin \
     -d postgres
```

Enter password when prompted. If successful, you'll see:
```
postgres=>
```

---

## Security Best Practices

### ✅ For Development:

```
Security Group Inbound Rule:
- Port: 5432
- Source: My IP (your specific IP address)
```

### ✅ For Production:

1. **Use VPC and Private Subnet:**
   - Keep RDS in private subnet
   - Connect via VPN or bastion host

2. **Restrict Security Group:**
   ```
   Allow 5432 from:
   - Elastic Beanstalk security group only
   - VPN server IP only
   ```

3. **Use IAM Database Authentication:**
   - Instead of passwords
   - More secure

4. **Enable Encryption:**
   - Enable encryption at rest
   - Use SSL/TLS for connections

### ❌ Avoid:

- ❌ Don't use `0.0.0.0/0` (anywhere) in production
- ❌ Don't commit passwords to GitHub
- ❌ Don't use default/weak passwords

---

## Complete Connection Example

### Your RDS Details (Example):
```
Endpoint: lottery-db.c1d2e3f4g5h6.us-east-1.rds.amazonaws.com
Port: 5432
Database: postgres
Username: lottery_admin
Password: MySecurePassword123!
```

### pgAdmin 4 Setup:

**General Tab:**
- Name: `AWS Lottery RDS`

**Connection Tab:**
- Host: `lottery-db.c1d2e3f4g5h6.us-east-1.rds.amazonaws.com`
- Port: `5432`
- Database: `postgres`
- Username: `lottery_admin`
- Password: `MySecurePassword123!`
- Save password: ✅

**SSL Tab:**
- SSL mode: `Require`

Click **Save** → Connected! ✅

---

## Environment Variable for Your App

Once connected and tested, use this in Elastic Beanstalk:

```bash
eb setenv DATABASE_URL="postgresql://lottery_admin:MySecurePassword123!@lottery-db.c1d2e3f4g5h6.us-east-1.rds.amazonaws.com:5432/postgres"
```

---

## Run Prisma Migrations

After connecting, run your database migrations:

```bash
# Set DATABASE_URL
set DATABASE_URL=postgresql://lottery_admin:password@endpoint.rds.amazonaws.com:5432/postgres

# Run migrations
npx prisma migrate deploy

# Generate Prisma Client
npx prisma generate
```

---

## Useful pgAdmin 4 Features

Once connected:

### View Tables:
```
Servers → AWS Lottery Database → Databases → postgres → Schemas → public → Tables
```

### Run Queries:
1. Right-click on database
2. Click **Query Tool**
3. Write SQL:
```sql
SELECT * FROM users LIMIT 10;
```

### Import/Export Data:
1. Right-click on table
2. **Import/Export Data**

### Backup Database:
1. Right-click on database
2. **Backup**
3. Save as `.sql` file

---

## Summary Checklist

- [ ] RDS database created
- [ ] Security group configured (port 5432 open)
- [ ] RDS publicly accessible (for development)
- [ ] Connection details noted down
- [ ] pgAdmin 4 installed
- [ ] Server created in pgAdmin
- [ ] Connection successful
- [ ] Database visible in pgAdmin
- [ ] Migrations run successfully

---

## Next Steps

1. ✅ Connect pgAdmin to RDS
2. ✅ Run Prisma migrations
3. ✅ Create initial admin user
4. ✅ Update Elastic Beanstalk DATABASE_URL
5. ✅ Test backend API connection

---

**Need help? Check AWS_AMPLIFY_SETUP.md for full deployment guide!**


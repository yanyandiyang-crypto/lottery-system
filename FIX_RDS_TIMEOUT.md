# Fix: AWS RDS Connection Timeout

## ⚠️ Error: "connection timeout expired"

This means AWS is blocking your connection. Follow these steps:

---

## Fix 1: Configure Security Group (90% of cases)

### Step-by-Step:

1. **Go to AWS RDS Console:**
   - https://console.aws.amazon.com/rds

2. **Click on your database instance**
   - Find and click your database (e.g., `lottery-database`)

3. **Find the Security Group:**
   - Look for **"Connectivity & security"** tab
   - Under **"VPC security groups"**, you'll see something like:
     ```
     default (sg-xxxxxxxxxxxxx)
     ```
   - **Click on the security group name**

4. **Edit Inbound Rules:**
   - You'll be taken to EC2 Security Groups
   - Click the **"Inbound rules"** tab at the bottom
   - Click **"Edit inbound rules"** button

5. **Check Existing Rules:**
   - Look for a rule with **Port 5432**
   - If it doesn't exist, you need to add it!

6. **Add New Rule:**
   - Click **"Add rule"** button
   - Configure:
     ```
     Type:         PostgreSQL
     Protocol:     TCP
     Port range:   5432
     Source:       My IP
     Description:  pgAdmin access
     ```

7. **Get Your IP Automatically:**
   - When you select "My IP", AWS auto-detects your current IP
   - Or manually enter your IP address

8. **Save Rules:**
   - Click **"Save rules"**
   - Wait 10 seconds for changes to apply

---

## Fix 2: Enable Public Access

1. **Go back to RDS Console**
2. **Select your database**
3. **Click "Modify"** button (top right)
4. **Scroll to "Connectivity"** section
5. **Find "Public access"**
6. **Select "Yes" (Publicly accessible)**
7. **Scroll to bottom**
8. **Click "Continue"**
9. **Select "Apply immediately"**
10. **Click "Modify DB instance"**

Wait 2-5 minutes for changes to apply.

---

## Fix 3: Check Network Settings

### Get Your Current IP:

Open PowerShell and run:
```powershell
Invoke-RestMethod -Uri "https://api.ipify.org?format=json" | Select-Object -ExpandProperty ip
```

This shows your public IP address that needs to be whitelisted.

### Add This IP to Security Group:

1. Go to Security Group (from Fix 1)
2. Edit inbound rules
3. Add rule with your IP:
   ```
   Type:   PostgreSQL
   Port:   5432
   Source: [Your IP from above]/32
   ```

---

## Fix 4: Verify RDS Status

Before connecting, make sure RDS is running:

1. **RDS Console → Databases**
2. **Check Status:**
   - Should say: **"Available"** ✅
   - If it says "Modifying", wait a few minutes

---

## Quick Test: AWS CLI Method

If you have AWS CLI installed:

```bash
# Get DB instance status
aws rds describe-db-instances --db-instance-identifier lottery-database --query 'DBInstances[0].DBInstanceStatus'

# Get endpoint
aws rds describe-db-instances --db-instance-identifier lottery-database --query 'DBInstances[0].Endpoint.Address' --output text

# Get security groups
aws rds describe-db-instances --db-instance-identifier lottery-database --query 'DBInstances[0].VpcSecurityGroups[*].[VpcSecurityGroupId,Status]'

# Check if publicly accessible
aws rds describe-db-instances --db-instance-identifier lottery-database --query 'DBInstances[0].PubliclyAccessible'
```

---

## Visual Checklist

Use this to verify settings:

### ✅ Security Group Inbound Rules:
```
┌────────────────────────────────────────────────┐
│ Inbound Rules                                  │
├────────┬──────────┬──────┬────────────────────┤
│ Type   │ Protocol │ Port │ Source             │
├────────┼──────────┼──────┼────────────────────┤
│ Postgre│ TCP      │ 5432 │ Your IP/32     ✅  │
│  SQL   │          │      │                    │
└────────┴──────────┴──────┴────────────────────┘
```

### ✅ RDS Settings:
```
Publicly accessible:    Yes ✅
Status:                 Available ✅
VPC security group:     Has inbound rule ✅
```

---

## Test Connection from Command Line

Before using pgAdmin, test with `telnet`:

### Windows PowerShell:
```powershell
# Test if port 5432 is reachable
Test-NetConnection -ComputerName your-database.xxxxx.us-east-1.rds.amazonaws.com -Port 5432
```

**Expected output if working:**
```
TcpTestSucceeded : True ✅
```

**If failed:**
```
TcpTestSucceeded : False ❌
```
→ Security group is still blocking

---

## Alternative: Use Temporary "Allow All"

**⚠️ For Testing ONLY - Not secure for production!**

If you're still having issues, temporarily allow all IPs:

1. Security Group → Inbound Rules
2. Add rule:
   ```
   Type:   PostgreSQL
   Port:   5432
   Source: Anywhere-IPv4 (0.0.0.0/0)
   ```

This proves it's a security group issue. **Remove this rule after testing!**

---

## Complete Fix Commands (AWS CLI)

Replace `sg-xxxxxxxxx` with your security group ID:

```bash
# Get your current public IP
$MY_IP = (Invoke-RestMethod -Uri "https://api.ipify.org?format=json").ip
echo "Your IP: $MY_IP"

# Get security group ID
$SG_ID = aws rds describe-db-instances --db-instance-identifier lottery-database --query 'DBInstances[0].VpcSecurityGroups[0].VpcSecurityGroupId' --output text
echo "Security Group: $SG_ID"

# Add inbound rule (replace with actual values)
aws ec2 authorize-security-group-ingress `
  --group-id $SG_ID `
  --protocol tcp `
  --port 5432 `
  --cidr "$MY_IP/32"

# Make RDS publicly accessible
aws rds modify-db-instance `
  --db-instance-identifier lottery-database `
  --publicly-accessible `
  --apply-immediately
```

---

## After Fixing - Reconnect in pgAdmin

1. Open pgAdmin 4
2. Right-click on your failed server connection
3. Click **"Disconnect Server"** (if connected)
4. Right-click again → **"Properties"**
5. Verify **Connection** tab:
   ```
   Host:     [Your RDS endpoint]
   Port:     5432
   Database: postgres
   Username: lottery_admin
   Password: [Your password]
   ```
6. Click **"Save"**
7. Click on the server to connect

---

## Still Not Working?

### Check These:

1. **Endpoint is correct:**
   - Should end in `.rds.amazonaws.com`
   - Copy from RDS Console exactly

2. **Database name:**
   - Default is `postgres`
   - Check RDS Console → Configuration → DB name

3. **Username:**
   - Check RDS Console → Configuration → Master username
   - Usually `postgres` or `lottery_admin`

4. **Port:**
   - Should be `5432`
   - Check RDS Console → Connectivity & security → Port

5. **Your ISP/Network:**
   - Some ISPs block port 5432
   - Try from different network (mobile hotspot)
   - Try using VPN

6. **Firewall:**
   - Windows Firewall might block outbound
   - Temporarily disable to test

---

## Success Indicators

You'll know it's working when:

✅ `Test-NetConnection` shows `TcpTestSucceeded : True`  
✅ pgAdmin connects without timeout  
✅ You see "Databases" folder in pgAdmin  
✅ Can run queries in Query Tool  

---

## Need More Help?

Run this diagnostic script:

```powershell
# Save as check-rds.ps1
Write-Host "=== RDS Connection Diagnostics ===" -ForegroundColor Cyan
Write-Host ""

# Your RDS endpoint (replace with yours)
$RDS_ENDPOINT = Read-Host "Enter your RDS endpoint"

Write-Host "Testing connection to $RDS_ENDPOINT..." -ForegroundColor Yellow
$result = Test-NetConnection -ComputerName $RDS_ENDPOINT -Port 5432

if ($result.TcpTestSucceeded) {
    Write-Host "✅ Port 5432 is REACHABLE" -ForegroundColor Green
    Write-Host "You should be able to connect with pgAdmin" -ForegroundColor Green
} else {
    Write-Host "❌ Port 5432 is BLOCKED" -ForegroundColor Red
    Write-Host "Fix needed:" -ForegroundColor Yellow
    Write-Host "1. Check RDS Security Group allows your IP" -ForegroundColor Yellow
    Write-Host "2. Ensure RDS is publicly accessible" -ForegroundColor Yellow
    Write-Host "3. Verify your IP: $((Invoke-RestMethod -Uri 'https://api.ipify.org').Trim())" -ForegroundColor Yellow
}
```

Run it:
```powershell
powershell -ExecutionPolicy Bypass -File check-rds.ps1
```

---

**Most Common Fix:** Security Group + Public Access = Problem Solved! 🎉


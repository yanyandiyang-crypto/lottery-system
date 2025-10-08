# ✅ pgAdmin4 Connection Settings - NEW Database

## 📋 **CORRECT Connection Details**

Based on your NEW database URL:
```
postgresql://lottery:NOfMMQoXGSlSaMZVbpHMJWIPA4f3vmrZ@dpg-d3j4juc9c44c73b6m6c0-a.oregon-postgres.render.com/lottery_m6px
```

---

## 🔧 **pgAdmin4 Configuration (EXACT SETTINGS)**

### General Tab:
```
Name: Render Lottery NEW Database
Server group: Servers
```

### Connection Tab (COPY EXACTLY):

```
Host name/address:
dpg-d3j4juc9c44c73b6m6c0-a.oregon-postgres.render.com

Port:
5432

Maintenance database:
lottery_m6px

Username:
lottery
(NOT postgres! Use: lottery)

Password:
NOfMMQoXGSlSaMZVbpHMJWIPA4f3vmrZ

Save password: ✅ YES
```

### SSL Tab (IMPORTANT):

```
SSL mode: Require
(NOT Prefer - use REQUIRE)

Root certificate: (leave empty)
Client certificate: (leave empty)
Client certificate key: (leave empty)
```

### Advanced Tab:

```
DB restriction: lottery_m6px
```

### Parameters Tab (ADD THIS - IMPORTANT):

```
Add these parameters to fix disconnection:

connect_timeout: 30
keepalives: 1
keepalives_idle: 30
keepalives_interval: 10
keepalives_count: 5
```

---

## ⚠️ **Issue You're Having:**

Your logs show:
```
✅ Connection authorized
✅ SSL enabled
❌ Disconnection after 3 seconds
```

**Problem:** Using wrong username (`postgres` instead of `lottery`)

**Solution:** Update pgAdmin4 connection to use `lottery` as username

---

## 🔧 **Fix in pgAdmin4:**

### Update Connection:

1. **Open pgAdmin4**
2. **Right-click** your Render server
3. **Click:** "Properties"
4. **Connection Tab:**
   - Change **Username** from `postgres` to `lottery`
   - Change **Password** to `NOfMMQoXGSlSaMZVbpHMJWIPA4f3vmrZ`
   - Change **Database** to `lottery_m6px`
   - Change **Host** to `dpg-d3j4juc9c44c73b6m6c0-a.oregon-postgres.render.com`
5. **SSL Tab:**
   - Change **SSL mode** to `Require`
6. **Advanced → Parameters Tab:**
   - Add: `connect_timeout=30`
   - Add: `keepalives=1`
   - Add: `keepalives_idle=30`
7. **Click:** "Save"
8. **Try connecting again**

---

## ✅ **Alternative: Create NEW Server**

Dili lang i-update, create new:

### Delete old connection:
```
Right-click Render server → Remove Server
```

### Create new with CORRECT settings:

**General:**
```
Name: Render Lottery DB (NEW)
```

**Connection:**
```
Host: dpg-d3j4juc9c44c73b6m6c0-a.oregon-postgres.render.com
Port: 5432
Database: lottery_m6px
Username: lottery
Password: NOfMMQoXGSlSaMZVbpHMJWIPA4f3vmrZ
Save password: ✅
```

**SSL:**
```
SSL mode: Require
```

**Advanced:**
```
DB restriction: lottery_m6px
```

**Save and Connect!**

---

## 🎯 **Most Common Issues:**

### Issue 1: Wrong Username ❌
```
You used: postgres
Correct: lottery

Fix: Update username in Connection tab
```

### Issue 2: SSL Mode Wrong ❌
```
You used: Prefer or Disable
Correct: Require

Fix: SSL tab → Set to "Require"
```

### Issue 3: Timeout Too Short ❌
```
Default: 10 seconds
Better: 30 seconds

Fix: Parameters tab → connect_timeout=30
```

---

## 🧪 **Test Connection:**

After updating settings:

1. **Click:** "Connect" or double-click server name
2. **Should see:**
   ```
   ✅ Connected!
   └─ Databases
      └─ lottery_m6px
         └─ Schemas
            └─ public
               └─ Tables (should see your tables)
   ```

3. **If still disconnects:**
   - Try: SSL mode = "Prefer" instead of "Require"
   - Add: application_name=pgAdmin4 in Parameters
   - Increase: connect_timeout=60

---

## 💡 **If Still Not Working:**

### Check Render Dashboard:

```
1. Dashboard → Databases → lottery_m6px
2. Click: "Info" tab
3. Check: "Connections" section
4. Verify: External connections allowed?

Free plan:
❌ Might not allow external connections

Paid plan ($7/mo):
✅ External connections allowed
```

---

## 🚀 **Easiest Solution: Use Render Web Shell**

Since you have connection issues:

### Render Dashboard SQL:

1. **Go to:** https://dashboard.render.com
2. **Databases** → `lottery_m6px`
3. **Click:** "Connect" button
4. **Click:** "PSQL"
5. **Opens:** SQL terminal in browser!

**Run queries:**
```sql
-- List tables
\dt

-- View all users
SELECT * FROM users;

-- Create tables (if empty)
-- Run your SQL schema file
```

---

## ✅ **Summary:**

### To Fix pgAdmin4 Connection:

**Change these in pgAdmin4:**
1. Username: `postgres` → `lottery`
2. Password: Update to new password
3. Database: Update to `lottery_m6px`
4. Host: Update to new host
5. SSL: Set to `Require`
6. Parameters: Add timeouts

### If Still Fails:

**Use Render Web Shell instead:**
- Dashboard → Connect → PSQL
- Works 100% of the time! ✅

---

**Try updating pgAdmin4 connection karon with CORRECT username: `lottery`** 🔧

**The connection IS working, just using wrong credentials!** 💪


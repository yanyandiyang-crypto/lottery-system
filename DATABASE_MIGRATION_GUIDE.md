# 🗄️ Database Migration Guide: Local → Render

## Overview
This guide will help you migrate your local PostgreSQL database to Render's PostgreSQL service.

## 📋 Prerequisites
- PostgreSQL installed locally
- Access to your Render dashboard
- Your local database running
- Render database created

## 🚀 Migration Methods

### Method 1: Automated Setup (Recommended)
```bash
# Run the setup script
node setup-migration.js

# Follow the prompts to configure your databases
# Then run the migration
migrate-database.bat
```

### Method 2: Manual Migration

#### Step 1: Get Render Database URL
1. Go to: https://dashboard.render.com
2. Find your "lottery-db" database
3. Copy the "External Database URL"
4. Format: `postgresql://user:pass@host:port/database`

#### Step 2: Create Database Dump
```bash
# Create a dump of your local database
pg_dump -h localhost -p 5432 -U postgres -d lottery_system_local \
  --no-owner --no-privileges --clean --if-exists \
  -f lottery_system_dump.sql
```

#### Step 3: Restore to Render
```bash
# Restore the dump to Render database
PGPASSWORD="your_render_password" psql \
  -h your_render_host \
  -p your_render_port \
  -U your_render_user \
  -d your_render_database \
  -f lottery_system_dump.sql
```

## 🔧 Configuration Files

### .env.migration
```env
# Local Database
LOCAL_DB_HOST=localhost
LOCAL_DB_PORT=5432
LOCAL_DB_NAME=lottery_system_local
LOCAL_DB_USER=postgres
LOCAL_DB_PASS=your_local_password

# Render Database
RENDER_DATABASE_URL=postgresql://user:pass@host:port/database
```

## 📊 What Gets Migrated

### Core Tables (30 models):
- **Users & Authentication**: User, LoginAudit, SecurityAudit
- **System Configuration**: SystemFunction, RoleFunctionPermission, SystemSetting
- **Regions & Templates**: Region, TicketTemplate, AgentTicketTemplate
- **Betting System**: BetLimit, PrizeConfiguration, BetLimitsPerDraw
- **Draws & Results**: Draw, DrawResult, CurrentBetTotal
- **Tickets & Sales**: Ticket, Bet, Sale, Commission
- **Winning System**: WinningTicket, WinningPrize, ClaimsAudit
- **Financial**: UserBalance, BalanceTransaction
- **Audit & Logs**: AuditLog, SystemLog, Notification
- **Reprints**: TicketReprint

## ⚠️ Important Notes

### Before Migration:
- **Backup your Render database** if it has important data
- **Test the migration** on a copy first if possible
- **Ensure Render database is empty** or you're okay with overwriting

### During Migration:
- **Don't interrupt the process** - it may corrupt data
- **Monitor the console output** for any errors
- **Keep your local database running** during the dump

### After Migration:
- **Update Render environment variables**
- **Restart your Render service**
- **Test all functionality**
- **Verify data integrity**

## 🔍 Troubleshooting

### Common Issues:

#### 1. Connection Errors
```
❌ Failed to connect to Render database
```
**Solution**: Check your Render database URL and network connectivity

#### 2. Permission Errors
```
❌ Permission denied for table
```
**Solution**: Ensure your Render database user has proper permissions

#### 3. Schema Conflicts
```
❌ Relation already exists
```
**Solution**: Use `--clean --if-exists` flags in pg_dump

#### 4. Large Dataset Timeout
```
❌ Connection timeout
```
**Solution**: Increase timeout settings or migrate in smaller batches

## 📈 Migration Performance

### Expected Timeline:
- **Small database** (< 1GB): 2-5 minutes
- **Medium database** (1-10GB): 10-30 minutes  
- **Large database** (> 10GB): 30+ minutes

### Optimization Tips:
- **Close other applications** during migration
- **Use wired internet** for better stability
- **Monitor Render service limits** (free tier has restrictions)

## ✅ Post-Migration Checklist

- [ ] Database dump created successfully
- [ ] Data restored to Render without errors
- [ ] All tables have correct record counts
- [ ] Render service environment variables updated
- [ ] Render service restarted
- [ ] Application connects to Render database
- [ ] All features working correctly
- [ ] User authentication working
- [ ] Ticket system functional
- [ ] Reports and analytics working

## 🆘 Support

If you encounter issues:
1. **Check the migration logs** for specific error messages
2. **Verify your database credentials** are correct
3. **Test network connectivity** to Render
4. **Contact Render support** if database issues persist
5. **Check Render service logs** for application errors

## 🎯 Next Steps After Migration

1. **Update your application** to use Render database URL
2. **Test all functionality** thoroughly
3. **Monitor performance** and optimize if needed
4. **Set up database backups** on Render
5. **Consider upgrading** Render plan if needed

---

**Remember**: This migration will overwrite your Render database. Make sure you have backups and are ready to proceed!

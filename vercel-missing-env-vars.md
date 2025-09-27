# Missing Vercel Environment Variables

## Current Vercel Environment Variables:
- ✅ REACT_APP_API_URL: `https://lottery-backend-l1k7.onrender.com` (WRONG URL)
- ✅ REACT_APP_API_VERSION: `v1`
- ✅ REACT_APP_VERSION: `1.0.0` (OUTDATED)
- ✅ GENERATE_SOURCEMAP: `false`

## Missing Environment Variable:
- ❌ **REACT_APP_SOCKET_URL** - NOT PRESENT!

## What You Need to Add/Update in Vercel:

### 1. Add Missing Variable:
- **Name**: `REACT_APP_SOCKET_URL`
- **Value**: `https://lottery-system-tna9.onrender.com`
- **Environments**: All Environments

### 2. Update Existing Variables:
- **REACT_APP_API_URL**: Change from `https://lottery-backend-l1k7.onrender.com` to `https://lottery-system-tna9.onrender.com`
- **REACT_APP_VERSION**: Change from `1.0.0` to `3.0.4`

## Final Vercel Environment Variables Should Be:
- ✅ REACT_APP_API_URL: `https://lottery-system-tna9.onrender.com`
- ✅ REACT_APP_SOCKET_URL: `https://lottery-system-tna9.onrender.com` (ADD THIS)
- ✅ REACT_APP_API_VERSION: `v1`
- ✅ REACT_APP_VERSION: `3.0.4`
- ✅ GENERATE_SOURCEMAP: `false`

## Steps to Fix:
1. Go to Vercel Dashboard
2. Find "lottery-system-gamma" project
3. Go to Settings → Environment Variables
4. Add REACT_APP_SOCKET_URL
5. Update REACT_APP_API_URL
6. Update REACT_APP_VERSION
7. Redeploy

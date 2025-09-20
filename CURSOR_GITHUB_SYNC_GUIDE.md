# 🔗 Cursor + GitHub Auto-Sync Guide

## ✅ **Current Status**
- Repository: `https://github.com/yanyandiyang-crypto/lottery-system`
- Branch: `master`
- Status: Connected and ready

## 🚀 **Method 1: Cursor Built-in Git (Recommended)**

### **Step 1: Enable Source Control**
1. Press `Ctrl + Shift + G` to open Source Control
2. You'll see your repository status
3. Make changes to any file
4. See changes appear in Source Control panel

### **Step 2: Commit and Push**
1. **Stage changes**: Click `+` next to files
2. **Write commit message**: "Update feature X"
3. **Commit**: Press `Ctrl + Enter`
4. **Push**: Click `...` → `Push`

## 🔄 **Method 2: Quick Sync Script**

### **Use the sync script:**
```bash
# Double-click sync-to-github.bat
# OR run in terminal:
./sync-to-github.bat
```

## ⚡ **Method 3: Keyboard Shortcuts**

### **Essential Git Shortcuts in Cursor:**
- `Ctrl + Shift + G` - Open Source Control
- `Ctrl + Enter` - Commit staged changes
- `Ctrl + Shift + P` - Command Palette
- `Ctrl + K, Ctrl + H` - Show Git History

## 🔧 **Method 4: Auto-Sync Settings**

### **Enable Auto-Fetch:**
1. Open Settings (`Ctrl + ,`)
2. Search "git auto fetch"
3. Enable "Git: Auto Fetch"

### **Enable Auto-Stash:**
1. Search "git auto stash"
2. Enable "Git: Auto Stash"

## 📱 **Method 5: GitHub Desktop Integration**

### **Install GitHub Desktop:**
1. Download from [desktop.github.com](https://desktop.github.com)
2. Sign in with your GitHub account
3. Add existing repository
4. Select your project folder

## 🎯 **Daily Workflow**

### **When you make changes:**
1. **Edit files** in Cursor
2. **Check Source Control** (`Ctrl + Shift + G`)
3. **Stage changes** (click `+`)
4. **Commit** with message
5. **Push** to GitHub

### **Quick Commands:**
```bash
# Check status
git status

# Add all changes
git add .

# Commit with message
git commit -m "Your message"

# Push to GitHub
git push origin master
```

## 🔐 **Authentication Setup**

### **If you get authentication errors:**
1. **Use GitHub CLI**:
   ```bash
   gh auth login
   ```

2. **Or use Personal Access Token**:
   - Go to GitHub Settings → Developer settings → Personal access tokens
   - Generate new token
   - Use token as password when prompted

## 📊 **Monitor Your Repository**

### **Check repository online:**
- Visit: `https://github.com/yanyandiyang-crypto/lottery-system`
- See all commits, branches, and changes
- Monitor deployment status

## 🚨 **Troubleshooting**

### **Common Issues:**
1. **"Repository not found"**: Check remote URL
2. **"Permission denied"**: Re-authenticate
3. **"Merge conflicts"**: Resolve conflicts in Cursor

### **Reset if needed:**
```bash
git fetch origin
git reset --hard origin/master
```

## 🎉 **You're All Set!**

Your Cursor is now connected to GitHub. Any changes you make will be tracked and can be easily committed and pushed to your repository.

---
**Happy Coding!** 🚀

## 📝 **Test Commit**
This is a test to verify Cursor-GitHub sync is working!

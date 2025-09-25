const axios = require('axios');

// Configuration
const BASE_URL = 'http://localhost:3001/api/v1';

async function checkFunctionManagementStatus() {
  try {
    console.log('🔍 Checking Function Management status...\n');
    
    // Login as superadmin
    console.log('1. Logging in as superadmin...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      username: 'superadmin',
      password: 'superadmin123'
    });
    
    const token = loginResponse.data.token;
    console.log('✅ Logged in successfully');
    
    // Create axios instance with auth
    const api = axios.create({
      baseURL: BASE_URL,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    // Get all functions and their permissions
    console.log('\n2. Checking function permissions...');
    const functionsResponse = await api.get('/function-management/functions');
    const functions = functionsResponse.data.data;
    
    console.log(`Found ${functions.length} system functions\n`);
    
    // Analyze function status by role
    const roleAnalysis = {};
    
    functions.forEach(func => {
      console.log(`📋 ${func.name} (${func.category})`);
      console.log(`   Key: ${func.key}`);
      console.log(`   Description: ${func.description}`);
      
      if (func.rolePermissions && func.rolePermissions.length > 0) {
        console.log('   Permissions:');
        func.rolePermissions.forEach(perm => {
          const status = perm.isEnabled ? '✅ ACTIVE' : '❌ INACTIVE';
          console.log(`     • ${perm.role}: ${status}`);
          
          // Track role analysis
          if (!roleAnalysis[perm.role]) {
            roleAnalysis[perm.role] = { active: 0, inactive: 0, total: 0 };
          }
          roleAnalysis[perm.role].total++;
          if (perm.isEnabled) {
            roleAnalysis[perm.role].active++;
          } else {
            roleAnalysis[perm.role].inactive++;
          }
        });
      } else {
        console.log('   ❌ NO PERMISSIONS FOUND');
      }
      console.log('');
    });
    
    // Summary by role
    console.log('📊 SUMMARY BY ROLE:');
    console.log('='.repeat(50));
    Object.entries(roleAnalysis).forEach(([role, stats]) => {
      const activePercent = ((stats.active / stats.total) * 100).toFixed(1);
      console.log(`${role.toUpperCase()}:`);
      console.log(`   Active: ${stats.active}/${stats.total} (${activePercent}%)`);
      console.log(`   Inactive: ${stats.inactive}/${stats.total}`);
      
      if (stats.inactive > 0) {
        console.log(`   ⚠️  ${stats.inactive} functions are INACTIVE for ${role}`);
      }
      console.log('');
    });
    
    // Check for functions without any permissions
    const functionsWithoutPermissions = functions.filter(f => !f.rolePermissions || f.rolePermissions.length === 0);
    if (functionsWithoutPermissions.length > 0) {
      console.log('❌ FUNCTIONS WITHOUT ANY PERMISSIONS:');
      functionsWithoutPermissions.forEach(f => {
        console.log(`   • ${f.name} (${f.key})`);
      });
    }
    
  } catch (error) {
    console.log('❌ Error checking function status:', error.response?.data?.message || error.message);
  }
}

checkFunctionManagementStatus();

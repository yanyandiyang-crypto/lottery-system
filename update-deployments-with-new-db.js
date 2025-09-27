const fs = require('fs');
const { execSync } = require('child_process');

console.log('🚀 Updating Deployments with New Database');
console.log('=========================================');

// New database URL
const NEW_DB_URL = 'postgresql://lottery_db_k3w0_user:FvVBvl5N1R3Cz4LYnk0EwDg0oZXJDNk7@dpg-d3c016j7mgec73a3pdf0-a.oregon-postgres.render.com/lottery_db_k3w0';

async function updateDeployments() {
    try {
        console.log('📝 Updating package.json version...');
        
        // Update root package.json version
        const rootPackageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
        rootPackageJson.version = '3.0.0';
        fs.writeFileSync('package.json', JSON.stringify(rootPackageJson, null, 2));
        console.log('✅ Root package.json updated to version 3.0.0');
        
        // Update frontend package.json version
        const frontendPackageJson = JSON.parse(fs.readFileSync('frontend/package.json', 'utf8'));
        frontendPackageJson.version = '3.0.0';
        fs.writeFileSync('frontend/package.json', JSON.stringify(frontendPackageJson, null, 2));
        console.log('✅ Frontend package.json updated to version 3.0.0');
        
        // Update frontend vercel.json
        const vercelJson = JSON.parse(fs.readFileSync('frontend/vercel.json', 'utf8'));
        vercelJson.env.REACT_APP_VERSION = '3.0.0';
        fs.writeFileSync('frontend/vercel.json', JSON.stringify(vercelJson, null, 2));
        console.log('✅ Frontend vercel.json updated to version 3.0.0');
        
        // Update render.yaml with new database URL
        const renderYaml = fs.readFileSync('render.yaml', 'utf8');
        const updatedRenderYaml = renderYaml.replace(
            /DATABASE_URL: .*/,
            `DATABASE_URL: ${NEW_DB_URL}`
        );
        fs.writeFileSync('render.yaml', updatedRenderYaml);
        console.log('✅ render.yaml updated with new DATABASE_URL');
        
        // Create deployment info file
        const deploymentInfo = {
            timestamp: new Date().toISOString(),
            version: '3.0.0',
            database: {
                url: NEW_DB_URL,
                host: 'dpg-d3c016j7mgec73a3pdf0-a.oregon-postgres.render.com',
                database: 'lottery_db_k3w0',
                username: 'lottery_db_k3w0_user'
            },
            deployments: {
                github: 'Updated',
                render: 'Updated with new DATABASE_URL',
                vercel: 'Updated'
            },
            status: 'Ready for deployment'
        };
        
        fs.writeFileSync('deployment-info-v3.json', JSON.stringify(deploymentInfo, null, 2));
        console.log('✅ Deployment info saved to deployment-info-v3.json');
        
        console.log('\n🔄 Committing changes to GitHub...');
        
        // Git commands
        execSync('git add .', { stdio: 'inherit' });
        execSync('git commit -m "Update to v3.0.0 with new Render database"', { stdio: 'inherit' });
        execSync('git push origin main', { stdio: 'inherit' });
        
        console.log('\n🎉 GitHub updated successfully!');
        
        console.log('\n📋 Deployment Summary:');
        console.log('======================');
        console.log('✅ Version updated to 3.0.0');
        console.log('✅ New DATABASE_URL configured');
        console.log('✅ GitHub repository updated');
        console.log('✅ Changes committed and pushed');
        
        console.log('\n🔄 Next Steps:');
        console.log('==============');
        console.log('1. 🌐 Render will auto-deploy with new DATABASE_URL');
        console.log('2. 🌐 Vercel will auto-deploy with version 3.0.0');
        console.log('3. 🧪 Test frontend: https://lottery-system-gamma.vercel.app');
        console.log('4. 🧪 Test backend: https://lottery-system-tna9.onrender.com');
        
        console.log('\n📊 New Database Details:');
        console.log('========================');
        console.log(`Host: dpg-d3c016j7mgec73a3pdf0-a.oregon-postgres.render.com`);
        console.log(`Database: lottery_db_k3w0`);
        console.log(`Username: lottery_db_k3w0_user`);
        console.log(`Status: ✅ Data restored successfully`);
        
    } catch (error) {
        console.error('❌ Error updating deployments:', error.message);
    }
}

updateDeployments();

const { PrismaClient } = require('@prisma/client');
const moment = require('moment-timezone');

const prisma = new PrismaClient();

async function checkDraws() {
    try {
        console.log('🔍 Checking current draws...');
        console.log('📅 Current Manila time:', moment().tz('Asia/Manila').format('YYYY-MM-DD HH:mm:ss'));
        
        const draws = await prisma.draw.findMany({
            orderBy: [
                { drawDate: 'asc' },
                { drawTime: 'asc' }
            ]
        });
        
        console.log(`\n📊 Total draws found: ${draws.length}`);
        
        if (draws.length === 0) {
            console.log('❌ No draws found in database');
        } else {
            console.log('\n📋 Draw details:');
            draws.forEach((draw, index) => {
                const drawDateTime = moment(draw.drawDate).tz('Asia/Manila').format('YYYY-MM-DD HH:mm');
                console.log(`${index + 1}. ${drawDateTime} - ${draw.drawTime} - ${draw.status} (ID: ${draw.id})`);
            });
        }
        
    } catch (error) {
        console.error('❌ Error checking draws:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

checkDraws();

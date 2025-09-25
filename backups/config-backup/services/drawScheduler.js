const { PrismaClient } = require('@prisma/client');
const cron = require('node-cron');
const moment = require('moment-timezone');

const prisma = new PrismaClient();

class DrawScheduler {
  constructor() {
    this.isInitialized = false;
  }

  initialize() {
    if (this.isInitialized) return;

    console.log('🎯 Initializing Draw Scheduler...');

    // Create draws for today and next 14 days if they don't exist
    this.ensureDrawsExist(14);

    // Schedule daily draw creation at midnight - ensures next 14 days always exist
    cron.schedule('0 0 * * *', () => {
      console.log('🕛 Daily draw maintenance - ensuring next 14 days have draws...');
      this.ensureDrawsExist(14);
    });

    // Schedule draw status updates every minute
    this.scheduleDrawUpdates();

    this.isInitialized = true;
    console.log('✅ Draw Scheduler initialized successfully');
  }

  async createDrawsForPeriod(days) {
    try {
      const startDate = moment().tz('Asia/Manila');
      
      for (let i = 0; i < days; i++) {
        const targetDate = startDate.clone().add(i, 'days');
        const dateStr = targetDate.format('YYYY-MM-DD');
        const dateObj = new Date(dateStr);

        // Check if draws already exist for this date
        const existingDraws = await prisma.draw.findMany({
          where: { drawDate: dateObj }
        });

        if (existingDraws.length >= 3) {
          continue; // Skip if all 3 draws already exist
        }

        // Create draws for 2PM, 5PM, and 9PM
        const drawTimes = [
          { time: 'twoPM', hour: 14 },
          { time: 'fivePM', hour: 17 },
          { time: 'ninePM', hour: 21 }
        ];

        for (const drawTime of drawTimes) {
          // Check if this specific draw time already exists
          const existingDraw = existingDraws.find(d => d.drawTime === drawTime.time);
          if (existingDraw) continue;

          // Calculate cutoff time (5 minutes before draw time)
          // 2PM draw: cutoff at 1:55PM (13:55)
          // 5PM draw: cutoff at 4:55PM (16:55) 
          // 9PM draw: cutoff at 8:55PM (20:55)
          const cutoffTime = new Date(dateObj);
          cutoffTime.setHours(drawTime.hour - 1, 55, 0, 0); // 5 minutes before draw time
          
          await prisma.draw.create({
            data: {
              drawDate: dateObj,
              drawTime: drawTime.time,
              status: 'open',
              cutoffTime: cutoffTime
            }
          });

          console.log(`✅ Created ${drawTime.time} draw for ${dateStr} (cutoff: ${cutoffTime.toLocaleString()})`);
        }
      }

    } catch (error) {
      console.error('❌ Error creating draws for period:', error);
    }
  }

  async createTodayDraws() {
    // Legacy method - now calls the new period method for today only
    await this.createDrawsForPeriod(1);
  }

  scheduleDrawUpdates() {
    // Check every minute for draw status updates
    cron.schedule('* * * * *', async () => {
      try {
        await this.updateDrawStatuses();
      } catch (error) {
        console.error('Error updating draw statuses:', error);
      }
    });
  }

  async updateDrawStatuses() {
    try {
      const now = moment().tz('Asia/Manila');
      const today = now.format('YYYY-MM-DD');
      const yesterday = now.clone().subtract(1, 'day').format('YYYY-MM-DD');
      const tomorrow = now.clone().add(1, 'day').format('YYYY-MM-DD');

      // Get draws for yesterday, today, and tomorrow to handle cross-day betting windows
      const draws = await prisma.draw.findMany({
        where: {
          drawDate: {
            in: [new Date(yesterday), new Date(today), new Date(tomorrow)]
          },
          status: 'open'
        }
      });

      for (const draw of draws) {
        // Calculate cutoff time based on drawTime
        let cutoffHour;
        switch (draw.drawTime) {
          case 'twoPM':
            cutoffHour = 13; // 1:55 PM = 13:55
            break;
          case 'fivePM':
            cutoffHour = 16; // 4:55 PM = 16:55
            break;
          case 'ninePM':
            cutoffHour = 20; // 8:55 PM = 20:55
            break;
          default:
            continue;
        }

        const cutoffDateTime = moment(draw.drawDate).tz('Asia/Manila')
          .hour(cutoffHour)
          .minute(55)
          .second(0);

        // Check if cutoff time has passed
        if (now.isAfter(cutoffDateTime) && draw.status === 'open') {
          await prisma.draw.update({
            where: { id: draw.id },
            data: { status: 'closed' }
          });

          console.log(`🔒 Draw ${draw.drawTime} for ${moment(draw.drawDate).format('YYYY-MM-DD')} closed at cutoff time`);
        }
      }

    } catch (error) {
      console.error('Error updating draw statuses:', error);
    }
  }

  // Get currently available draws for betting based on betting windows
  async getAvailableDrawsForBetting() {
    try {
      const now = moment().tz('Asia/Manila');
      const today = now.format('YYYY-MM-DD');
      const tomorrow = now.clone().add(1, 'day').format('YYYY-MM-DD');

      // Get open draws for today and tomorrow
      const draws = await prisma.draw.findMany({
        where: {
          drawDate: {
            in: [new Date(today), new Date(tomorrow)]
          },
          status: 'open'
        },
        orderBy: [
          { drawDate: 'asc' },
          { drawTime: 'asc' }
        ]
      });

      const availableDraws = [];

      for (const draw of draws) {
        const drawDate = moment(draw.drawDate).tz('Asia/Manila');
        const isToday = drawDate.format('YYYY-MM-DD') === today;
        const isTomorrow = drawDate.format('YYYY-MM-DD') === tomorrow;

        // Determine if this draw is currently available for betting
        let isAvailable = false;

        if (draw.drawTime === 'twoPM') {
          // 2PM draw is available from 9PM previous day until 1:55PM
          const cutoffTime = drawDate.clone().hour(13).minute(55).second(0);
          
          if (isToday) {
            // Today's 2PM draw: available until 1:55PM today
            isAvailable = now.isBefore(cutoffTime);
          } else if (isTomorrow) {
            // Tomorrow's 2PM draw: available from 9PM today
            const startTime = now.clone().hour(21).minute(0).second(0);
            isAvailable = now.isAfter(startTime) || now.hour() >= 21;
          }
        } else if (draw.drawTime === 'fivePM') {
          // 5PM draw is available from 2PM same day until 4:55PM
          const startTime = drawDate.clone().hour(14).minute(0).second(0);
          const cutoffTime = drawDate.clone().hour(16).minute(55).second(0);
          
          if (isToday) {
            isAvailable = now.isAfter(startTime) && now.isBefore(cutoffTime);
          }
        } else if (draw.drawTime === 'ninePM') {
          // 9PM draw is available from 5PM same day until 8:55PM
          const startTime = drawDate.clone().hour(17).minute(0).second(0);
          const cutoffTime = drawDate.clone().hour(20).minute(55).second(0);
          
          if (isToday) {
            isAvailable = now.isAfter(startTime) && now.isBefore(cutoffTime);
          }
        }

        if (isAvailable) {
          availableDraws.push({
            ...draw,
            bettingWindow: this.getBettingWindowInfo(draw.drawTime, drawDate)
          });
        }
      }

      return availableDraws;
    } catch (error) {
      console.error('Error getting available draws for betting:', error);
      return [];
    }
  }

  // Get betting window information for a specific draw
  getBettingWindowInfo(drawTime, drawDate) {
    const date = moment(drawDate).tz('Asia/Manila');
    
    switch (drawTime) {
      case 'twoPM':
        return {
          startTime: date.clone().subtract(1, 'day').hour(21).minute(0).second(0),
          endTime: date.clone().hour(13).minute(55).second(0),
          description: '9:00 PM (previous day) to 1:55 PM'
        };
      case 'fivePM':
        return {
          startTime: date.clone().hour(14).minute(0).second(0),
          endTime: date.clone().hour(16).minute(55).second(0),
          description: '2:00 PM to 4:55 PM'
        };
      case 'ninePM':
        return {
          startTime: date.clone().hour(17).minute(0).second(0),
          endTime: date.clone().hour(20).minute(55).second(0),
          description: '5:00 PM to 8:55 PM'
        };
      default:
        return null;
    }
  }

  async getSystemSettings() {
    try {
      const settings = await prisma.systemSetting.findMany();
      const settingsMap = {};
      
      settings.forEach(setting => {
        settingsMap[setting.settingKey] = setting.settingValue;
      });

      return settingsMap;
    } catch (error) {
      console.error('Error getting system settings:', error);
      return {};
    }
  }

  async createDrawForDate(date) {
    try {
      const targetDate = moment(date).tz('Asia/Manila').format('YYYY-MM-DD');
      const targetDateObj = new Date(targetDate);

      // Check if draws already exist for this date
      const existingDraws = await prisma.draw.findMany({
        where: { drawDate: targetDateObj }
      });

      if (existingDraws.length > 0) {
        return {
          success: false,
          message: 'Draws already exist for this date'
        };
      }

      // Create draws for 2PM, 5PM, and 9PM
      const drawTimes = [
        { time: 'twoPM', hour: 14 },
        { time: 'fivePM', hour: 17 },
        { time: 'ninePM', hour: 21 }
      ];

      const createdDraws = [];

      for (const drawTime of drawTimes) {
        const draw = await prisma.draw.create({
          data: {
            drawDate: targetDateObj,
            drawTime: drawTime.time,
            status: 'open'
          }
        });

        createdDraws.push(draw);
      }

      return {
        success: true,
        message: `Created ${createdDraws.length} draws for ${targetDate}`,
        draws: createdDraws
      };

    } catch (error) {
      console.error('Error creating draws for date:', error);
      return {
        success: false,
        message: 'Error creating draws'
      };
    }
  }

  async getUpcomingDraws() {
    try {
      const now = moment().tz('Asia/Manila');
      const today = now.format('YYYY-MM-DD');

      const upcomingDraws = await prisma.draw.findMany({
        where: {
          drawDate: {
            gte: new Date(today)
          },
          status: 'open'
        },
        orderBy: { drawDate: 'asc' }
      });

      return upcomingDraws;
    } catch (error) {
      console.error('Error getting upcoming draws:', error);
      return [];
    }
  }

  async getDrawHistory(days = 7) {
    try {
      const endDate = moment().tz('Asia/Manila');
      const startDate = endDate.clone().subtract(days, 'days');

      const draws = await prisma.draw.findMany({
        where: {
          drawDate: {
            gte: startDate.toDate(),
            lte: endDate.toDate()
          }
        },
        include: {
          _count: {
            select: {
              tickets: true,
              winningTickets: true
            }
          }
        },
        orderBy: { drawDate: 'desc' }
      });

      return draws;
    } catch (error) {
      console.error('Error getting draw history:', error);
      return [];
    }
  }

  // Method to create draws for extended periods (useful for setup or maintenance)
  async createDrawsForExtendedPeriod(days = 30) {
    try {
      console.log(`🗓️ Creating draws for the next ${days} days...`);
      await this.createDrawsForPeriod(days);
      console.log(`✅ Successfully ensured draws exist for the next ${days} days`);
      return { success: true, message: `Draws created for ${days} days` };
    } catch (error) {
      console.error('❌ Error creating extended period draws:', error);
      return { success: false, message: 'Error creating extended period draws' };
    }
  }

  // Method to create draws for entire months
  async createDrawsForMonth(year, month) {
    try {
      console.log(`🗓️ Creating draws for ${year}-${month.toString().padStart(2, '0')}...`);
      
      // Get the first and last day of the month
      const startDate = moment().year(year).month(month - 1).date(1).tz('Asia/Manila');
      const endDate = startDate.clone().endOf('month');
      const daysInMonth = endDate.date();
      
      let createdCount = 0;
      let skippedCount = 0;
      
      for (let day = 1; day <= daysInMonth; day++) {
        const targetDate = startDate.clone().date(day);
        const dateStr = targetDate.format('YYYY-MM-DD');
        const dateObj = new Date(dateStr);

        // Check if draws already exist for this date
        const existingDraws = await prisma.draw.findMany({
          where: { drawDate: dateObj }
        });

        if (existingDraws.length >= 3) {
          skippedCount++;
          continue; // Skip if all 3 draws already exist
        }

        // Create draws for 2PM, 5PM, and 9PM
        const drawTimes = [
          { time: 'twoPM', hour: 14 },
          { time: 'fivePM', hour: 17 },
          { time: 'ninePM', hour: 21 }
        ];

        for (const drawTime of drawTimes) {
          // Check if this specific draw time already exists
          const existingDraw = existingDraws.find(d => d.drawTime === drawTime.time);
          if (existingDraw) continue;

          // Calculate cutoff time (5 minutes before draw time)
          const cutoffTime = new Date(dateObj);
          cutoffTime.setHours(drawTime.hour - 1, 55, 0, 0);
          
          await prisma.draw.create({
            data: {
              drawDate: dateObj,
              drawTime: drawTime.time,
              status: 'open',
              cutoffTime: cutoffTime
            }
          });

          createdCount++;
        }
      }

      const monthName = startDate.format('MMMM YYYY');
      console.log(`✅ Created ${createdCount} draws for ${monthName} (${skippedCount} days already had draws)`);
      
      return { 
        success: true, 
        message: `Created ${createdCount} draws for ${monthName}`,
        created: createdCount,
        skipped: skippedCount,
        totalDays: daysInMonth
      };
    } catch (error) {
      console.error('❌ Error creating monthly draws:', error);
      return { success: false, message: 'Error creating monthly draws' };
    }
  }


  // Method to check and ensure draws exist for the next N days
  async ensureDrawsExist(days = 7) {
    try {
      const startDate = moment().tz('Asia/Manila');
      const endDate = startDate.clone().add(days, 'days');
      
      // Count existing draws in the period
      const existingDrawsCount = await prisma.draw.count({
        where: {
          drawDate: {
            gte: startDate.toDate(),
            lt: endDate.toDate()
          }
        }
      });

      const expectedDrawsCount = days * 3; // 3 draws per day
      
      if (existingDrawsCount < expectedDrawsCount) {
        console.log(`📊 Found ${existingDrawsCount}/${expectedDrawsCount} draws. Creating missing draws...`);
        await this.createDrawsForPeriod(days);
      } else {
        console.log(`✅ All draws exist for the next ${days} days (${existingDrawsCount}/${expectedDrawsCount})`);
      }

      return { 
        success: true, 
        existing: existingDrawsCount, 
        expected: expectedDrawsCount 
      };
    } catch (error) {
      console.error('Error ensuring draws exist:', error);
      return { success: false, message: 'Error checking draws' };
    }
  }
}

const drawScheduler = new DrawScheduler();
module.exports = drawScheduler;


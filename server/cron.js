const cron = require('node-cron');
const { cleanupOldImages } = require('./services/cleanupService');

// Run cleanup at 3 AM UTC every day
cron.schedule('0 3 * * *', async () => {
    console.log('Starting scheduled cleanup...');
    try {
        const result = await cleanupOldImages();
        console.log('Scheduled cleanup completed:', result);
    } catch (error) {
        console.error('Error in scheduled cleanup:', error);
    }
}); 
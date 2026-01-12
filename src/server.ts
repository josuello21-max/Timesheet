import app from './app';
import { config } from './config';
import prisma from './config/database';

const startServer = async () => {
    try {
        // Test database connection
        await prisma.$connect();
        console.log('✅ Database connected successfully');

        // Start server
        app.listen(config.port, () => {
            console.log('🚀 Star5 Timesheet API Server');
            console.log(`📡 Environment: ${config.env}`);
            console.log(`🌐 Server running on port ${config.port}`);
            console.log(`📍 API URL: http://localhost:${config.port}${config.apiPrefix}`);
            console.log(`🏥 Health check: http://localhost:${config.port}${config.apiPrefix}/health`);
            console.log('\n📚 Available endpoints:');
            console.log(`   POST   ${config.apiPrefix}/auth/register`);
            console.log(`   POST   ${config.apiPrefix}/auth/login`);
            console.log(`   GET    ${config.apiPrefix}/auth/me`);
            console.log(`   GET    ${config.apiPrefix}/projects`);
            console.log(`   GET    ${config.apiPrefix}/time-entries`);
            console.log(`   POST   ${config.apiPrefix}/time-entries`);
            console.log(`   GET    ${config.apiPrefix}/timesheets/pending-approvals`);
            console.log(`   POST   ${config.apiPrefix}/timesheets/:id/submit`);
            console.log(`   POST   ${config.apiPrefix}/timesheets/:id/approve`);
            console.log('\n⏳ Waiting for requests...\n');
        });

        // Graceful shutdown
        process.on('SIGINT', async () => {
            console.log('\n🛑 Shutting down gracefully...');
            await prisma.$disconnect();
            console.log('✅ Database disconnected');
            process.exit(0);
        });
    } catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
};

startServer();

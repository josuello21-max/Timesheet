import dotenv from 'dotenv';

dotenv.config();

export const config = {
    env: process.env.NODE_ENV || 'development',
    port: parseInt(process.env.PORT || '3000', 10),
    apiPrefix: process.env.API_PREFIX || '/api/v1',

    database: {
        url: process.env.DATABASE_URL || '',
    },

    jwt: {
        secret: process.env.JWT_SECRET || 'your-secret-key',
        expiresIn: process.env.JWT_EXPIRES_IN || '7d',
        refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
    },

    cors: {
        origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3001'],
        credentials: true,
    },

    pagination: {
        defaultPageSize: parseInt(process.env.DEFAULT_PAGE_SIZE || '20', 10),
        maxPageSize: parseInt(process.env.MAX_PAGE_SIZE || '100', 10),
    },
};

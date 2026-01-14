import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import { config } from './config';
import routes from './routes';
import { errorHandler } from './middleware/errorHandler';

const app: Application = express();

// Security middleware
// app.use(helmet()); // Desactivado temporalmente para depuración

// CORS configuration
app.use(cors(config.cors));

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Logging middleware
if (config.env === 'development') {
    app.use(morgan('dev'));
} else {
    app.use(morgan('combined'));
}

// API routes
app.use(config.apiPrefix, routes);

// Root route
app.get('/', (req: Request, res: Response) => {
    res.json({
        message: 'Star5 Timesheet API',
        version: '1.0.0',
        documentation: `${config.apiPrefix}/health`,
    });
});

// 404 handler
app.use((req: Request, res: Response) => {
    res.status(404).json({
        error: 'Not Found',
        message: `Cannot ${req.method} ${req.path}`,
    });
});

// Error handling middleware (must be last)
app.use(errorHandler);

export default app;

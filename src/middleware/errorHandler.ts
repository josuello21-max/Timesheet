import { Request, Response, NextFunction } from 'express';

export const errorHandler = (
    err: Error,
    req: Request,
    res: Response,
    next: NextFunction
): void => {
    console.error('Error:', err);

    if (err.name === 'ValidationError') {
        res.status(400).json({
            error: 'Validation Error',
            message: err.message,
        });
        return;
    }

    if (err.name === 'PrismaClientKnownRequestError') {
        res.status(400).json({
            error: 'Database Error',
            message: 'An error occurred while processing your request',
        });
        return;
    }

    res.status(500).json({
        error: 'Internal Server Error',
        message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong',
    });
};

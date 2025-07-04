import { log, logError } from '../utils/logger.js';

export const errorHandler = (err, req, res, next) => {
    let statusCode = err.status || 500;
    let message = err.message || 'Internal Server Error';

    if (err.name === 'ValidationError') {
        statusCode = 400;
        message = 'Validation failed';
    }

    if (err.name === 'CastError') {
        statusCode = 400;
        message = 'Invalid ID format';
    }

    if (err.name === 'JsonWebTokenError') {
        statusCode = 401;
        message = 'Invalid token';
    }

    if (err.name === 'TokenExpiredError') {
        statusCode = 401;
        message = 'Token expired';
    }

    if (err.code === 11000) {
        statusCode = 400;
        message = 'Duplicate key error';
    }

    if (err.code === 'EBADCSRFTOKEN') {
        statusCode = 403;
        message = 'Invalid CSRF token';
    }

    logError(`Error ${statusCode}: ${message} (Request: ${req.method} ${req.url})`);
    res.status(statusCode).json({ message });
};

export default errorHandler;